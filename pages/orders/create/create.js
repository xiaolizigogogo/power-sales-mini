const app = getApp();

Page({
  data: {
    loading: true,
    submitting: false,
    productId: null,
    productInfo: null,
    form: {
      name: '',
      phone: '',
      address: '',
      companyName: '',
      businessLicense: '',
      voltage: '220',
      phase: '单相',
      estimatedPower: '',
      remark: ''
    },
    voltageOptions: ['220', '380'],
    phaseOptions: ['单相', '三相'],
    rules: {
      name: [
        { required: true, message: '请输入联系人姓名' }
      ],
      phone: [
        { required: true, message: '请输入联系电话' },
        { pattern: /^1\d{10}$/, message: '手机号格式不正确' }
      ],
      address: [
        { required: true, message: '请输入安装地址' }
      ],
      companyName: [
        { required: true, message: '请输入公司名称' }
      ],
      businessLicense: [
        { required: true, message: '请上传营业执照' }
      ],
      estimatedPower: [
        { required: true, message: '请输入预计用电量' },
        { pattern: /^\d+(\.\d+)?$/, message: '请输入正确的数值' }
      ]
    }
  },

  onLoad(options) {
    const { id } = options;
    this.setData({ productId: id });
    this.loadProductInfo(id);
  },

  // 加载产品信息
  async loadProductInfo(id) {
    this.setData({ loading: true });

    try {
      const res = await app.request({
        url: `/products/${id}`
      });

      this.setData({
        productInfo: res.data,
        'form.voltage': res.data.voltage,
        'form.phase': res.data.phase
      });

    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 输入框变化
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  // 选择器变化
  onPickerChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`form.${field}`]: this.data[`${field}Options`][value]
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

  // 提交订单
  async handleSubmit() {
    if (!this.validateForm()) return;

    this.setData({ submitting: true });

    try {
      // 这里应该调用创建订单接口
      const res = await app.request({
        url: '/orders',
        method: 'POST',
        data: {
          productId: this.data.productId,
          ...this.data.form
        }
      });

      wx.showToast({
        title: '提交成功',
        icon: 'success'
      });

      // 延迟跳转
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/orders/detail/detail?id=${res.data.id}`
        });
      }, 1500);

    } catch (error) {
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  }
}); 