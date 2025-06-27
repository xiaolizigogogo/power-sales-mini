const { getApiBaseURL } = require('./utils/env')

App({
  globalData: {
    userInfo: null,
    token: '',
    baseUrl: getApiBaseURL(), // 使用环境配置的API地址
    isLogin: false,
    userRole: '', // customer: 普通客户, manager: 客户经理
  },

  onLaunch() {
    // 检查登录状态
    this.checkLogin()
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    const userRole = wx.getStorageSync('userRole')
    
    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.userRole = userRole
      this.globalData.isLogin = true
      // 验证token有效性
      this.checkToken()
    }
  },

  checkToken() {
    // 暂时注释掉token验证，避免启动时清除登录状态
    // 后续可以在需要时再验证token有效性
    /*
    wx.request({
      url: `${this.globalData.baseUrl}/auth/check`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${this.globalData.token}`
      },
      success: (res) => {
        if (res.statusCode !== 200 || (res.data && res.data.code !== 0)) {
          // token无效，清除登录状态
          this.clearLoginInfo()
        }
      },
      fail: () => {
        // 网络请求失败，不清除登录状态，保持离线可用
        console.warn('Token验证请求失败，可能是网络问题')
      }
    })
    */
  },

  clearLoginInfo() {
    this.globalData.token = ''
    this.globalData.userInfo = null
    this.globalData.isLogin = false
    this.globalData.userRole = ''
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('userRole')
  },

  // 用户登录
  login(userInfo, token, userRole) {
    this.globalData.userInfo = userInfo;
    this.globalData.token = token;
    this.globalData.isLogin = true;
    this.globalData.userRole = userRole;
    
    // 存储到本地
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('token', token);
    wx.setStorageSync('userRole', userRole);
  },

  // 用户登出
  logout() {
    this.globalData.userInfo = null;
    this.globalData.token = null;
    this.globalData.isLogin = false;
    this.globalData.userRole = '';
    
    // 清除本地存储
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('token');
    wx.removeStorageSync('userRole');
    
    // 跳转到登录页
    wx.reLaunch({
      url: '/pages/auth/login/login'
    });
  },

  // 统一的请求方法
  request(options) {
    const { url, method = 'GET', data, header = {} } = options

    // 添加token到header
    if (this.globalData.token) {
      header.Authorization = `Bearer ${this.globalData.token}`
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.baseUrl}${url}`,
        method,
        data,
        header,
        success: (res) => {
          if (res.statusCode === 401) {
            // token过期，清除登录状态
            this.clearLoginInfo()
            // 跳转到登录页
            wx.reLaunch({
              url: '/pages/auth/login/login'
            })
            reject(new Error('未登录或登录已过期'))
          } else if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else {
            reject(new Error(res.data.message || '请求失败'))
          }
        },
        fail: (err) => {
          reject(new Error('网络请求失败'))
        }
      })
    })
  },

  // 显示加载提示
  showLoading(title = '加载中') {
    wx.showLoading({
      title,
      mask: true
    })
  },

  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading()
  },

  // 显示提示信息
  showToast(title, icon = 'none') {
    wx.showToast({
      title,
      icon,
      duration: 2000
    })
  }
}) 