// 认证工具类
const { showToast, navigateTo, switchTab } = require('./common')

// 获取用户信息
function getUserInfo() {
  try {
    return wx.getStorageSync('userInfo') || null
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

// 设置用户信息
function setUserInfo(userInfo) {
  try {
    wx.setStorageSync('userInfo', userInfo)
    return true
  } catch (error) {
    console.error('保存用户信息失败:', error)
    return false
  }
}

// 获取登录令牌
function getToken() {
  try {
    return wx.getStorageSync('token') || ''
  } catch (error) {
    console.error('获取令牌失败:', error)
    return ''
  }
}

// 设置登录令牌
function setToken(token) {
  try {
    wx.setStorageSync('token', token)
    return true
  } catch (error) {
    console.error('保存令牌失败:', error)
    return false
  }
}

// 获取刷新令牌
function getRefreshToken() {
  try {
    return wx.getStorageSync('refreshToken') || ''
  } catch (error) {
    console.error('获取刷新令牌失败:', error)
    return ''
  }
}

// 设置刷新令牌
function setRefreshToken(refreshToken) {
  try {
    wx.setStorageSync('refreshToken', refreshToken)
    return true
  } catch (error) {
    console.error('保存刷新令牌失败:', error)
    return false
  }
}

// 检查是否已登录
function isLoggedIn() {
  const token = getToken()
  const userInfo = getUserInfo()
  return !!(token && userInfo)
}

// 检查登录状态并处理
function checkLogin(showTip = true) {
  if (!isLoggedIn()) {
    if (showTip) {
      showToast('请先登录')
    }
    // 跳转到登录页面
    setTimeout(() => {
      navigateTo('/pages/auth/login/login')
    }, 1500)
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
  try {
    // 清除所有认证相关的存储
    wx.removeStorageSync('token')
    wx.removeStorageSync('refreshToken')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('loginTime')
    
    // 跳转到登录页面
    navigateTo('/pages/auth/login/login')
    
    return true
  } catch (error) {
    console.error('退出登录失败:', error)
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

// 检查令牌是否过期（简单检查）
function isTokenExpired() {
  const loginTime = wx.getStorageSync('loginTime')
  if (!loginTime) return true
  
  // 假设令牌7天过期
  const expireTime = 7 * 24 * 60 * 60 * 1000
  return Date.now() - loginTime > expireTime
}

// 获取用户角色
function getUserRole() {
  const userInfo = getUserInfo()
  return userInfo ? userInfo.role : null
}

// 检查用户权限
function hasPermission(permission) {
  const userInfo = getUserInfo()
  if (!userInfo || !userInfo.permissions) {
    return false
  }
  
  return userInfo.permissions.includes(permission)
}

// 检查是否为管理员
function isManager() {
  const role = getUserRole()
  return role === 'manager' || role === 'admin'
}

// 检查是否为客户
function isCustomer() {
  const role = getUserRole()
  return role === 'customer'
}

// 获取用户头像
function getUserAvatar() {
  const userInfo = getUserInfo()
  return userInfo ? userInfo.avatar : '/assets/images/default-avatar.png'
}

// 获取用户名称
function getUserName() {
  const userInfo = getUserInfo()
  return userInfo ? userInfo.name : '未知用户'
}

// 获取用户手机号
function getUserPhone() {
  const userInfo = getUserInfo()
  return userInfo ? userInfo.phone : ''
}

module.exports = {
  // 基础认证
  getUserInfo,
  setUserInfo,
  getToken,
  setToken,
  getRefreshToken,
  setRefreshToken,
  
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
  isManager,
  isCustomer,
  getUserAvatar,
  getUserName,
  getUserPhone
} 