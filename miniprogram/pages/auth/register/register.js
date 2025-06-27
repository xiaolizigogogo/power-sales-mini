const { showToast, showLoading, hideLoading } = require('../../../utils/common')
const app = getApp()

Page({
  data: {
    currentStep: 1,
    totalSteps: 1,
    
    // 步骤1：基本信息
    formData: {
      name: '',
      phone: '',
      code: '',
      password: '',
      companyName: '',
      companyId: '',
    },
    
    // 步骤2：用电信息
    powerInfo: {
      capacity: '',
      monthlyUsage: '',
      currentPrice: '',
      industryType: '',
      usagePattern: ''
    },
    
    // 步骤3：认证信息
    authInfo: {
      businessLicense: '',
      idCardFront: '',
      idCardBack: ''
    },
    
    // 企业搜索
    companyList: [],
    showCompanyList: false,
    
    // 行业类型选项
    industryTypes: [
      { value: 'manufacturing', label: '制造业' },
      { value: 'retail', label: '零售业' },
      { value: 'service', label: '服务业' },
      { value: 'construction', label: '建筑业' },
      { value: 'technology', label: '科技行业' },
      { value: 'other', label: '其他' }
    ],
    industryIndex: -1,
    
    // 用电模式选项
    usagePatterns: [
      { value: 'continuous', label: '连续用电' },
      { value: 'peak', label: '高峰用电' },
      { value: 'valley', label: '低谷用电' },
      { value: 'mixed', label: '混合用电' }
    ],
    patternIndex: -1,
    
    countdown: 0,
    canGetCode: true,
    loading: false,

    // 补充：表单验证状态
    formErrors: {
      name: '',
      phone: '',
      code: '',
      password: '',
      companyName: ''
    },
    
    // 补充：步骤指示器配置
    stepTitles: ['基本信息', '用电信息', '认证信息'],
    
    // 补充：认证状态
    authStatus: {
      businessLicense: false,
      idCardFront: false,
      idCardBack: false
    }
  },

  onLoad(options) {
    // 如果已登录但未完善信息，直接进入注册流程
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.phone) {
      this.setData({
        'formData.name': userInfo.name || '',
        'formData.phone': userInfo.phone || ''
      })
    }
  },

  // 表单输入处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset
    const value = e.detail.value
    this.setData({
      [`formData.${field}`]: value
    })
    
    // 企业名称输入时搜索
    if (field === 'companyName' && value.length >= 2) {
      this.searchCompanies(value)
    } else if (field === 'companyName') {
      this.setData({ showCompanyList: false })
    }

    // 验证输入
    this.validateInput(e)
  },

  // 用电信息输入
  onPowerInfoChange(e) {
    const { field } = e.currentTarget.dataset
    const value = e.detail.value
    this.setData({
      [`powerInfo.${field}`]: value
    })
  },

  // 搜索企业
  async searchCompanies(keyword) {
    try {
      const response = await app.request({
        url: '/companies/search',
        method: 'GET',
        data: {
          keyword,
          limit: 10
        }
      })
      
      this.setData({
        companyList: response.data || [],
        showCompanyList: true
      })
    } catch (error) {
      console.error('搜索企业失败:', error)
    }
  },

  // 选择企业
  selectCompany(e) {
    const { index } = e.currentTarget.dataset
    const company = this.data.companyList[index]
    
    this.setData({
      'formData.companyName': company.company_name,
      'formData.companyId': company.id,
      showCompanyList: false,
      'powerInfo.industryType': company.industry_type || ''
    })
  },

  // 获取验证码
  async getVerifyCode() {
    const { phone } = this.data.formData
    
    if (!phone) {
      showToast('请输入手机号')
      return
    }
    
    const phoneReg = /^1[3-9]\d{9}$/
    if (!phoneReg.test(phone)) {
      showToast('请输入正确的手机号')
      return
    }

    try {
      showLoading('发送中...')
      
      await app.request({
        url: '/auth/send-code',
        method: 'POST',
        data: { 
          phone,
          type: 'register'
        }
      })
      
      showToast('验证码已发送')
      this.startCountdown()
      
    } catch (error) {
      showToast(error.message || '发送失败，请重试')
    } finally {
      hideLoading()
    }
  },

  // 开始倒计时
  startCountdown() {
    this.setData({ 
      countdown: 60, 
      canGetCode: false 
    })
    
    this.countdownTimer = setInterval(() => {
      const countdown = this.data.countdown - 1
      
      if (countdown <= 0) {
        clearInterval(this.countdownTimer)
        this.countdownTimer = null
        this.setData({ 
          countdown: 0, 
          canGetCode: true 
        })
      } else {
        this.setData({ countdown })
      }
    }, 1000)
  },

  // 行业类型选择
  onIndustryChange(e) {
    const index = e.detail.value
    this.setData({
      industryIndex: index,
      'powerInfo.industryType': this.data.industryTypes[index].value
    })
  },

  // 用电模式选择
  onPatternChange(e) {
    const index = e.detail.value
    this.setData({
      patternIndex: index,
      'powerInfo.usagePattern': this.data.usagePatterns[index].value
    })
  },

  // 上传图片
  async uploadImage(e) {
    const { type } = e.currentTarget.dataset
    
    try {
      const res = await new Promise((resolve, reject) => {
        wx.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: resolve,
          fail: reject
        })
      })

      const tempFilePath = res.tempFilePaths[0]
      
      showLoading('上传中...')
      
      const uploadRes = await new Promise((resolve, reject) => {
        wx.uploadFile({
          url: api.baseURL + '/upload/image',
          filePath: tempFilePath,
          name: 'file',
          header: {
            'Authorization': 'Bearer ' + wx.getStorageSync('token')
          },
          success: resolve,
          fail: reject
        })
      })

      const result = JSON.parse(uploadRes.data)
      
      this.setData({
        [`authInfo.${type}`]: result.url,
        [`authStatus.${type}`]: true
      })
      
      showToast('上传成功')
      
    } catch (error) {
      console.error('上传图片失败:', error)
      showToast('上传失败，请重试')
    } finally {
      hideLoading()
    }
  },

  // 删除已上传的图片
  deleteImage(e) {
    const { type } = e.currentTarget.dataset
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            [`authInfo.${type}`]: '',
            [`authStatus.${type}`]: false
          })
          showToast('删除成功')
        }
      }
    })
  },

  // 预览图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset
    wx.previewImage({
      urls: [url],
      current: url
    })
  },

  // 下一步
  nextStep() {
    const { currentStep } = this.data
    
    if (currentStep === 1) {
      if (!this.validateStep1()) return
    } else if (currentStep === 2) {
      if (!this.validateStep2()) return
    }
    
    this.setData({
      currentStep: currentStep + 1
    })
  },

  // 上一步
  prevStep() {
    const { currentStep } = this.data
    
    if (currentStep > 1) {
      this.setData({
        currentStep: currentStep - 1
      })
    }
  },

  // 验证步骤1
  validateStep1() {
    const { name, phone, password, companyName } = this.data.formData
    
    if (!name.trim()) {
      showToast('请输入姓名')
      return false
    }
    
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      showToast('请输入正确的手机号')
      return false
    }
    
    // 验证码验证已移除
    
    if (!password) {
      showToast('请设置密码')
      return false
    }
    
    if (password.length < 6 || password.length > 20) {
      showToast('密码长度应为6-20位')
      return false
    }
    
    if (!companyName.trim()) {
      showToast('请输入企业名称')
      return false
    }
    
    return true
  },

  // 验证步骤2
  validateStep2() {
    const { capacity, monthlyUsage, currentPrice, industryType } = this.data.powerInfo
    
    if (!capacity || isNaN(capacity) || capacity <= 0) {
      showToast('请输入正确的用电容量')
      return false
    }
    
    if (!monthlyUsage || isNaN(monthlyUsage) || monthlyUsage <= 0) {
      showToast('请输入正确的月用电量')
      return false
    }
    
    if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0) {
      showToast('请输入正确的当前电价')
      return false
    }
    
    if (!industryType) {
      showToast('请选择行业类型')
      return false
    }
    
    return true
  },

  // 验证步骤3
  validateStep3() {
    const { businessLicense, idCardFront, idCardBack } = this.data.authInfo
    
    if (!businessLicense) {
      showToast('请上传营业执照')
      return false
    }
    
    if (!idCardFront) {
      showToast('请上传身份证正面')
      return false
    }
    
    if (!idCardBack) {
      showToast('请上传身份证背面')
      return false
    }
    
    return true
  },

  // 清除表单错误
  clearFormError(field) {
    this.setData({
      [`formErrors.${field}`]: ''
    })
  },

  // 设置表单错误
  setFormError(field, message) {
    this.setData({
      [`formErrors.${field}`]: message
    })
  },

  // 实时验证输入
  validateInput(e) {
    const { field } = e.currentTarget.dataset
    const value = e.detail.value
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          this.setFormError('name', '请输入姓名')
        } else if (value.length < 2) {
          this.setFormError('name', '姓名至少2个字符')
        } else {
          this.clearFormError('name')
        }
        break
        
      case 'phone':
        const phoneReg = /^1[3-9]\d{9}$/
        if (!value) {
          this.setFormError('phone', '请输入手机号')
        } else if (!phoneReg.test(value)) {
          this.setFormError('phone', '手机号格式不正确')
        } else {
          this.clearFormError('phone')
        }
        break
        
      // case 'code':
      //   if (!value) {
      //     this.setFormError('code', '请输入验证码')
      //   } else if (value.length !== 6) {
      //     this.setFormError('code', '验证码为6位数字')
      //   } else {
      //     this.clearFormError('code')
      //   }
      //   break
        
      case 'password':
        if (!value) {
          this.setFormError('password', '请设置密码')
        } else if (value.length < 6) {
          this.setFormError('password', '密码不能少于6位')
        } else if (value.length > 20) {
          this.setFormError('password', '密码不能超过20位')
        } else {
          this.clearFormError('password')
        }
        break
        
      case 'companyName':
        if (!value.trim()) {
          this.setFormError('companyName', '请输入企业名称')
        } else {
          this.clearFormError('companyName')
        }
        break
    }
  },

  // 检查所有步骤完成状态
  checkAllStepsComplete() {
    const step1Valid = this.validateStep1()
    const step2Valid = this.validateStep2()
    const step3Valid = this.validateStep3()
    
    return step1Valid && step2Valid && step3Valid
  },

  // 重置表单
  resetForm() {
    this.setData({
      currentStep: 1,
      formData: {
        name: '',
        phone: '',
        code: '',
        password: '',
        companyName: '',
        companyId: '',
      },
      powerInfo: {
        capacity: '',
        monthlyUsage: '',
        currentPrice: '',
        industryType: '',
        usagePattern: ''
      },
      authInfo: {
        businessLicense: '',
        idCardFront: '',
        idCardBack: ''
      },
      formErrors: {
        name: '',
        phone: '',
        code: '',
        password: '',
        companyName: ''
      },
      authStatus: {
        businessLicense: false,
        idCardFront: false,
        idCardBack: false
      },
      industryIndex: -1,
      patternIndex: -1,
      countdown: 0,
      canGetCode: true,
      loading: false
    })
  },

  // 提交注册
  async submitRegister() {
    if (!this.validateStep1()) {
      return
    }

    try {
      this.setData({ loading: true })
      showLoading('提交中...')
      
      // 构造符合后端接口的数据结构
      const requestData = {
        phone: this.data.formData.phone,
        password: this.data.formData.password,
        name: this.data.formData.name,
        companyName: this.data.formData.companyName,
        companyAddress: '', // 可以从其他地方获取
        contactPerson: this.data.formData.name,
        contactPhone: this.data.formData.phone,
        industry: this.data.powerInfo.industryType,
        province: '', // 可以从地址选择器获取
        city: '',     // 可以从地址选择器获取
        district: ''  // 可以从地址选择器获取
      }
      
      const response = await app.request({
        url: '/auth/register',
        method: 'POST',
        data: requestData
      })
      
      showToast('注册成功，请等待审核')
      
      // 跳转到登录页面
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/auth/login/login'
        })
      }, 1500)
      
    } catch (error) {
      console.error('注册失败:', error)
      showToast(error.message || '注册失败，请重试')
    } finally {
      this.setData({ loading: false })
      hideLoading()
    }
  },

  // 返回登录
  goToLogin() {
    wx.navigateBack()
  },

  // 页面卸载清理
  onUnload() {
    // 清理定时器
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
    }
  }
}) 