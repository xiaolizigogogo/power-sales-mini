const api = require('../../../utils/api');
const common = require('../../../utils/common');

Page({
  data: {
    productId: '',
    product: null,
    loading: false,
    submitting: false,
    
    // 用户信息
    userInfo: null,
    
    // 订单信息
    orderInfo: {
      productId: '',
      serviceStartDate: '',
      serviceEndDate: '',
      capacity: '',
      estimatedUsage: '',
      currentPrice: '',
      specialRequirements: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      companyAddress: ''
    },
    
    // 计算结果
    calculation: {
      estimatedAmount: 0,
      estimatedSavings: 0,
      annualSavings: 0,
      serviceMonths: 12
    },
    
    // 表单验证
    errors: {},
    
    // 服务期限选项
    servicePeriodOptions: [
      { value: 12, label: '12个月', popular: true },
      { value: 24, label: '24个月', popular: false },
      { value: 36, label: '36个月', popular: false }
    ],
    selectedServicePeriod: 12,
    
    // 日期选择
    minDate: '',
    maxDate: '',
    
    // 协议确认
    agreedToTerms: false,
    showTermsModal: false
  },

  onLoad(options) {
    const { productId } = options;
    if (productId) {
      this.setData({ productId });
      this.loadProductInfo();
    }
    this.loadUserInfo();
    this.initDateRange();
  },

  onShow() {
    // 每次显示页面时重新加载用户信息，防止信息过期
    this.loadUserInfo();
  },

  // 加载产品信息
  async loadProductInfo() {
    if (!this.data.productId) return;
    
    try {
      this.setData({ loading: true });
      
      const product = await api.getProductDetail(this.data.productId);
      
      this.setData({ 
        product,
        'orderInfo.productId': this.data.productId
      });
      
      // 如果用户信息已加载，进行效益计算
      if (this.data.userInfo) {
        this.calculateBenefit();
      }
      
    } catch (error) {
      console.error('加载产品信息失败:', error);
      common.showToast('加载产品信息失败', 'error');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const userInfo = await api.getUserInfo();
      
      this.setData({ 
        userInfo,
        'orderInfo.contactName': userInfo.name || '',
        'orderInfo.contactPhone': userInfo.phone || '',
        'orderInfo.contactEmail': userInfo.email || '',
        'orderInfo.companyAddress': userInfo.companyAddress || '',
        'orderInfo.capacity': userInfo.powerConsumption?.capacity || '',
        'orderInfo.estimatedUsage': userInfo.powerConsumption?.monthlyUsage || '',
        'orderInfo.currentPrice': userInfo.powerConsumption?.currentPrice || ''
      });
      
      // 如果产品信息已加载，进行效益计算
      if (this.data.product) {
        this.calculateBenefit();
      }
      
    } catch (error) {
      console.error('加载用户信息失败:', error);
      common.showToast('加载用户信息失败', 'error');
    }
  },

  // 初始化日期范围
  initDateRange() {
    const today = new Date();
    const minDate = common.formatDate(today);
    
    // 最大开始日期为6个月后
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    
    this.setData({
      minDate,
      maxDate: common.formatDate(maxDate),
      'orderInfo.serviceStartDate': minDate
    });
    
    // 设置默认结束日期
    this.calculateEndDate();
  },

  // 计算结束日期
  calculateEndDate() {
    const { serviceStartDate } = this.data.orderInfo;
    const { selectedServicePeriod } = this.data;
    
    if (serviceStartDate) {
      const startDate = new Date(serviceStartDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + selectedServicePeriod);
      
      this.setData({
        'orderInfo.serviceEndDate': common.formatDate(endDate),
        'calculation.serviceMonths': selectedServicePeriod
      });
      
      this.calculateBenefit();
    }
  },

  // 效益计算
  calculateBenefit() {
    const { orderInfo, product, calculation } = this.data;
    
    if (!product || !orderInfo.capacity || !orderInfo.estimatedUsage || !orderInfo.currentPrice) {
      return;
    }
    
    try {
      const capacity = parseFloat(orderInfo.capacity) || 0;
      const monthlyUsage = parseFloat(orderInfo.estimatedUsage) || 0;
      const currentPrice = parseFloat(orderInfo.currentPrice) || 0;
      const serviceMonths = calculation.serviceMonths;
      
      // 根据产品类型计算新电价
      let newPrice = currentPrice;
      if (product.priceType === 'fixed') {
        newPrice = product.price;
      } else if (product.priceType === 'discount') {
        newPrice = currentPrice * (1 - product.discountRate / 100);
      }
      
      // 计算费用和节省
      const currentMonthlyAmount = monthlyUsage * currentPrice;
      const newMonthlyAmount = monthlyUsage * newPrice;
      const monthlySavings = currentMonthlyAmount - newMonthlyAmount;
      
      const totalAmount = newMonthlyAmount * serviceMonths;
      const totalSavings = monthlySavings * serviceMonths;
      const annualSavings = monthlySavings * 12;
      
      this.setData({
        'calculation.estimatedAmount': totalAmount,
        'calculation.estimatedSavings': totalSavings,
        'calculation.annualSavings': annualSavings
      });
      
    } catch (error) {
      console.error('效益计算失败:', error);
    }
  },

  // 输入事件处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`orderInfo.${field}`]: value,
      [`errors.${field}`]: '' // 清除错误信息
    });
    
    // 如果是影响计算的字段，重新计算
    if (['capacity', 'estimatedUsage', 'currentPrice'].includes(field)) {
      this.calculateBenefit();
    }
  },

  // 服务期限选择
  onServicePeriodChange(e) {
    const period = parseInt(e.currentTarget.dataset.period);
    this.setData({ selectedServicePeriod: period });
    this.calculateEndDate();
  },

  // 服务开始日期选择
  onStartDateChange(e) {
    this.setData({
      'orderInfo.serviceStartDate': e.detail.value,
      'errors.serviceStartDate': ''
    });
    this.calculateEndDate();
  },

  // 协议确认
  onAgreeChange(e) {
    this.setData({
      agreedToTerms: e.detail.value,
      'errors.agreedToTerms': ''
    });
  },

  // 显示服务协议
  showTerms() {
    this.setData({ showTermsModal: true });
  },

  // 关闭服务协议
  closeTerms() {
    this.setData({ showTermsModal: false });
  },

  // 表单验证
  validateForm() {
    const { orderInfo, agreedToTerms } = this.data;
    const errors = {};
    
    // 必填字段验证
    const requiredFields = {
      'contactName': '联系人姓名',
      'contactPhone': '联系电话',
      'capacity': '用电容量',
      'estimatedUsage': '预估月用电量',
      'currentPrice': '当前电价',
      'serviceStartDate': '服务开始日期'
    };
    
    Object.keys(requiredFields).forEach(field => {
      if (!orderInfo[field] || orderInfo[field].trim() === '') {
        errors[field] = `请填写${requiredFields[field]}`;
      }
    });
    
    // 电话号码格式验证
    if (orderInfo.contactPhone && !common.validatePhone(orderInfo.contactPhone)) {
      errors.contactPhone = '请输入正确的手机号码';
    }
    
    // 邮箱格式验证（如果填写了邮箱）
    if (orderInfo.contactEmail && !common.validateEmail(orderInfo.contactEmail)) {
      errors.contactEmail = '请输入正确的邮箱地址';
    }
    
    // 数值验证
    if (orderInfo.capacity && (isNaN(orderInfo.capacity) || parseFloat(orderInfo.capacity) <= 0)) {
      errors.capacity = '请输入正确的用电容量';
    }
    
    if (orderInfo.estimatedUsage && (isNaN(orderInfo.estimatedUsage) || parseFloat(orderInfo.estimatedUsage) <= 0)) {
      errors.estimatedUsage = '请输入正确的月用电量';
    }
    
    if (orderInfo.currentPrice && (isNaN(orderInfo.currentPrice) || parseFloat(orderInfo.currentPrice) <= 0)) {
      errors.currentPrice = '请输入正确的当前电价';
    }
    
    // 协议确认验证
    if (!agreedToTerms) {
      errors.agreedToTerms = '请阅读并同意服务协议';
    }
    
    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  // 提交订单
  async submitOrder() {
    if (!this.validateForm()) {
      const firstErrorField = Object.keys(this.data.errors)[0];
      common.showToast(this.data.errors[firstErrorField], 'error');
      return;
    }
    
    if (this.data.submitting) return;
    
    try {
      this.setData({ submitting: true });
      
      const orderData = {
        ...this.data.orderInfo,
        estimatedAmount: this.data.calculation.estimatedAmount,
        estimatedSavings: this.data.calculation.estimatedSavings,
        serviceMonths: this.data.calculation.serviceMonths
      };
      
      const result = await api.createOrder(orderData);
      
      common.showToast('订单提交成功', 'success');
      
      // 跳转到订单详情页
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/orders/detail/detail?id=${result.orderId}`
        });
      }, 1500);
      
    } catch (error) {
      console.error('订单提交失败:', error);
      common.showToast(error.message || '订单提交失败，请重试', 'error');
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 重新计算
  recalculate() {
    this.calculateBenefit();
    common.showToast('重新计算完成', 'success');
  },

  // 返回产品详情
  goBack() {
    wx.navigateBack();
  },

  // 联系客服
  contactService() {
    common.makePhoneCall('400-800-8888');
  }
}); 