const app = getApp();

Page({
  data: {
    loading: false,
    form: {
      name: '',
      idCard: '',
      phone: '',
      companyName: '',
      businessLicense: '',
      idCardFront: '',
      idCardBack: ''
    },
    rules: {
      name: [
        { required: true, message: '请输入姓名' }
      ],
      idCard: [
        { required: true, message: '请输入身份证号' },
        { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '身份证号格式不正确' }
      ],
      phone: [
        { required: true, message: '请输入手机号' },
        { pattern: /^1\d{10}$/, message: '手机号格式不正确' }
      ],
      companyName: [
        { required: true, message: '请输入公司名称' }
      ],
      businessLicense: [
        { required: true, message: '请上传营业执照' }
      ],
      idCardFront: [
        { required: true, message: '请上传身份证正面照' }
      ],
      idCardBack: [
        { required: true, message: '请上传身份证背面照' }
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

  // 上传图片
  async uploadImage(e) {
    const { field } = e.currentTarget.dataset;
    
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      wx.showLoading({
        title: '上传中...',
        mask: true
      });

      // 这里应该调用上传接口，这里模拟上传
      setTimeout(() => {
        this.setData({
          [`form.${field}`]: res.tempFilePaths[0]
        });
        wx.hideLoading();
      }, 1000);

    } catch (error) {
      console.error('上传图片失败:', error);
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },

  // 预览图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    if (!url) return;
    
    wx.previewImage({
      urls: [url]
    });
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
      // 这里应该调用实际的认证接口
      const res = await app.request({
        url: '/auth/verify',
        method: 'POST',
        data: this.data.form
      });

      wx.showToast({
        title: '提交成功',
        icon: 'success'
      });

      // 延迟跳转
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/auth/login/login'
        });
      }, 1500);

    } catch (error) {
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  }
}); 