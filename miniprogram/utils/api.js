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
      
      // 需要认证的接口列表（登录相关接口除外）
      const noAuthUrls = ['/auth/login', '/auth/wechat-login', '/auth/register', '/auth/send-code', '/auth/verify-code-login']
      const needAuth = !noAuthUrls.some(url => options.url.includes(url))
      
      if (needAuth) {
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
    const response = await apiService.get('/user/profile', {}, {
      showError: false
    });
    console.log('获取用户信息响应:', response)
    return response;
  },

  // 获取用户电力信息
  getPowerInfo: async () => {
    console.log('获取用户电力信息')
    try {
      const response = await apiService.get('/user/power-info', {}, {
        showError: false
      });
      console.log('获取用户电力信息响应:', response)
      return response;
    } catch (error) {
      console.error('获取用户电力信息失败:', error)
      // 返回默认数据
      return {
        code: 200,
        data: {
          monthlyConsumption: 0,
          monthlyBill: 0,
          savingRate: 0
        }
      };
    }
  },

  // 获取用户统计数据
  getUserStats: async () => {
    console.log('获取用户统计数据')
    try {
      const response = await apiService.get('/user/stats', {}, {
        showError: false
      });
      console.log('获取用户统计数据响应:', response)
      return response;
    } catch (error) {
      console.error('获取用户统计数据失败:', error)
      // 返回默认数据
      return {
        code: 200,
        data: {
          totalOrders: 0,
          totalAmount: 0,
          totalSavings: 0,
          pendingOrders: 0,
          completedOrders: 0
        }
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
    const response = await apiService.get('/user/profile', {}, {
      showError: false
    });
    return response;
  },

  // 刷新令牌
  refreshToken: async (refreshToken) => {
    const response = await apiService.post('/auth/refresh-token', { refreshToken }, {
      showError: false
    });
    return formatAuthResponse(response);
  },

  // 退出登录
  logout: (refreshToken) => {
    return apiService.post(`/mini/auth/logout?refreshToken=${refreshToken}`);
  },

  // OCR识别
  performOCR: async (data) => {
    console.log('发起OCR识别请求:', data)
    const response = await apiService.post('/auth/ocr', data);
    console.log('OCR识别响应:', response)
    return response;
  },

  // 提交认证申请
  submitAuth: async (authData) => {
    console.log('提交认证申请:', authData)
    const response = await apiService.post('/mini/auth/submit', authData);
    console.log('认证申请响应:', response)
    return response;
  },

  // 搜索企业名称
  searchCompanies: async (keyword) => {
    console.log('搜索企业名称:', keyword)
    const response = await apiService.get('/mini/auth/companies/search', { keyword });
    console.log('企业名称搜索响应:', response)
    return response;
  },

  // 获取认证状态
  getAuthStatus: async () => {
    console.log('获取认证状态')
    const response = await apiService.get('/mini/auth/status');
    console.log('认证状态响应:', response)
    return response;
  }
}

// 产品相关 API
const productAPI = {
  // 获取产品列表
  getProducts: async (params = {}) => {
    console.log('获取产品列表:', params)
    const response = await apiService.get('/products', params);
    console.log('产品列表响应:', response)
    return response;
  },

  // 获取产品详情
  getProductDetail: async (productId) => {
    console.log('获取产品详情:', productId)
    const response = await apiService.get(`/products/${productId}`);
    console.log('产品详情响应:', response)
    return response;
  },

  // 获取产品价格计算
  calculatePrice: async (productId, params) => {
    console.log('计算产品价格:', { productId, params })
    const response = await apiService.post(`/products/${productId}/calculate`, params);
    console.log('价格计算响应:', response)
    return response;
  }
}

// 用户电力信息相关 API
const powerAPI = {
  // 获取用户电力信息
  getUserPowerInfo: async () => {
    console.log('获取用户电力信息')
    const response = await apiService.get('/user/power-info');
    console.log('用户电力信息响应:', response)
    return response;
  },

  // 获取用户用电统计
  getPowerStats: async (params = {}) => {
    console.log('获取用电统计:', params)
    const response = await apiService.get('/user/power-stats', params);
    console.log('用电统计响应:', response)
    return response;
  }
}

// 用户相关接口
const userAPI = {
  // 获取用户信息
  getUserInfo: () => {
    return apiService.get('/user/profile')
  },

  // 获取用户用电信息
  getUserPowerInfo: () => {
    return apiService.get('/user/power-info')
  }
}

// 订单相关接口
const orderAPI = {
  // 创建订单
  createOrder: (data) => {
    return apiService.post('/orders', data)
  },

  // 获取订单详情
  getOrderDetail: (id) => {
    return apiService.get(`/orders/${id}`)
  },

  // 获取订单列表
  getOrderList: (params) => {
    return apiService.get('/orders', params)
  },

  // 获取我的订单列表
  getMyOrders: (params) => {
    return apiService.get('/orders/my', params)
  },

  // 获取我的订单统计
  getMyOrderStats: () => {
    try {
      return apiService.get('/user/orders/stats')
    } catch (error) {
      console.error('获取订单统计失败:', error)
      // 返回默认数据
      return Promise.resolve({
        code: 200,
        data: {
          orderCount: 0,
          contractCount: 0,
          powerPoints: 0
        }
      });
    }
  },

  // 获取订单统计（通用）
  getOrderStats: () => {
    try {
      return apiService.get('/user/orders/stats')
    } catch (error) {
      console.error('获取订单统计失败:', error)
      // 返回默认数据
      return Promise.resolve({
        code: 200,
        data: {
          orderCount: 0,
          contractCount: 0,
          powerPoints: 0
        }
      });
    }
  },

  // 取消订单
  cancelOrder: (id, reason) => {
    return apiService.post(`/orders/${id}/cancel`, { reason })
  },

  // 确认订单
  confirmOrder: (id) => {
    return apiService.post(`/orders/${id}/confirm`)
  },

  // 支付订单
  payOrder: (id, paymentMethod) => {
    return apiService.post(`/orders/${id}/pay`, { paymentMethod })
  },

  // 评价订单
  reviewOrder: (id, rating, comment) => {
    return apiService.post(`/orders/${id}/review`, { rating, comment })
  },

  // 获取订单服务数据
  getServiceData: (id) => {
    return apiService.get(`/orders/${id}/service`)
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

// 模拟数据
const mockProducts = [
  {
    id: 1,
    name: '工业用电套餐A',
    description: '适用于小型工业企业',
    price: 0.65,
    unit: '元/度',
    category: '工业用电',
    features: ['阶梯电价', '峰谷分时', '节能补贴'],
    minCapacity: 100,
    maxCapacity: 1000
  },
  {
    id: 2,
    name: '商业用电套餐B',
    description: '适用于商场、超市等商业场所',
    price: 0.75,
    unit: '元/度',
    category: '商业用电',
    features: ['固定电价', '免费能耗分析', '专属客服'],
    minCapacity: 50,
    maxCapacity: 500
  },
  {
    id: 3,
    name: '居民用电套餐C',
    description: '适用于家庭住宅',
    price: 0.55,
    unit: '元/度',
    category: '居民用电',
    features: ['阶梯电价', '绿色能源', '智能监控'],
    minCapacity: 1,
    maxCapacity: 50
  },
  {
    id: 4,
    name: '农业用电套餐D',
    description: '适用于农业生产',
    price: 0.45,
    unit: '元/度',
    category: '农业用电',
    features: ['政策补贴', '季节性调价', '专业支持'],
    minCapacity: 10,
    maxCapacity: 200
  }
]

const mockUserInfo = {
  id: 1,
  name: '张三',
  phone: '13800138000',
  address: '广东省深圳市南山区科技园',
  customerType: '工业用户',
  contractStatus: '已签约',
  powerCapacity: 500
}

const mockPowerInfo = {
  currentMonth: {
    consumption: 12500,
    amount: 8125,
    peak: 600,
    valley: 300
  },
  lastMonth: {
    consumption: 11800,
    amount: 7670,
    peak: 580,
    valley: 280
  },
  yearToDate: {
    consumption: 138000,
    amount: 89700,
    average: 11500
  }
}

// 开发环境使用模拟数据
const isDev = false

// 导出API
module.exports = {
  api: {
    ...authAPI,
    ...productAPI,
    ...powerAPI,
    // 用户接口 - 覆盖authAPI中的getUserInfo
    getUserInfo: isDev ? () => Promise.resolve({ data: mockUserInfo }) : userAPI.getUserInfo,
    getUserPowerInfo: isDev ? () => Promise.resolve({ data: mockPowerInfo }) : userAPI.getUserPowerInfo,
    
    // 订单接口
    createOrder: isDev ? (data) => Promise.resolve({ data: { ...data, id: Date.now() } }) : orderAPI.createOrder,
    getOrderDetail: isDev ? (id) => Promise.resolve({ data: { id } }) : orderAPI.getOrderDetail,
    getOrderList: isDev ? () => Promise.resolve({ data: [] }) : orderAPI.getOrderList,
    
    // 添加缺失的订单方法
    getMyOrders: orderAPI.getMyOrders,
    getMyOrderStats: orderAPI.getMyOrderStats,
    getOrderStats: orderAPI.getOrderStats,
    cancelOrder: orderAPI.cancelOrder,
    confirmOrder: orderAPI.confirmOrder,
    payOrder: orderAPI.payOrder,
    reviewOrder: orderAPI.reviewOrder,
    getServiceData: orderAPI.getServiceData
  },
  apiService,
  authAPI,
  productAPI,
  orderAPI,
  maintenanceAPI,
  customerAPI
} 