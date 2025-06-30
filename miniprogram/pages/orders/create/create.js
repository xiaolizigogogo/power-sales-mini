const app = getApp()

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
      totalAmount: 0, // 预估总金额
      monthlyFee: 0 // 月均费用
    },
    
    // 产品信息
    product: null,
    
    // 服务期限选项
    periodOptions: [
      { text: '1年', value: 12 },
      { text: '2年', value: 24 },
      { text: '3年', value: 36 }
    ],
    
    // 日期选择
    minDate: new Date().getTime(),
    maxDate: new Date().setMonth(new Date().getMonth() + 3),
    currentDate: new Date().getTime(),
    showDatePicker: false,
    
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
    errors: {}
  },

  onLoad(options) {
    const { productId } = options
    
    if (!productId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }
    
    this.setData({
      'orderForm.productId': productId
    })
    
    this.loadProductInfo(productId)
  },

  // 加载产品信息
  async loadProductInfo(productId) {
    try {
      const res = await app.request({
        url: `/products/${productId}`
      })
      
      if (res.data) {
        this.setData({
          product: res.data,
          'orderForm.productName': res.data.name
        })
        
        // 预填充用电量（如果有）
        if (res.data.defaultUsage) {
          this.setData({
            'orderForm.estimatedUsage': res.data.defaultUsage
          })
          this.calculateFees()
        }
      }
    } catch (error) {
      console.error('加载产品信息失败:', error)
      wx.showToast({
        title: '加载产品信息失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 表单输入处理
  onInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`orderForm.${field}`]: value
    })
    
    // 如果修改了用电量，重新计算费用
    if (field === 'estimatedUsage') {
      this.calculateFees()
    }
  },

  // 选择服务期限
  onPeriodChange(e) {
    this.setData({
      'orderForm.servicePeriod': e.detail
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

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  },

  // 计算费用
  calculateFees() {
    const { estimatedUsage, servicePeriod } = this.data.orderForm
    const { price = 0 } = this.data.product || {}
    
    if (!estimatedUsage || !price) return
    
    const monthlyFee = estimatedUsage * price
    const totalAmount = monthlyFee * servicePeriod
    
    this.setData({
      'orderForm.monthlyFee': monthlyFee.toFixed(2),
      'orderForm.totalAmount': totalAmount.toFixed(2)
    })
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
    
    this.setData({ submitting: true })
    
    try {
      const res = await app.request({
        url: '/orders',
        method: 'POST',
        data: this.data.orderForm
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
        title: '提交订单失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  }
}) 