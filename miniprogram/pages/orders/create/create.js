const app = getApp()
const { checkRoleAccess } = require('../../../utils/auth');
const { apiService } = require('../../../utils/api');

Page({
  data: {
    // 订单基本信息
    orderForm: {
      productId: '', // 产品ID
      productName: '', // 产品名称
      servicePeriod: 12, // 服务期限（月）
      startDate: '', // 服务开始时间
      specialRequirements: '', // 特殊需求
      remarks: '', // 备注
      estimatedUsage: '', // 预估月用电量
      usageType: 'commercial', // 用电性质
      voltageLevel: '', // 电压等级
      totalAmount: 0, // 预估总金额
      monthlyFee: 0, // 月均费用
      estimatedSavings: 0, // 预计节省金额
      attachments: [] // 附件列表
    },
    
    // 客户信息
    customerInfo: {
      companyName: '',
      contactPerson: '',
      contactPhone: '',
      serviceAddress: ''
    },
    
    // 产品信息
    product: null,
    
    // 服务期限选项 - 使用数组格式，Vant picker需要
    periodOptions: [
      '6个月',
      '12个月', 
      '24个月',
      '36个月'
    ],

    // 用电性质选项
    usageTypeOptions: [
      { text: '工商业用电', value: 'commercial' },
      { text: '居民用电', value: 'residential' },
      { text: '农业用电', value: 'agricultural' },
      { text: '临时用电', value: 'temporary' }
    ],

    // 电压等级选项
    voltageOptions: [
      '380V及以下',
      '10kV',
      '35kV',
      '110kV及以上'
    ],
    
    // 日期选择
    minDate: new Date().getTime(),
    maxDate: new Date().setMonth(new Date().getMonth() + 6),
    currentDate: new Date().getTime(),
    showDatePicker: false,
    showVoltagePicker: false,
    
    // 表单验证规则
    rules: {
      servicePeriod: [
        { required: true, message: '请选择服务期限' }
      ],
      startDate: [
        { required: true, message: '请选择服务开始时间' }
      ],
      estimatedUsage: [
        { required: true, message: '请输入预估月用电量' },
        { type: 'number', min: 1, message: '用电量必须大于0' }
      ]
    },
    
    // 页面状态
    loading: true,
    submitting: false,
    errors: {},
    agreedTerms: false,
    showConfirmDialog: false,
    confirmMessage: '',
    
    // 表单字段
    serviceAddress: '',
    servicePeriod: 12,
    serviceStartDate: new Date().getTime(),
    specialRequirements: '',
    
    // 费用计算
    totalAmount: '0.00',
    actualAmount: '0.00',
    estimatedSavings: '0.00',
    
    // 选择器相关
    showVoltagePopup: false,
    showTypePopup: false,
    showPeriodPopup: false,
    typeOptions: ['工业用电', '商业用电', '居民用电', '农业用电'],
    
    // 其他字段
    quantity: 1,
    estimatedBill: '0.00',
    
    // 格式化后的日期
    formattedStartDate: ''
  },

  onLoad(options) {
    console.log('🚀 订单创建页面 onLoad 被调用');
    console.log('📋 页面参数:', options);
    
    try {
      // 检查角色权限
      if (!checkRoleAccess('orders')) {
        console.warn('⚠️ 用户角色未定义或权限不足');
        // 暂时允许访问，后续可以添加重定向逻辑
      } else {
        console.log('✅ 角色权限检查通过');
      }

      console.log('📊 当前用户信息:', {
        token: wx.getStorageSync('token') ? '已设置' : '未设置',
        userInfo: wx.getStorageSync('userInfo'),
        userRole: wx.getStorageSync('userRole')
      });
      
      const { 
        productId, 
        productName, 
        currentPrice, 
        productType, 
        voltage, 
        phase, 
        consumption 
      } = options;
      
      // 如果有传入的产品信息，先设置基础信息
      if (productId && productName) {
        const decodedName = decodeURIComponent(productName);
        
        // 设置基础产品信息
        const baseProductInfo = {
          id: productId,
          name: decodedName,
          price: currentPrice || '0.65',
          unitPrice: currentPrice || '0.65',
          category: productType || 'commercial',
          voltage: voltage || '380',
          phase: phase || '三相',
          description: '电力优化服务套餐'
        };
        
        this.setData({
          product: baseProductInfo,
          'orderForm.productId': productId,
          'orderForm.productName': decodedName,
          'orderForm.estimatedUsage': consumption || '',
          'orderForm.voltageLevel': voltage || '380V及以下',
          'orderForm.usageType': productType || 'commercial'
        });
        
        console.log('设置基础产品信息:', baseProductInfo);
        
        // 如果有预估用电量，计算费用
        if (consumption) {
          this.calculateAmount();
        }
      }
      
      // 加载详细产品信息（如果有productId）
      if (productId) {
        this.loadProductInfo(productId);
      }
      
      // 加载客户信息
      this.loadCustomerInfo();
      
    } catch (error) {
      console.error('页面加载失败:', error);
    } finally {
      // 设置页面为已加载状态
      const today = new Date();
      const formattedToday = this.formatDate(today);
      
      this.setData({ 
        loading: false,
        formattedStartDate: formattedToday,
        serviceStartDate: today.getTime(),
        'orderForm.startDate': formattedToday
      });
      
      console.log('📅 设置默认开始日期:', {
        today: today,
        formattedToday: formattedToday,
        timestamp: today.getTime()
      });
    }
  },

  // 初始化页面数据
  async initPageData(productId) {
    try {
      await Promise.all([
        this.loadProductInfo(productId),
        this.loadCustomerInfo()
      ])
    } catch (error) {
      console.error('初始化页面数据失败:', error)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载产品信息
  async loadProductInfo(productId) {
    wx.showLoading({
      title: '加载中...'
    });

    try {
      const res = await apiService.get(`/products/${productId}`);
      
      if (res && res.data) {
        // 更新产品信息，保留基础信息
        const updatedProduct = {
          ...this.data.product, // 保留基础信息
          ...res.data,
          unitPrice: res.data.price || res.data.basePrice || this.data.product.price
        };
        
        this.setData({
          product: updatedProduct,
          'orderForm.productName': updatedProduct.name
        });
        
        console.log('成功加载详细产品信息:', updatedProduct);
        
        // 预填充用电量（如果有）
        if (res.data.defaultUsage && !this.data.orderForm.estimatedUsage) {
          this.setData({
            'orderForm.estimatedUsage': res.data.defaultUsage
          });
          this.calculateAmount();
        }
      }
    } catch (error) {
      console.warn('加载详细产品信息失败，使用基础信息:', error);
      // 不显示错误提示，保持使用基础产品信息
    } finally {
      wx.hideLoading();
    }
  },

  // 加载客户信息
  async loadCustomerInfo() {
    console.log('👤 开始加载客户信息...');
    try {
      console.log('🌐 调用 /user/profile 接口...');
      const res = await apiService.get('/user/profile');
      
      console.log('✅ 客户信息接口响应:', res);
      
      if (res && res.data) {
        this.setData({
          customerInfo: res.data
        });
        console.log('✅ 成功加载用户信息:', res.data);
      } else {
        console.warn('⚠️ 客户信息响应数据为空:', res);
      }
    } catch (error) {
      console.warn('加载用户信息失败，使用默认信息:', error);
      // 使用默认客户信息
      this.setData({
        customerInfo: {
          companyName: '示例企业有限公司',
          contactPerson: '张经理',
          contactPhone: '138****8888',
          serviceAddress: '北京市朝阳区示例大厦'
        }
      });
    }
  },

  // 编辑客户信息
  editCustomerInfo() {
    wx.navigateTo({
      url: '/pages/profile/edit/edit'
    })
  },

  // 表单输入处理
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`form.${field}`]: value
    });
    
    // 如果修改了用电量，重新计算费用
    if (field === 'capacity') {
      this.calculateEstimatedBill();
    }
  },

  // 选择服务期限
  onPeriodChange(e) {
    const servicePeriod = e.detail;
    this.setData({
      servicePeriod: servicePeriod,
      'orderForm.servicePeriod': servicePeriod
    });
    
    // 重新计算费用
    this.calculateAmount();
  },

  // 选择用电性质
  onUsageTypeChange(e) {
    this.setData({
      'orderForm.usageType': e.detail
    })
    this.calculateFees()
  },

  // 显示日期选择器
  showDatePicker() {
    this.setData({
      showDatePicker: true
    });
  },

  // 关闭日期选择器
  closeDatePicker() {
    this.setData({
      showDatePicker: false
    });
  },

  // 确认日期选择
  onDateConfirm(e) {
    const date = new Date(e.detail);
    const formattedDate = this.formatDate(date);
    
    console.log('📅 用户选择日期:', {
      timestamp: e.detail,
      date: date,
      formattedDate: formattedDate
    });
    
    this.setData({
      serviceStartDate: e.detail,
      formattedStartDate: formattedDate,
      'orderForm.startDate': formattedDate,
      showDatePicker: false
    });
    
    console.log('✅ 日期选择完成，当前orderForm.startDate:', this.data.orderForm.startDate);
  },

  // 显示电压等级选择器
  showVoltagePopup() {
    this.setData({
      showVoltagePopup: true
    });
  },

  // 关闭电压等级选择器
  closeVoltagePopup() {
    this.setData({
      showVoltagePopup: false
    });
  },

  // 确认电压等级选择
  onVoltageConfirm(e) {
    this.setData({
      'form.voltage': e.detail.value,
      showVoltagePopup: false
    });
  },

  // 用电类型选择
  showTypePopup() {
    this.setData({
      showTypePopup: true
    });
  },

  closeTypePopup() {
    this.setData({
      showTypePopup: false
    });
  },

  onTypeConfirm(e) {
    this.setData({
      'form.type': e.detail.value,
      showTypePopup: false
    });
  },

  // 服务期限选择
  showPeriodPopup() {
    this.setData({
      showPeriodPopup: true
    });
  },

  closePeriodPopup() {
    this.setData({
      showPeriodPopup: false
    });
  },

  onPeriodConfirm(e) {
    const selectedPeriod = e.detail.value;
    console.log('选择的服务期限:', selectedPeriod);
    
    // 从字符串中提取数字
    const periodNumber = parseInt(selectedPeriod);
    
    this.setData({
      servicePeriod: periodNumber,
      'orderForm.servicePeriod': periodNumber,
      showPeriodPopup: false
    });
    
    // 重新计算费用
    this.calculateAmount();
  },

  // 协议确认
  onAgreementChange(e) {
    console.log('📋 服务条款状态变更:', {
      checked: e.detail,
      previousValue: this.data.agreedTerms
    });
    
    this.setData({
      agreedTerms: e.detail
    });
    
    console.log('✅ 服务条款状态已更新:', this.data.agreedTerms);
  },

  // 查看协议
  viewAgreement() {
    console.log('📖 用户点击查看协议');
    
    // 暂时显示提示，因为协议页面可能不存在
    wx.showToast({
      title: '协议页面开发中',
      icon: 'none'
    });
    
    // 如果后续有协议页面，可以取消注释下面的代码
    // wx.navigateTo({
    //   url: '/pages/agreement/agreement'
    // });
  },

  // 上传文件
  uploadFile() {
    wx.chooseMessageFile({
      count: 5,
      type: 'file',
      success: (res) => {
        const tempFiles = res.tempFiles
        this.uploadFiles(tempFiles)
      }
    })
  },

  // 上传文件到服务器
  async uploadFiles(files) {
    wx.showLoading({ title: '上传中...' })
    
    try {
      const uploadPromises = files.map(file => {
        return new Promise((resolve, reject) => {
          wx.uploadFile({
            url: app.globalData.baseUrl + '/upload',
            filePath: file.path,
            name: 'file',
            header: {
              'Authorization': `Bearer ${app.globalData.token}`
            },
            success: (res) => {
              const data = JSON.parse(res.data)
              if (data.success) {
                resolve({
                  id: Date.now() + Math.random(),
                  name: file.name,
                  url: data.data.url,
                  size: file.size
                })
              } else {
                reject(new Error(data.message))
              }
            },
            fail: reject
          })
        })
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      const currentAttachments = this.data.orderForm.attachments
      
      this.setData({
        'orderForm.attachments': [...currentAttachments, ...uploadedFiles]
      })
      
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('文件上传失败:', error)
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 删除文件
  removeFile(e) {
    const { index } = e.currentTarget.dataset
    const attachments = this.data.orderForm.attachments
    attachments.splice(index, 1)
    
    this.setData({
      'orderForm.attachments': attachments
    })
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 计算费用
  calculateFees() {
    const { estimatedUsage, servicePeriod, usageType } = this.data.orderForm
    const { price = 0 } = this.data.product || {}
    
    if (!estimatedUsage || !price) return
    
    // 根据用电性质调整价格
    let adjustedPrice = price
    switch (usageType) {
      case 'residential':
        adjustedPrice = price * 0.9 // 居民用电优惠10%
        break
      case 'agricultural':
        adjustedPrice = price * 0.8 // 农业用电优惠20%
        break
      case 'temporary':
        adjustedPrice = price * 1.2 // 临时用电加价20%
        break
    }
    
    const monthlyFee = estimatedUsage * adjustedPrice
    const totalAmount = monthlyFee * servicePeriod
    
    // 计算预估节省（假设比市场价节省15%）
    const marketPrice = adjustedPrice * 1.15
    const estimatedSavings = (estimatedUsage * (marketPrice - adjustedPrice)) * 12
    
    this.setData({
      'orderForm.monthlyFee': monthlyFee.toFixed(2),
      'orderForm.totalAmount': totalAmount.toFixed(2),
      'orderForm.estimatedSavings': estimatedSavings.toFixed(2)
    })
  },

  // 重新计算费用
  recalculateFees() {
    this.calculateFees()
    wx.showToast({
      title: '费用已更新',
      icon: 'success'
    })
  },

  // 计算预估电费
  calculateEstimatedBill() {
    const { capacity } = this.data.form;
    const { price } = this.data.product;

    if (!capacity || !price) {
      this.setData({
        estimatedBill: '0.00'
      });
      return;
    }

    // 假设每月运行720小时（30天×24小时）
    const monthlyHours = 720;
    // 负荷率按0.8计算
    const loadFactor = 0.8;
    // 月度用电量 = 容量 × 负荷率 × 运行时间
    const monthlyConsumption = capacity * loadFactor * monthlyHours;
    // 月度电费 = 用电量 × 电价
    const monthlyBill = (monthlyConsumption * price).toFixed(2);

    this.setData({
      estimatedBill: monthlyBill
    });
  },

  // 验证表单
  validateForm() {
    console.log('🔍 开始表单验证...');
    console.log('📋 验证规则:', this.data.rules);
    console.log('📝 表单数据:', this.data.orderForm);
    
    const errors = {};
    let isValid = true;
    
    Object.keys(this.data.rules).forEach(field => {
      const rules = this.data.rules[field];
      const value = this.data.orderForm[field];
      
      console.log(`🔍 验证字段 ${field}:`, { value, rules });
      
      for (const rule of rules) {
        if (rule.required && !value) {
          console.log(`❌ 字段 ${field} 验证失败: 必填项为空`);
          errors[field] = rule.message;
          isValid = false;
          break;
        }
        if (rule.type === 'number') {
          const num = parseFloat(value);
          if (isNaN(num) || (rule.min !== undefined && num < rule.min)) {
            console.log(`❌ 字段 ${field} 验证失败: 数值验证失败`, { num, min: rule.min });
            errors[field] = rule.message;
            isValid = false;
            break;
          }
        }
      }
      
      if (!errors[field]) {
        console.log(`✅ 字段 ${field} 验证通过`);
      }
    });
    
    console.log('📊 验证结果:', { isValid, errors });
    this.setData({ errors });
    return isValid;
  },

  // 提交订单
  async submitOrder() {
    console.log('🚀 submitOrder 方法被调用');
    console.log('📊 当前表单状态:', {
      agreedTerms: this.data.agreedTerms,
      orderForm: this.data.orderForm,
      product: this.data.product
    });

    console.log('🔍 开始表单验证...');
    if (!this.validateForm()) {
      console.log('❌ 表单验证失败');
      return;
    }
    console.log('✅ 表单验证通过');

    // 检查企业认证状态
    console.log('🔍 检查企业认证状态...');
    const authStatus = await this.checkAuthStatus();
    // 允许已认证或认证中的状态创建订单
    if (authStatus !== 'verified' && authStatus !== 'pending') {
      console.log('❌ 企业认证状态检查失败:', authStatus);
      this.showAuthRequiredDialog();
      return;
    }
    console.log('✅ 企业认证状态检查通过');

    if (!this.data.agreedTerms) {
      console.log('❌ 用户未同意服务条款');
      wx.showToast({
        title: '请先同意服务条款',
        icon: 'none'
      });
      return;
    }
    console.log('✅ 用户已同意服务条款');
    
    // 显示确认对话框
    const { orderForm, product } = this.data;
    const confirmMessage = `确认提交以下订单申请：\n\n产品：${product.name}\n服务期限：${orderForm.servicePeriod}个月\n预估费用：${orderForm.totalAmount}元\n\n提交后客户经理将联系您确认详情。`;
    
    console.log('📋 确认对话框内容:', confirmMessage);
    console.log('🔄 显示确认对话框');
    
    this.setData({
      showConfirmDialog: true,
      confirmMessage
    });
  },

  // 确认提交
  async confirmSubmit() {
    console.log('🚀 开始提交订单...');
    console.log('📊 当前页面状态:', {
      submitting: this.data.submitting,
      showConfirmDialog: this.data.showConfirmDialog,
      product: this.data.product,
      orderForm: this.data.orderForm,
      customerInfo: this.data.customerInfo
    });

    this.setData({ 
      showConfirmDialog: false,
      submitting: true 
    });
    
    try {
      // 构建提交数据
      const submitData = {
        productId: this.data.orderForm.productId,
        assignedEmployeeId: this.data.customerInfo.assignedEmployeeId || 1, // 默认分配员工ID为1
        servicePeriod: this.data.servicePeriod,
        serviceAddress: this.data.serviceAddress,
        remark: this.data.orderForm.remarks || '',
        specialRequirements: this.data.specialRequirements || ''
      };

      console.log('📦 准备提交的订单数据:', submitData);
      console.log('🔑 当前token状态:', wx.getStorageSync('token') ? '已设置' : '未设置');
      console.log('🌐 开始调用API...');

      const res = await apiService.post('/orders', submitData);
      
      console.log('✅ API调用成功，响应数据:', res);
      
      if (res.data) {
        console.log('🎉 订单创建成功，订单ID:', res.data.id);
        
        wx.showToast({
          title: '订单提交成功',
          icon: 'success'
        });
        
        // 跳转到订单详情页
        setTimeout(() => {
          console.log('🔄 准备跳转到订单详情页:', `/pages/orders/detail/detail?id=${res.data.id}`);
          wx.redirectTo({
            url: `/pages/orders/detail/detail?id=${res.data.id}`
          });
        }, 1500);
      } else {
        console.warn('⚠️ API响应中没有data字段:', res);
        throw new Error('订单创建失败：响应数据格式错误');
      }
    } catch (error) {
      console.error('❌ 提交订单失败:', error);
      console.error('❌ 错误详情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      wx.showToast({
        title: error.message || '提交订单失败，请重试',
        icon: 'none',
        duration: 3000
      });
    } finally {
      console.log('🏁 提交流程结束，重置提交状态');
      this.setData({ submitting: false });
    }
  },

  // 取消提交
  cancelSubmit() {
    console.log('❌ 用户取消提交订单');
    this.setData({
      showConfirmDialog: false
    });
    console.log('✅ 确认对话框已关闭');
  },

  onQuantityChange(event) {
    this.setData({
      quantity: event.detail
    })
    this.calculateAmount()
  },

  onServiceAddressChange(event) {
    this.setData({
      serviceAddress: event.detail
    });
  },

  onStartDateChange(event) {
    this.setData({
      serviceStartDate: event.detail
    });
  },

  onSpecialRequirementsChange(event) {
    this.setData({
      specialRequirements: event.detail
    });
  },

  // 预估用电量变化
  onEstimatedUsageChange(event) {
    const usage = event.detail;
    this.setData({
      'orderForm.estimatedUsage': usage
    });
    
    // 重新计算费用
    if (usage) {
      this.calculateAmount();
    }
  },

  calculateAmount() {
    const { product, orderForm, servicePeriod } = this.data;
    if (!product) return;

    const estimatedUsage = parseFloat(orderForm.estimatedUsage) || 0;
    const unitPrice = parseFloat(product.unitPrice || product.price) || 0;
    const period = parseInt(servicePeriod) || 12;

    if (estimatedUsage <= 0 || unitPrice <= 0) {
      this.setData({
        totalAmount: '0.00',
        actualAmount: '0.00',
        estimatedSavings: '0.00'
      });
      return;
    }

    // 计算月均费用
    const monthlyFee = estimatedUsage * unitPrice;
    
    // 计算总费用（服务期限内的总费用）
    const totalAmount = monthlyFee * period;
    
    // 根据服务期限计算折扣
    let discount = 1;
    if (period >= 36) {
      discount = 0.85; // 36个月以上85折
    } else if (period >= 24) {
      discount = 0.9;  // 24个月以上9折
    } else if (period >= 12) {
      discount = 0.95; // 12个月以上95折
    }

    const actualAmount = totalAmount * discount;
    const estimatedSavings = totalAmount - actualAmount;

    this.setData({
      totalAmount: totalAmount.toFixed(2),
      actualAmount: actualAmount.toFixed(2),
      estimatedSavings: estimatedSavings.toFixed(2),
      'orderForm.totalAmount': totalAmount.toFixed(2),
      'orderForm.monthlyFee': monthlyFee.toFixed(2),
      'orderForm.estimatedSavings': estimatedSavings.toFixed(2)
    });

    console.log('费用计算完成:', {
      estimatedUsage,
      unitPrice,
      period,
      monthlyFee,
      totalAmount,
      actualAmount,
      estimatedSavings
    });
  },

  async handleSubmit() {
    console.log('🚀 handleSubmit 方法被调用');
    console.log('📊 当前提交状态:', this.data.submitting);
    
    if (this.data.submitting) {
      console.log('⏸️ 正在提交中，忽略重复调用');
      return;
    }
    
    const { 
      product, serviceAddress, servicePeriod,
      specialRequirements, actualAmount,
      totalAmount, estimatedSavings
    } = this.data;

    console.log('📋 表单数据检查:', {
      product: product ? { id: product.id, name: product.name } : null,
      serviceAddress,
      servicePeriod,
      specialRequirements,
      actualAmount,
      totalAmount
    });

    if (!serviceAddress) {
      console.log('❌ 服务地址为空，显示错误提示');
      wx.showToast({
        title: '请输入服务地址',
        icon: 'none'
      });
      return;
    }

    console.log('✅ 表单验证通过，开始提交订单');
    
    // 调用submitOrder函数，统一处理订单提交
    await this.submitOrder();
  },

  // 检查企业认证状态
  async checkAuthStatus() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      const authStatus = userInfo.companyAuthStatus || userInfo.authStatus || 'unverified';
      
      console.log('当前企业认证状态:', authStatus);
      
      // 如果本地没有认证状态信息，尝试从服务器获取
      if (!authStatus || authStatus === 'unverified') {
        try {
          const response = await apiService.get('/user/auth/status');
          if (response && response.data) {
            const serverAuthStatus = response.data.companyAuthStatus || response.data.authStatus || 'unverified';
            console.log('从服务器获取的认证状态:', serverAuthStatus);
            
            // 更新本地存储
            userInfo.authStatus = serverAuthStatus;
            userInfo.companyAuthStatus = serverAuthStatus;
            wx.setStorageSync('userInfo', userInfo);
            
            return serverAuthStatus;
          }
        } catch (error) {
          console.error('获取服务器认证状态失败:', error);
        }
      }
      
      return authStatus;
    } catch (error) {
      console.error('检查认证状态失败:', error);
      return 'unverified';
    }
  },

  // 显示认证要求弹窗
  showAuthRequiredDialog() {
    wx.showModal({
      title: '企业认证提示',
      content: '企业未完成认证，无法创建订单。请先完成企业认证。',
      confirmText: '去认证',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 跳转到企业认证页面
          wx.navigateTo({
            url: '/pages/profile/auth/auth',
            fail: (error) => {
              console.error('跳转到认证页面失败:', error);
              wx.showToast({
                title: '跳转失败，请稍后重试',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  }
}) 