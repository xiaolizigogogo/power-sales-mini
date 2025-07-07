# 客户经理 openid 绑定功能建议

## 功能需求

由于客户经理首次使用微信登录时需要绑定 openid，建议实现管理员绑定功能。

## 方案一：管理员手动绑定

### 后端接口
```java
@PostMapping("/admin/employees/bind-wechat")
public ResponseEntity<?> bindWechatOpenid(
    @RequestParam Long employeeId,
    @RequestParam String openid) {
    // 验证员工是否存在
    // 验证openid是否已被绑定
    // 执行绑定操作
}
```

### 前端界面
在员工管理页面添加"绑定微信"按钮，管理员可以：
1. 输入员工ID
2. 输入或扫码获取微信openid
3. 执行绑定操作

## 方案二：自助绑定流程

### 实现步骤
1. 客户经理尝试微信登录失败
2. 系统记录该次登录的openid和时间
3. 客户经理通过其他方式（如账号密码）登录
4. 系统提示有待绑定的微信账号
5. 客户经理确认绑定

### 后端接口
```java
@GetMapping("/employee/pending-wechat-bind")
public ResponseEntity<?> getPendingWechatBind() {
    // 返回待绑定的微信openid列表
}

@PostMapping("/employee/confirm-wechat-bind")
public ResponseEntity<?> confirmWechatBind(@RequestParam String openid) {
    // 确认绑定微信账号
}
```

## 方案三：二维码绑定

### 实现步骤
1. 管理员后台生成绑定二维码
2. 二维码包含员工ID和临时token
3. 客户经理扫码后进入绑定页面
4. 客户经理确认身份信息
5. 系统自动绑定微信openid

### 后端接口
```java
@PostMapping("/admin/employees/generate-bind-qr")
public ResponseEntity<?> generateBindQrCode(@RequestParam Long employeeId) {
    // 生成绑定二维码
}

@PostMapping("/wechat/bind-by-qr")
public ResponseEntity<?> bindByQrCode(@RequestParam String token) {
    // 通过二维码token绑定
}
```

## 推荐方案

建议使用**方案二（自助绑定流程）**，理由：

1. **用户体验好**：客户经理可以自助完成绑定
2. **管理成本低**：减少管理员的工作量
3. **安全性高**：需要客户经理先通过其他方式验证身份
4. **实现简单**：逻辑相对简单，开发成本低

## 具体实现建议

### 1. 数据库设计
```sql
-- 创建待绑定记录表
CREATE TABLE pending_wechat_binds (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(100) NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    employee_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_openid (openid),
    INDEX idx_status (status)
);
```

### 2. 修改微信登录逻辑
当客户经理openid未找到时：
```java
// 记录待绑定的openid
PendingWechatBind pending = new PendingWechatBind();
pending.setOpenid(openId);
pending.setAttemptedAt(LocalDateTime.now());
pending.setExpiresAt(LocalDateTime.now().plusHours(24)); // 24小时有效期
pendingWechatBindMapper.insert(pending);

throw new RuntimeException("未找到对应的客户经理账户，请先使用账号密码登录完成微信绑定");
```

### 3. 员工登录后检查
```java
@PostMapping("/employee/check-pending-bind")
public ResponseEntity<?> checkPendingBind() {
    Long employeeId = getCurrentEmployeeId();
    List<PendingWechatBind> pendingBinds = pendingWechatBindMapper.findPendingByEmployeeId(employeeId);
    // 返回待绑定列表
}
```

### 4. 确认绑定
```java
@PostMapping("/employee/confirm-bind")
public ResponseEntity<?> confirmBind(@RequestParam String openid) {
    Long employeeId = getCurrentEmployeeId();
    
    // 验证待绑定记录
    PendingWechatBind pending = pendingWechatBindMapper.findByOpenid(openid);
    if (pending == null || pending.isExpired()) {
        return ResponseUtil.error("绑定请求已过期，请重新尝试微信登录");
    }
    
    // 执行绑定
    Employee employee = employeeMapper.selectById(employeeId);
    employee.setOpenid(openid);
    employeeMapper.updateById(employee);
    
    // 更新待绑定状态
    pending.setStatus("completed");
    pending.setEmployeeId(employeeId);
    pendingWechatBindMapper.updateById(pending);
    
    return ResponseUtil.success("微信账号绑定成功");
}
```

## 前端界面建议

### 1. 登录页面提示
当微信登录失败时，显示：
```
微信账号未绑定，请使用账号密码登录后完成绑定
```

### 2. 员工后台绑定界面
登录后如果有待绑定记录，显示：
```
检测到待绑定的微信账号，是否确认绑定？
- 最近尝试时间：2025-07-07 14:30:00
- [确认绑定] [忽略]
```

### 3. 绑定成功提示
```
微信账号绑定成功！现在可以使用微信快速登录了。
```

这样的实现既保证了安全性，又提供了良好的用户体验，建议优先考虑实现。 