const { getApiBaseURL } = require('./utils/env')
const { authAPI } = require('./utils/api')

App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    userRole: null,
    token: null,
    refreshToken: null,
    refreshTokenPromise: null
  },

  onLaunch() {
    console.log('App onLaunch');
    this.checkLoginStatus();
  },

  // 检查登录状态
  async checkLoginStatus() {
    try {
      const token = wx.getStorageSync('token');
      const userInfo = wx.getStorageSync('userInfo');
      const userRole = wx.getStorageSync('userRole');
      const refreshToken = wx.getStorageSync('refreshToken');

      console.log('检查登录状态:', {
        hasToken: !!token,
        hasUserInfo: !!userInfo,
        userRole,
        hasRefreshToken: !!refreshToken
      });

      if (!token || !userInfo) {
        console.log('未找到登录信息，需要重新登录');
        this.clearLoginInfo();
        return false;
      }

      // 更新全局状态
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
      this.globalData.userRole = userRole;
      this.globalData.token = token;
      this.globalData.refreshToken = refreshToken;

      // 验证token是否有效
      try {
        const currentUser = await authAPI.getCurrentUser();
        console.log('获取当前用户信息成功:', currentUser);
        
        if (currentUser) {
          // 更新用户信息
          this.globalData.userInfo = currentUser;
          wx.setStorageSync('userInfo', currentUser);
          return true;
        }
      } catch (error) {
        console.error('验证token失败:', error);
        
        // 尝试使用refreshToken
        if (refreshToken) {
          try {
            console.log('尝试使用refreshToken刷新登录状态');
            const response = await this.refreshUserToken(refreshToken);
            return !!response;
          } catch (refreshError) {
            console.error('刷新token失败:', refreshError);
          }
        }
      }

      console.log('登录状态无效，清除登录信息');
      this.clearLoginInfo();
      return false;
    } catch (error) {
      console.error('检查登录状态失败:', error);
      this.clearLoginInfo();
      return false;
    }
  },

  // 刷新用户token
  async refreshUserToken(refreshToken) {
    // 如果已经在刷新，返回正在进行的Promise
    if (this.globalData.refreshTokenPromise) {
      return this.globalData.refreshTokenPromise;
    }

    console.log('开始刷新token');
    
    // 创建新的刷新Promise
    this.globalData.refreshTokenPromise = new Promise(async (resolve, reject) => {
      try {
        const response = await authAPI.refreshToken(refreshToken);
        console.log('刷新token成功:', response);

        if (response && response.token) {
          // 更新登录信息
          wx.setStorageSync('token', response.token);
          if (response.refreshToken) {
            wx.setStorageSync('refreshToken', response.refreshToken);
          }
          if (response.userInfo) {
            wx.setStorageSync('userInfo', response.userInfo);
            if (response.userInfo.role) {
              wx.setStorageSync('userRole', response.userInfo.role);
            }
          }

          // 更新全局状态
          this.globalData.token = response.token;
          this.globalData.refreshToken = response.refreshToken || refreshToken;
          if (response.userInfo) {
            this.globalData.userInfo = response.userInfo;
            this.globalData.userRole = response.userInfo.role;
          }
          this.globalData.isLoggedIn = true;

          resolve(response);
        } else {
          throw new Error('刷新token返回数据格式错误');
        }
      } catch (error) {
        console.error('刷新token失败:', error);
        this.clearLoginInfo();
        reject(error);
      } finally {
        this.globalData.refreshTokenPromise = null;
      }
    });

    return this.globalData.refreshTokenPromise;
  },

  // 登录成功后的处理
  login(userInfo, token, userRole, refreshToken) {
    console.log('保存登录信息:', {
      hasUserInfo: !!userInfo,
      hasToken: !!token,
      userRole,
      hasRefreshToken: !!refreshToken
    });

    // 保存到全局数据
    this.globalData.userInfo = userInfo;
    this.globalData.isLoggedIn = true;
    this.globalData.userRole = userRole;
    this.globalData.token = token;
    this.globalData.refreshToken = refreshToken;

    // 保存到本地存储
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('token', token);
    wx.setStorageSync('userRole', userRole);
    wx.setStorageSync('refreshToken', refreshToken);
  },

  // 清除登录信息
  clearLoginInfo() {
    console.log('清除登录信息');
    
    // 清除全局数据
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    this.globalData.userRole = null;
    this.globalData.token = null;
    this.globalData.refreshToken = null;
    this.globalData.refreshTokenPromise = null;

    // 清除本地存储
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('token');
    wx.removeStorageSync('userRole');
    wx.removeStorageSync('refreshToken');
  },

  // 检查是否需要登录
  checkLogin() {
    if (!this.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
      return false;
    }
    return true;
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

  // 用户登出
  async logout() {
    try {
      const refreshToken = wx.getStorageSync('refreshToken');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      this.clearLoginInfo();
      // 跳转到登录页
      wx.reLaunch({
        url: '/pages/auth/login/login'
      });
    }
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
        success: async (res) => {
          if (res.statusCode === 401) {
            try {
              // 尝试刷新token
              await this.refreshUserToken(this.globalData.refreshToken);
              // 刷新成功，重试请求
              const retryRes = await this.request(options);
              resolve(retryRes);
            } catch (error) {
              console.error('Token刷新失败:', error);
              this.clearLoginInfo();
              wx.reLaunch({
                url: '/pages/auth/login/login'
              });
              reject(new Error('登录已过期，请重新登录'));
            }
          } else if (res.statusCode >= 200 && res.statusCode < 300) {
            if (res.data.code === 0) {
              resolve(res.data.data);
            } else {
              reject(new Error(res.data.message || '请求失败'));
            }
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: (err) => {
          reject(new Error('网络请求失败'));
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