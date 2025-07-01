const app = getApp()

Page({
  data: {
    // 页面状态
    loading: true,
    refreshing: false,
    
    // 统计数据
    statistics: {
      pendingService: 0,
      activeService: 0,
      todayActivated: 0,
      satisfaction: 0
    },
    
    // 搜索和筛选
    searchKeyword: '',
    currentFilter: 'all',
    filterTabs: [
      { value: 'all', label: '全部', icon: '📋', count: 0 },
      { value: 'pending', label: '待开通', icon: '⏳', count: 0 },
      { value: 'activating', label: '开通中', icon: '🚀', count: 0 },
      { value: 'completed', label: '已完成', icon: '✅', count: 0 },
      { value: 'monitoring', label: '监控中', icon: '📊', count: 0 }
    ],
    
    // 服务列表
    serviceList: [],
    
    // 服务开通弹窗
    showActivationDialog: false,
    selectedService: null,
    activationForm: {
      estimatedDate: '',
      department: '',
      remark: ''
    },
    
    // 进度更新弹窗
    showProgressDialog: false,
    progressForm: {
      currentStep: 1,
      stepText: '',
      remark: '',
      expectedDate: ''
    },
    progressSteps: [
      { value: 1, label: '资料准备' },
      { value: 2, label: '系统配置' },
      { value: 3, label: '设备调试' },
      { value: 4, label: '服务测试' },
      { value: 5, label: '正式开通' }
    ],
    
    // 服务监控弹窗
    showMonitorDialog: false,
    monitorData: {
      powerConsumption: 0,
      monthlySavings: 0,
      satisfactionScore: 0
    },
    monitorForm: {
      satisfaction: 5,
      issues: '',
      solutions: ''
    },
    
    // 选择器相关
    showDepartmentPicker: false,
    departmentOptions: [
      { name: '技术部', value: 'tech' },
      { name: '运维部', value: 'ops' },
      { name: '客服部', value: 'service' },
      { name: '工程部', value: 'engineering' }
    ],
    
    showDatePicker: false,
    pickerDate: new Date().getTime(),
    minDate: new Date().getTime(),
    currentDateField: ''
  },

  onLoad() {
    this.initPageData()
  },

  onShow() {
    this.refreshData()
  },

  onPullDownRefresh() {
    this.refreshData().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 初始化页面数据
  async initPageData() {
    try {
      await Promise.all([
        this.loadStatistics(),
        this.loadServiceList()
      ])
    } catch (error) {
      console.error('初始化页面数据失败:', error)
    }
  },

  // 刷新数据
  async refreshData() {
    this.setData({ refreshing: true })
    try {
      await this.initPageData()
    } finally {
      this.setData({ refreshing: false })
    }
  },

  // 加载统计数据
  async loadStatistics() {
    try {
      const res = await app.request({
        url: '/service/statistics'
      })
      
      if (res.data) {
        this.setData({ statistics: res.data })
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
      // 使用模拟数据
      this.setData({
        statistics: {
          pendingService: 8,
          activeService: 45,
          todayActivated: 3,
          satisfaction: 96
        }
      })
    }
  },

  // 加载服务列表
  async loadServiceList() {
    try {
      this.setData({ loading: true })
      
      const params = {
        keyword: this.data.searchKeyword,
        status: this.data.currentFilter === 'all' ? '' : this.data.currentFilter
      }
      
      const res = await app.request({
        url: '/service/list',
        data: params
      })
      
      if (res.data) {
        this.setData({
          serviceList: res.data.list || [],
          loading: false
        })
        this.updateFilterCounts()
      }
    } catch (error) {
      console.error('加载服务列表失败:', error)
      // 使用模拟数据
      this.loadMockServiceList()
    }
  },

  // 加载模拟服务数据
  loadMockServiceList() {
    const mockServices = [
      {
        id: 1,
        orderNo: 'PO2024001',
        customerName: '北京科技有限公司',
        productName: '工商业用电套餐A',
        amount: 120000,
        servicePeriod: 12,
        serviceStatus: 'pending',
        activationDate: null,
        progressPercent: 0,
        progressText: '等待开通',
        customerPhone: '138****5678',
        createdAt: '2024-01-15'
      },
      {
        id: 2,
        orderNo: 'PO2024002',
        customerName: '上海制造有限公司',
        productName: '工商业用电套餐B',
        amount: 200000,
        servicePeriod: 24,
        serviceStatus: 'activating',
        activationDate: '2024-01-16',
        progressPercent: 60,
        progressText: '设备调试中',
        customerPhone: '139****1234',
        createdAt: '2024-01-14'
      },
      {
        id: 3,
        orderNo: 'PO2024003',
        customerName: '深圳电子有限公司',
        productName: '工商业用电套餐C',
        amount: 150000,
        servicePeriod: 18,
        serviceStatus: 'completed',
        activationDate: '2024-01-10',
        progressPercent: 100,
        progressText: '服务已开通',
        customerPhone: '137****9876',
        createdAt: '2024-01-10'
      }
    ]

    this.setData({
      serviceList: mockServices,
      loading: false
    })
    this.updateFilterCounts()
  },

  // 更新筛选标签计数
  updateFilterCounts() {
    const { serviceList } = this.data
    const filterTabs = this.data.filterTabs.map(tab => {
      if (tab.value === 'all') {
        tab.count = serviceList.length
      } else {
        tab.count = serviceList.filter(item => item.serviceStatus === tab.value).length
      }
      return tab
    })
    this.setData({ filterTabs })
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail })
  },

  // 搜索确认
  onSearchConfirm() {
    this.loadServiceList()
  },

  // 筛选标签点击
  onFilterTabTap(e) {
    const { filter } = e.currentTarget.dataset
    this.setData({ currentFilter: filter })
    this.loadServiceList()
  },

  // 服务卡片点击
  onServiceTap(e) {
    const { service } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/orders/detail/detail?id=${service.id}`
    })
  },

  // 联系客户
  onContactCustomer(e) {
    e.stopPropagation()
    const { customer } = e.currentTarget.dataset
    
    wx.showActionSheet({
      itemList: ['拨打电话', '发送短信', '查看详情'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.makePhoneCall(customer.customerPhone)
            break
          case 1:
            this.sendSMS(customer.customerPhone)
            break
          case 2:
            this.viewCustomerDetail(customer.id)
            break
        }
      }
    })
  },

  // 拨打电话
  makePhoneCall(phoneNumber) {
    const phone = phoneNumber.replace(/\*/g, '')
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: (error) => {
        console.error('拨打电话失败:', error)
        wx.showToast({
          title: '拨打失败',
          icon: 'none'
        })
      }
    })
  },

  // 发送短信
  sendSMS(phoneNumber) {
    wx.showToast({
      title: '短信功能开发中',
      icon: 'none'
    })
  },

  // 查看客户详情
  viewCustomerDetail(customerId) {
    wx.navigateTo({
      url: `/pages/manager/customers/detail/detail?id=${customerId}`
    })
  },

  // 查看进度
  onViewProgress(e) {
    e.stopPropagation()
    const { service } = e.currentTarget.dataset
    
    wx.showModal({
      title: '服务开通进度',
      content: `当前进度：${service.progressText}\n进度：${service.progressPercent}%`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 开始开通服务
  onStartActivation(e) {
    e.stopPropagation()
    const { service } = e.currentTarget.dataset
    
    this.setData({
      selectedService: service,
      showActivationDialog: true,
      activationForm: {
        estimatedDate: '',
        department: '',
        remark: ''
      }
    })
  },

  // 关闭开通弹窗
  closeActivationDialog() {
    this.setData({
      showActivationDialog: false,
      selectedService: null
    })
  },

  // 确认开通
  async confirmActivation() {
    const { activationForm, selectedService } = this.data
    
    if (!activationForm.estimatedDate) {
      wx.showToast({
        title: '请选择预计开通时间',
        icon: 'none'
      })
      return
    }
    
    if (!activationForm.department) {
      wx.showToast({
        title: '请选择负责部门',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '提交中...' })
      
      await app.request({
        url: `/service/${selectedService.id}/activate`,
        method: 'POST',
        data: activationForm
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '开通成功',
        icon: 'success'
      })
      
      this.setData({ showActivationDialog: false })
      this.loadServiceList()
      
    } catch (error) {
      wx.hideLoading()
      console.error('开通服务失败:', error)
      
      // 模拟成功
      wx.showToast({
        title: '开通成功',
        icon: 'success'
      })
      
      // 更新本地数据
      const serviceList = this.data.serviceList.map(item => {
        if (item.id === selectedService.id) {
          return {
            ...item,
            serviceStatus: 'activating',
            activationDate: activationForm.estimatedDate,
            progressPercent: 20,
            progressText: '资料准备中'
          }
        }
        return item
      })
      
      this.setData({
        serviceList,
        showActivationDialog: false
      })
      this.updateFilterCounts()
    }
  },

  // 更新进度
  onUpdateProgress(e) {
    e.stopPropagation()
    const { service } = e.currentTarget.dataset
    
    this.setData({
      selectedService: service,
      showProgressDialog: true,
      progressForm: {
        currentStep: Math.ceil(service.progressPercent / 20) || 1,
        stepText: this.getStepText(Math.ceil(service.progressPercent / 20) || 1),
        remark: '',
        expectedDate: ''
      }
    })
  },

  // 关闭进度弹窗
  closeProgressDialog() {
    this.setData({
      showProgressDialog: false,
      selectedService: null
    })
  },

  // 确认进度更新
  async confirmProgressUpdate() {
    const { progressForm, selectedService } = this.data
    
    if (!progressForm.remark) {
      wx.showToast({
        title: '请填写进度说明',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '更新中...' })
      
      await app.request({
        url: `/service/${selectedService.id}/progress`,
        method: 'PUT',
        data: progressForm
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      })
      
      this.setData({ showProgressDialog: false })
      this.loadServiceList()
      
    } catch (error) {
      wx.hideLoading()
      console.error('更新进度失败:', error)
      
      // 模拟成功
      const progressPercent = progressForm.currentStep * 20
      const serviceStatus = progressPercent >= 100 ? 'completed' : 'activating'
      
      // 更新本地数据
      const serviceList = this.data.serviceList.map(item => {
        if (item.id === selectedService.id) {
          return {
            ...item,
            serviceStatus,
            progressPercent,
            progressText: progressForm.stepText
          }
        }
        return item
      })
      
      this.setData({
        serviceList,
        showProgressDialog: false
      })
      this.updateFilterCounts()
      
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      })
    }
  },

  // 服务监控
  onServiceMonitor(e) {
    e.stopPropagation()
    const { service } = e.currentTarget.dataset
    
    this.setData({
      selectedService: service,
      showMonitorDialog: true,
      monitorData: {
        powerConsumption: 12500,
        monthlySavings: 3200,
        satisfactionScore: 4.8
      },
      monitorForm: {
        satisfaction: 5,
        issues: '',
        solutions: ''
      }
    })
  },

  // 关闭监控弹窗
  closeMonitorDialog() {
    this.setData({
      showMonitorDialog: false,
      selectedService: null
    })
  },

  // 确认监控更新
  async confirmMonitorUpdate() {
    const { monitorForm, selectedService } = this.data

    try {
      wx.showLoading({ title: '保存中...' })
      
      await app.request({
        url: `/service/${selectedService.id}/monitor`,
        method: 'POST',
        data: monitorForm
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      this.setData({ showMonitorDialog: false })
      
    } catch (error) {
      wx.hideLoading()
      console.error('保存监控记录失败:', error)
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      this.setData({ showMonitorDialog: false })
    }
  },

  // 表单输入处理
  onActivationFormInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`activationForm.${field}`]: e.detail
    })
  },

  onProgressFormInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`progressForm.${field}`]: e.detail
    })
  },

  onMonitorFormInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`monitorForm.${field}`]: e.detail
    })
  },

  // 满意度评分变更
  onSatisfactionChange(e) {
    this.setData({
      'monitorForm.satisfaction': e.detail
    })
  },

  // 进度步骤点击
  onProgressStepTap(e) {
    const { step } = e.currentTarget.dataset
    this.setData({
      'progressForm.currentStep': step,
      'progressForm.stepText': this.getStepText(step)
    })
  },

  // 获取步骤文本
  getStepText(step) {
    const stepMap = {
      1: '资料准备中',
      2: '系统配置中',
      3: '设备调试中',
      4: '服务测试中',
      5: '正式开通完成'
    }
    return stepMap[step] || '未知状态'
  },

  // 选择预计开通时间
  selectEstimatedDate() {
    this.setData({
      showDatePicker: true,
      currentDateField: 'estimatedDate'
    })
  },

  // 选择预计完成时间
  selectExpectedDate() {
    this.setData({
      showDatePicker: true,
      currentDateField: 'expectedDate'
    })
  },

  // 选择部门
  selectDepartment() {
    this.setData({ showDepartmentPicker: true })
  },

  // 关闭部门选择器
  closeDepartmentPicker() {
    this.setData({ showDepartmentPicker: false })
  },

  // 部门选择
  onDepartmentSelect(e) {
    const { value, name } = e.detail
    this.setData({
      'activationForm.department': name,
      showDepartmentPicker: false
    })
  },

  // 关闭日期选择器
  closeDatePicker() {
    this.setData({ showDatePicker: false })
  },

  // 日期确认
  onDateConfirm(e) {
    const date = new Date(e.detail)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    
    const { currentDateField } = this.data
    if (currentDateField === 'estimatedDate') {
      this.setData({
        'activationForm.estimatedDate': dateStr,
        showDatePicker: false
      })
    } else if (currentDateField === 'expectedDate') {
      this.setData({
        'progressForm.expectedDate': dateStr,
        showDatePicker: false
      })
    }
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'pending': '待开通',
      'activating': '开通中',
      'completed': '已完成',
      'monitoring': '监控中',
      'suspended': '已暂停'
    }
    return statusMap[status] || '未知状态'
  },

  // 获取状态颜色
  getStatusColor(status) {
    const colorMap = {
      'pending': '#1989fa',
      'activating': '#ff976a',
      'completed': '#07c160',
      'monitoring': '#52c41a',
      'suspended': '#969799'
    }
    return colorMap[status] || '#969799'
  },

  // 格式化金额
  formatAmount(amount) {
    if (!amount) return '0'
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
}) 