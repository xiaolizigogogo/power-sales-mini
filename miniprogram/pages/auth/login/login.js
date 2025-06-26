const app = getApp();

Page({
  data: {
    phone: '',
    password: '',
    loading: false
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

      // 登录成功
      app.login(res.data.userInfo, res.data.token, res.data.userRole);
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      // 返回上一页或首页
      setTimeout(() => {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack();
        } else {
          wx.reLaunch({
            url: '/pages/index/index'
          });
        }
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