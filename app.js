App({
  // 全局数据
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'https://your-api-domain.com/power',
    isLoggedIn: false, // 统一使用 isLoggedIn
    userRole: '', // customer: 普通客户, manager: 客户经理
    companyInfo: null,
    systemConfig: {
      version: '1.0.0',
      updateTime: '2025-01-01'
    }
  },

  // 小程序启动
  onLaunch(options) {
    console.log('小程序启动', options);
    
    // 检查小程序版本更新
    this.checkForUpdate();
    
    // 初始化配置
    this.initConfig();
    
    // 检查登录状态
    this.checkLoginStatus();
    
    // 获取系统信息
    this.getSystemInfo();
  },

  // 小程序显示
  onShow(options) {
    console.log('小程序显示', options);
    
    // 检查场景值
    this.handleLaunchScene(options.scene);
  },

  // 小程序隐藏
  onHide() {
    console.log('小程序隐藏');
  },

  // 小程序错误
  onError(msg) {
    console.error('小程序错误:', msg);
    
    // 错误日志上报
    this.reportError(msg);
  },

  // 页面不存在
  onPageNotFound(res) {
    console.log('页面不存在:', res);
    
    // 重定向到首页
    wx.redirectTo({
      url: '/pages/index/index'
    });
  },

  // 检查更新
  checkForUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate((res) => {
        console.log('检查更新结果:', res.hasUpdate);
      });
      
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });
      
      updateManager.onUpdateFailed(() => {
        wx.showToast({
          title: '更新失败',
          icon: 'none'
        });
      });
    }
  },

  // 初始化配置
  initConfig() {
    try {
      // 获取存储的配置信息
      const token = wx.getStorageSync('token');
      const userInfo = wx.getStorageSync('userInfo');
      const userRole = wx.getStorageSync('userRole');
      const companyInfo = wx.getStorageSync('companyInfo');
      const refreshToken = wx.getStorageSync('refreshToken');
      
      if (token && userInfo) {
        this.globalData.token = token;
        this.globalData.userInfo = userInfo;
        this.globalData.isLoggedIn = true;
        this.globalData.userRole = userRole || '';
        this.globalData.companyInfo = companyInfo || null;
        this.globalData.refreshToken = refreshToken;
      } else {
        this.clearLoginInfo(); // 数据不完整时清除
      }
    } catch (error) {
      console.error('初始化配置失败:', error);
      this.clearLoginInfo();
    }
  },

  // 检查登录状态
  async checkLoginStatus() {
    if (!this.globalData.token) {
      return false;
    }
    
    try {
      // 验证token有效性
      const res = await wx.request({
        url: this.globalData.baseUrl + '/auth/verify-token',
        method: 'POST',
        header: {
          'Authorization': 'Bearer ' + this.globalData.token
        }
      });

      if (res.statusCode !== 200 || !res.data.success) {
        // token无效，尝试使用refreshToken
        await this.refreshUserToken();
      }
      
      return true;
    } catch (error) {
      console.error('token验证失败:', error);
      this.clearLoginInfo();
      return false;
    }
  },

  // 刷新用户Token
  async refreshUserToken() {
    try {
      const refreshToken = wx.getStorageSync('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const res = await wx.request({
        url: this.globalData.baseUrl + '/auth/refresh-token',
        method: 'POST',
        data: {
          refreshToken: refreshToken
        }
      });

      if (res.statusCode === 200 && res.data.success) {
        // 更新token信息
        this.globalData.token = res.data.data.token;
        wx.setStorageSync('token', res.data.data.token);
        if (res.data.data.refreshToken) {
          wx.setStorageSync('refreshToken', res.data.data.refreshToken);
        }
        return true;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('刷新token失败:', error);
      this.clearLoginInfo();
      return false;
    }
  },

  // 获取系统信息
  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res;
        console.log('系统信息:', res);
      }
    });
  },

  // 处理启动场景
  handleLaunchScene(scene) {
    console.log('启动场景:', scene);
    
    // 根据不同场景值进行处理
    switch (scene) {
      case 1001: // 发现栏小程序主入口
      case 1005: // 顶部搜索框的搜索结果页
      case 1006: // 发现栏小程序主入口搜索框的搜索结果页
        break;
      case 1007: // 单人聊天会话中的小程序消息卡片
      case 1008: // 群聊会话中的小程序消息卡片
        // 社交场景
        break;
      case 1011: // 扫描二维码
      case 1012: // 长按图片识别二维码
      case 1013: // 手机相册选取二维码
        // 扫码场景
        break;
      default:
        break;
    }
  },

  // 用户登录
  login(userInfo, token, userRole, refreshToken) {
    // 更新全局数据
    this.globalData.userInfo = userInfo;
    this.globalData.token = token;
    this.globalData.isLoggedIn = true;
    this.globalData.userRole = userRole || '';
    
    // 存储到本地
    try {
      wx.setStorageSync('userInfo', userInfo);
      wx.setStorageSync('token', token);
      wx.setStorageSync('userRole', userRole);
      
      // 存储刷新令牌
      if (refreshToken) {
        wx.setStorageSync('refreshToken', refreshToken);
        this.globalData.refreshToken = refreshToken;
      }

      // 存储公司信息（如果有）
      if (userInfo.company) {
        wx.setStorageSync('companyInfo', userInfo.company);
        this.globalData.companyInfo = userInfo.company;
      }

      console.log('用户登录信息保存成功');
    } catch (error) {
      console.error('保存登录信息失败:', error);
      wx.showToast({
        title: '登录信息保存失败',
        icon: 'none'
      });
    }
  },

  // 清除登录信息
  clearLoginInfo() {
    // 清除全局数据
    this.globalData.userInfo = null;
    this.globalData.token = null;
    this.globalData.isLoggedIn = false;
    this.globalData.userRole = '';
    this.globalData.companyInfo = null;
    this.globalData.refreshToken = null;
    
    try {
      // 清除本地存储
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('token');
      wx.removeStorageSync('userRole');
      wx.removeStorageSync('refreshToken');
      wx.removeStorageSync('companyInfo');
    } catch (error) {
      console.error('清除登录信息失败:', error);
    }
  },

  // 网络请求封装
  request(options) {
    const {url, method = 'GET', data, header = {}, showLoading = false} = options;
    
    if (showLoading) {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
    }
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.globalData.baseUrl + url,
        method: method,
        data: data,
        header: {
          'Content-Type': 'application/json',
          'Authorization': this.globalData.token ? 'Bearer ' + this.globalData.token : '',
          ...header
        },
        success: (res) => {
          if (showLoading) {
            wx.hideLoading();
          }
          
          if (res.statusCode === 200) {
            if (res.data.success) {
              resolve(res.data);
            } else {
              wx.showToast({
                title: res.data.message || '请求失败',
                icon: 'none'
              });
              reject(res.data);
            }
          } else if (res.statusCode === 401) {
            // token过期，重新登录
            this.logout();
            reject(res);
          } else {
            wx.showToast({
              title: '网络错误',
              icon: 'none'
            });
            reject(res);
          }
        },
        fail: (err) => {
          if (showLoading) {
            wx.hideLoading();
          }
          
          wx.showToast({
            title: '网络连接失败',
            icon: 'none'
          });
          reject(err);
        }
      });
    });
  },

  // 错误上报
  reportError(error) {
    // 上报错误信息到服务器
    this.request({
      url: '/system/error-report',
      method: 'POST',
      data: {
        error: error,
        userAgent: this.globalData.systemInfo,
        timestamp: new Date().getTime(),
        userId: this.globalData.userInfo ? this.globalData.userInfo.id : null
      }
    }).catch(() => {
      // 错误上报失败，忽略
    });
  },

  // 工具方法：格式化金额
  formatMoney(amount) {
    if (!amount) return '0.00';
    return parseFloat(amount).toFixed(2);
  },

  // 工具方法：格式化日期
  formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    const second = d.getSeconds().toString().padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute)
      .replace('ss', second);
  },

  // 工具方法：防抖
  debounce(fn, delay = 500) {
    let timer = null;
    return function(...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  }
}); 