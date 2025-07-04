const app = getApp();
const { checkRoleAccess } = require('../../../utils/auth');
const { apiService } = require('../../../utils/api');

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
        { pattern: /^\d+(\.\d+)?$/, message: '请输入有效的功率数值' },
        { validator: (val) => Number(val) > 0, message: '功率必须大于0' }
      ],
      hours: [
        { required: true, message: '请输入每日用电时长' },
        { pattern: /^\d+(\.\d+)?$/, message: '请输入有效的时长数值' },
        { validator: (val) => Number(val) >= 0 && Number(val) <= 24, message: '每日用电时长必须在0-24小时之间' }
      ],
      days: [
        { required: true, message: '请输入每月用电天数' },
        { pattern: /^\d+$/, message: '请输入整数天数' },
        { validator: (val) => Number(val) >= 1 && Number(val) <= 31, message: '每月用电天数必须是1-31之间的整数' }
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
    error: null,
    product: null,
    type: 'commercial',
    consumption: '',
    peakPercent: 60,
    results: {
      currentBill: 0,
      newBill: 0,
      monthlySavings: 0,
      annualSavings: 0
    },
    // 基准电价（元/度）
    baseRates: {
      commercial: {
        current: 0.8,
        peak: 1.2,
        valley: 0.4
      },
      residential: {
        current: 0.6,
        peak: 0.8,
        valley: 0.3
      }
    },
    formData: {
      consumption: '',
      peakHours: '',
      valleyHours: ''
    }
  },

  onLoad(options) {
    // 检查角色权限
    if (!checkRoleAccess('products')) {
      return;
    }

    console.log('计算器页面加载，参数:', options);
    
    const { productId, productName, currentPrice, consumption } = options;
    
    // 设置初始产品信息
    if (productId && productName && currentPrice) {
      // 解码URL编码的产品名称
      const decodedName = decodeURIComponent(productName);
      
      const productInfo = {
        id: productId,
        name: decodedName,
        price: currentPrice,
        image: '/assets/images/product-default.png',
        voltage: '380',
        phase: '三相',
        categoryName: '工商业套餐',
        priceRange: `¥${currentPrice} - ¥${(parseFloat(currentPrice) * 1.2).toFixed(2)}/度`,
        minCapacity: '1000度/月',
        maxCapacity: '50000度/月',
        suitableDesc: '适用于工商业用户的基础用电套餐',
        features: ['稳定供电', '价格透明', '服务保障']
      };
      
      this.setData({
        productInfo,
        'form.productId': productId,
        'form.voltage': productInfo.voltage,
        'form.phase': productInfo.phase,
        'form.currentPrice': currentPrice,
        'form.monthlyUsage': consumption || ''
      });
      
      console.log('设置传入的产品信息:', productInfo);
      
      // 尝试加载更详细的产品信息（可选）
      if (productId !== 'default') {
        this.loadProductInfo(productId);
      }
    } else {
      console.warn('未传入完整的产品信息');
      // 使用默认产品信息
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
      default: {
        id: 'default',
        name: '电力产品套餐',
        price: '0.60',
        image: '/assets/images/product-default.png',
        voltage: '220',
        phase: '单相',
        categoryName: '基础套餐',
        priceRange: '¥0.60 - ¥0.72/度',
        minCapacity: '100度/月',
        maxCapacity: '10000度/月',
        suitableDesc: '适用于一般用户的电力套餐',
        features: ['基础供电', '价格实惠', '简单便捷']
      }
    };

    const productInfo = defaultProducts[id] || defaultProducts['default'];
    
    this.setData({
      productInfo,
      'form.voltage': productInfo.voltage,
      'form.phase': productInfo.phase,
      'form.currentPrice': productInfo.price
    });
    
    console.log('设置默认产品信息:', productInfo);
  },

  // 加载产品信息
  async loadProductInfo(productId) {
    try {
      this.setData({ loading: true });
      
      // 使用HTTP API替代云函数
      const res = await apiService.get(`/products/${productId}`, {}, { showError: false });
      
      if (res && res.data) {
        const product = res.data;
        // 格式化价格区间
        const priceRange = `¥${product.minPrice || product.price} - ¥${product.maxPrice || (parseFloat(product.price) * 1.2).toFixed(2)}/度`;
        
        this.setData({
          productInfo: {
            ...this.data.productInfo, // 保留现有信息
            ...product,
            priceRange,
            minCapacity: product.minCapacity ? `${product.minCapacity}度/月` : '暂无限制',
            maxCapacity: product.maxCapacity ? `${product.maxCapacity}度/月` : '暂无限制'
          }
        });
        
        console.log('成功加载详细产品信息:', product);
      }
    } catch (error) {
      console.warn('获取详细产品信息失败，使用基础信息:', error);
      // 不显示错误提示，保持使用基础信息
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载客户信息
  async loadCustomerInfo(customerId) {
    try {
      const res = await apiService.get(`/customers/${customerId}`);
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

  // 输入事件处理
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail;
    
    console.log('输入变化:', field, value);
    
    this.setData({
      [`form.${field}`]: value
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
    console.log('开始表单验证:', this.data.form);
    
    const { form } = this.data;
    const rules = {
      power: [
        { required: true, message: '请输入设备功率' },
        { pattern: /^\d+(\.\d+)?$/, message: '请输入有效的功率数值' },
        { validator: (val) => Number(val) > 0, message: '功率必须大于0' }
      ],
      hours: [
        { required: true, message: '请输入每日用电时长' },
        { pattern: /^\d+(\.\d+)?$/, message: '请输入有效的时长数值' },
        { validator: (val) => Number(val) >= 0 && Number(val) <= 24, message: '每日用电时长必须在0-24小时之间' }
      ],
      days: [
        { required: true, message: '请输入每月用电天数' },
        { pattern: /^\d+$/, message: '请输入整数天数' },
        { validator: (val) => Number(val) >= 1 && Number(val) <= 31, message: '每月用电天数必须是1-31之间的整数' }
      ]
    };

    // 遍历规则进行验证
    for (const field in rules) {
      console.log('验证字段', field + ':', form[field]);
      
      const fieldRules = rules[field];
      const value = form[field];

      // 检查每个规则
      const error = fieldRules.find(rule => {
        // 必填验证
        if (rule.required) {
          if (!value && value !== 0) {
            console.log('必填验证失败:', field);
            return true;
          }
        }

        // 正则验证
        if (rule.pattern && value) {
          if (!rule.pattern.test(value)) {
            console.log('正则验证失败:', field);
            return true;
          }
        }

        // 自定义验证
        if (rule.validator && value) {
          if (!rule.validator(value)) {
            console.log('自定义验证失败:', field);
            return true;
          }
        }

        return false;
      });

      if (error) {
        console.log('表单验证失败:', error.message);
        wx.showToast({
          title: error.message,
          icon: 'none',
          duration: 2000
        });
        return false;
      }
    }

    console.log('表单验证通过');
    return true;
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
  },

  // 用电类型切换
  onTypeChange(e) {
    this.setData({
      type: e.detail,
      showResult: false
    });
  },

  // 用电量输入
  onConsumptionChange(e) {
    this.setData({
      consumption: e.detail,
      showResult: false
    });
  },

  // 峰时比例变化
  onPeakChange(e) {
    this.setData({
      peakPercent: e.detail,
      showResult: false
    });
  },

  // 计算电费
  calculate() {
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

  // 重新计算
  recalculate() {
    this.setData({
      showResult: false,
      consumption: '',
      peakPercent: 60
    });
  },

  // 创建订单
  createOrder() {
    const { id } = this.data.productInfo;
    wx.navigateTo({
      url: `/pages/orders/create/create?productId=${id}`
    });
  }
}); 