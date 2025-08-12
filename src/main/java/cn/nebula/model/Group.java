package cn.nebula.model;

import java.util.List;

public class Group {
    private Long id;
    private String name;
    private Long owner;
    private Long createTime;
    private List<Long> members;
    
    public Group() {}
    
    public Group(String name, Long owner) {
        this.name = name;
        this.owner = owner;
        this.createTime = System.currentTimeMillis();
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public Long getOwner() { return owner; }
    public void setOwner(Long owner) { this.owner = owner; }
    
    public Long getCreateTime() { return createTime; }
    public void setCreateTime(Long createTime) { this.createTime = createTime; }
    
    public List<Long> getMembers() { return members; }
    public void setMembers(List<Long> members) { this.members = members; }
}