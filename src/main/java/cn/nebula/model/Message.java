package cn.nebula.model;

public class Message {
    private Long id;
    private Long sender;
    private Long receiver;
    private Integer type; // 0=private, 1=group
    private String content;
    private Integer status; // 0=unsent, 1=delivered, 2=read
    private Long timestamp;
    
    public Message() {}
    
    public Message(Long sender, Long receiver, Integer type, String content) {
        this.sender = sender;
        this.receiver = receiver;
        this.type = type;
        this.content = content;
        this.status = 0;
        this.timestamp = System.currentTimeMillis();
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getSender() { return sender; }
    public void setSender(Long sender) { this.sender = sender; }
    
    public Long getReceiver() { return receiver; }
    public void setReceiver(Long receiver) { this.receiver = receiver; }
    
    public Integer getType() { return type; }
    public void setType(Integer type) { this.type = type; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    
    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
}