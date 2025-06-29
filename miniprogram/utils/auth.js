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