package cn.nebula.websocket;

import cn.nebula.service.ChatService;
import cn.nebula.utils.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler implements WebSocketHandler {

    @Autowired
    private ChatService chatService;

    @Autowired
    private JwtUtil jwtUtil;

    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Store active WebSocket sessions by user ID
    private final Map<Long, WebSocketSession> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // Extract token from query parameters
        URI uri = session.getUri();
        String query = uri.getQuery();
        String token = null;
        
        if (query != null) {
            String[] params = query.split("&");
            for (String param : params) {
                String[] keyValue = param.split("=");
                if (keyValue.length == 2 && "token".equals(keyValue[0])) {
                    token = keyValue[1];
                    break;
                }
            }
        }
        
        if (token != null && jwtUtil.validateToken(token)) {
            Long userId = jwtUtil.getUserIdFromToken(token);
            session.getAttributes().put("userId", userId);
            userSessions.put(userId, session);
            
            System.out.println("User " + userId + " connected to WebSocket");
        } else {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Invalid token"));
        }
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        Long userId = (Long) session.getAttributes().get("userId");
        if (userId == null) {
            return;
        }

        try {
            String payload = message.getPayload().toString();
            Map<String, Object> messageData = objectMapper.readValue(payload, Map.class);
            
            String type = (String) messageData.get("type");
            Long receiverId = Long.parseLong(messageData.get("to").toString());
            String content = (String) messageData.get("content");
            Integer messageType = (Integer) messageData.getOrDefault("messageType", 0); // 0=private, 1=group
            
            // Save message to database
            boolean saved = chatService.saveMessage(userId, receiverId, messageType, content);
            
            if (saved) {
                // Forward message to receiver if online
                WebSocketSession receiverSession = userSessions.get(receiverId);
                if (receiverSession != null && receiverSession.isOpen()) {
                    Map<String, Object> forwardMessage = Map.of(
                        "type", type,
                        "from", userId,
                        "to", receiverId,
                        "content", content,
                        "timestamp", System.currentTimeMillis()
                    );
                    
                    String forwardPayload = objectMapper.writeValueAsString(forwardMessage);
                    receiverSession.sendMessage(new TextMessage(forwardPayload));
                    
                    // Update message status to delivered
                    chatService.updateMessageStatus(userId, receiverId, 1);
                }
                
                // Send delivery confirmation back to sender
                Map<String, Object> confirmation = Map.of(
                    "type", "delivery_confirmation",
                    "success", true,
                    "timestamp", System.currentTimeMillis()
                );
                
                String confirmationPayload = objectMapper.writeValueAsString(confirmation);
                session.sendMessage(new TextMessage(confirmationPayload));
            } else {
                // Send error message
                Map<String, Object> error = Map.of(
                    "type", "error",
                    "message", "Failed to save message",
                    "timestamp", System.currentTimeMillis()
                );
                
                String errorPayload = objectMapper.writeValueAsString(error);
                session.sendMessage(new TextMessage(errorPayload));
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("WebSocket transport error: " + exception.getMessage());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        Long userId = (Long) session.getAttributes().get("userId");
        if (userId != null) {
            userSessions.remove(userId);
            System.out.println("User " + userId + " disconnected from WebSocket");
        }
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }
    
    // Method to send message to specific user (used by other services)
    public boolean sendMessageToUser(Long userId, Map<String, Object> message) {
        WebSocketSession session = userSessions.get(userId);
        if (session != null && session.isOpen()) {
            try {
                String payload = objectMapper.writeValueAsString(message);
                session.sendMessage(new TextMessage(payload));
                return true;
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return false;
    }
    
    // Method to check if user is online
    public boolean isUserOnline(Long userId) {
        WebSocketSession session = userSessions.get(userId);
        return session != null && session.isOpen();
    }
}