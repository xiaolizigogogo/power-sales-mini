const app = getApp();
const { authAPI } = require('../../../utils/api');

Page({
  data: {
    phone: '',
    password: '',
    loading: false
  },

  onLoad() {
    // 检查是否已经登录
    console.log('登录页面加载，当前登录状态:', app.globalData.isLoggedIn)
    
    if (app.globalData.isLoggedIn) {
      console.log('用户已登录，跳转到首页')
      wx.reLaunch({
        url: '/pages/index/index'
      });
    }
  },

  // 处理微信登录
  handleWechatLogin() {
    this.setData({ loading: true });

    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        // 获取用户信息成功
        const userInfo = res.userInfo;
        console.log('获取用户信息成功:', userInfo);
        
        // 获取登录凭证
        wx.login({
          success: async (loginRes) => {
            try {
              if (!loginRes.code) {
                throw new Error('获取登录凭证失败');
              }
              console.log('获取登录凭证成功:', loginRes.code);

              // 调用后端登录接口
              const response = await authAPI.wechatLogin(loginRes.code, {
                ...userInfo,
                ...res
              });
              console.log('微信登录接口返回:', response);

              if (!response || !response.token) {
                throw new Error('登录返回数据格式错误');
              }

              // 保存token
              wx.setStorageSync('token', response.token);
              if (response.refreshToken) {
                wx.setStorageSync('refreshToken', response.refreshToken);
              }

              // 保存用户信息
              wx.setStorageSync('userInfo', response.userInfo);
              if (response.userInfo && response.userInfo.role) {
                wx.setStorageSync('userRole', response.userInfo.role);
              }

              // 更新全局状态
              app.globalData.isLoggedIn = true;
              app.globalData.userInfo = response.userInfo;

              console.log('微信登录成功，用户信息：', response.userInfo);

              wx.showToast({
                title: '登录成功',
                icon: 'success'
              });

              // 登录成功后跳转到首页
              setTimeout(() => {
                wx.reLaunch({
                  url: '/pages/index/index'
                });
              }, 1500);

            } catch (error) {
              console.error('微信登录失败:', error);
              wx.showToast({
                title: error.message || '登录失败',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            console.error('获取登录凭证失败:', err);
            wx.showToast({
              title: '获取登录凭证失败',
              icon: 'none'
            });
          }
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        if (err.errMsg.includes('auth deny')) {
          wx.showToast({
            title: '您已拒绝授权',
            icon: 'none'
          });
        } else {
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
        }
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 输入手机号
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 输入密码
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 提交登录
  async handleLogin() {
    if (!this.validateForm()) {
      return;
    }

    this.setData({ loading: true });

    try {
      // 使用authAPI进行登录
      const response = await authAPI.userLogin(this.data.phone, this.data.password);
      console.log('手机号登录接口返回:', response);

      if (!response || !response.token) {
        throw new Error('登录返回数据格式错误');
      }

      // 保存token
      wx.setStorageSync('token', response.token);
      if (response.refreshToken) {
        wx.setStorageSync('refreshToken', response.refreshToken);
      }

      // 保存用户信息
      wx.setStorageSync('userInfo', response.userInfo);
      if (response.userInfo && response.userInfo.role) {
        wx.setStorageSync('userRole', response.userInfo.role);
      }

      // 更新全局状态
      app.globalData.isLoggedIn = true;
      app.globalData.userInfo = response.userInfo;

      console.log('手机号登录成功，用户信息：', response.userInfo);
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      // 登录成功后直接跳转到首页
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/index/index'
        });
      }, 1500);

    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 表单验证
  validateForm() {
    if (!this.data.phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      });
      return false;
    }

    if (!/^1\d{10}$/.test(this.data.phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return false;
    }

    if (!this.data.password) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return false;
    }

    if (this.data.password.length < 6) {
      wx.showToast({
        title: '密码不能少于6位',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 跳转到注册页
  goToRegister() {
    wx.navigateTo({
      url: '/pages/auth/register/register'
    });
  }
}); 