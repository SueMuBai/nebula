package cn.nebula.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

@Configuration
public class DatabaseConfig {

    @Bean
    public void initializeDatabase(DataSource dataSource) throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            Statement statement = connection.createStatement();
            
            // Enable WAL mode for better performance
            statement.execute("PRAGMA journal_mode=WAL;");
            
            // Create users table
            statement.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    phone TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    nickname TEXT DEFAULT '用户',
                    avatar TEXT,
                    status INTEGER DEFAULT 0,
                    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
                )
            """);
            
            // Create friendships table
            statement.execute("""
                CREATE TABLE IF NOT EXISTS friendships (
                    user_a INTEGER NOT NULL,
                    user_b INTEGER NOT NULL,
                    status INTEGER NOT NULL,
                    remark TEXT,
                    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
                    PRIMARY KEY (user_a, user_b)
                )
            """);
            
            // Create messages table (current month)
            String currentMonth = java.time.LocalDate.now().toString().substring(0, 7).replace("-", "");
            statement.execute(String.format("""
                CREATE TABLE IF NOT EXISTS messages_%s (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sender INTEGER NOT NULL,
                    receiver INTEGER NOT NULL,
                    type INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    status INTEGER DEFAULT 0,
                    timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000)
                )
            """, currentMonth));
            
            // Create groups table
            statement.execute("""
                CREATE TABLE IF NOT EXISTS groups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    owner INTEGER NOT NULL,
                    create_time INTEGER DEFAULT (strftime('%s', 'now') * 1000)
                )
            """);
            
            // Create group_members table
            statement.execute("""
                CREATE TABLE IF NOT EXISTS group_members (
                    group_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    role INTEGER DEFAULT 0,
                    joined_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
                    PRIMARY KEY (group_id, user_id)
                )
            """);
            
            // Create indexes for better performance
            statement.execute("CREATE INDEX IF NOT EXISTS idx_friendships_user_a ON friendships(user_a)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_friendships_user_b ON friendships(user_b)");
            statement.execute(String.format("CREATE INDEX IF NOT EXISTS idx_messages_%s_sender ON messages_%s(sender)", currentMonth, currentMonth));
            statement.execute(String.format("CREATE INDEX IF NOT EXISTS idx_messages_%s_receiver ON messages_%s(receiver)", currentMonth, currentMonth));
        }
    }
}