# 微信登录接口 loginType 区分说明

## 修改概述

将微信登录接口 `/mini/auth/wechat-login` 修改为支持通过 `loginType` 参数区分普通客户和客户经理两种用户类型。

## 修改内容

### 1. 数据库修改
- 为 `employees` 表添加 `openid` 字段
- 添加唯一索引 `idx_employees_openid`
- 执行SQL脚本：`update_2025_07_07.sql`

### 2. 后端代码修改
- **Employee 实体类**：添加 openid 字段
- **EmployeeMapper**：添加 `findByOpenid` 方法
- **WechatLoginRequest DTO**：添加 `loginType` 字段
- **AuthService**：修改微信登录逻辑，支持区分用户类型
- **AuthServiceImpl**：实现普通客户和客户经理的分别处理逻辑

### 3. 前端代码修改
- **API 调用路径**：修改为 `/mini/auth/wechat-login`
- **请求参数**：添加 `loginType` 参数

## 接口说明

### 接口地址
```
POST /mini/auth/wechat-login
```

### 请求参数
```json
{
  "code": "微信授权码",
  "loginType": "customer|manager",
  "encryptedData": "加密数据(可选)",
  "iv": "初始向量(可选)"
}
```

### 参数说明
- `code`: 微信小程序登录获取的授权码
- `loginType`: 登录类型
  - `customer`: 普通客户
  - `manager`: 客户经理
- `encryptedData`: 微信加密数据（可选）
- `iv`: 初始向量（可选）

### 响应结果
```json
{
  "code": 200,
  "data": {
    "accessToken": "访问令牌",
    "refreshToken": "刷新令牌",
    "userRole": "customer|manager",
    "userInfo": {
      "id": 用户ID,
      "nickname": "用户昵称",
      "phone": "手机号",
      "avatar": "头像URL"
    }
  }
}
```

## 处理逻辑

### 普通客户登录 (loginType = "customer")
1. 通过微信授权码获取 openid
2. 在 `users` 表中查找 openid 对应的用户
3. 如果用户不存在，创建新用户
4. 生成 JWT token，userType 为 "customer"
5. 返回用户信息和 token

### 客户经理登录 (loginType = "manager")
1. 通过微信授权码获取 openid
2. 在 `employees` 表中查找 openid 对应的员工
3. 如果员工不存在，返回错误："未找到对应的客户经理账户，请联系管理员进行绑定"
4. 检查员工状态是否为 "active"
5. 生成 JWT token，userType 为 "manager"
6. 返回员工信息和 token

## 前端使用示例

### 小程序登录页面
```javascript
// 普通客户登录
const customerLogin = async () => {
  const res = await wx.login();
  const response = await authAPI.wechatLogin({
    code: res.code,
    loginType: 'customer'
  });
  // 处理登录结果
};

// 客户经理登录
const managerLogin = async () => {
  const res = await wx.login();
  const response = await authAPI.wechatLogin({
    code: res.code,
    loginType: 'manager'
  });
  // 处理登录结果
};
```

### 使用角色管理器
```javascript
// 在登录成功后
const roleManager = require('../../utils/role-manager');
await roleManager.setCurrentUser({
  id: response.data.userInfo.id,
  userType: response.data.userRole,
  // 其他用户信息
});
```

## 注意事项

1. **客户经理openid绑定**：客户经理首次使用微信登录时，需要管理员手动将其微信openid绑定到员工账户。

2. **错误处理**：
   - 如果客户经理openid未绑定，会提示"未找到对应的客户经理账户，请联系管理员进行绑定"
   - 如果员工账户被禁用，会提示"客户经理账户已被禁用"

3. **向后兼容性**：
   - 保持了与现有普通客户登录逻辑的兼容性
   - 如果不传 `loginType` 参数，默认为 "customer"

4. **Token 区分**：
   - 普通客户的 token 包含 userType: "customer"
   - 客户经理的 token 包含 userType: "manager"

## 数据库更新

执行以下SQL脚本更新数据库：

```sql
-- 为员工表添加openid字段
ALTER TABLE employees ADD COLUMN openid VARCHAR(100) COMMENT '微信openid';

-- 为openid字段添加唯一索引
CREATE UNIQUE INDEX idx_employees_openid ON employees(openid);
```

## 测试建议

1. 测试普通客户登录流程
2. 测试客户经理登录流程（需要先绑定openid）
3. 测试错误场景（未绑定openid、账户被禁用等）
4. 测试token生成和角色权限验证

## 管理员绑定操作

管理员可以通过以下方式为客户经理绑定微信openid：

1. 让客户经理先尝试登录（会失败并返回openid）
2. 管理员在后台员工管理界面，将该openid绑定到对应的员工账户
3. 或者提供专门的绑定接口供管理员使用 