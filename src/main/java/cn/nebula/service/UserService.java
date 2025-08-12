package cn.nebula.service;

import cn.nebula.model.User;
import cn.nebula.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {
    
    @Autowired
    private DataSource dataSource;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    public Map<String, Object> register(String phone, String password, String nickname) {
        Map<String, Object> result = new HashMap<>();
        
        try (Connection conn = dataSource.getConnection()) {
            // Check if phone already exists
            String checkSql = "SELECT id FROM users WHERE phone = ?";
            try (PreparedStatement stmt = conn.prepareStatement(checkSql)) {
                stmt.setString(1, phone);
                ResultSet rs = stmt.executeQuery();
                if (rs.next()) {
                    result.put("success", false);
                    result.put("message", "手机号已注册");
                    return result;
                }
            }
            
            // Insert new user
            String insertSql = "INSERT INTO users (phone, password, nickname) VALUES (?, ?, ?)";
            try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
                stmt.setString(1, phone);
                stmt.setString(2, passwordEncoder.encode(password));
                stmt.setString(3, nickname != null ? nickname : "用户");
                
                int affected = stmt.executeUpdate();
                if (affected > 0) {
                    result.put("success", true);
                    result.put("message", "注册成功");
                } else {
                    result.put("success", false);
                    result.put("message", "注册失败");
                }
            }
        } catch (SQLException e) {
            result.put("success", false);
            result.put("message", "数据库错误");
        }
        
        return result;
    }
    
    public Map<String, Object> login(String phone, String password) {
        Map<String, Object> result = new HashMap<>();
        
        try (Connection conn = dataSource.getConnection()) {
            String sql = "SELECT id, password, nickname FROM users WHERE phone = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, phone);
                ResultSet rs = stmt.executeQuery();
                
                if (rs.next()) {
                    String storedPassword = rs.getString("password");
                    if (passwordEncoder.matches(password, storedPassword)) {
                        Long userId = rs.getLong("id");
                        String nickname = rs.getString("nickname");
                        
                        // Update user status to online
                        updateUserStatus(userId, 1);
                        
                        String token = jwtUtil.generateToken(userId, phone);
                        
                        result.put("success", true);
                        result.put("token", token);
                        result.put("userId", userId);
                        result.put("nickname", nickname);
                    } else {
                        result.put("success", false);
                        result.put("message", "密码错误");
                    }
                } else {
                    result.put("success", false);
                    result.put("message", "用户不存在");
                }
            }
        } catch (SQLException e) {
            result.put("success", false);
            result.put("message", "登录失败");
        }
        
        return result;
    }
    
    public User getUserById(Long userId) {
        try (Connection conn = dataSource.getConnection()) {
            String sql = "SELECT * FROM users WHERE id = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setLong(1, userId);
                ResultSet rs = stmt.executeQuery();
                
                if (rs.next()) {
                    User user = new User();
                    user.setId(rs.getLong("id"));
                    user.setPhone(rs.getString("phone"));
                    user.setNickname(rs.getString("nickname"));
                    user.setAvatar(rs.getString("avatar"));
                    user.setStatus(rs.getInt("status"));
                    user.setCreatedAt(rs.getLong("created_at"));
                    return user;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }
    
    public User getUserByPhone(String phone) {
        try (Connection conn = dataSource.getConnection()) {
            String sql = "SELECT * FROM users WHERE phone = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, phone);
                ResultSet rs = stmt.executeQuery();
                
                if (rs.next()) {
                    User user = new User();
                    user.setId(rs.getLong("id"));
                    user.setPhone(rs.getString("phone"));
                    user.setNickname(rs.getString("nickname"));
                    user.setAvatar(rs.getString("avatar"));
                    user.setStatus(rs.getInt("status"));
                    user.setCreatedAt(rs.getLong("created_at"));
                    return user;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }
    
    public boolean updateUserStatus(Long userId, Integer status) {
        try (Connection conn = dataSource.getConnection()) {
            String sql = "UPDATE users SET status = ? WHERE id = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, status);
                stmt.setLong(2, userId);
                return stmt.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
    
    public boolean updateUserProfile(Long userId, String nickname, String avatar) {
        try (Connection conn = dataSource.getConnection()) {
            String sql = "UPDATE users SET nickname = ?, avatar = ? WHERE id = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, nickname);
                stmt.setString(2, avatar);
                stmt.setLong(3, userId);
                return stmt.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}