const app = getApp();

Page({
  data: {
    phone: '',
    password: '',
    loading: false
  },

  onLoad() {
    // 检查是否已经登录
    const app = getApp()
    console.log('登录页面加载，当前登录状态:', app.globalData.isLogin)
    
    // 延迟检查，确保app.js的checkLogin已经执行完成
    setTimeout(() => {
      if (app.globalData.isLogin) {
        console.log('用户已登录，跳转到首页')
        wx.reLaunch({
          url: '/pages/index/index'
        })
      }
    }, 100)
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
      const res = await app.request({
        url: '/auth/login',
        method: 'POST',
        data: {
          phone: this.data.phone,
          password: this.data.password
        }
      });

      // 登录成功，保存令牌和用户信息
      app.login(res.data.userInfo, res.data.accessToken, res.data.userRole, res.data.refreshToken);
      
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