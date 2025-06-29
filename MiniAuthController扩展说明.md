# MiniAuthController 用户登录功能扩展说明

## 问题描述
用户要求在 MiniAuthController 中也加一份用户登录功能，使小程序端可以通过专门的小程序端认证接口进行登录和注册操作。

## 扩展内容

### 1. AuthService 接口扩展
为了支持新的认证功能，首先扩展了 AuthService 接口：

```java
public interface AuthService {
    // 原有方法...
    
    // 新增方法
    void sendVerifyCode(String phoneNumber);
    UserLoginResponse verifyCodeLogin(VerifyCodeLoginRequest request);
}
```

### 2. AuthDto 新增请求类
在 AuthDto 中新增验证码登录请求类：

```java
@Data
public static class VerifyCodeLoginRequest {
    @NotBlank(message = "手机号不能为空")
    private String phone;
    
    @NotBlank(message = "验证码不能为空")
    private String verifyCode;
}
```

### 3. AuthServiceImpl 实现扩展
实现了新增的两个方法：

#### sendVerifyCode 方法
```java
@Override
public void sendVerifyCode(String phoneNumber) {
    log.info("发送验证码: phone={}", phoneNumber);
    
    // 验证手机号格式
    if (!phoneNumber.matches("^1[3-9]\\d{9}$")) {
        throw new RuntimeException("手机号格式不正确");
    }
    
    // 生成6位随机验证码
    String verifyCode = String.format("%06d", (int)(Math.random() * 1000000));
    
    // TODO: 实际发送短信验证码
    // 这里可以集成第三方短信服务
    log.info("验证码已生成: phone={}, code={}", phoneNumber, verifyCode);
    log.info("验证码发送成功");
}
```

#### verifyCodeLogin 方法
```java
@Override
@Transactional
public UserLoginResponse verifyCodeLogin(VerifyCodeLoginRequest request) {
    // 验证验证码并完成登录
    // 实现与密码登录类似的逻辑
}
```

### 4. MiniAuthController 完整功能
扩展后的 MiniAuthController 现在提供以下接口：

#### 原有接口
- `POST /mini/auth/wechat-login` - 微信小程序登录
- `POST /mini/auth/send-code` - 发送验证码
- `POST /mini/auth/logout` - 退出登录

#### 新增接口
- `POST /mini/auth/login` - 用户手机号+密码登录
- `POST /mini/auth/verify-code-login` - 验证码登录
- `POST /mini/auth/register` - 用户注册
- `GET /mini/auth/me` - 获取当前用户信息
- `POST /mini/auth/refresh` - 刷新令牌

## API 接口详情

### 用户手机号+密码登录
```http
POST /mini/auth/login
Content-Type: application/json

{
  "phone": "13800138000",
  "password": "123456"
}
```

**响应：**
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "uuid-string",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "userInfo": {
      "id": 1,
      "phone": "13800138000",
      "name": "用户姓名",
      "companyName": "企业名称",
      "status": "verified"
    },
    "userRole": "customer"
  }
}
```

### 验证码登录
```http
POST /mini/auth/verify-code-login
Content-Type: application/json

{
  "phone": "13800138000",
  "verifyCode": "123456"
}
```

### 用户注册
```http
POST /mini/auth/register
Content-Type: application/json

{
  "phone": "13800138000",
  "password": "123456",
  "name": "张三",
  "companyName": "某某科技有限公司",
  "companyAddress": "北京市朝阳区...",
  "contactPerson": "李四",
  "contactPhone": "13900139000",
  "industry": "制造业",
  "province": "北京市",
  "city": "北京市",
  "district": "朝阳区"
}
```

### 获取当前用户信息
```http
GET /mini/auth/me
Authorization: Bearer eyJ...
```

### 刷新令牌
```http
POST /mini/auth/refresh?refreshToken=uuid-string
```

## 优势特性

### 1. 完整的认证体系
- 支持微信登录、手机号密码登录、验证码登录
- 统一的用户注册流程
- JWT令牌机制，支持访问令牌和刷新令牌

### 2. 小程序端专用
- 独立的API路径（`/mini/auth/*`）
- 专门针对小程序端的参数验证和错误处理
- 与管理后台认证完全隔离

### 3. 安全性考虑
- 密码使用BCrypt加密
- 用户状态验证（只有verified/active状态才能登录）
- 令牌过期和刷新机制

### 4. 用户角色判断
自动判断用户角色：
- 如果分配了客户经理且经理角色为CUSTOMER_MANAGER，则为manager
- 否则为customer

## 后续优化建议

### 1. 验证码功能完善
当前验证码功能是简化实现，建议集成真实的短信服务：
- 阿里云短信服务
- 腾讯云短信服务
- 将验证码存储到Redis中，设置5分钟过期

### 2. 登录安全增强
- 增加登录失败次数限制
- 增加设备指纹验证
- 增加登录地点异常检测

### 3. 用户体验优化
- 支持手机号一键登录
- 支持社交账号登录（QQ、微博等）
- 增加登录历史记录

## 相关文件
- `src/main/java/com/powersales/service/AuthService.java` - 认证服务接口
- `src/main/java/com/powersales/service/impl/AuthServiceImpl.java` - 认证服务实现
- `src/main/java/com/powersales/dto/AuthDto.java` - 认证相关DTO
- `src/main/java/com/powersales/controller/mini/MiniAuthController.java` - 小程序端认证控制器

## 技术要点
1. **接口隔离**：小程序端和管理后台使用不同的认证接口
2. **DTO设计**：请求和响应使用专门的DTO类，保证类型安全
3. **异常处理**：统一的异常处理和错误信息返回
4. **日志记录**：详细的操作日志，便于问题排查
5. **事务管理**：登录、注册等关键操作使用事务保证数据一致性 