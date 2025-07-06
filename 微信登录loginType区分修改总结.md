# 微信登录 loginType 区分修改总结

## 修改需求

用户要求修改 `/mini/auth/wechat-login` 接口，通过 `loginType` 参数区分普通客户和客户经理：
- 普通客户：使用现有的用户表逻辑
- 客户经理：使用员工表的 openid 查找

## 已完成的修改

### 1. 数据库修改
✅ **文件**: `power-sales-platform/db/update_2025_07_07.sql`
- 为 `employees` 表添加 `openid` 字段
- 添加唯一索引 `idx_employees_openid`

### 2. 后端实体类修改
✅ **文件**: `power-sales-platform/src/main/java/com/powersales/entity/Employee.java`
- 添加 `openid` 字段和对应的注解

### 3. 数据访问层修改
✅ **文件**: `power-sales-platform/src/main/java/com/powersales/mapper/EmployeeMapper.java`
- 添加 `findByOpenid` 方法，支持根据微信openid查找员工

### 4. DTO 修改
✅ **文件**: `power-sales-platform/src/main/java/com/powersales/dto/WechatLoginRequest.java`
- 创建独立的 `WechatLoginRequest` 类
- 包含 `loginType` 字段用于区分用户类型

### 5. 服务层修改
✅ **文件**: `power-sales-platform/src/main/java/com/powersales/service/AuthService.java`
- 修改接口方法签名，使用独立的 `WechatLoginRequest` 类

✅ **文件**: `power-sales-platform/src/main/java/com/powersales/service/impl/AuthServiceImpl.java`
- 重写 `wechatLogin` 方法，支持 `loginType` 区分
- 实现 `handleCustomerWechatLogin` 方法处理普通客户登录
- 实现 `handleManagerWechatLogin` 方法处理客户经理登录
- 简化 `createWechatUser` 方法

### 6. 控制器修改
✅ **文件**: `power-sales-platform/src/main/java/com/powersales/controller/mini/MiniAuthController.java`
- 修改导入，使用独立的 `WechatLoginRequest` 类

### 7. 前端API修改
✅ **文件**: `power-sales-mini/miniprogram/utils/api.js`
- 修改微信登录 API 路径为 `/mini/auth/wechat-login`
- 添加 `/mini/auth/wechat-login` 到无认证URL列表
- 微信登录已支持 `loginType` 参数传递

## 修改逻辑说明

### 普通客户登录 (loginType = "customer")
1. 通过微信授权码获取 openid
2. 在 `users` 表中查找对应用户
3. 如果不存在则创建新用户
4. 生成 JWT token，userType 为 "customer"

### 客户经理登录 (loginType = "manager")
1. 通过微信授权码获取 openid
2. 在 `employees` 表中查找对应员工
3. 如果不存在则返回错误提示
4. 检查员工状态是否为 "active"
5. 生成 JWT token，userType 为 "manager"

## 文档和说明
✅ **文件**: `power-sales-mini/微信登录接口loginType区分说明.md`
- 完整的接口使用说明
- 前端调用示例
- 错误处理说明
- 测试建议

## 关键改进点

1. **完整的业务逻辑分离**：普通客户和客户经理使用完全不同的数据表和处理逻辑
2. **错误处理**：客户经理未绑定openid时提供明确的错误提示
3. **向后兼容**：保持现有普通客户登录逻辑不变
4. **安全性**：员工账户状态验证，确保只有激活状态的员工可以登录

## 使用示例

### 前端调用
```javascript
// 普通客户登录
const customerResponse = await authAPI.wechatLogin({
  code: wxLoginCode,
  loginType: 'customer'
});

// 客户经理登录
const managerResponse = await authAPI.wechatLogin({
  code: wxLoginCode,
  loginType: 'manager'
});
```

### 响应结果
```json
{
  "code": 200,
  "data": {
    "accessToken": "JWT访问令牌",
    "refreshToken": "刷新令牌",
    "userRole": "customer|manager",
    "userInfo": {
      "id": 123,
      "nickname": "用户昵称",
      "phone": "手机号"
    }
  }
}
```

## 注意事项

1. **客户经理openid绑定**：首次使用需要管理员手动绑定微信openid到员工账户
2. **数据库更新**：需要执行 `update_2025_07_07.sql` 脚本
3. **Token区分**：生成的JWT token中包含不同的userType，用于后续权限验证
4. **错误处理**：客户经理未绑定或账户被禁用时有明确提示

## 测试建议

1. 测试普通客户微信登录流程
2. 测试客户经理微信登录流程（需要先绑定openid）
3. 测试未绑定openid的错误场景
4. 测试被禁用账户的错误场景
5. 验证生成的JWT token和角色权限

修改已全部完成，可以进行测试和部署。 