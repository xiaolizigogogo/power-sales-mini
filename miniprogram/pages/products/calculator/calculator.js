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
      days: '',
      monthlyUsage: '',
      peakUsage: '',
      valleyUsage: '',
      currentPrice: '',
      industry: '',
      demandPower: ''
    },
    result: null,
    productInfo: null,
    voltageOptions: ['220', '380'],
    phaseOptions: ['单相', '三相'],
    rules: {
      power: [
        { required: true, message: '请输入设备功率' },
        { custom: (value) => !isNaN(value) && Number(value) > 0, message: '请输入大于0的功率数值' }
      ],
      hours: [
        { required: true, message: '请输入每日用电时长' },
        { custom: (value) => !isNaN(value) && Number(value) >= 0 && Number(value) <= 24, message: '每日用电时长必须在0-24小时之间' }
      ],
      days: [
        { required: true, message: '请输入每月用电天数' },
        { custom: (value) => !isNaN(value) && Number(value) >= 1 && Number(value) <= 31 && Number(value) % 1 === 0, message: '每月用电天数必须是1-31之间的整数' }
      ],
      monthlyUsage: [
        { required: true, message: '请输入月均用电量' },
        { type: 'number', min: 1, message: '用电量必须大于0' }
      ],
      currentPrice: [
        { required: true, message: '请输入当前电价' },
        { type: 'number', min: 0.1, message: '电价必须大于0.1' }
      ]
    },
    calculationResult: null,
    recommendedProducts: [],
    calculating: false,
    showResult: false,
    error: null
  },

  onLoad(options) {
    const { id } = options;
    console.log('计算器页面加载，产品ID:', id);
    
    if (id) {
      this.setData({
        'form.productId': id
      });
      
      // 立即设置默认的产品信息，确保页面有内容
      this.setDefaultProductInfo(id);
      
      // 尝试加载真实的产品信息
      this.loadProductInfo(id);
    } else {
      // 没有指定产品时，使用默认产品信息
      this.setDefaultProductInfo('default');
    }

    // 如果是客户经理代客户使用，预填充客户数据
    if (options.customerId) {
      this.loadCustomerInfo(options.customerId);
    }
  },

  // 设置默认产品信息
  setDefaultProductInfo(id) {
    const defaultProducts = {
      1: {
        id: 1,
        name: '工商业基础用电套餐',
        price: '0.65',
        image: '/assets/images/product-1.png',
        voltage: '380',
        phase: '三相'
      },
      2: {
        id: 2,
        name: '工商业优选用电套餐',
        price: '0.58',
        image: '/assets/images/product-2.png',
        voltage: '380',
        phase: '三相'
      },
      default: {
        id: 'default',
        name: '电力产品套餐',
        price: '0.60',
        image: '/assets/images/product-default.png',
        voltage: '220',
        phase: '单相'
      }
    };

    const productInfo = defaultProducts[id] || defaultProducts['default'];
    
    this.setData({
      productInfo,
      'form.voltage': productInfo.voltage,
      'form.phase': productInfo.phase
    });
    
    console.log('设置默认产品信息:', productInfo);
  },

  // 加载产品信息
  async loadProductInfo(id) {
    this.setData({ loading: false }); // 不显示loading，因为已有默认数据

    try {
      console.log('尝试加载产品信息，ID:', id);
      const res = await app.request({
        url: `/products/${id}`
      });

      console.log('产品信息加载成功:', res);
      if (res && res.data) {
        this.setData({
          productInfo: res.data,
          'form.voltage': res.data.voltage || this.data.form.voltage,
          'form.phase': res.data.phase || this.data.form.phase,
          'form.industry': res.data.industry || ''
        });
        console.log('真实产品信息设置成功');
      }

    } catch (error) {
      console.error('加载产品信息失败:', error);
      console.log('保持使用默认产品信息');
      // 不显示错误提示，保持默认数据
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载客户信息
  async loadCustomerInfo(customerId) {
    try {
      const res = await app.request({
        url: `/customers/${customerId}`
      });
      if (res.data) {
        // 预填充客户用电数据
        this.setData({
          'form.voltage': res.data.voltage || '',
          'form.monthlyUsage': res.data.monthlyUsage || '',
          'form.industry': res.data.industry || '',
          'form.currentPrice': res.data.currentPrice || ''
        });
      }
    } catch (error) {
      console.error('加载客户信息失败:', error);
    }
  },

  // 输入框变化
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`form.${field}`]: value,
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

    console.log('开始表单验证:', form);

    for (const field in rules) {
      const value = form[field];
      const fieldRules = rules[field];

      console.log(`验证字段 ${field}:`, value);

      for (const rule of fieldRules) {
        // 必填验证
        if (rule.required && (!value || value.toString().trim() === '')) {
          isValid = false;
          errorMessage = rule.message;
          console.log(`必填验证失败: ${field}`);
          break;
        }

        // 跳过空值的其他验证
        if (!value || value.toString().trim() === '') continue;

        // 自定义验证
        if (rule.custom) {
          try {
            if (!rule.custom(value)) {
              isValid = false;
              errorMessage = rule.message;
              console.log(`自定义验证失败: ${field}, 值:`, value);
              break;
            }
          } catch (error) {
            console.error(`验证出错: ${field}`, error);
            isValid = false;
            errorMessage = '数据格式错误';
            break;
          }
        }

        // 数字类型验证
        if (rule.type === 'number') {
          const num = parseFloat(value);
          if (isNaN(num) || (rule.min !== undefined && num < rule.min)) {
            isValid = false;
            errorMessage = rule.message;
            console.log(`数字验证失败: ${field}, 值:`, value);
            break;
          }
        }
      }

      if (!isValid) break;
    }

    if (!isValid) {
      console.log('表单验证失败:', errorMessage);
      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      });
    } else {
      console.log('表单验证通过');
    }

    this.setData({ errors: !isValid ? { [Object.keys(rules).find(key => rules[key].some(r => r.required && !value))]: rules[Object.keys(rules).find(key => rules[key].some(r => r.required && !value))].find(r => r.required && !value).message } : {} });
    return isValid;
  },

  // 计算电费
  handleCalculate() {
    console.log('=== 开始计算电费 ===');
    console.log('当前表单数据:', this.data.form);
    
    // 表单验证
    if (!this.validateForm()) {
      console.log('表单验证失败，停止计算');
      return;
    }

    console.log('表单验证通过，开始计算');

    const { form, productInfo } = this.data;
    const { power, hours, days } = form;
    
    // 转换为数字类型
    const powerNum = Number(power);
    const hoursNum = Number(hours);
    const daysNum = Number(days);
    
    console.log('计算参数:', { 
      power: powerNum, 
      hours: hoursNum, 
      days: daysNum, 
      productInfo 
    });

    // 计算月用电量（度）= 功率(W) × 小时数 × 天数 / 1000
    const monthlyUsage = (powerNum * hoursNum * daysNum) / 1000;
    
    // 获取电价，如果没有产品信息则使用默认电价
    const pricePerKWh = productInfo ? Number(productInfo.price) : 0.60;
    
    console.log('电价:', pricePerKWh, '元/度');
    
    // 计算月电费
    const monthlyFee = monthlyUsage * pricePerKWh;

    const result = {
      monthlyUsage: monthlyUsage.toFixed(2),
      monthlyFee: monthlyFee.toFixed(2),
      yearlyUsage: (monthlyUsage * 12).toFixed(2),
      yearlyFee: (monthlyFee * 12).toFixed(2)
    };

    console.log('计算结果:', result);

    this.setData({ result });

    // 显示计算完成提示
    wx.showToast({
      title: '计算完成！',
      icon: 'success',
      duration: 1500
    });

    // 滚动到结果区域
    setTimeout(() => {
      wx.pageScrollTo({
        selector: '.result-card',
        duration: 300
      });
    }, 500);
    
    console.log('=== 计算电费完成 ===');
  },

  // 重置表单
  handleReset() {
    this.setData({
      form: {
        ...this.data.form,
        power: '',
        hours: '',
        days: '',
        monthlyUsage: '',
        peakUsage: '',
        valleyUsage: '',
        currentPrice: '',
        industry: '',
        demandPower: ''
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
  },

  // 计算节电效益
  async calculateSavings() {
    if (!this.validateForm()) {
      return;
    }
    
    this.setData({
      calculating: true,
      error: null
    });
    
    try {
      // 调用计算接口
      const res = await app.request({
        url: '/calculator/savings',
        method: 'POST',
        data: this.data.form
      });
      
      // 处理计算结果
      this.setData({
        calculationResult: res.data.result,
        recommendedProducts: res.data.recommendations,
        showResult: true
      });
      
      // 记录计算历史
      this.saveCalculationHistory(res.data);
      
    } catch (error) {
      console.error('计算失败:', error);
      this.setData({
        error: '计算失败，请稍后重试'
      });
    } finally {
      this.setData({
        calculating: false
      });
    }
  },

  // 保存计算历史
  async saveCalculationHistory(data) {
    try {
      await app.request({
        url: '/calculator/history',
        method: 'POST',
        data: {
          input: this.data.form,
          result: data.result,
          recommendations: data.recommendations
        }
      });
    } catch (error) {
      console.error('保存计算历史失败:', error);
    }
  },

  // 查看推荐产品详情
  viewProductDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/products/detail/detail?id=${id}`
    });
  },

  // 分享计算结果
  onShareAppMessage() {
    return {
      title: '为您推荐最优惠的电力套餐',
      path: '/pages/products/calculator/calculator',
      imageUrl: '/assets/images/share-calculator.png'
    };
  }
}); 