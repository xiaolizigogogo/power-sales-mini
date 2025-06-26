// API 工具类
const config = require('./config')
const { showToast, showLoading, hideLoading } = require('./common')

class ApiService {
  constructor() {
    this.baseURL = config.apiConfig.baseURL
    this.timeout = config.apiConfig.timeout || 10000
  }

  // 请求拦截器
  interceptRequest(options) {
    // 添加 loading
    if (options.showLoading !== false) {
      showLoading(options.loadingText || '请求中...')
    }

    // 添加认证头
    const token = wx.getStorageSync('token')
    if (token) {
      options.header = {
        ...options.header,
        'Authorization': `Bearer ${token}`
      }
    }

    // 添加通用头部
    options.header = {
      'Content-Type': 'application/json',
      ...options.header
    }

    return options
  }

  // 响应拦截器
  interceptResponse(res, options) {
    hideLoading()

    const { statusCode, data } = res

    // HTTP 状态码检查
    if (statusCode !== 200) {
      const message = this.getErrorMessage(statusCode)
      if (options.showError !== false) {
        showToast(message, 'error')
      }
      return Promise.reject(new Error(message))
    }

    // 业务状态码检查
    if (data.code !== undefined && data.code !== 0) {
      if (data.code === 401) {
        // token 失效，跳转登录
        this.handleAuthError()
        return Promise.reject(new Error('登录已失效'))
      }

      const message = data.message || '请求失败'
      if (options.showError !== false) {
        showToast(message, 'error')
      }
      return Promise.reject(new Error(message))
    }

    return data.data || data
  }

  // 处理认证错误
  handleAuthError() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    
    wx.showModal({
      title: '提示',
      content: '登录已失效，请重新登录',
      showCancel: false,
      success: () => {
        wx.reLaunch({
          url: '/pages/auth/login/login'
        })
      }
    })
  }

  // 获取错误信息
  getErrorMessage(statusCode) {
    const errorMap = {
      400: '请求参数错误',
      401: '未授权访问',
      403: '禁止访问',
      404: '请求地址不存在',
      405: '请求方法不允许',
      408: '请求超时',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务不可用',
      504: '网关超时'
    }
    return errorMap[statusCode] || '网络请求失败'
  }

  // 基础请求方法
  request(options) {
    return new Promise((resolve, reject) => {
      const requestOptions = this.interceptRequest({
        url: this.baseURL + options.url,
        method: options.method || 'GET',
        data: options.data,
        header: options.header || {},
        timeout: options.timeout || this.timeout,
        showLoading: options.showLoading,
        showError: options.showError,
        loadingText: options.loadingText
      })

      wx.request({
        ...requestOptions,
        success: (res) => {
          this.interceptResponse(res, options)
            .then(resolve)
            .catch(reject)
        },
        fail: (err) => {
          hideLoading()
          const message = err.errMsg || '网络请求失败'
          if (options.showError !== false) {
            showToast(message, 'error')
          }
          reject(err)
        }
      })
    })
  }

  // GET 请求
  get(url, params = {}, options = {}) {
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    
    const fullUrl = queryString ? `${url}?${queryString}` : url
    
    return this.request({
      url: fullUrl,
      method: 'GET',
      ...options
    })
  }

  // POST 请求
  post(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...options
    })
  }

  // PUT 请求
  put(url, data = {}, options = {}) {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...options
    })
  }

  // DELETE 请求
  delete(url, options = {}) {
    return this.request({
      url,
      method: 'DELETE',
      ...options
    })
  }

  // 文件上传
  uploadFile(url, filePath, name = 'file', formData = {}, options = {}) {
    return new Promise((resolve, reject) => {
      if (options.showLoading !== false) {
        showLoading('上传中...')
      }

      const token = wx.getStorageSync('token')
      const header = {
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      }

      wx.uploadFile({
        url: this.baseURL + url,
        filePath,
        name,
        formData,
        header,
        success: (res) => {
          hideLoading()
          try {
            const data = JSON.parse(res.data)
            if (data.code === 0) {
              resolve(data.data || data)
            } else {
              const message = data.message || '上传失败'
              if (options.showError !== false) {
                showToast(message, 'error')
              }
              reject(new Error(message))
            }
          } catch (err) {
            if (options.showError !== false) {
              showToast('上传失败', 'error')
            }
            reject(err)
          }
        },
        fail: (err) => {
          hideLoading()
          const message = err.errMsg || '上传失败'
          if (options.showError !== false) {
            showToast(message, 'error')
          }
          reject(err)
        }
      })
    })
  }
}

