// API 工具类
const config = require('./config')
const { showToast, showLoading, hideLoading } = require('./common')

class ApiService {
  constructor() {
    this.baseURL = config.apiConfig.baseURL
    this.timeout = config.apiConfig.timeout || 10000
  }

  // 处理认证错误
  handleAuthError() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('refreshToken')
    wx.removeStorageSync('userRole')
    
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
      // 添加 loading
      if (options.showLoading !== false) {
        showLoading(options.loadingText || '请求中...')
      }

      // 添加认证头
      const token = wx.getStorageSync('token')
      const header = {
        'Content-Type': 'application/json',
        ...options.header
      }
      
      // 非登录接口才需要token
      if (!options.url.includes('/auth/') || options.url === '/auth/me') {
        if (!token) {
          console.error('请求未携带token:', options.url)
          this.handleAuthError()
          reject(new Error('未登录'))
          return
        }
        header.Authorization = `Bearer ${token}`
      }

      const requestOptions = {
        url: this.baseURL + options.url,
        method: options.method || 'GET',
        data: options.data,
        header,
        timeout: options.timeout || this.timeout
      }

      console.log('请求选项:', {
        url: requestOptions.url,
        method: requestOptions.method,
        data: requestOptions.data,
        header: requestOptions.header
      })

      wx.request({
        ...requestOptions,
        success: (res) => {
          hideLoading()
          
          const { statusCode, data } = res
          console.log('响应数据:', {
            url: options.url,
            statusCode,
            data
          })

          // HTTP 状态码检查
          if (statusCode !== 200) {
            const message = this.getErrorMessage(statusCode)
            if (options.showError !== false) {
              showToast(message, 'error')
            }
            reject(new Error(message))
            return
          }

          // 业务状态码检查
          if (data.code !== undefined) {
            // 处理401错误
            if (data.code === 401) {
              this.handleAuthError()
              reject(new Error('登录已失效'))
              return
            }

            // 处理其他错误码
            if (data.code !== 200) { // 只允许code为200
              const message = data.message || '请求失败'
              if (options.showError !== false) {
                showToast(message, 'error')
              }
              reject(new Error(message))
              return
            }
          }

          // 返回数据
          resolve(data)
        },
        fail: (err) => {
          hideLoading()
          const message = err.errMsg || '网络请求失败'
          if (options.showError !== false) {
            showToast(message, 'error')
          }
          reject(new Error(message))
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
}

// 创建实例
const apiService = new ApiService()

// 用户认证相关 API
const authAPI = {
  // 微信登录
  wechatLogin: async (code, userInfo) => {
    console.log('发起微信登录请求:', { code, userInfo })
    const response = await apiService.post('/auth/wechat-login', { 
      code,
      encryptedData: userInfo.encryptedData,
      iv: userInfo.iv,
      rawData: userInfo.rawData,
      signature: userInfo.signature,
      userInfo: {
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        gender: userInfo.gender,
        country: userInfo.country,
        province: userInfo.province,
        city: userInfo.city,
        language: userInfo.language
      }
    }, {
      showError: false // 不显示错误提示，由调用方处理
    });
    console.log('微信登录响应:', response)
    return formatAuthResponse(response);
  },

  // 用户手机号+密码登录
  userLogin: async (phone, password) => {
    console.log('发起手机号登录请求:', { phone })
    const response = await apiService.post('/auth/login', { 
      phone, 
      password 
    }, {
      showError: false
    });
    console.log('手机号登录响应:', response)
    return formatAuthResponse(response);
  },

  // 获取用户信息
  getUserInfo: async () => {
    console.log('获取用户信息')
    const response = await apiService.get('/auth/me', {}, {
      showError: false
    });
    console.log('获取用户信息响应:', response)
    return formatUserInfo(response.data);
  },

  // 获取用户统计数据
  getUserStats: async () => {
    console.log('获取用户统计数据')
    try {
      const response = await apiService.get('/user/stats', {}, {
        showError: false
      });
      console.log('获取用户统计数据响应:', response)
      return response.data || {
        totalOrders: 0,
        totalAmount: 0,
        totalSavings: 0,
        pendingOrders: 0,
        completedOrders: 0
      };
    } catch (error) {
      console.error('获取用户统计数据失败:', error)
      // 返回默认数据
      return {
        totalOrders: 0,
        totalAmount: 0,
        totalSavings: 0,
        pendingOrders: 0,
        completedOrders: 0
      };
    }
  },

  // 验证码登录
  verifyCodeLogin: async (phone, verifyCode) => {
    const response = await apiService.post('/auth/verify-code-login', { phone, verifyCode }, {
      showError: false
    });
    return formatAuthResponse(response);
  },

  // 发送验证码
  sendVerifyCode: (phoneNumber) => {
    return apiService.post('/auth/send-code', { phoneNumber });
  },

  // 用户注册
  register: async (userData) => {
    const response = await apiService.post('/auth/register', userData, {
      showError: false
    });
    return formatAuthResponse(response);
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    const response = await apiService.get('/auth/me', {}, {
      showError: false
    });
    return formatUserInfo(response.data);
  },

  // 刷新令牌
  refreshToken: async (refreshToken) => {
    const response = await apiService.post('/auth/refresh-token', { refreshToken }, {
      showError: false
    });
    return formatAuthResponse(response);
  },

  // 退出登录
  logout: () => {
    return apiService.post('/auth/logout');
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
  }
}

// 格式化认证响应
const formatAuthResponse = (response) => {
  if (!response || !response.data) return null;
  
  // 兼容两种数据结构
  const data = response.data;
  const token = data.token || data.accessToken;
  const refreshToken = data.refreshToken;
  const userInfo = data.userInfo || data;

  if (!token) {
    console.error('认证响应缺少token:', response);
    return null;
  }

  return {
    token,
    refreshToken,
    userInfo: formatUserInfo(userInfo)
  };
};

// 格式化用户信息
const formatUserInfo = (userInfo) => {
  if (!userInfo) return null;

  // 兼容不同的字段名
  const result = {
    id: userInfo.id || userInfo.userId,
    name: userInfo.name || userInfo.nickName || userInfo.username,
    phone: userInfo.phone || userInfo.phoneNumber,
    email: userInfo.email,
    avatar: userInfo.avatar || userInfo.avatarUrl,
    role: userInfo.role || userInfo.userRole,
    userLevel: userInfo.userLevel || userInfo.level,
    companyName: userInfo.companyName || (userInfo.company ? userInfo.company.name : null),
    companyId: userInfo.companyId || (userInfo.company ? userInfo.company.id : null),
    department: userInfo.department,
    position: userInfo.position,
    status: userInfo.status,
    createTime: userInfo.createTime || userInfo.createdAt || userInfo.createAt
  };

  // 移除undefined的字段
  Object.keys(result).forEach(key => {
    if (result[key] === undefined) {
      delete result[key];
    }
  });

  return result;
};

module.exports = {
  apiService,
  authAPI,
  productAPI,
  orderAPI,
  maintenanceAPI,
  customerAPI
} 