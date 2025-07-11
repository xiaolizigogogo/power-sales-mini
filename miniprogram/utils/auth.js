// 认证工具类
const { showToast, navigateTo, switchTab } = require('./common')

// 角色常量定义
const ROLES = {
  CUSTOMER: 'customer',
  CUSTOMER_MANAGER: 'manager',
  SALES_MANAGER: 'sales_manager',
  SALES_DIRECTOR: 'sales_director',
  CUSTOMER_SERVICE: 'customer_service',
  FINANCE: 'finance',
  ADMIN: 'admin'
}

// 权限常量定义
const PERMISSIONS = {
  // 客户管理权限
  CUSTOMER_VIEW: 'customer:view',
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',
  
  // 订单管理权限
  ORDER_CREATE: 'order:create',
  ORDER_UPDATE: 'order:update',
  ORDER_CANCEL: 'order:cancel',
  ORDER_APPROVE: 'order:approve',
  
  // 跟进管理权限
  FOLLOW_VIEW: 'follow:view',
  FOLLOW_CREATE: 'follow:create',
  FOLLOW_UPDATE: 'follow:update',
  FOLLOW_DELETE: 'follow:delete',
  
  // 业绩查看权限
  PERFORMANCE_VIEW: 'performance:view',
  PERFORMANCE_TEAM: 'performance:team',
  
  // 产品管理权限
  PRODUCT_VIEW: 'product:view',
  PRODUCT_PRICE: 'product:price',
  
  // 合同管理权限
  CONTRACT_VIEW: 'contract:view',
  CONTRACT_SIGN: 'contract:sign'
}

// 页面类型权限映射
const PAGE_ACCESS = {
  'products': [ROLES.CUSTOMER, ROLES.CUSTOMER_MANAGER, ROLES.SALES_MANAGER],
  'orders': [ROLES.CUSTOMER, ROLES.CUSTOMER_MANAGER, ROLES.SALES_MANAGER],
  'customers': [ROLES.CUSTOMER_MANAGER, ROLES.SALES_MANAGER],
  'performance': [ROLES.CUSTOMER_MANAGER, ROLES.SALES_MANAGER]
}

// 角色权限映射
const ROLE_PERMISSIONS = {
  [ROLES.CUSTOMER]: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_CANCEL,
    PERMISSIONS.CONTRACT_VIEW
  ],
  [ROLES.CUSTOMER_MANAGER]: [
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.FOLLOW_VIEW,
    PERMISSIONS.FOLLOW_CREATE,
    PERMISSIONS.FOLLOW_UPDATE,
    PERMISSIONS.FOLLOW_DELETE,
    PERMISSIONS.PERFORMANCE_VIEW,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_PRICE,
    PERMISSIONS.CONTRACT_VIEW
  ],
  [ROLES.SALES_MANAGER]: [
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.ORDER_APPROVE,
    PERMISSIONS.FOLLOW_VIEW,
    PERMISSIONS.PERFORMANCE_VIEW,
    PERMISSIONS.PERFORMANCE_TEAM,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_PRICE,
    PERMISSIONS.CONTRACT_VIEW,
    PERMISSIONS.CONTRACT_SIGN
  ]
}

// 用户角色枚举
const USER_ROLES = {
  CUSTOMER: 'customer',    // 普通客户
  MANAGER: 'manager'       // 客户经理
};

// Token 存储键名
const TOKEN_KEY = 'user_token';
const USER_INFO_KEY = 'user_info';

/**
 * 获取存储的token
 * @returns {string|null} token
 */
const getToken = () => {
  return wx.getStorageSync(TOKEN_KEY);
};

/**
 * 设置token
 * @param {string} token 
 */
const setToken = (token) => {
  wx.setStorageSync(TOKEN_KEY, token);
};

/**
 * 清除token
 */
const clearToken = () => {
  wx.removeStorageSync(TOKEN_KEY);
};

/**
 * 获取用户信息
 * @returns {Object|null} 用户信息
 */
const getUserInfo = () => {
  return wx.getStorageSync(USER_INFO_KEY);
};

/**
 * 设置用户信息
 * @param {Object} userInfo 
 */
const setUserInfo = (userInfo) => {
  wx.setStorageSync(USER_INFO_KEY, userInfo);
};

/**
 * 清除用户信息
 */
const clearUserInfo = () => {
  wx.removeStorageSync(USER_INFO_KEY);
};

/**
 * 检查是否已登录
 * @returns {boolean}
 */
const isLoggedIn = () => {
  return !!getToken();
};

/**
 * 登出
 */
const logout = () => {
  clearToken();
  clearUserInfo();
};

// 获取用户角色
function getUserRole() {
  try {
    return wx.getStorageSync('userRole') || null
  } catch (error) {
    console.error('获取用户角色失败:', error)
    return null
  }
}

// 检查登录状态
function isLoggedIn() {
  const token = wx.getStorageSync('token')
  const userInfo = wx.getStorageSync('userInfo')
  return !!(token && userInfo)
}

// 检查登录并跳转
function checkLogin() {
  if (!isLoggedIn()) {
    wx.redirectTo({
      url: '/pages/auth/login/login'
    })
    return false
  }
  return true
}

// 登录
function login(loginData) {
  const { token, refreshToken, userInfo } = loginData
  
  if (token) setToken(token)
  if (refreshToken) setRefreshToken(refreshToken)
  if (userInfo) setUserInfo(userInfo)
  
  // 触发登录成功事件
  wx.setStorageSync('loginTime', Date.now())
  
  return true
}

