const api = require('../../../utils/api');
const common = require('../../../utils/common');

Page({
  data: {
    // 页面状态
    loading: false,
    
    // 用电信息输入
    powerInfo: {
      capacity: '',           // 用电容量(kW)
      monthlyUsage: '',      // 月用电量(kWh)
      currentPrice: '',      // 当前电价(元/kWh)
      industryType: '',      // 行业类型
      usagePattern: '工业用电' // 用电性质
    },
    
    // 行业类型选项
    industryTypes: [
      { id: 'manufacturing', name: '制造业', coefficient: 1.0 },
      { id: 'commerce', name: '商业', coefficient: 0.95 },
      { id: 'service', name: '服务业', coefficient: 0.9 },
      { id: 'logistics', name: '物流仓储', coefficient: 1.05 },
      { id: 'datacenter', name: '数据中心', coefficient: 1.1 },
      { id: 'other', name: '其他', coefficient: 1.0 }
    ],
    industryIndex: -1,
    
    // 用电性质选项
    usagePatterns: ['工业用电', '商业用电', '居民用电'],
    usageIndex: 0,
    
    // 产品列表
    products: [],
    
    // 计算结果
    calculationResults: [],
    showResults: false,
    
    // 表单验证错误
    errors: {},
    
    // 计算详情
    calculationDetails: null,
    showDetails: false,
    selectedResult: null,
    
    // 推荐产品
    recommendedProduct: null,
    
    // 页面提示
    tips: [
      '输入准确的用电信息，可获得更精确的节费计算',
      '不同行业类型会影响节费效果',
      '建议上传最近3个月的电费单以获得精准计算'
    ],
    currentTip: 0
  },

  onLoad(options) {
    console.log('Calculator page loaded with options:', options);
    
    // 如果有传入的产品ID，则预设计算该产品
    if (options.productId) {
      this.setData({
        presetProductId: options.productId
      });
    }
    
    this.initPage();
  },

  onShow() {
    // 从用户信息中预填充数据
    this.loadUserPowerInfo();
    
    // 启动提示轮播
    this.startTipsRotation();
  },

  onHide() {
    // 停止提示轮播
    this.stopTipsRotation();
  },

  onUnload() {
    this.stopTipsRotation();
  },

  // 初始化页面
  async initPage() {
    try {
      this.setData({ loading: true });
      
      await this.loadProducts();
      
    } catch (error) {
      console.error('Init page error:', error);
      common.showToast('页面加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载产品列表
  async loadProducts() {
    try {
      const result = await api.request('/products', 'GET');
      
      if (result.success) {
        this.setData({
          products: result.data.map(product => ({
            ...product,
            priceDisplay: this.formatPriceRange(product.priceRange)
          }))
        });
      }
    } catch (error) {
      console.error('Load products error:', error);
    }
  },

  // 加载用户用电信息
  async loadUserPowerInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo && userInfo.powerConsumption) {
        const powerInfo = userInfo.powerConsumption;
        
        // 查找行业类型索引
        let industryIndex = -1;
        if (powerInfo.industryType) {
          industryIndex = this.data.industryTypes.findIndex(
            item => item.id === powerInfo.industryType
          );
        }
        
        this.setData({
          'powerInfo.capacity': powerInfo.capacity || '',
          'powerInfo.monthlyUsage': powerInfo.monthlyUsage || '',
          'powerInfo.currentPrice': powerInfo.currentPrice || '',
          'powerInfo.industryType': powerInfo.industryType || '',
          industryIndex: industryIndex
        });
      }
    } catch (error) {
      console.error('Load user power info error:', error);
    }
  },

  // 输入框变化处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`powerInfo.${field}`]: value,
      [`errors.${field}`]: '' // 清除错误提示
    });
    
    // 实时计算（防抖）
    if (this.calculateTimer) {
      clearTimeout(this.calculateTimer);
    }
    
    this.calculateTimer = setTimeout(() => {
      this.autoCalculate();
    }, 500);
  },

  // 行业类型选择
  onIndustryChange(e) {
    const index = parseInt(e.detail.value);
    const industry = this.data.industryTypes[index];
    
    this.setData({
      industryIndex: index,
      'powerInfo.industryType': industry.id
    });
    
    // 重新计算
    this.autoCalculate();
  },

  // 用电性质选择
  onUsagePatternChange(e) {
    const index = parseInt(e.detail.value);
    
    this.setData({
      usageIndex: index,
      'powerInfo.usagePattern': this.data.usagePatterns[index]
    });
    
    // 重新计算
    this.autoCalculate();
  },

  // 表单验证
  validateForm() {
    const { powerInfo } = this.data;
    const errors = {};
    
    if (!powerInfo.capacity || parseFloat(powerInfo.capacity) <= 0) {
      errors.capacity = '请输入有效的用电容量';
    }
    
    if (!powerInfo.monthlyUsage || parseFloat(powerInfo.monthlyUsage) <= 0) {
      errors.monthlyUsage = '请输入有效的月用电量';
    }
    
    if (!powerInfo.currentPrice || parseFloat(powerInfo.currentPrice) <= 0) {
      errors.currentPrice = '请输入有效的当前电价';
    }
    
    if (!powerInfo.industryType) {
      errors.industryType = '请选择行业类型';
    }
    
    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  // 自动计算（当输入完整时）
  autoCalculate() {
    const { powerInfo } = this.data;
    
    // 检查必要字段是否填写完整
    if (powerInfo.capacity && powerInfo.monthlyUsage && 
        powerInfo.currentPrice && powerInfo.industryType) {
      this.performCalculation();
    }
  },

  // 手动计算按钮
  onCalculate() {
    if (!this.validateForm()) {
      common.showToast('请完善用电信息');
      return;
    }
    
    this.performCalculation();
  },

  // 执行计算
  async performCalculation() {
    try {
      this.setData({ loading: true });
      
      const { powerInfo, products } = this.data;
      
      // 模拟计算结果（实际应调用API）
      const calculationResults = this.simulateCalculation(powerInfo, products);
      
      // 按节费金额排序
      calculationResults.sort((a, b) => b.annualSavings - a.annualSavings);
      
      // 找出推荐产品（节费最多的）
      const recommendedProduct = calculationResults[0];
      
      this.setData({
        calculationResults,
        recommendedProduct,
        showResults: true
      });
      
      // 保存计算历史
      this.saveCalculationHistory();
      
      // 滚动到结果区域
      setTimeout(() => {
        wx.pageScrollTo({
          selector: '.results-section',
          duration: 300
        });
      }, 100);
      
    } catch (error) {
      console.error('Calculation error:', error);
      common.showToast('计算失败，请稍后重试');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 模拟计算逻辑
  simulateCalculation(powerInfo, products) {
    const capacity = parseFloat(powerInfo.capacity);
    const monthlyUsage = parseFloat(powerInfo.monthlyUsage);
    const currentPrice = parseFloat(powerInfo.currentPrice);
    
    // 获取行业系数
    const industry = this.data.industryTypes.find(item => item.id === powerInfo.industryType);
    const coefficient = industry ? industry.coefficient : 1.0;
    
    const results = [];
    
    // 模拟产品数据
    const mockProducts = [
      { id: '1', name: '智能节电套餐A', type: 'discount', discountRate: 15, price: 0 },
      { id: '2', name: '绿色能源套餐B', type: 'fixed', discountRate: 0, price: currentPrice * 0.85 },
      { id: '3', name: '峰谷电价套餐C', type: 'discount', discountRate: 20, price: 0 }
    ];
    
    mockProducts.forEach(product => {
      let newPrice = currentPrice;
      
      if (product.type === 'discount') {
        newPrice = currentPrice * (1 - product.discountRate / 100);
      } else if (product.type === 'fixed') {
        newPrice = product.price;
      }
      
      // 应用行业系数
      newPrice = newPrice * coefficient;
      
      const currentMonthlyBill = monthlyUsage * currentPrice;
      const newMonthlyBill = monthlyUsage * newPrice;
      const monthlySavings = currentMonthlyBill - newMonthlyBill;
      const annualSavings = monthlySavings * 12;
      
      results.push({
        productId: product.id,
        productName: product.name,
        productType: product.type,
        newPrice: newPrice.toFixed(4),
        currentMonthlyBill: currentMonthlyBill.toFixed(2),
        newMonthlyBill: newMonthlyBill.toFixed(2),
        monthlySavings: monthlySavings.toFixed(2),
        annualSavings: annualSavings.toFixed(2),
        initialCost: (capacity * 100).toFixed(2),
        paybackPeriod: Math.ceil(capacity * 100 / monthlySavings),
        threeYearSavings: (annualSavings * 3).toFixed(2),
        priceDisplay: `${newPrice.toFixed(4)}元/kWh`
      });
    });
    
    return results;
  },

  // 保存计算历史
  async saveCalculationHistory() {
    try {
      const { powerInfo, calculationResults, recommendedProduct } = this.data;
      
      const historyData = {
        powerInfo,
        calculationResults: calculationResults.slice(0, 3), // 只保存前3个结果
        recommendedProduct,
        calculatedAt: new Date().toISOString()
      };
      
      // 保存到本地存储
      let calculationHistory = wx.getStorageSync('calculationHistory') || [];
      calculationHistory.unshift(historyData);
      
      // 最多保存10条历史记录
      if (calculationHistory.length > 10) {
        calculationHistory = calculationHistory.slice(0, 10);
      }
      
      wx.setStorageSync('calculationHistory', calculationHistory);
      
    } catch (error) {
      console.error('Save calculation history error:', error);
    }
  },

  // 查看计算详情
  onViewDetails(e) {
    const { productId } = e.currentTarget.dataset;
    const result = this.data.calculationResults.find(r => r.productId === productId);
    
    if (result) {
      this.setData({
        selectedResult: result,
        showDetails: true
      });
    }
  },

  // 关闭详情弹窗
  onCloseDetails() {
    this.setData({
      showDetails: false,
      selectedResult: null
    });
  },

  // 选择产品
  onSelectProduct(e) {
    const { productId } = e.currentTarget.dataset;
    
    // 跳转到产品详情页
    wx.navigateTo({
      url: `/pages/products/detail/detail?id=${productId}&fromCalculator=1`
    });
  },

  // 立即下单
  onCreateOrder(e) {
    const { productId } = e.currentTarget.dataset;
    
    // 检查用户登录状态
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.navigateTo({
        url: '/pages/auth/login/login'
      });
      return;
    }
    
    // 跳转到订单创建页面
    const calculationResult = this.data.calculationResults.find(r => r.productId === productId);
    wx.navigateTo({
      url: `/pages/orders/create/create?productId=${productId}&calculationData=${encodeURIComponent(JSON.stringify(calculationResult))}`
    });
  },

  // 格式化价格区间
  formatPriceRange(priceRange) {
    if (!priceRange) return '';
    
    if (priceRange.min === priceRange.max) {
      return `${priceRange.min}元/kWh`;
    } else {
      return `${priceRange.min}-${priceRange.max}元/kWh`;
    }
  },

  // 启动提示轮播
  startTipsRotation() {
    if (this.tipsTimer) return;
    
    this.tipsTimer = setInterval(() => {
      const { tips, currentTip } = this.data;
      const nextTip = (currentTip + 1) % tips.length;
      this.setData({ currentTip: nextTip });
    }, 3000);
  },

  // 停止提示轮播
  stopTipsRotation() {
    if (this.tipsTimer) {
      clearInterval(this.tipsTimer);
      this.tipsTimer = null;
    }
  },

  // 上传电费单
  onUploadBill() {
    wx.chooseMedia({
      count: 3,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles;
        this.uploadBillImages(tempFiles);
      }
    });
  },

  // 上传电费单图片
  async uploadBillImages(tempFiles) {
    try {
      this.setData({ loading: true });
      
      // 模拟识别结果
      setTimeout(() => {
        this.setData({
          'powerInfo.capacity': '500',
          'powerInfo.monthlyUsage': '50000',
          'powerInfo.currentPrice': '0.65'
        });
        
        common.showToast('电费单识别成功');
        
        // 自动计算
        setTimeout(() => {
          this.autoCalculate();
        }, 500);
        
        this.setData({ loading: false });
      }, 2000);
      
    } catch (error) {
      console.error('Upload bill images error:', error);
      common.showToast('上传失败');
      this.setData({ loading: false });
    }
  },

  // 清空表单
  onClearForm() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有输入的信息吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            powerInfo: {
              capacity: '',
              monthlyUsage: '',
              currentPrice: '',
              industryType: '',
              usagePattern: '工业用电'
            },
            industryIndex: -1,
            usageIndex: 0,
            calculationResults: [],
            showResults: false,
            errors: {}
          });
        }
      }
    });
  },

  // 保存为模板
  onSaveTemplate() {
    const { powerInfo } = this.data;
    
    if (!this.validateForm()) {
      common.showToast('请完善用电信息');
      return;
    }
    
    wx.showModal({
      title: '保存模板',
      content: '将当前用电信息保存为模板，方便下次使用',
      success: (res) => {
        if (res.confirm) {
          const templates = wx.getStorageSync('calculatorTemplates') || [];
          const template = {
            ...powerInfo,
            name: `模板${templates.length + 1}`,
            createdAt: new Date().toISOString()
          };
          
          templates.push(template);
          wx.setStorageSync('calculatorTemplates', templates);
          common.showToast('模板保存成功');
        }
      }
    });
  },

  // 使用模板
  onUseTemplate() {
    const templates = wx.getStorageSync('calculatorTemplates') || [];
    
    if (templates.length === 0) {
      common.showToast('暂无保存的模板');
      return;
    }
    
    // 使用最近的模板
    const latestTemplate = templates[templates.length - 1];
    
    // 查找行业类型索引
    let industryIndex = -1;
    if (latestTemplate.industryType) {
      industryIndex = this.data.industryTypes.findIndex(
        item => item.id === latestTemplate.industryType
      );
    }
    
    // 查找用电性质索引
    let usageIndex = 0;
    if (latestTemplate.usagePattern) {
      usageIndex = this.data.usagePatterns.findIndex(
        pattern => pattern === latestTemplate.usagePattern
      );
      if (usageIndex === -1) usageIndex = 0;
    }
    
    this.setData({
      powerInfo: {
        capacity: latestTemplate.capacity,
        monthlyUsage: latestTemplate.monthlyUsage,
        currentPrice: latestTemplate.currentPrice,
        industryType: latestTemplate.industryType,
        usagePattern: latestTemplate.usagePattern
      },
      industryIndex,
      usageIndex
    });
    
    common.showToast('模板加载成功');
    
    // 自动计算
    setTimeout(() => {
      this.autoCalculate();
    }, 500);
  },

  // 查看历史计算记录
  onViewHistory() {
    wx.navigateTo({
      url: '/pages/calculator/history/history'
    });
  },

  // 分享计算结果
  onShareResult() {
    const { recommendedProduct } = this.data;
    
    if (!recommendedProduct) {
      common.showToast('请先进行计算');
      return;
    }
    
    return {
      title: `我通过智能计算预计每年可节省电费${recommendedProduct.annualSavings}元`,
      path: `/pages/calculator/index/index?shared=1`,
      imageUrl: '/images/share-calculator.png'
    };
  },

  // 联系客服
  onContactService() {
    common.makePhoneCall('400-800-8888');
  }
}); 