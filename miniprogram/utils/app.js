// utils/app.js - 应用工具类
const config = require('./config')

// 全局应用实例
let globalApp = null

// 设置全局应用实例
function setGlobalApp(app) {
  globalApp = app
}

// 获取全局应用实例
function getGlobalApp() {
  return globalApp
}

// 获取用户信息
function getUserInfo() {
  if (globalApp && globalApp.globalData) {
    return globalApp.globalData.userInfo
  }
  return wx.getStorageSync('userInfo')
}

// 获取token
function getToken() {
  if (globalApp && globalApp.globalData) {
    return globalApp.globalData.token
  }
  return wx.getStorageSync('token')
}

// 获取用户类型
function getUserType() {
  if (globalApp && globalApp.globalData) {
    return globalApp.globalData.userType
  }
  return wx.getStorageSync('userType')
}

// 检查是否已登录
function isLoggedIn() {
  if (globalApp && globalApp.globalData) {
    return globalApp.globalData.isLogin
  }
  const token = wx.getStorageSync('token')
  const userInfo = wx.getStorageSync('userInfo')
  return !!(token && userInfo)
}

// 登录方法
function login(userInfo, token, userType, refreshToken) {
  if (globalApp && globalApp.login) {
    return globalApp.login(userInfo, token, userType, refreshToken)
  }
  
  // 如果没有全局app实例，直接存储到本地
  wx.setStorageSync('userInfo', userInfo)
  wx.setStorageSync('token', token)
  wx.setStorageSync('userType', userType)
  if (refreshToken) {
    wx.setStorageSync('refreshToken', refreshToken)
  }
}

// 退出登录
function logout() {
  if (globalApp && globalApp.logout) {
    return globalApp.logout()
  }
  
  // 如果没有全局app实例，直接清除本地存储
  wx.removeStorageSync('userInfo')
  wx.removeStorageSync('token')
  wx.removeStorageSync('userType')
  wx.removeStorageSync('refreshToken')
}

// 更新用户信息
function updateUserInfo(userInfo) {
  if (globalApp && globalApp.updateUserInfo) {
    return globalApp.updateUserInfo(userInfo)
  }
  
  wx.setStorageSync('userInfo', userInfo)
}

// 获取系统信息
function getSystemInfo() {
  if (globalApp && globalApp.globalData && globalApp.globalData.systemInfo) {
    return globalApp.globalData.systemInfo
  }
  
  try {
    return wx.getSystemInfoSync()
  } catch (error) {
    console.error('获取系统信息失败:', error)
    return null
  }
}

// 获取网络状态
function getNetworkType() {
  if (globalApp && globalApp.globalData) {
    return globalApp.globalData.networkType
  }
  return 'unknown'
}

// 检查登录状态
function checkLoginStatus() {
  try {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    const userType = wx.getStorageSync('userType')
    
    if (token && userInfo) {
      return {
        isLogin: true,
        token,
        userInfo,
        userType
      }
    } else {
      return {
        isLogin: false,
        token: null,
        userInfo: null,
        userType: null
      }
    }
  } catch (error) {
    console.error('检查登录状态失败:', error)
    return {
      isLogin: false,
      token: null,
      userInfo: null,
      userType: null
    }
  }
}

// 导航到登录页面
function navigateToLogin() {
  wx.reLaunch({
    url: '/pages/auth/login/login'
  })
}

// 导航到首页
function navigateToHome() {
  const userType = getUserType()
  if (userType === 'manager') {
    wx.reLaunch({
      url: '/pages/menu/manager/workplace/workplace'
    })
  } else {
    wx.reLaunch({
      url: '/pages/customer/home/home'
    })
  }
}

// 显示错误提示
function showError(message, title = '错误') {
  wx.showModal({
    title,
    content: message,
    showCancel: false
  })
}

// 显示成功提示
function showSuccess(message, title = '成功') {
  wx.showToast({
    title: message,
    icon: 'success',
    duration: 2000
  })
}

// 显示加载提示
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  })
}

// 隐藏加载提示
function hideLoading() {
  wx.hideLoading()
}

module.exports = {
  setGlobalApp,
  getGlobalApp,
  getUserInfo,
  getToken,
  getUserType,
  isLoggedIn,
  login,
  logout,
  updateUserInfo,
  getSystemInfo,
  getNetworkType,
  checkLoginStatus,
  navigateToLogin,
  navigateToHome,
  showError,
  showSuccess,
  showLoading,
  hideLoading,
  config
} 