const app = getApp()
const auth = require('../../../utils/auth')
const util = require('../../../utils/common')

Page({
  data: {
    loading: false,
    submitting: false,
    
    // 客户基础信息
    customerForm: {
      name: '',
      phone: '',
      email: '',
      position: '',
      wechat: '',
      companyName: '',
      companyCode: '',
      companyAddress: '',
      industry: '',
      scale: '',
      registeredCapital: '',
      establishDate: '',
      businessScope: '',
      contactPerson: '',
      contactPhone: '',
      province: '',
      city: '',
      district: '',
      detailAddress: '',
      remark: ''
    },
    
    // 客户标签
    customerTags: [],
    availableTags: [
      { id: 1, name: '潜在客户', color: '#909399', selected: true },
      { id: 2, name: '高价值客户', color: '#f56c6c', selected: false },
      { id: 3, name: '重点跟进', color: '#e6a23c', selected: false },
      { id: 4, name: '意向强烈', color: '#67c23a', selected: false },
      { id: 5, name: '决策者', color: '#409eff', selected: false },
      { id: 6, name: '预算充足', color: '#722ed1', selected: false }
    ],
    
    // 行业选择
    industryOptions: [
      { value: 'manufacturing', label: '制造业' },
      { value: 'commerce', label: '商贸业' },
      { value: 'service', label: '服务业' },
      { value: 'construction', label: '建筑业' },
      { value: 'finance', label: '金融业' },
      { value: 'education', label: '教育业' },
      { value: 'healthcare', label: '医疗健康' },
      { value: 'technology', label: '科技业' },
      { value: 'agriculture', label: '农业' },
      { value: 'other', label: '其他' }
    ],
    
    // 企业规模选择
    scaleOptions: [
      { value: 'micro', label: '微型企业（<10人）' },
      { value: 'small', label: '小型企业（10-49人）' },
      { value: 'medium', label: '中型企业（50-299人）' },
      { value: 'large', label: '大型企业（≥300人）' }
    ],
    
    // 企业名录匹配
    showCompanyMatcher: false,
    companySearchKeyword: '',
    matchedCompanies: [],
    searchingCompanies: false,
    
    // 地区选择
    showRegionPicker: false,
    regionColumns: [[], [], []],
    regionIndex: [0, 0, 0],
    
    // 日期选择
    showDatePicker: false,
    minDate: new Date('1900-01-01').getTime(),
    maxDate: new Date().getTime(),
    
    // 权限控制
    canCreate: false
  },

  onLoad(options) {
    console.log('客户添加页面加载')
    
    // 检查权限
    if (!this.checkPermissions()) {
      return
    }
    
    // 初始化数据
    this.initData()
    
    // 如果有传入的企业信息，预填充
    if (options.companyName) {
      this.setData({
        'customerForm.companyName': decodeURIComponent(options.companyName)
      })
    }
  },

  // 检查权限
  checkPermissions() {
    if (!auth.checkLogin()) {
      return false
    }
    
    if (!auth.hasPermission(auth.PERMISSIONS.CUSTOMER_CREATE)) {
      wx.showModal({
        title: '权限不足',
        content: '您没有权限添加客户',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
      return false
    }
    
    this.setData({
      canCreate: true
    })
    
    return true
  },

  // 初始化数据
  initData() {
    // 设置默认标签
    const defaultTags = this.data.availableTags.filter(tag => tag.selected)
    this.setData({
      customerTags: defaultTags.map(tag => tag.id)
    })
    
    // 加载地区数据
    this.loadRegionData()
  },

  // 表单输入处理
  onFormInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`customerForm.${field}`]: value
    })
    
    // 如果是企业名称输入，触发企业匹配
    if (field === 'companyName' && value.length >= 2) {
      this.searchCompanies(value)
    }
  },

  // 行业选择
  onIndustryChange(e) {
    const industry = this.data.industryOptions[e.detail.value]
    this.setData({
      'customerForm.industry': industry.value
    })
  },

  // 企业规模选择
  onScaleChange(e) {
    const scale = this.data.scaleOptions[e.detail.value]
    this.setData({
      'customerForm.scale': scale.value
    })
  },

  // 客户标签切换
  onTagToggle(e) {
    const { id } = e.currentTarget.dataset
    let { customerTags } = this.data
    
    if (customerTags.includes(id)) {
      customerTags = customerTags.filter(tagId => tagId !== id)
    } else {
      customerTags.push(id)
    }
    
    // 更新标签状态
    const availableTags = this.data.availableTags.map(tag => ({
      ...tag,
      selected: customerTags.includes(tag.id)
    }))
    
    this.setData({
      customerTags,
      availableTags
    })
  },

  // 搜索企业名录
  async searchCompanies(keyword) {
    if (this.data.searchingCompanies) return
    
    this.setData({
      searchingCompanies: true,
      companySearchKeyword: keyword
    })
    
    try {
      const result = await app.request({
        url: '/companies/search',
        method: 'GET',
        data: { keyword, limit: 10 }
      })
      
      console.log('企业搜索结果:', result)
      
      this.setData({
        matchedCompanies: result.data || [],
        showCompanyMatcher: (result.data || []).length > 0
      })
      
    } catch (error) {
      console.error('搜索企业失败:', error)
      // 使用模拟数据
      this.loadMockCompanies(keyword)
    } finally {
      this.setData({
        searchingCompanies: false
      })
    }
  },

  // 加载模拟企业数据
  loadMockCompanies(keyword) {
    const mockCompanies = [
      {
        id: 1,
        name: '北京科技有限公司',
        code: '91110000MA01234567',
        address: '北京市朝阳区xxx路xxx号',
        industry: 'technology',
        industryText: '科技业',
        scale: 'medium',
        registeredCapital: '1000万元',
        establishDate: '2020-01-15',
        businessScope: '技术开发、技术咨询、技术服务'
      },
      {
        id: 2,
        name: '上海制造有限公司',
        code: '91310000MA01234568',
        address: '上海市浦东新区xxx路xxx号',
        industry: 'manufacturing',
        industryText: '制造业',
        scale: 'large',
        registeredCapital: '5000万元',
        establishDate: '2018-06-20',
        businessScope: '机械设备制造、销售'
      }
    ]
    
    const filtered = mockCompanies.filter(company => 
      company.name.includes(keyword)
    )
    
    this.setData({
      matchedCompanies: filtered,
      showCompanyMatcher: filtered.length > 0
    })
  },

  // 选择企业
  onCompanySelect(e) {
    const { company } = e.currentTarget.dataset
    
    // 填充企业信息
    this.setData({
      'customerForm.companyName': company.name,
      'customerForm.companyCode': company.code,
      'customerForm.companyAddress': company.address,
      'customerForm.industry': company.industry,
      'customerForm.scale': company.scale,
      'customerForm.registeredCapital': company.registeredCapital,
      'customerForm.establishDate': company.establishDate,
      'customerForm.businessScope': company.businessScope,
      showCompanyMatcher: false
    })
    
    wx.showToast({
      title: '企业信息已填充',
      icon: 'success'
    })
  },

  // 手动录入企业
  onManualInput() {
    this.setData({
      showCompanyMatcher: false
    })
    
    wx.showToast({
      title: '请手动填写企业信息',
      icon: 'none'
    })
  },

  // 地区选择
  onRegionTap() {
    this.setData({
      showRegionPicker: true
    })
  },

  onRegionChange(e) {
    const { value } = e.detail
    this.setData({
      regionIndex: value
    })
  },

  onRegionConfirm(e) {
    const { value } = e.detail
    const { regionColumns } = this.data
    
    this.setData({
      'customerForm.province': regionColumns[0][value[0]]?.name || '',
      'customerForm.city': regionColumns[1][value[1]]?.name || '',
      'customerForm.district': regionColumns[2][value[2]]?.name || '',
      showRegionPicker: false
    })
  },

  onRegionCancel() {
    this.setData({
      showRegionPicker: false
    })
  },

  // 加载地区数据
  loadRegionData() {
    // 模拟地区数据
    const mockRegions = {
      provinces: [
        { name: '北京市', code: '110000' },
        { name: '上海市', code: '310000' },
        { name: '广东省', code: '440000' },
        { name: '浙江省', code: '330000' }
      ],
      cities: {
        '110000': [{ name: '北京市', code: '110100' }],
        '310000': [{ name: '上海市', code: '310100' }],
        '440000': [
          { name: '广州市', code: '440100' },
          { name: '深圳市', code: '440300' }
        ],
        '330000': [
          { name: '杭州市', code: '330100' },
          { name: '宁波市', code: '330200' }
        ]
      },
      districts: {
        '110100': [
          { name: '东城区', code: '110101' },
          { name: '西城区', code: '110102' },
          { name: '朝阳区', code: '110105' }
        ],
        '440100': [
          { name: '越秀区', code: '440103' },
          { name: '海珠区', code: '440105' }
        ]
      }
    }
    
    this.setData({
      regionColumns: [
        mockRegions.provinces,
        mockRegions.cities['110000'] || [],
        mockRegions.districts['110100'] || []
      ]
    })
  },

  // 成立日期选择
  onEstablishDateTap() {
    this.setData({
      showDatePicker: true
    })
  },

  onDateConfirm(e) {
    const date = new Date(e.detail)
    const formattedDate = util.formatDate(date, 'YYYY-MM-DD')
    
    this.setData({
      'customerForm.establishDate': formattedDate,
      showDatePicker: false
    })
  },

  onDateCancel() {
    this.setData({
      showDatePicker: false
    })
  },

  // 表单验证
  validateForm() {
    const { customerForm } = this.data
    
    if (!customerForm.name.trim()) {
      wx.showToast({
        title: '请输入客户姓名',
        icon: 'none'
      })
      return false
    }
    
    if (!customerForm.phone.trim()) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      })
      return false
    }
    
    if (!/^1[3-9]\d{9}$/.test(customerForm.phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return false
    }
    
    if (!customerForm.companyName.trim()) {
      wx.showToast({
        title: '请输入企业名称',
        icon: 'none'
      })
      return false
    }
    
    if (!customerForm.industry) {
      wx.showToast({
        title: '请选择行业类型',
        icon: 'none'
      })
      return false
    }
    
    return true
  },

  // 提交表单
  async onSubmit() {
    if (!this.validateForm()) {
      return
    }
    
    this.setData({ submitting: true })
    
    try {
      const { customerForm, customerTags } = this.data
      
      // 获取标签名称
      const tagNames = this.data.availableTags
        .filter(tag => customerTags.includes(tag.id))
        .map(tag => tag.name)
      
      const submitData = {
        ...customerForm,
        tags: tagNames,
        source: 'manual', // 手动录入
        managerId: auth.getUserInfo()?.id
      }
      
      console.log('提交客户数据:', submitData)
      
      const result = await app.request({
        url: '/manager/customers',
        method: 'POST',
        data: submitData
      })
      
      console.log('客户创建成功:', result)
      
      wx.showToast({
        title: '客户添加成功',
        icon: 'success'
      })
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        // 跳转到客户详情页面
        wx.redirectTo({
          url: `/pages/manager/customers/detail/detail?id=${result.data.id}`
        })
      }, 1500)
      
    } catch (error) {
      console.error('添加客户失败:', error)
      wx.showToast({
        title: error.message || '添加失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 重置表单
  onReset() {
    wx.showModal({
      title: '确认重置',
      content: '确定要清空所有已填写的信息吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            customerForm: {
              name: '',
              phone: '',
              email: '',
              position: '',
              wechat: '',
              companyName: '',
              companyCode: '',
              companyAddress: '',
              industry: '',
              scale: '',
              registeredCapital: '',
              establishDate: '',
              businessScope: '',
              contactPerson: '',
              contactPhone: '',
              province: '',
              city: '',
              district: '',
              detailAddress: '',
              remark: ''
            }
          })
          
          this.initData()
          
          wx.showToast({
            title: '表单已重置',
            icon: 'success'
          })
        }
      }
    })
  },

  // 返回上一页
  onBack() {
    wx.navigateBack()
  }
}) 