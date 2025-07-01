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

  // 用户手机号+密码登录
  userLogin: (phone, password) => {
    return apiService.post('/auth/login', { phone, password })
  },

  // 验证码登录
  verifyCodeLogin: (phone, verifyCode) => {
    return apiService.post('/auth/verify-code-login', { phone, verifyCode })
  },

  // 发送验证码
  sendVerifyCode: (phoneNumber) => {
    return apiService.post('/auth/send-code', { phoneNumber })
  },

  // 用户注册
  register: (userData) => {
    return apiService.post('/auth/register', userData)
  },

  // 获取当前用户信息
  getCurrentUser: () => {
    return apiService.get('/auth/me')
  },

  // 刷新令牌
  refreshToken: (refreshToken) => {
    return apiService.post(`/auth/refresh?refreshToken=${refreshToken}`)
  },

  // 退出登录
  logout: (refreshToken) => {
    return apiService.post(`/auth/logout?refreshToken=${refreshToken}`)
  },

  // 手机号绑定
  bindPhone: (phoneNumber, verifyCode) => {
    return apiService.post('/auth/bind-phone', { phoneNumber, verifyCode })
  },

  // 身份认证
  submitAuth: (authData) => {
    return apiService.post('/auth/verify', authData)
  },

  // 获取用户信息
  getUserInfo: () => {
    return apiService.get('/user/profile')
  },

  // 更新用户信息
  updateUserInfo: (userData) => {
    return apiService.put('/user/profile', userData)
  },

  // 获取用户统计信息
  getUserStats: () => {
    return apiService.get('/user/statistics')
  },

  // 获取未读通知数量
  getUnreadNotificationCount: () => {
    return apiService.get('/user/notifications/unread-count')
  },

  // 获取客户经理信息
  getCustomerManager: () => {
    return apiService.get('/user/customer-manager')
  },

  // 获取用户用电信息
  getUserPowerInfo: () => {
    return apiService.get('/user/power-info')
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

  // 获取我的订单
  getMyOrders: (params) => {
    return apiService.get('/orders/my', params)
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
  },

  // 确认收货
  confirmOrder: (id) => {
    return apiService.post(`/orders/${id}/confirm`)
  },

  // 申请退款
  requestRefund: (id, reason, description) => {
    return apiService.post(`/orders/${id}/refund`, { reason, description })
  },

  // 订单支付
  payOrder: (id, paymentMethod) => {
    return apiService.post(`/orders/${id}/pay`, { paymentMethod })
  },

  // 获取订单统计
  getOrderStatistics: () => {
    return apiService.get('/orders/statistics')
  },

  // 获取订单统计（简短路径）
  getOrderStats: () => {
    return apiService.get('/orders/stats')
  },

  // 订单评价
  reviewOrder: (id, rating, comment) => {
    return apiService.post(`/orders/${id}/review`, { rating, comment })
  },

  // 重新下单
  reorder: (id) => {
    return apiService.post(`/orders/${id}/reorder`)
  },

  // 获取物流信息
  getLogistics: (id) => {
    return apiService.get(`/orders/${id}/logistics`)
  },

  // 查看退款详情
  getRefundDetail: (id) => {
    return apiService.get(`/orders/${id}/refund`)
  },

  // 获取服务数据
  getServiceData: (orderId) => {
    return apiService.get(`/orders/${orderId}/service-data`)
  }
}

// 客户维护相关 API
const maintenanceAPI = {
  // 获取维护统计
  getStatistics: () => {
    return apiService.get('/maintenance/statistics')
  },

  // 获取今日任务
  getTodayTasks: () => {
    return apiService.get('/maintenance/today-tasks')
  },

  // 获取最近回访记录
  getRecentVisits: (params) => {
    return apiService.get('/maintenance/recent-visits', params)
  },

  // 快速回访
  quickVisit: (data) => {
    return apiService.post('/maintenance/quick-visit', data)
  },

  // 安排回访
  scheduleVisit: (data) => {
    return apiService.post('/maintenance/schedule-visit', data)
  },

  // 推广服务
  promoteService: (data) => {
    return apiService.post('/maintenance/promote-service', data)
  },

  // 完成任务
  completeTask: (taskId) => {
    return apiService.post(`/maintenance/tasks/${taskId}/complete`)
  },

  // 获取回访计划
  getVisitPlan: (params) => {
    return apiService.get('/maintenance/visit-plan', params)
  },

  // 创建回访计划
  createVisitPlan: (data) => {
    return apiService.post('/maintenance/visit-plan', data)
  },

  // 获取问题跟踪
  getIssueTracking: (params) => {
    return apiService.get('/maintenance/issue-tracking', params)
  },

  // 上报问题
  reportIssue: (data) => {
    return apiService.post('/maintenance/report-issue', data)
  }
}

// 客户管理相关 API
const customerAPI = {
  // 获取我的客户列表
  getMyCustomers: (params) => {
    return apiService.get('/manager/customers/my', params)
  },

  // 获取客户统计数据
  getStatistics: () => {
    return apiService.get('/manager/customers/statistics')
  },

  // 导出客户数据
  exportCustomers: (params) => {
    return apiService.post('/manager/customers/export', params)
  },

  // 获取客户详情
  getCustomerDetail: (id) => {
    return apiService.get(`/manager/customers/${id}`)
  },

  // 更新客户信息
  updateCustomer: (id, data) => {
    return apiService.put(`/manager/customers/${id}`, data)
  },

  // 添加客户
  addCustomer: (data) => {
    return apiService.post('/manager/customers', data)
  },

  // 删除客户
  deleteCustomer: (id) => {
    return apiService.delete(`/manager/customers/${id}`)
  },

  // 批量操作客户
  batchOperation: (data) => {
    return apiService.post('/manager/customers/batch', data)
  }
}

