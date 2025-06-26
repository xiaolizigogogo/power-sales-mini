const app = getApp();

Page({
  data: {
    loading: false,
    form: {
      productId: '',
      voltage: '220',
      phase: '单相',
      power: '',
      hours: '',
      days: ''
    },
    result: null,
    productInfo: null,
    voltageOptions: ['220', '380'],
    phaseOptions: ['单相', '三相'],
    rules: {
      power: [
        { required: true, message: '请输入设备功率' },
        { pattern: /^\d+(\.\d+)?$/, message: '请输入正确的功率数值' }
      ],
      hours: [
        { required: true, message: '请输入每日用电时长' },
        { pattern: /^([0-9]|1[0-9]|2[0-4])$/, message: '请输入0-24之间的小时数' }
      ],
      days: [
        { required: true, message: '请输入每月用电天数' },
        { pattern: /^([1-9]|[12][0-9]|3[0-1])$/, message: '请输入1-31之间的天数' }
      ]
    }
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({
        'form.productId': id
      });
      this.loadProductInfo(id);
    }
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
      [`form.${field}`]: e.detail.value,
      result: null
    });
  },

  // 选择器变化
  onPickerChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`form.${field}`]: this.data[`${field}Options`][value],
      result: null
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

  // 计算电费
  handleCalculate() {
    if (!this.validateForm()) return;

    const { form, productInfo } = this.data;
    const { power, hours, days } = form;

    // 计算月用电量（度）
    const monthlyUsage = (Number(power) * Number(hours) * Number(days)) / 1000;
    
    // 计算月电费
    const monthlyFee = monthlyUsage * (productInfo ? productInfo.price : 0);

    this.setData({
      result: {
        monthlyUsage: monthlyUsage.toFixed(2),
        monthlyFee: monthlyFee.toFixed(2),
        yearlyUsage: (monthlyUsage * 12).toFixed(2),
        yearlyFee: (monthlyFee * 12).toFixed(2)
      }
    });

    // 滚动到结果区域
    wx.pageScrollTo({
      selector: '.result-card',
      duration: 300
    });
  },

  // 重置表单
  handleReset() {
    this.setData({
      form: {
        ...this.data.form,
        power: '',
        hours: '',
        days: ''
      },
      result: null
    });
  },

  // 跳转到产品详情
  goToDetail() {
    if (!this.data.form.productId) return;
    
    wx.navigateTo({
      url: `/pages/products/detail/detail?id=${this.data.form.productId}`
    });
  }
}); 