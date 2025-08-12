package cn.nebula.model;

public class Friendship {
    private Long userA;
    private Long userB;
    private Integer status; // 0=pending, 1=accepted
    private String remark;
    private Long createdAt;
    
    public Friendship() {}
    
    public Friendship(Long userA, Long userB, Integer status) {
        this.userA = userA;
        this.userB = userB;
        this.status = status;
        this.createdAt = System.currentTimeMillis();
    }
    
    public Long getUserA() { return userA; }
    public void setUserA(Long userA) { this.userA = userA; }
    
    public Long getUserB() { return userB; }
    public void setUserB(Long userB) { this.userB = userB; }
    
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    
    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }
}