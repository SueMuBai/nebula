package cn.nebula.config;

import cn.nebula.service.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
public class ScheduleConfig {

    @Autowired
    private MatchService matchService;

    // 每小时清理过期的临时匹配
    @Scheduled(fixedRate = 3600000) // 1 hour
    public void cleanupExpiredMatches() {
        matchService.scheduledCleanup();
    }
}