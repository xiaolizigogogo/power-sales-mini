const app = getApp();

Page({
  data: {
    loading: false,
    form: {
      phone: '',
      code: '',
      password: '',
      confirmPassword: ''
    },
    countdown: 0,
    rules: {
      phone: [
        { required: true, message: '请输入手机号' },
        { pattern: /^1\d{10}$/, message: '手机号格式不正确' }
      ],
      code: [
        { required: true, message: '请输入验证码' },
        { pattern: /^\d{6}$/, message: '验证码格式不正确' }
      ],
      password: [
        { required: true, message: '请输入密码' },
        { min: 6, message: '密码不能少于6位' }
      ],
      confirmPassword: [
        { required: true, message: '请确认密码' },
        { validator: (rule, value, callback, source) => source.password === value, message: '两次输入的密码不一致' }
      ]
    }
  },

  // 输入框变化
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  // 发送验证码
  async sendCode() {
    if (this.data.countdown > 0) return;

    const phone = this.data.form.phone;
    if (!phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      });
      return;
    }

    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none'
      });
      return;
    }

    try {
      // 这里应该调用发送验证码接口
      await app.request({
        url: '/auth/send-code',
        method: 'POST',
        data: { phone }
      });

      // 开始倒计时
      this.setData({ countdown: 60 });
      this.startCountdown();

      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      });

    } catch (error) {
      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none'
      });
    }
  },

  // 倒计时
  startCountdown() {
    if (this.data.countdown <= 0) return;

    setTimeout(() => {
      this.setData({
        countdown: this.data.countdown - 1
      });
      this.startCountdown();
    }, 1000);
  },

  // 表单验证
  validateForm() {
    const { form, rules } = this.data;
    let isValid = true;
    let errorMessage = '';

    for (const field in rules) {
      const value = form[field];
      const fieldRules = rules[field];

      for (const rule of fieldRules) {
        if (rule.required && !value) {
          isValid = false;
          errorMessage = rule.message;
          break;
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          isValid = false;
          errorMessage = rule.message;
          break;
        }

        if (rule.min && value.length < rule.min) {
          isValid = false;
          errorMessage = rule.message;
          break;
        }

        if (rule.validator && !rule.validator(rule, value, null, form)) {
          isValid = false;
          errorMessage = rule.message;
          break;
        }
      }

      if (!isValid) break;
    }

    if (!isValid) {
      wx.showToast({
        title: errorMessage,
        icon: 'none'
      });
    }

    return isValid;
  },

  // 提交表单
  async handleSubmit() {
    if (!this.validateForm()) return;

    this.setData({ loading: true });

    try {
      // 这里应该调用实际的注册接口
      const res = await app.request({
        url: '/auth/register',
        method: 'POST',
        data: this.data.form
      });

      wx.showToast({
        title: '注册成功',
        icon: 'success'
      });

      // 延迟跳转
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/auth/verify/verify'
        });
      }, 1500);

    } catch (error) {
      wx.showToast({
        title: error.message || '注册失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 跳转登录
  goToLogin() {
    wx.redirectTo({
      url: '/pages/auth/login/login'
    });
  }
}); 