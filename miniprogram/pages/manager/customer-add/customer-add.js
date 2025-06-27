const app = getApp()

Page({
  data: {
    form: {
      name: '',
      companyName: '',
      phone: '',
      email: '',
      companyAddress: '',
      businessLicense: '',
      industry: '',
      voltageLevel: '',
      annualConsumption: '',
      contactPerson: '',
      contactPhone: '',
      province: '',
      city: '',
      district: '',
      remark: ''
    },
    industryOptions: [
      { value: 'manufacturing', label: '制造业' },
      { value: 'construction', label: '建筑业' },
      { value: 'retail', label: '零售业' },
      { value: 'hospitality', label: '餐饮住宿业' },
      { value: 'education', label: '教育业' },
      { value: 'healthcare', label: '医疗卫生业' },
      { value: 'transportation', label: '交通运输业' },
      { value: 'finance', label: '金融业' },
      { value: 'technology', label: '科技服务业' },
      { value: 'agriculture', label: '农林牧渔业' },
      { value: 'other', label: '其他' }
    ],
    voltageLevelOptions: [
      { value: '220V', label: '220V' },
      { value: '380V', label: '380V' },
      { value: '10kV', label: '10kV' },
      { value: '35kV', label: '35kV' },
      { value: '110kV', label: '110kV' },
      { value: '220kV', label: '220kV' },
      { value: '500kV', label: '500kV' }
    ],
    industryIndex: -1,
    voltageLevelIndex: -1,
    submitting: false
  },

  onLoad(options) {
    console.log('新增客户页面加载')
    wx.setNavigationBarTitle({
      title: '新增客户'
    })
  },

  // 表单输入处理
  onNameInput(e) {
    this.setData({
      'form.name': e.detail.value
    })
  },

  onCompanyNameInput(e) {
    this.setData({
      'form.companyName': e.detail.value
    })
  },

  onPhoneInput(e) {
    this.setData({
      'form.phone': e.detail.value
    })
  },

  onEmailInput(e) {
    this.setData({
      'form.email': e.detail.value
    })
  },

  onCompanyAddressInput(e) {
    this.setData({
      'form.companyAddress': e.detail.value
    })
  },

  onBusinessLicenseInput(e) {
    this.setData({
      'form.businessLicense': e.detail.value
    })
  },

  onAnnualConsumptionInput(e) {
    this.setData({
      'form.annualConsumption': e.detail.value
    })
  },

  onContactPersonInput(e) {
    this.setData({
      'form.contactPerson': e.detail.value
    })
  },

  onContactPhoneInput(e) {
    this.setData({
      'form.contactPhone': e.detail.value
    })
  },

  onProvinceInput(e) {
    this.setData({
      'form.province': e.detail.value
    })
  },

  onCityInput(e) {
    this.setData({
      'form.city': e.detail.value
    })
  },

  onDistrictInput(e) {
    this.setData({
      'form.district': e.detail.value
    })
  },

  onRemarkInput(e) {
    this.setData({
      'form.remark': e.detail.value
    })
  },

  // 选择器处理
  onIndustryChange(e) {
    const index = e.detail.value
    this.setData({
      industryIndex: index,
      'form.industry': this.data.industryOptions[index].value
    })
  },

  onVoltageLevelChange(e) {
    const index = e.detail.value
    this.setData({
      voltageLevelIndex: index,
      'form.voltageLevel': this.data.voltageLevelOptions[index].value
    })
  },

  // 表单验证
  validateForm() {
    const { form } = this.data
    
    if (!form.name.trim()) {
      wx.showToast({
        title: '请输入客户姓名',
        icon: 'none'
      })
      return false
    }

    if (!form.companyName.trim()) {
      wx.showToast({
        title: '请输入企业名称',
        icon: 'none'
      })
      return false
    }

    if (!form.phone.trim()) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      })
      return false
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(form.phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return false
    }

    if (!form.email.trim()) {
      wx.showToast({
        title: '请输入邮箱地址',
        icon: 'none'
      })
      return false
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      wx.showToast({
        title: '请输入正确的邮箱地址',
        icon: 'none'
      })
      return false
    }

    return true
  },

  // 提交表单
  async onSubmit(e) {
    if (!this.validateForm()) {
      return
    }

    this.setData({ submitting: true })

    try {
      console.log('提交客户信息:', this.data.form)

      // 准备提交数据
      const submitData = {
        name: this.data.form.name.trim(),
        companyName: this.data.form.companyName.trim(),
        phone: this.data.form.phone.trim(),
        email: this.data.form.email.trim(),
        companyAddress: this.data.form.companyAddress.trim(),
        businessLicense: this.data.form.businessLicense.trim(),
        industry: this.data.form.industry,
        voltageLevel: this.data.form.voltageLevel,
        annualConsumption: this.data.form.annualConsumption ? parseFloat(this.data.form.annualConsumption) : null,
        contactPerson: this.data.form.contactPerson.trim(),
        contactPhone: this.data.form.contactPhone.trim(),
        address: {
          province: this.data.form.province.trim(),
          city: this.data.form.city.trim(),
          district: this.data.form.district.trim()
        },
        remark: this.data.form.remark.trim(),
        status: 'pending', // 新增客户默认为待审核状态
        source: 'manager_add' // 标记为管理员添加
      }

      // 调用API提交数据
      const result = await app.request({
        url: '/customers',
        method: 'POST',
        data: submitData
      })

      console.log('客户添加成功:', result)

      wx.showToast({
        title: '客户添加成功',
        icon: 'success',
        duration: 2000
      })

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 2000)

    } catch (error) {
      console.error('添加客户失败:', error)
      
      let errorMessage = '添加失败，请重试'
      if (error.message) {
        if (error.message.includes('phone')) {
          errorMessage = '该手机号已存在'
        } else if (error.message.includes('email')) {
          errorMessage = '该邮箱已存在'
        } else if (error.message.includes('network')) {
          errorMessage = '网络连接失败'
        } else {
          errorMessage = error.message
        }
      }

      wx.showModal({
        title: '添加失败',
        content: errorMessage,
        showCancel: false,
        confirmText: '确定'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 重置表单
  onReset() {
    wx.showModal({
      title: '确认重置',
      content: '确定要清空所有已填写的内容吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            form: {
              name: '',
              companyName: '',
              phone: '',
              email: '',
              companyAddress: '',
              businessLicense: '',
              industry: '',
              voltageLevel: '',
              annualConsumption: '',
              contactPerson: '',
              contactPhone: '',
              province: '',
              city: '',
              district: '',
              remark: ''
            },
            industryIndex: -1,
            voltageLevelIndex: -1
          })
          
          wx.showToast({
            title: '表单已重置',
            icon: 'success'
          })
        }
      }
    })
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '电力销售客户管理',
      path: '/pages/manager/customer-add/customer-add'
    }
  }
}) 