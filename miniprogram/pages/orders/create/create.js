const app = getApp()
const { checkRoleAccess } = require('../../../utils/auth');
const { request } = require('../../../utils/api');

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
    
    // 服务期限选项
    periodOptions: [
      { text: '1年', value: 12 },
      { text: '2年', value: 24 },
      { text: '3年', value: 36 },
      { text: '5年', value: 60 }
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
    form: {
      address: '',
      contactName: '',
      contactPhone: '',
      capacity: '',
      voltage: '',
      type: '',
      period: '',
      remark: ''
    },
    estimatedBill: '0.00',
    // 选择器相关
    showVoltagePopup: false,
    showTypePopup: false,
    showPeriodPopup: false,
    typeOptions: ['工业用电', '商业用电', '居民用电', '农业用电']
  },

  onLoad(options) {
    // 检查角色权限
    if (!checkRoleAccess('orders')) {
      return;
    }

    const { productId } = options;
    if (productId) {
      this.loadProductInfo(productId);
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
      const res = await request('GET', `/api/products/${productId}`);
      this.setData({
        product: res.data,
        'orderForm.productName': res.data.name
      });
      
      // 预填充用电量（如果有）
      if (res.data.defaultUsage) {
        this.setData({
          'orderForm.estimatedUsage': res.data.defaultUsage
        })
        this.calculateFees()
      }
    } catch (error) {
      console.error('加载产品信息失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      // 使用模拟数据
      this.setData({
        product: {
          id: productId,
          name: '工商业电力优化方案',
          description: '专为中小企业设计的节能方案',
          price: 0.65,
          image: '/assets/images/product1.jpg',
          isHot: true
        },
        'orderForm.productName': '工商业电力优化方案'
      })
    } finally {
      wx.hideLoading();
    }
  },

  // 加载客户信息
  async loadCustomerInfo() {
    try {
      const res = await app.request({
        url: '/customer/profile'
      })
      
      if (res.data) {
        this.setData({
          customerInfo: res.data
        })
      }
    } catch (error) {
      console.error('加载客户信息失败:', error)
      // 使用默认客户信息
      this.setData({
        customerInfo: {
          companyName: '示例企业有限公司',
          contactPerson: '张经理',
          contactPhone: '138****8888',
          serviceAddress: '北京市朝阳区示例大厦'
        }
      })
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
    this.setData({
      'orderForm.servicePeriod': e.detail
    })
    this.calculateFees()
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
    })
  },

  // 关闭日期选择器
  closeDatePicker() {
    this.setData({
      showDatePicker: false
    })
  },

  // 确认日期选择
  onDateConfirm(e) {
    const date = new Date(e.detail)
    this.setData({
      'orderForm.startDate': this.formatDate(date),
      showDatePicker: false
    })
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
    this.setData({
      'form.period': e.detail.value,
      showPeriodPopup: false
    });
  },

  // 协议确认
  onAgreementChange(e) {
    this.setData({
      agreedTerms: e.detail
    });
  },

  // 查看协议
  viewAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/agreement'
    });
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
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
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
    const errors = {}
    let isValid = true
    
    Object.keys(this.data.rules).forEach(field => {
      const rules = this.data.rules[field]
      const value = this.data.orderForm[field]
      
      for (const rule of rules) {
        if (rule.required && !value) {
          errors[field] = rule.message
          isValid = false
          break
        }
        if (rule.type === 'number') {
          const num = parseFloat(value)
          if (isNaN(num) || (rule.min !== undefined && num < rule.min)) {
            errors[field] = rule.message
            isValid = false
            break
          }
        }
      }
    })
    
    this.setData({ errors })
    return isValid
  },

  // 提交订单
  async submitOrder() {
    if (!this.validateForm()) {
      return
    }

    if (!this.data.agreedTerms) {
      wx.showToast({
        title: '请先同意服务条款',
        icon: 'none'
      })
      return
    }
    
    // 显示确认对话框
    const { orderForm, product } = this.data
    const confirmMessage = `确认提交以下订单申请：\n\n产品：${product.name}\n服务期限：${orderForm.servicePeriod}个月\n预估费用：${orderForm.totalAmount}元\n\n提交后客户经理将联系您确认详情。`
    
    this.setData({
      showConfirmDialog: true,
      confirmMessage
    })
  },

  // 确认提交
  async confirmSubmit() {
    this.setData({ 
      showConfirmDialog: false,
      submitting: true 
    })
    
    try {
      const orderData = {
        ...this.data.orderForm,
        customerInfo: this.data.customerInfo,
        status: 'pending_confirmation' // 待确认状态
      }

      const res = await app.request({
        url: '/orders',
        method: 'POST',
        data: orderData
      })
      
      if (res.data) {
        wx.showToast({
          title: '订单提交成功',
          icon: 'success'
        })
        
        // 跳转到订单详情页
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/orders/detail/detail?id=${res.data.id}`
          })
        }, 1500)
      }
    } catch (error) {
      console.error('提交订单失败:', error)
      wx.showToast({
        title: '提交订单失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 取消提交
  cancelSubmit() {
    this.setData({
      showConfirmDialog: false
    })
  }
}) 