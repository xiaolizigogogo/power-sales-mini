App({
  globalData: {
    userInfo: null,
    token: '',
    baseUrl: 'https://api.example.com', // 替换为实际的API地址
  },

  onLaunch() {
    // 检查登录状态
    this.checkLogin()
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      // 验证token有效性
      this.checkToken()
    }
  },

  checkToken() {
    wx.request({
      url: `${this.globalData.baseUrl}/api/auth/check`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${this.globalData.token}`
      },
      success: (res) => {
        if (res.data.code !== 0) {
          // token无效，清除登录状态
          this.clearLoginInfo()
        }
      },
      fail: () => {
        // 请求失败，清除登录状态
        this.clearLoginInfo()
      }
    })
  },

  clearLoginInfo() {
    this.globalData.token = ''
    this.globalData.userInfo = null
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
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
            wx.redirectTo({
              url: '/pages/auth/register/register'
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