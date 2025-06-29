# 小程序API路径修复说明

## 问题描述
用户反映小程序的登录接口仍在访问 `http://localhost:8000/api/v1/mini/auth/login`，但根据后台API路径调整，已经移除了 `/api/v1` 前缀，应该访问 `http://localhost:8000/mini/auth/login`。

## 问题分析
在之前的系统架构调整中，后台API路径已经统一去除了 `/api/v1` 前缀，但小程序端的配置文件没有同步更新，导致接口调用路径不匹配。

## 修复内容

### 1. 根目录配置文件修复
**文件：** `power-sales-mini/utils/config.js`

```javascript
// 修复前
baseURL: 'http://localhost:8000/api/v1/mini',

// 修复后
baseURL: 'http://localhost:8000/mini',
```

### 2. 小程序内部环境配置修复
**文件：** `power-sales-mini/miniprogram/utils/env.js`

```javascript
// 修复前
[ENV_TYPES.DEVELOPMENT]: {
  apiBaseURL: 'http://localhost:8000/api/v1/mini',
  // ...
},

// 修复后
[ENV_TYPES.DEVELOPMENT]: {
  apiBaseURL: 'http://localhost:8000/mini',
  // ...
},
```

### 3. 示例配置文件修复
**文件：** `power-sales-mini/app.js`

```javascript
// 修复前
baseUrl: 'https://your-api-domain.com/power/api/v1',

// 修复后
baseUrl: 'https://your-api-domain.com/power/mini',
```

### 4. 图片上传组件修复
**文件：** `power-sales-mini/miniprogram/components/image-upload/index.js`

```javascript
// 修复前
uploadUrl: {
  type: String,
  value: '/api/v1/upload/image'
},

// 修复后
uploadUrl: {
  type: String,
  value: '/mini/upload/image'
},
```

## 当前API架构
修复后的小程序API路径结构：

```
小程序端：
├── /mini/auth/login          - 登录接口
├── /mini/auth/logout         - 登出接口
├── /mini/user/profile        - 用户信息
├── /mini/products/*          - 产品相关接口
├── /mini/orders/*            - 订单相关接口
├── /mini/manager/*           - 管理功能接口
└── /mini/upload/image        - 图片上传接口

管理后台：
├── /admin/employees/*        - 员工管理
├── /admin/customers/*        - 客户管理
├── /admin/orders/*           - 订单管理
└── /admin/products/*         - 产品管理

公共接口：
└── /common/*                 - 通用接口

认证接口：
└── /auth/*                   - 认证相关接口
```

## 环境配置说明

### 开发环境
- **小程序API基础路径：** `http://localhost:8000/mini`
- **管理后台API基础路径：** `http://localhost:8000/admin`

### 生产环境
- **小程序API基础路径：** `https://dyh.zytcft.com/power/mini`
- **管理后台API基础路径：** `https://dyh.zytcft.com/power/admin`

## 修复验证
修复完成后，以下小程序接口应该能正常访问：

1. **登录接口：** `http://localhost:8000/mini/auth/login`
2. **用户信息：** `http://localhost:8000/mini/user/profile`
3. **产品列表：** `http://localhost:8000/mini/products`
4. **订单列表：** `http://localhost:8000/mini/orders`
5. **图片上传：** `http://localhost:8000/mini/upload/image`

## 相关文件
- `power-sales-mini/utils/config.js` - 根目录API配置
- `power-sales-mini/miniprogram/utils/env.js` - 环境配置管理
- `power-sales-mini/miniprogram/utils/config.js` - 小程序内部配置
- `power-sales-mini/app.js` - 全局应用配置
- `power-sales-mini/miniprogram/components/image-upload/index.js` - 图片上传组件

## 技术要点
1. **统一性：** 确保前后端API路径的一致性
2. **环境隔离：** 开发环境和生产环境的配置分离
3. **组件兼容：** 第三方组件和自定义组件的配置同步
4. **全局搜索：** 使用grep工具确保没有遗漏的路径配置

## 注意事项
- 如果后续后台API路径再次调整，需要同步更新小程序端的配置文件
- 生产环境部署前需要确认生产环境的API路径配置是否正确
- 建议在环境配置文件中集中管理所有API路径，避免硬编码分散在各个文件中 