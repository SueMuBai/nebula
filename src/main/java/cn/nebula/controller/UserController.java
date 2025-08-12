package cn.nebula.controller;

import cn.nebula.model.User;
import cn.nebula.service.UserService;
import cn.nebula.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> request) {
        String phone = request.get("phone");
        String password = request.get("password");
        String nickname = request.get("nickname");
        
        if (phone == null || password == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "手机号和密码不能为空");
            return ResponseEntity.badRequest().body(response);
        }
        
        Map<String, Object> result = userService.register(phone, password, nickname);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> request) {
        String phone = request.get("phone");
        String password = request.get("password");
        
        if (phone == null || password == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "手机号和密码不能为空");
            return ResponseEntity.badRequest().body(response);
        }
        
        Map<String, Object> result = userService.login(phone, password);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(@RequestHeader("Authorization") String token) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            
            Long userId = jwtUtil.getUserIdFromToken(token);
            userService.updateUserStatus(userId, 0); // Set offline
            
            response.put("success", true);
            response.put("message", "登出成功");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "登出失败");
        }
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@RequestHeader("Authorization") String token) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            
            if (!jwtUtil.validateToken(token)) {
                response.put("success", false);
                response.put("message", "无效的token");
                return ResponseEntity.unauthorized().body(response);
            }
            
            Long userId = jwtUtil.getUserIdFromToken(token);
            User user = userService.getUserById(userId);
            
            if (user != null) {
                response.put("success", true);
                response.put("user", user);
            } else {
                response.put("success", false);
                response.put("message", "用户不存在");
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取用户信息失败");
        }
        
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            
            if (!jwtUtil.validateToken(token)) {
                response.put("success", false);
                response.put("message", "无效的token");
                return ResponseEntity.unauthorized().body(response);
            }
            
            Long userId = jwtUtil.getUserIdFromToken(token);
            String nickname = request.get("nickname");
            String avatar = request.get("avatar");
            
            boolean updated = userService.updateUserProfile(userId, nickname, avatar);
            
            if (updated) {
                response.put("success", true);
                response.put("message", "更新成功");
            } else {
                response.put("success", false);
                response.put("message", "更新失败");
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "更新失败");
        }
        
        return ResponseEntity.ok(response);
    }
}