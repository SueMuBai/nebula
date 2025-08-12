package cn.nebula.service;

import cn.nebula.model.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatService {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private FriendService friendService;

    private String getCurrentMessageTable() {
        String currentMonth = LocalDate.now().toString().substring(0, 7).replace("-", "");
        return "messages_" + currentMonth;
    }

    public boolean saveMessage(Long sender, Long receiver, Integer type, String content) {
        // Check if users are friends (for private messages)
        if (type == 0 && !friendService.areFriends(sender, receiver)) {
            return false;
        }

        try (Connection conn = dataSource.getConnection()) {
            String tableName = getCurrentMessageTable();
            String sql = String.format("INSERT INTO %s (sender, receiver, type, content, status, timestamp) VALUES (?, ?, ?, ?, 0, ?)", tableName);
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setLong(1, sender);
                stmt.setLong(2, receiver);
                stmt.setInt(3, type);
                stmt.setString(4, content);
                stmt.setLong(5, System.currentTimeMillis());
                
                return stmt.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateMessageStatus(Long sender, Long receiver, Integer status) {
        try (Connection conn = dataSource.getConnection()) {
            String tableName = getCurrentMessageTable();
            String sql = String.format("UPDATE %s SET status = ? WHERE sender = ? AND receiver = ? AND status < ?", tableName);
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, status);
                stmt.setLong(2, sender);
                stmt.setLong(3, receiver);
                stmt.setInt(4, status);
                
                return stmt.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public List<Map<String, Object>> getChatHistory(Long userId, Long otherUserId, int limit, long offset) {
        List<Map<String, Object>> messages = new ArrayList<>();
        
        if (!friendService.areFriends(userId, otherUserId)) {
            return messages;
        }

        try (Connection conn = dataSource.getConnection()) {
            String tableName = getCurrentMessageTable();
            String sql = String.format("""
                SELECT id, sender, receiver, content, status, timestamp 
                FROM %s 
                WHERE ((sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)) AND type = 0
                ORDER BY timestamp DESC 
                LIMIT ? OFFSET ?
                """, tableName);
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setLong(1, userId);
                stmt.setLong(2, otherUserId);
                stmt.setLong(3, otherUserId);
                stmt.setLong(4, userId);
                stmt.setInt(5, limit);
                stmt.setLong(6, offset);
                
                ResultSet rs = stmt.executeQuery();
                
                while (rs.next()) {
                    Map<String, Object> message = new HashMap<>();
                    message.put("id", rs.getLong("id"));
                    message.put("sender", rs.getLong("sender"));
                    message.put("receiver", rs.getLong("receiver"));
                    message.put("content", rs.getString("content"));
                    message.put("status", rs.getInt("status"));
                    message.put("timestamp", rs.getLong("timestamp"));
                    messages.add(message);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        
        return messages;
    }

    public List<Map<String, Object>> getRecentChats(Long userId) {
        List<Map<String, Object>> chats = new ArrayList<>();

        try (Connection conn = dataSource.getConnection()) {
            String tableName = getCurrentMessageTable();
            
            // Get most recent message with each contact
            String sql = String.format("""
                SELECT 
                    CASE WHEN sender = ? THEN receiver ELSE sender END as contact_id,
                    content,
                    timestamp,
                    MAX(timestamp) as last_message_time
                FROM %s 
                WHERE (sender = ? OR receiver = ?) AND type = 0
                GROUP BY contact_id
                ORDER BY last_message_time DESC
                """, tableName);
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setLong(1, userId);
                stmt.setLong(2, userId);
                stmt.setLong(3, userId);
                
                ResultSet rs = stmt.executeQuery();
                
                while (rs.next()) {
                    Map<String, Object> chat = new HashMap<>();
                    chat.put("contactId", rs.getLong("contact_id"));
                    chat.put("lastMessage", rs.getString("content"));
                    chat.put("lastMessageTime", rs.getLong("timestamp"));
                    chats.add(chat);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        
        return chats;
    }

    public int getUnreadMessageCount(Long userId, Long fromUserId) {
        try (Connection conn = dataSource.getConnection()) {
            String tableName = getCurrentMessageTable();
            String sql = String.format("SELECT COUNT(*) FROM %s WHERE sender = ? AND receiver = ? AND status = 0", tableName);
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setLong(1, fromUserId);
                stmt.setLong(2, userId);
                
                ResultSet rs = stmt.executeQuery();
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    public boolean markMessagesAsRead(Long userId, Long fromUserId) {
        return updateMessageStatus(fromUserId, userId, 2);
    }
}