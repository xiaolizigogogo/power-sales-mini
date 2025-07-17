// app.js
const appUtils = require('./utils/app')

App({
  globalData: {
    userInfo: null,
    token: '',
    userType: '',
    isLogin: false,
    systemInfo: null,
    networkType: 'wifi'
  },

  onLaunch() {
    console.log('应用启动')
    
    // 设置全局应用实例
    appUtils.setGlobalApp(this)
    
    // 获取系统信息
    this.getSystemInfo()
    
    // 获取网络状态
    this.getNetworkType()
    
    // 检查登录状态
    this.checkLoginStatus()
  },

  onShow() {
    console.log('应用显示')
  },

  onHide() {
    console.log('应用隐藏')
  },

  onError(error) {
    console.error('应用错误:', error)
  },

  // 获取系统信息
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      this.globalData.systemInfo = systemInfo
      console.log('系统信息:', systemInfo)
    } catch (error) {
      console.error('获取系统信息失败:', error)
    }
  },

  // 获取网络状态
  getNetworkType() {
    wx.getNetworkType({
      success: (res) => {
        this.globalData.networkType = res.networkType
        console.log('网络类型:', res.networkType)
      },
      fail: (error) => {
        console.error('获取网络状态失败:', error)
      }
    })
  },

  // 检查登录状态
  checkLoginStatus() {
    try {
      const token = wx.getStorageSync('token')
      const userInfo = wx.getStorageSync('userInfo')
      const userType = wx.getStorageSync('userType')
      
      if (token && userInfo) {
        this.globalData.token = token
        this.globalData.userInfo = userInfo
        this.globalData.userType = userType
        this.globalData.isLogin = true
        console.log('检测到登录状态:', { userType, hasUserInfo: !!userInfo })
      } else {
        console.log('未检测到登录状态')
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
    }
  },

  // 登录方法
  login(userInfo, token, userType, refreshToken) {
    console.log('app.login 被调用:', { userInfo, token, userType })
    
    this.globalData.userInfo = userInfo
    this.globalData.token = token
    this.globalData.userType = userType
    this.globalData.isLogin = true
    
    // 存储到本地
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('token', token)
    wx.setStorageSync('userType', userType)
    if (refreshToken) {
      wx.setStorageSync('refreshToken', refreshToken)
    }
    
    console.log('登录成功，全局数据已更新')
  },

  // 退出登录
  logout() {
    console.log('app.logout 被调用')
    
    // 清除全局数据
    this.globalData.userInfo = null
    this.globalData.token = ''
    this.globalData.userType = ''
    this.globalData.isLogin = false
    
    // 清除本地存储
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('token')
    wx.removeStorageSync('userType')
    wx.removeStorageSync('refreshToken')
    
    console.log('退出登录成功，全局数据已清除')
  },

  // 更新用户信息
  updateUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
    console.log('用户信息已更新')
  },

  // 获取用户信息
  getUserInfo() {
    return this.globalData.userInfo
  },

  // 获取token
  getToken() {
    return this.globalData.token
  },

  // 获取用户类型
  getUserType() {
    return this.globalData.userType
  },

  // 检查是否已登录
  isLoggedIn() {
    return this.globalData.isLogin
  },

  request({ url, method = 'GET', data = {}, header = {}, showLoading = true }) {
    if (showLoading) wx.showLoading({ title: '加载中...' });
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        method,
        data,
        header: {
          'Authorization': 'Bearer ' + (this.globalData.token || wx.getStorageSync('token') || ''),
          'content-type': 'application/json',
          ...header
        },
        success: res => {
          if (showLoading) wx.hideLoading();
          resolve(res);
        },
        fail: err => {
          if (showLoading) wx.hideLoading();
          wx.showToast({ title: '网络错误', icon: 'none' });
          reject(err);
        }
      });
    });
  },

  uploadFile({ url, filePath, name = 'file', formData = {}, header = {} }) {
    wx.showLoading({ title: '上传中...' });
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url,
        filePath,
        name,
        formData,
        header: {
          'Authorization': 'Bearer ' + (this.globalData.token || wx.getStorageSync('token') || ''),
          ...header
        },
        success: res => {
          wx.hideLoading();
          resolve(res);
        },
        fail: err => {
          wx.hideLoading();
          wx.showToast({ title: '上传失败', icon: 'none' });
          reject(err);
        }
      });
    });
  },

  uploadBusinessLicense(filePath) {
    return this.uploadFile({
      url: '/upload/auth/businessLicense',
      filePath,
      name: 'file'
    });
  },

  uploadIdCardFront(filePath) {
    return this.uploadFile({
      url: '/upload/auth/idCardFront',
      filePath,
      name: 'file'
    });
  },

  uploadIdCardBack(filePath) {
    return this.uploadFile({
      url: '/upload/auth/idCardBack',
      filePath,
      name: 'file'
    });
  }
}) 