// 跟进管理相关 API
const followAPI = {
  // 获取跟进统计数据
  getStatistics: () => {
    return apiService.get('/manager/follow/statistics')
  },

  // 获取跟进列表
  getFollowList: (params) => {
    return apiService.get('/manager/follow/list', params)
  },

  // 获取跟进详情
  getFollowDetail: (id) => {
    return apiService.get(`/manager/follow/${id}`)
  },

  // 添加跟进记录
  addFollow: (data) => {
    return apiService.post('/manager/follow', data)
  },

  // 更新跟进记录
  updateFollow: (id, data) => {
    return apiService.put(`/manager/follow/${id}`, data)
  },

  // 完成跟进
  completeFollow: (data) => {
    return apiService.post('/manager/follow/complete', data)
  },

  // 延期跟进
  postponeFollow: (data) => {
    return apiService.post('/manager/follow/postpone', data)
  },

  // 删除跟进记录
  deleteFollow: (id) => {
    return apiService.delete(`/manager/follow/${id}`)
  },

  // 批量完成跟进
  batchCompleteFollow: (data) => {
    return apiService.post('/manager/follow/batch/complete', data)
  },

  // 批量删除跟进
  batchDeleteFollow: (data) => {
    return apiService.post('/manager/follow/batch/delete', data)
  },

  // 上传跟进附件
  uploadAttachment: (filePath) => {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${config.baseURL}/manager/follow/attachment`,
        filePath,
        name: 'file',
        header: {
          'Authorization': wx.getStorageSync('token')
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.code === 200) {
              resolve(data)
            } else {
              reject(data)
            }
          } catch (error) {
            reject(error)
          }
        },
        fail: reject
      })
    })
  },

  // 设置跟进提醒
  setReminder: (data) => {
    return apiService.post('/manager/follow/reminder', data)
  }
}

// 业绩统计相关 API
const performanceAPI = {
  // 获取业绩数据
  getPerformanceData: (params) => {
    return apiService.get('/manager/performance/data', params)
  },

  // 获取目标数据
  getTargetData: () => {
    return apiService.get('/manager/performance/target')
  },

  // 获取图表数据
  getChartData: (params) => {
    return apiService.get('/manager/performance/chart', params)
  },

  // 获取排行榜数据
  getRankingData: (params) => {
    return apiService.get('/manager/performance/ranking', params)
  },

  // 获取业绩明细
  getPerformanceDetail: (params) => {
    return apiService.get('/manager/performance/detail', params)
  },

  // 设置目标
  setTarget: (data) => {
    return apiService.post('/manager/performance/target', data)
  },

  // 导出业绩报告
  exportReport: (params) => {
    return apiService.post('/manager/performance/export', params)
  },

  // 获取业绩趋势
  getTrend: (params) => {
    return apiService.get('/manager/performance/trend', params)
  },

  // 获取客户转化数据
  getConversionData: (params) => {
    return apiService.get('/manager/performance/conversion', params)
  },

  // 获取收入明细
  getRevenueDetail: (params) => {
    return apiService.get('/manager/performance/revenue', params)
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

// 为了向后兼容，直接导出跟进API的方法
module.exports = {
  // 基础服务
  apiService,
  
  // API 模块
  authAPI,
  userAPI: authAPI, // 向后兼容
  productAPI,
  orderAPI,
  customerAPI,
  maintenanceAPI,
  followAPI,
  performanceAPI,
  uploadAPI,
  
  // 跟进相关方法的直接导出（为了与follow.js兼容）
  getFollowList: followAPI.getFollowList,
  getFollowStatistics: followAPI.getStatistics,
  getFollowDetail: followAPI.getFollowDetail,
  addFollowRecord: followAPI.addFollow,
  completeFollow: followAPI.completeFollow,
  rescheduleFollow: followAPI.postponeFollow,
  batchFollow: followAPI.batchCompleteFollow,

  // 产品相关方法的直接导出
  getProducts: productAPI.getProducts,
  getProductDetail: productAPI.getProductDetail,
  calculateSavings: productAPI.calculateSavings,

  // 用户相关方法的直接导出
  getUserPowerInfo: authAPI.getUserPowerInfo
}

// 合同续约相关 API
const renewalAPI = {
  // 获取续约统计数据（客户经理端）
  getStatistics: () => {
    return apiService.get('/renewal/statistics')
  },

  // 获取续约合同列表（客户经理端）
  getContracts: (params) => {
    return apiService.get('/renewal/contracts', params)
  },

  // 续约跟进记录
  followRenewal: (data) => {
    return apiService.post('/renewal/follow', data)
  },

  // 设置续约提醒
  setReminderSettings: (data) => {
    return apiService.post('/renewal/reminder-settings', data)
  },

  // 导出续约报告
  exportReport: () => {
    return apiService.post('/renewal/export-report')
  },

  // 获取客户端续约合同列表
  getCustomerContracts: (params) => {
    return apiService.get('/renewal/customer-contracts', params)
  },

  // 客户续约决策
  customerDecision: (data) => {
    return apiService.post('/renewal/customer-decision', data)
  }
}

// 添加到导出对象
module.exports.renewalAPI = renewalAPI 