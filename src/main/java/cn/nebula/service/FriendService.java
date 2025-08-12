package cn.nebula.service;

import cn.nebula.model.Friendship;
import cn.nebula.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FriendService {
    
    @Autowired
    private DataSource dataSource;
    
    @Autowired
    private UserService userService;
    
    public Map<String, Object> sendFriendRequest(Long fromUserId, Long toUserId) {
        Map<String, Object> result = new HashMap<>();
        
        if (fromUserId.equals(toUserId)) {
            result.put("success", false);
            result.put("message", "不能添加自己为好友");
            return result;
        }
        
        try (Connection conn = dataSource.getConnection()) {
            // Check if friendship already exists
            String checkSql = "SELECT status FROM friendships WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)";
            try (PreparedStatement stmt = conn.prepareStatement(checkSql)) {
                stmt.setLong(1, fromUserId);
                stmt.setLong(2, toUserId);
                stmt.setLong(3, toUserId);
                stmt.setLong(4, fromUserId);
                
                ResultSet rs = stmt.executeQuery();
                if (rs.next()) {
                    int status = rs.getInt("status");
                    if (status == 1) {
                        result.put("success", false);
                        result.put("message", "已经是好友了");
                    } else {
                        result.put("success", false);
                        result.put("message", "好友请求已发送");
                    }
                    return result;
                }
            }
            
            // Insert friend request
            String insertSql = "INSERT INTO friendships (user_a, user_b, status) VALUES (?, ?, 0)";
            try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
                stmt.setLong(1, fromUserId);
                stmt.setLong(2, toUserId);
                
                int affected = stmt.executeUpdate();
                if (affected > 0) {
                    result.put("success", true);
                    result.put("message", "好友请求发送成功");
                } else {
                    result.put("success", false);
                    result.put("message", "发送失败");
                }
            }
        } catch (SQLException e) {
            result.put("success", false);
            result.put("message", "数据库错误");
        }
        
        return result;
    }
    
    public Map<String, Object> approveFriendRequest(Long currentUserId, Long fromUserId, boolean accept) {
        Map<String, Object> result = new HashMap<>();
        
        try (Connection conn = dataSource.getConnection()) {
            if (accept) {
                // Update existing request to accepted
                String updateSql = "UPDATE friendships SET status = 1 WHERE user_a = ? AND user_b = ? AND status = 0";
                try (PreparedStatement stmt = conn.prepareStatement(updateSql)) {
                    stmt.setLong(1, fromUserId);
                    stmt.setLong(2, currentUserId);
                    
                    int affected = stmt.executeUpdate();
                    if (affected > 0) {
                        // Add reverse friendship
                        String insertSql = "INSERT OR REPLACE INTO friendships (user_a, user_b, status) VALUES (?, ?, 1)";
                        try (PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
                            insertStmt.setLong(1, currentUserId);
                            insertStmt.setLong(2, fromUserId);
                            insertStmt.executeUpdate();
                        }
                        
                        result.put("success", true);
                        result.put("message", "已接受好友请求");
                    } else {
                        result.put("success", false);
                        result.put("message", "请求不存在或已处理");
                    }
                }
            } else {
                // Reject request by deleting it
                String deleteSql = "DELETE FROM friendships WHERE user_a = ? AND user_b = ? AND status = 0";
                try (PreparedStatement stmt = conn.prepareStatement(deleteSql)) {
                    stmt.setLong(1, fromUserId);
                    stmt.setLong(2, currentUserId);
                    
                    int affected = stmt.executeUpdate();
                    if (affected > 0) {
                        result.put("success", true);
                        result.put("message", "已拒绝好友请求");
                    } else {
                        result.put("success", false);
                        result.put("message", "请求不存在");
                    }
                }
            }
        } catch (SQLException e) {
            result.put("success", false);
            result.put("message", "处理失败");
        }
        
        return result;
    }
    
    public List<Map<String, Object>> getFriendRequests(Long userId) {
        List<Map<String, Object>> requests = new ArrayList<>();
        
        try (Connection conn = dataSource.getConnection()) {
            String sql = "SELECT f.user_a, f.created_at, u.nickname, u.avatar FROM friendships f " +
                        "JOIN users u ON f.user_a = u.id " +
                        "WHERE f.user_b = ? AND f.status = 0";
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setLong(1, userId);
                ResultSet rs = stmt.executeQuery();
                
                while (rs.next()) {
                    Map<String, Object> request = new HashMap<>();
                    request.put("fromUserId", rs.getLong("user_a"));
                    request.put("nickname", rs.getString("nickname"));
                    request.put("avatar", rs.getString("avatar"));
                    request.put("createdAt", rs.getLong("created_at"));
                    requests.add(request);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        
        return requests;
    }
    
    public List<Map<String, Object>> getFriendsList(Long userId) {
        List<Map<String, Object>> friends = new ArrayList<>();
        
        try (Connection conn = dataSource.getConnection()) {
            String sql = "SELECT CASE WHEN f.user_a = ? THEN u2.id ELSE u1.id END as friend_id, " +
                        "CASE WHEN f.user_a = ? THEN u2.nickname ELSE u1.nickname END as nickname, " +
                        "CASE WHEN f.user_a = ? THEN u2.avatar ELSE u1.avatar END as avatar, " +
                        "CASE WHEN f.user_a = ? THEN u2.status ELSE u1.status END as status " +
                        "FROM friendships f " +
                        "LEFT JOIN users u1 ON f.user_a = u1.id " +
                        "LEFT JOIN users u2 ON f.user_b = u2.id " +
                        "WHERE (f.user_a = ? OR f.user_b = ?) AND f.status = 1";
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setLong(1, userId);
                stmt.setLong(2, userId);
                stmt.setLong(3, userId);
                stmt.setLong(4, userId);
                stmt.setLong(5, userId);
                stmt.setLong(6, userId);
                
                ResultSet rs = stmt.executeQuery();
                
                while (rs.next()) {
                    Map<String, Object> friend = new HashMap<>();
                    friend.put("userId", rs.getLong("friend_id"));
                    friend.put("nickname", rs.getString("nickname"));
                    friend.put("avatar", rs.getString("avatar"));
                    friend.put("status", rs.getInt("status"));
                    friends.add(friend);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        
        return friends;
    }
    
    public boolean areFriends(Long userId1, Long userId2) {
        try (Connection conn = dataSource.getConnection()) {
            String sql = "SELECT 1 FROM friendships WHERE " +
                        "((user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)) AND status = 1";
            
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setLong(1, userId1);
                stmt.setLong(2, userId2);
                stmt.setLong(3, userId2);
                stmt.setLong(4, userId1);
                
                ResultSet rs = stmt.executeQuery();
                return rs.next();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}