// 创建实例
const apiService = new ApiService()

// 用户认证相关 API
const authAPI = {
  // 微信登录
  wechatLogin: (code, userInfo) => {
    return apiService.post('/auth/wechat-login', { code, userInfo })
  },

  // 手机号绑定
  bindPhone: (phoneNumber, verifyCode) => {
    return apiService.post('/auth/bind-phone', { phoneNumber, verifyCode })
  },

  // 发送验证码
  sendVerifyCode: (phoneNumber) => {
    return apiService.post('/auth/send-code', { phoneNumber })
  },

  // 用户注册
  register: (userData) => {
    return apiService.post('/auth/register', userData)
  },

  // 身份认证
  submitAuth: (authData) => {
    return apiService.post('/auth/verify', authData)
  },

  // 获取用户信息
  getUserInfo: () => {
    return apiService.get('/auth/me')
  },

  // 更新用户信息
  updateUserInfo: (userData) => {
    return apiService.put('/auth/me', userData)
  }
}

// 产品相关 API
const productAPI = {
  // 获取产品列表
  getProducts: (params) => {
    return apiService.get('/products', params)
  },

  // 获取产品详情
  getProductDetail: (id) => {
    return apiService.get(`/products/${id}`)
  },

  // 节电效益计算
  calculateSavings: (params) => {
    return apiService.post('/products/calculate', params)
  }
}

// 订单相关 API
const orderAPI = {
  // 获取订单列表
  getOrders: (params) => {
    return apiService.get('/orders', params)
  },

  // 获取订单详情
  getOrderDetail: (id) => {
    return apiService.get(`/orders/${id}`)
  },

  // 创建订单
  createOrder: (orderData) => {
    return apiService.post('/orders', orderData)
  },

  // 更新订单
  updateOrder: (id, orderData) => {
    return apiService.put(`/orders/${id}`, orderData)
  },

  // 取消订单
  cancelOrder: (id, reason) => {
    return apiService.post(`/orders/${id}/cancel`, { reason })
  }
}

// 客户管理相关 API
const customerAPI = {
  // 获取我的客户列表
  getMyCustomers: (params) => {
    return apiService.get('/customers/my-customers', params)
  },

  // 获取客户详情
  getCustomerDetail: (id) => {
    return apiService.get(`/customers/${id}`)
  },

  // 添加跟进记录
  addFollowRecord: (customerId, recordData) => {
    return apiService.post(`/customers/${customerId}/follow`, recordData)
  },

  // 获取跟进记录
  getFollowRecords: (customerId, params) => {
    return apiService.get(`/customers/${customerId}/follow`, params)
  },

  // 更新客户状态
  updateCustomerStatus: (customerId, status) => {
    return apiService.put(`/customers/${customerId}/status`, { status })
  }
}

// 业绩统计相关 API
const performanceAPI = {
  // 获取个人业绩统计
  getPersonalPerformance: (params) => {
    return apiService.get('/performance/personal', params)
  },

  // 获取团队业绩统计
  getTeamPerformance: (params) => {
    return apiService.get('/performance/team', params)
  },

  // 获取业绩排行榜
  getRanking: (params) => {
    return apiService.get('/performance/ranking', params)
  },

  // 设置业绩目标
  setTarget: (targetData) => {
    return apiService.post('/performance/target', targetData)
  }
}

// 文件上传相关 API
const uploadAPI = {
  // 上传头像
  uploadAvatar: (filePath) => {
    return apiService.uploadFile('/upload/avatar', filePath, 'avatar')
  },

  // 上传营业执照
  uploadBusinessLicense: (filePath) => {
    return apiService.uploadFile('/upload/business-license', filePath, 'license')
  },

  // 上传身份证
  uploadIdCard: (filePath, type) => {
    return apiService.uploadFile('/upload/id-card', filePath, 'idcard', { type })
  },

  // 上传附件
  uploadAttachment: (filePath, fileName) => {
    return apiService.uploadFile('/upload/attachment', filePath, 'file', { fileName })
  }
}

module.exports = {
  apiService,
  authAPI,
  productAPI,
  orderAPI,
  customerAPI,
  performanceAPI,
  uploadAPI
} 