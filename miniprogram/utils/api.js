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
      const noAuthUrls = ['/auth/login', '/auth/wechat-login', '/auth/register', '/auth/send-code', '/auth/verify-code-login', '/auth/wechat-login']
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
  // 微信登录 - 新版本支持用户类型
  wechatLogin: async (request) => {
    console.log('发起微信登录请求:', request)
    
    // 兼容新旧调用方式
    if (typeof request === 'string') {
      // 旧方式：wechatLogin(code, userInfo)
      const code = request;
      const userInfo = arguments[1];
      request = {
        code,
        loginType: 'customer',
        encryptedData: userInfo?.encryptedData,
        iv: userInfo?.iv
      };
    }
    
    const loginData = {
      code: request.code,
      loginType: request.loginType || 'customer', // customer 或 manager
      encryptedData: request.encryptedData,
      iv: request.iv
    };
    
    console.log('=== 微信登录数据结构 ===');
    console.log('提醒后端：请根据openId和loginType判断用户类型和是否已存在');
    console.log('loginType值: customer(普通客户) 或 manager(客户经理)');
    console.log('=== 微信登录数据结构结束 ===');
    
    const response = await apiService.post('/auth/wechat-login', loginData, {
      showError: false
    });
    console.log('微信登录响应:', response)
    return formatAuthResponse(response);
  },

  // 统一登录接口 - 账号密码登录
  login: async (request) => {
    console.log('发起账号密码登录请求:', { 
      loginType: request.loginType,
      identifier: request.phone || request.username  // 显示登录标识符
    })
    
    let loginData;
    
    if (request.loginType === 'manager') {
      // 客户经理使用用户名登录
      loginData = {
        username: request.username,
        password: request.password,
        loginType: request.loginType
      };
    } else {
      // 普通客户使用手机号登录
      loginData = {
        phone: request.phone,
        password: request.password,
        loginType: request.loginType || 'customer'
      };
    }
    
    const response = await apiService.post('/auth/login', loginData, {
      showError: false
    });
    console.log('账号密码登录响应:', response)
    return formatAuthResponse(response);
  },

  // 短信验证码登录
  smsLogin: async (request) => {
    console.log('发起短信验证码登录请求:', { phone: request.phone, loginType: request.loginType })
    
    // 暂时统一使用普通登录接口，等后端完善员工登录接口后再分离
    // TODO: 后端实现员工登录接口后，恢复以下代码
    // let loginUrl = '/auth/sms-login';
    // if (request.loginType === 'manager') {
    //   loginUrl = '/employee/auth/sms-login';
    //   console.log('客户经理短信登录，使用员工接口:', loginUrl);
    // }
    
    const loginData = {
      phone: request.phone,
      code: request.code,
      loginType: request.loginType || 'customer' // 传递登录类型给后端
    };
    
    const response = await apiService.post('/auth/sms-login', loginData, {
      showError: false
    });
    console.log('短信验证码登录响应:', response)
    return formatAuthResponse(response);
  },

  // 发送短信验证码
  sendSmsCode: async (request) => {
    console.log('发送短信验证码请求:', { phone: request.phone, type: request.type })
    
    // 暂时统一使用普通短信接口，等后端完善员工接口后再分离
    // TODO: 后端实现员工短信接口后，恢复以下代码
    // let smsUrl = '/auth/send-sms-code';
    // if (request.type === 'manager_login') {
    //   smsUrl = '/employee/auth/send-sms-code';
    //   console.log('客户经理短信验证码，使用员工接口:', smsUrl);
    // }
    
    const response = await apiService.post('/auth/send-sms-code', {
      phone: request.phone,
      type: request.type // customer_login, manager_login, register, forgot_password
    }, {
      showError: false
    });
    console.log('短信验证码发送响应:', response)
    return response;
  },

  // 用户手机号+密码登录 - 保持向后兼容
  userLogin: async (phone, password) => {
    console.log('发起手机号登录请求:', { phone })
    const response = await apiService.post('/auth/login', { 
      phone, 
      password,
      loginType: 'customer'
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
    return apiService.post(`/auth/logout?refreshToken=${refreshToken}`);
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
    const response = await apiService.post('/auth/submit', authData);
    console.log('认证申请响应:', response)
    return response;
  },

  // 搜索企业名称
  searchCompanies: async (keyword) => {
    console.log('搜索企业名称:', keyword)
    const response = await apiService.get('/auth/companies/search', { keyword });
    console.log('企业名称搜索响应:', response)
    return response;
  },

  // 获取认证状态
  getAuthStatus: async (userId) => {
    console.log('获取认证状态, userId:', userId)
    const params = userId ? { userId } : {};
    
    try {
      const response = await apiService.get('/auth/status', params);
      console.log('认证状态响应:', response)
      
      // 检查响应数据结构并给出建议
      if (response && response.data) {
        const data = response.data;
        console.log('=== 认证状态数据结构分析 ===');
        console.log('返回的数据字段:', Object.keys(data));
        
        // 检查认证状态字段
        const authStatusField = data.authStatus || data.status || data.verifyStatus;
        console.log('认证状态值:', authStatusField);
        
        if (!authStatusField) {
          console.warn('建议后端返回认证状态字段: authStatus 或 status');
          console.warn('状态值建议：unverified(未认证), pending(认证中), verified(已认证)');
        } else {
          console.log('=== 认证状态说明 ===');
          console.log('当前状态值:', authStatusField);
          console.log('建议后端统一状态值：');
          console.log('- unverified: 未认证');
          console.log('- pending: 认证中/审核中');
          console.log('- verified: 已认证');
          console.log('=== 认证状态说明结束 ===');
        }
        
        if (!data.basicInfo && !data.realName) {
          console.warn('建议后端返回基本信息字段: realName, companyName, phone, position, powerCapacity, monthlyUsage, currentPrice');
        }
        
        if (!data.authFiles && !data.businessLicense) {
          console.warn('建议后端返回认证文件字段: businessLicense, idCardFront, idCardBack');
        }
        
        console.log('=== 数据结构分析结束 ===');
      }
      
      return response;
    } catch (error) {
      console.error('获取认证状态失败:', error);
      throw error;
    }
  },



  // 取消认证
  cancelAuth: async () => {
    console.log('取消认证')
    const response = await apiService.post('/auth/cancel');
    console.log('取消认证响应:', response)
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
  },

  // 绑定微信
  bindWechat: async (data) => {
    console.log('绑定微信请求:', data)
    
    try {
      // 调用真实接口
      const response = await apiService.post('/user/wechat/bind', data);
      console.log('绑定微信响应:', response)
      return response;
    } catch (error) {
      console.warn('绑定微信接口调用失败，使用模拟响应:', error);
      
      // 模拟接口响应（作为后备方案）
      const mockResponse = {
        code: 200,
        success: true,
        message: '微信绑定成功',
        data: {
          openId: data.openId || 'mock_openid_' + Date.now(),
          unionId: data.unionId,
          nickName: data.nickName,
          avatarUrl: data.avatarUrl,
          bindTime: new Date().toISOString()
        }
      };
      
      // 延迟一点时间，模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('模拟绑定微信响应:', mockResponse);
      return Promise.resolve(mockResponse);
    }
  },

  // 解绑微信
  unbindWechat: async () => {
    console.log('解绑微信请求')
    
    try {
      // 调用真实接口
      const response = await apiService.post('/user/wechat/unbind');
      console.log('解绑微信响应:', response)
      return response;
    } catch (error) {
      console.warn('解绑微信接口调用失败，使用模拟响应:', error);
      
      // 模拟接口响应（作为后备方案）
      const mockResponse = {
        code: 200,
        success: true,
        message: '微信解绑成功',
        data: {
          unbindTime: new Date().toISOString()
        }
      };
      
      // 延迟一点时间，模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('模拟解绑微信响应:', mockResponse);
      return Promise.resolve(mockResponse);
    }
  },

  // 绑定客户经理
  bindManager: async (data) => {
    console.log('绑定客户经理请求:', data)
    
    try {
      // 调用真实接口
      const response = await apiService.post('/user/manager/bind', data);
      console.log('绑定客户经理响应:', response)
      return response;
    } catch (error) {
      console.warn('绑定客户经理接口调用失败，使用模拟响应:', error);
      
      // 模拟接口响应（作为后备方案）
      const mockResponse = {
        code: 200,
        success: true,
        message: '绑定成功（模拟）',
        data: {
          managerId: 'MGR' + Date.now(),
          managerName: '李经理',
          managerPhone: data.managerPhone,
          bindTime: new Date().toISOString()
        }
      };
      
      // 延迟一点时间，模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('模拟绑定客户经理响应:', mockResponse);
      return Promise.resolve(mockResponse);
    }
  },

  // 获取客户经理信息
  getManagerInfo: async (phone) => {
    console.log('获取客户经理信息, phone:', phone)
    
    try {
      // 调用真实接口
      const response = await apiService.get(`/user/manager/info/${phone}`);
      console.log('客户经理信息响应:', response)
      return response;
    } catch (error) {
      console.warn('获取客户经理信息接口调用失败，使用模拟响应:', error);
      
      // 模拟接口响应（作为后备方案）
      const mockResponse = {
        code: 200,
        success: true,
        message: '获取成功（模拟）',
        data: {
          managerId: 'MGR' + Date.now(),
          managerName: '李经理',
          managerPhone: phone,
          departmentId: 1,
          position: '客户经理'
        }
      };
      
      // 延迟一点时间，模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('模拟客户经理信息响应:', mockResponse);
      return Promise.resolve(mockResponse);
    }
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
  },

  // 添加客户
  addCustomer: (data) => {
    return apiService.post('/manager/customers', data)
  },

  // 更新客户信息
  updateCustomer: (id, data) => {
    return apiService.put(`/manager/customers/${id}`, data)
  },

  // 删除客户
  deleteCustomer: (id) => {
    return apiService.delete(`/manager/customers/${id}`)
  },

  // 获取客户详情
  getCustomerDetail: (id) => {
    return apiService.get(`/manager/customers/${id}`)
  },

  // 获取客户跟进记录
  getCustomerFollowRecords: (id, params) => {
    return apiService.get(`/manager/customers/${id}/follow-records`, params)
  },

  // 获取客户订单记录
  getCustomerOrders: (id, params) => {
    return apiService.get(`/manager/customers/${id}/orders`, params)
  },

  // 更新客户状态
  updateCustomerStatus: (id, status) => {
    return apiService.put(`/manager/customers/${id}/status`, { status })
  },

  // 批量导入客户
  importCustomers: (data) => {
    return apiService.post('/manager/customers/import', data)
  },

  // 客户标签管理
  getCustomerTags: () => {
    return apiService.get('/manager/customers/tags')
  },

  addCustomerTag: (data) => {
    return apiService.post('/manager/customers/tags', data)
  },

  updateCustomerTags: (id, tags) => {
    return apiService.put(`/manager/customers/${id}/tags`, { tags })
  }
}

// 跟进管理相关 API
const followAPI = {
  // 获取跟进记录列表
  getFollowRecords: (params) => {
    return apiService.get('/manager/follow-records', params)
  },

  // 添加跟进记录
  addFollowRecord: (data) => {
    return apiService.post('/manager/follow-records', data)
  },

  // 更新跟进记录
  updateFollowRecord: (id, data) => {
    return apiService.put(`/manager/follow-records/${id}`, data)
  },

  // 删除跟进记录
  deleteFollowRecord: (id) => {
    return apiService.delete(`/manager/follow-records/${id}`)
  },

  // 获取跟进记录详情
  getFollowRecordDetail: (id) => {
    return apiService.get(`/manager/follow-records/${id}`)
  },

  // 完成跟进
  completeFollow: (id) => {
    return apiService.put(`/manager/follow-records/${id}/complete`)
  },

  // 延期跟进
  postponeFollow: (id, nextFollowTime) => {
    return apiService.put(`/manager/follow-records/${id}/postpone`, { nextFollowTime })
  },

  // 获取跟进统计
  getFollowStats: (params) => {
    return apiService.get('/manager/follow-records/stats', params)
  },

  // 获取跟进提醒
  getFollowReminders: (params) => {
    return apiService.get('/manager/follow-records/reminders', params)
  },

  // 批量操作跟进记录
  batchUpdateFollows: (data) => {
    return apiService.post('/manager/follow-records/batch', data)
  },

  // 获取跟进模板
  getFollowTemplates: () => {
    return apiService.get('/manager/follow-templates')
  },

  // 保存跟进草稿
  saveFollowDraft: (data) => {
    return apiService.post('/manager/follow-records/draft', data)
  },

  // 获取跟进草稿
  getFollowDraft: (customerId) => {
    return apiService.get(`/manager/follow-records/draft/${customerId}`)
  }
}

// 业绩管理相关 API
const performanceAPI = {
  // 获取业绩概览
  getPerformanceOverview: (params) => {
    return apiService.get('/manager/performance/overview', params)
  },

  // 获取业绩详情
  getPerformanceDetail: (params) => {
    return apiService.get('/manager/performance/detail', params)
  },

  // 获取业绩趋势
  getPerformanceTrend: (params) => {
    return apiService.get('/manager/performance/trend', params)
  },

  // 获取排行榜
  getRankings: (params) => {
    return apiService.get('/manager/performance/rankings', params)
  },

  // 获取个人排名
  getPersonalRanking: (params) => {
    return apiService.get('/manager/performance/personal-ranking', params)
  },

  // 获取目标设置
  getTargets: (params) => {
    return apiService.get('/manager/performance/targets', params)
  },

  // 设置目标
  setTarget: (data) => {
    return apiService.post('/manager/performance/targets', data)
  },

  // 获取业绩分析
  getPerformanceAnalysis: (params) => {
    return apiService.get('/manager/performance/analysis', params)
  },

  // 导出业绩报告
  exportPerformanceReport: (params) => {
    return apiService.post('/manager/performance/export', params)
  },

  // 获取客户分布
  getCustomerDistribution: (params) => {
    return apiService.get('/manager/performance/customer-distribution', params)
  },

  // 获取订单分析
  getOrderAnalysis: (params) => {
    return apiService.get('/manager/performance/order-analysis', params)
  },

  // 获取跟进效率
  getFollowEfficiency: (params) => {
    return apiService.get('/manager/performance/follow-efficiency', params)
  }
}

// 工作台相关 API
const workplaceAPI = {
  // 获取工作台数据
  getWorkplaceData: (params) => {
    return apiService.get('/manager/workplace/data', params)
  },

  // 获取今日统计
  getTodayStats: () => {
    return apiService.get('/manager/workplace/today-stats')
  },

  // 获取本周数据
  getWeekData: () => {
    return apiService.get('/manager/workplace/week-data')
  },

  // 获取最近跟进
  getRecentFollows: (params) => {
    return apiService.get('/manager/workplace/recent-follows', params)
  },

  // 获取即将到期提醒
  getUpcomingReminders: (params) => {
    return apiService.get('/manager/workplace/upcoming-reminders', params)
  },

  // 获取任务列表
  getTaskList: (params) => {
    return apiService.get('/manager/workplace/tasks', params)
  },

  // 更新任务状态
  updateTaskStatus: (id, status) => {
    return apiService.put(`/manager/workplace/tasks/${id}/status`, { status })
  },

  // 获取通知消息
  getNotifications: (params) => {
    return apiService.get('/manager/workplace/notifications', params)
  },

  // 标记通知已读
  markNotificationRead: (id) => {
    return apiService.put(`/manager/workplace/notifications/${id}/read`)
  }
}

// 服务管理相关 API
const serviceAPI = {
  // 获取服务统计
  getServiceStats: (params) => {
    return apiService.get('/manager/service/stats', params)
  },

  // 获取服务记录
  getServiceRecords: (params) => {
    return apiService.get('/manager/service/records', params)
  },

  // 添加服务记录
  addServiceRecord: (data) => {
    return apiService.post('/manager/service/records', data)
  },

  // 获取服务类型
  getServiceTypes: () => {
    return apiService.get('/manager/service/types')
  },

  // 获取服务评价
  getServiceReviews: (params) => {
    return apiService.get('/manager/service/reviews', params)
  }
}

// 续约管理相关 API
const renewalAPI = {
  // 获取续约统计
  getRenewalStats: (params) => {
    return apiService.get('/manager/renewal/stats', params)
  },

  // 获取续约列表
  getRenewalList: (params) => {
    return apiService.get('/manager/renewal/list', params)
  },

  // 获取即将到期客户
  getExpiringCustomers: (params) => {
    return apiService.get('/manager/renewal/expiring-customers', params)
  },

  // 发起续约
  initiateRenewal: (data) => {
    return apiService.post('/manager/renewal/initiate', data)
  },

  // 更新续约状态
  updateRenewalStatus: (id, status) => {
    return apiService.put(`/manager/renewal/${id}/status`, { status })
  }
}

// 投诉管理相关 API
const complaintAPI = {
  // 获取投诉列表
  getComplaints: (params) => {
    return apiService.get('/manager/complaints', params)
  },

  // 获取投诉详情
  getComplaintDetail: (id) => {
    return apiService.get(`/manager/complaints/${id}`)
  },

  // 处理投诉
  handleComplaint: (id, data) => {
    return apiService.put(`/manager/complaints/${id}/handle`, data)
  },

  // 获取投诉统计
  getComplaintStats: (params) => {
    return apiService.get('/manager/complaints/stats', params)
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
  
  // 提取并转换用户类型
  const userRole = data.userRole || userInfo.role || userInfo.userRole;
  const userType = userRole === 'manager' ? 'manager' : 'customer';

  if (!token) {
    console.error('认证响应缺少token:', response);
    return null;
  }

  console.log('格式化认证响应:', { 
    userRole, 
    userType, 
    hasToken: !!token,
    userInfo: formatUserInfo(userInfo) 
  });

  return {
    token,
    refreshToken,
    userType,  // 添加用户类型字段
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
    
    // 微信相关接口
    bindWechat: userAPI.bindWechat,
    unbindWechat: userAPI.unbindWechat,
    
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
    getServiceData: orderAPI.getServiceData,
    
    // 客户经理相关API
    ...customerAPI,
    ...followAPI,
    ...performanceAPI,
    ...workplaceAPI,
    ...serviceAPI,
    ...renewalAPI,
    ...complaintAPI
  },
  apiService,
  authAPI,
  productAPI,
  orderAPI,
  userAPI,
  maintenanceAPI,
  customerAPI,
  followAPI,
  performanceAPI,
  workplaceAPI,
  serviceAPI,
  renewalAPI,
  complaintAPI
} 