// 退出登录
function logout() {
  return new Promise((resolve) => {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          performLogout().then(resolve)
        } else {
          resolve(false)
        }
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

// 执行退出登录
async function performLogout() {
  try {
    wx.showLoading({
      title: '退出中...',
      mask: true
    })

    const app = getApp()

    // 调用后端退出登录接口（如果需要的话）
    try {
      const { authAPI } = require('./api')
      await authAPI.logout()
    } catch (error) {
      console.log('后端退出登录失败，继续本地清理:', error)
    }

    // 清除本地存储的用户信息
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('userRole')

    // 清除全局数据
    app.globalData.token = ''
    app.globalData.userInfo = null
    app.globalData.userRole = ''
    app.globalData.isLogin = false

    // 清除相关存储数据
    try {
      // 清除其他可能的存储项
      wx.removeStorageSync('loginTime')
      wx.removeStorageSync('refreshToken')
    } catch (error) {
      console.log('清除其他存储数据失败:', error)
    }

    wx.hideLoading()

    wx.showToast({
      title: '已退出登录',
      icon: 'success',
      duration: 2000
    })

    // 延迟跳转到登录页面
    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/auth/login/login'
      })
    }, 2000)

    return true

  } catch (error) {
    wx.hideLoading()
    console.error('退出登录失败:', error)
    wx.showToast({
      title: '退出失败，请重试',
      icon: 'error'
    })
    return false
  }
}

// 更新用户信息
function updateUserInfo(updates) {
  const currentUserInfo = getUserInfo()
  if (!currentUserInfo) {
    return false
  }
  
  const newUserInfo = { ...currentUserInfo, ...updates }
  return setUserInfo(newUserInfo)
}

// 检查token是否过期
function isTokenExpired() {
  const loginTime = wx.getStorageSync('loginTime')
  if (!loginTime) return true
  
  const now = Date.now()
  const expireTime = 24 * 60 * 60 * 1000 // 24小时
  return (now - loginTime) > expireTime
}

// 检查权限
function hasPermission(permission) {
  const role = getUserRole()
  if (!role) return false
  
  const permissions = ROLE_PERMISSIONS[role]
  return permissions ? permissions.includes(permission) : false
}

// 检查是否为客户经理
function isCustomerManager() {
  const role = getUserRole()
  return role === ROLES.CUSTOMER_MANAGER
}

// 检查是否为普通客户
function isCustomer() {
  const role = getUserRole()
  return role === ROLES.CUSTOMER
}

// 检查是否为销售经理
function isSalesManager() {
  const role = getUserRole()
  return role === ROLES.SALES_MANAGER
}

// 检查是否为管理员角色（包括各种管理员）
function isManager() {
  const role = getUserRole()
  return [
    ROLES.CUSTOMER_MANAGER,
    ROLES.SALES_MANAGER,
    ROLES.SALES_DIRECTOR,
    ROLES.ADMIN
  ].includes(role)
}

// 获取用户头像
function getUserAvatar() {
  const userInfo = getUserInfo()
  return userInfo ? userInfo.avatar : ''
}

// 获取用户姓名
function getUserName() {
  const userInfo = getUserInfo()
  return userInfo ? userInfo.name : ''
}

// 获取用户手机号
function getUserPhone() {
  const userInfo = getUserInfo()
  return userInfo ? userInfo.phone : ''
}

// 获取用户公司信息
function getUserCompany() {
  const userInfo = getUserInfo()
  return userInfo ? userInfo.companyName : ''
}

// 权限检查装饰器
function requirePermission(permission, showTip = true) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function(...args) {
      if (!hasPermission(permission)) {
        if (showTip) {
          showToast('您没有权限执行此操作')
        }
        return Promise.reject(new Error('权限不足'))
      }
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}

// 登录检查装饰器
function requireLogin(showTip = true) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function(...args) {
      if (!checkLogin()) {
        return Promise.reject(new Error('未登录'))
      }
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}

// 角色检查装饰器
function requireRole(roles, showTip = true) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function(...args) {
      const userRole = getUserRole()
      const allowedRoles = Array.isArray(roles) ? roles : [roles]
      
      if (!allowedRoles.includes(userRole)) {
        if (showTip) {
          showToast('您的角色无权限执行此操作')
        }
        return Promise.reject(new Error('角色权限不足'))
      }
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}

// 检查角色访问权限
function checkRoleAccess(pageType) {
  const userRole = getUserRole();
  
  if (!userRole) {
    console.warn('用户角色未定义');
    return true; // 暂时放行，等待角色系统完善
  }
  
  if (!PAGE_ACCESS[pageType]) {
    console.warn('页面类型未定义权限:', pageType);
    return true; // 未定义权限的页面默认放行
  }
  
  const hasAccess = PAGE_ACCESS[pageType].includes(userRole);
  
  if (!hasAccess) {
    wx.showToast({
      title: '暂无访问权限',
      icon: 'none'
    });
  }
  
  return hasAccess;
}

module.exports = {
  // 常量
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  
  // 基础认证
  getToken,
  setToken,
  clearToken,
  getUserInfo,
  setUserInfo,
  clearUserInfo,
  isLoggedIn,
  logout,
  
  // 登录状态
  isLoggedIn,
  checkLogin,
  login,
  logout,
  updateUserInfo,
  isTokenExpired,
  
  // 用户信息
  getUserRole,
  hasPermission,
  isCustomerManager,
  isCustomer,
  isSalesManager,
  isManager,
  getUserAvatar,
  getUserName,
  getUserPhone,
  getUserCompany,
  
  // 装饰器
  requirePermission,
  requireLogin,
  requireRole,
  
  // 用户角色枚举
  USER_ROLES,
  checkRoleAccess
} 