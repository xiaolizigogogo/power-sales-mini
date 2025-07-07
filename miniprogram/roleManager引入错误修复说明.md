# roleManager引入错误修复说明

## 问题描述

在小程序运行时出现以下错误：
```
TypeError: roleManager.getCurrentUserType is not a function
```

## 问题原因

问题出现在多个客户经理页面中，`roleManager` 的引入方式不正确。

### 错误的引入方式
```javascript
const roleManager = require('../../../utils/role-manager');
```

### 正确的引入方式
```javascript
const { roleManager } = require('../../../utils/role-manager');
```

## 问题根源

在 `role-manager.js` 文件中，导出的是一个对象：
```javascript
module.exports = {
  USER_TYPES,
  ROLE_PERMISSIONS,
  roleManager,    // 这是实际的roleManager实例
  RoleManager
}
```

所以需要使用解构赋值的方式来获取 `roleManager` 实例。

## 修复内容

### 1. 修复客户经理页面的引入方式

#### 1.1 工作台页面
**文件**: `power-sales-mini/miniprogram/pages/manager/workplace/workplace.js`
- 修复 `roleManager` 引入方式
- 修复 `getCurrentUser()` 方法调用为 `getCurrentUserInfo()`

#### 1.2 客户列表页面
**文件**: `power-sales-mini/miniprogram/pages/manager/customers/list.js`
- 修复 `roleManager` 引入方式

#### 1.3 跟进管理页面
**文件**: `power-sales-mini/miniprogram/pages/manager/follow/list.js`
- 修复 `roleManager` 引入方式

#### 1.4 业绩查看页面
**文件**: `power-sales-mini/miniprogram/pages/manager/performance/index.js`
- 修复 `roleManager` 引入方式
- 修复 `getCurrentUser()` 方法调用为 `getCurrentUserInfo()`

#### 1.5 个人资料页面
**文件**: `power-sales-mini/miniprogram/pages/manager/profile/index.js`
- 该文件的引入方式已经正确，无需修改

### 2. 修复方法调用错误

#### 2.1 用户名登录页面
**文件**: `power-sales-mini/miniprogram/pages/auth/username-login/index.js`
- 修复 `roleManager.setUserInfo()` 调用为 `roleManager.setCurrentUser()`
- 修正参数顺序：`setCurrentUser(userType, userInfo)`

## 修复对比

### 修复前
```javascript
// 错误的引入方式
const roleManager = require('../../../utils/role-manager');

// 错误的方法调用
const userInfo = roleManager.getCurrentUser(); // 应该是 getCurrentUserInfo()
roleManager.setUserInfo(userInfo, userType); // 应该是 setCurrentUser(userType, userInfo)
```

### 修复后
```javascript
// 正确的引入方式
const { roleManager } = require('../../../utils/role-manager');

// 正确的方法调用
const userInfo = roleManager.getCurrentUserInfo();
roleManager.setCurrentUser(userType, userInfo);
```

## 验证结果

修复后，以下功能应该正常工作：
1. 客户经理登录成功后能正确跳转到工作台
2. 工作台页面能正确显示底部菜单栏
3. 所有客户经理页面的权限检查功能正常
4. 页面间的切换功能正常
5. 用户信息获取和设置功能正常

## 其他已确认正确的文件

以下文件的 `roleManager` 引入方式已经正确，无需修改：
- `power-sales-mini/miniprogram/custom-tab-bar/index.js`
- `power-sales-mini/miniprogram/components/permission-guard/index.js`
- `power-sales-mini/miniprogram/pages/manager/profile/index.js`

## 技术要点

1. **模块导出理解**：需要理解 `module.exports` 导出的对象结构
2. **解构赋值**：使用 `const { roleManager } = require()` 来获取具体的实例
3. **方法名称**：注意区分 `getCurrentUser()` 和 `getCurrentUserInfo()` 方法
4. **参数顺序**：`setCurrentUser(userType, userInfo)` 的参数顺序很重要

## 测试建议

1. 清除小程序缓存
2. 重新登录客户经理账号
3. 验证是否还有 `TypeError` 错误
4. 测试各个页面的权限检查功能
5. 测试页面间的切换功能
6. 验证用户信息显示是否正常

此次修复确保了 `roleManager` 在所有页面中都能正确使用，解决了函数调用错误的问题。 