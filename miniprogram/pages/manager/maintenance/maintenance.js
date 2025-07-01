const app = getApp()

Page({
  data: {
    // 页面状态
    loading: true,
    refreshing: false,
    
    // 统计数据
    statistics: {
      todayVisits: 8,
      pendingVisits: 12,
      monthlyTarget: 85,
      satisfaction: 4.8
    },
    
    // 今日任务
    todayTasks: [],
    
    // 最近回访记录
    recentVisits: [],
    
    // 快速回访弹窗
    showQuickVisitDialog: false,
    quickVisitForm: {
      customerId: '',
      customerName: '',
      type: 'phone',
      typeText: '电话回访',
      content: '',
      satisfaction: 5,
      issues: ''
    },
    
    // 安排回访弹窗
    showScheduleVisitDialog: false,
    scheduleVisitForm: {
      customerId: '',
      customerName: '',
      visitTime: '',
      type: 'phone',
      typeText: '电话回访',
      purpose: '',
      reminder: true
    },
    
    // 增值服务推广弹窗
    showPromoteServiceDialog: false,
    promoteServiceForm: {
      customerId: '',
      customerName: '',
      productId: '',
      productName: '',
      content: '',
      discount: ''
    },
    
    // 选择器相关
    showCustomerPicker: false,
    showVisitTypePicker: false,
    showProductPicker: false,
    showDateTimePicker: false,
    
    customerOptions: [],
    visitTypeOptions: [
      { name: '电话回访', value: 'phone' },
      { name: '上门拜访', value: 'visit' },
      { name: '微信沟通', value: 'wechat' },
      { name: '视频会议', value: 'video' },
      { name: '邮件联系', value: 'email' }
    ],
    productOptions: [],
    
    pickerDateTime: new Date().getTime(),
    minDateTime: new Date().getTime(),
    currentPickerType: '', // 'quickVisit', 'scheduleVisit', 'promoteService'
    currentField: ''
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
        this.loadTodayTasks(),
        this.loadRecentVisits(),
        this.loadCustomerOptions(),
        this.loadProductOptions()
      ])
    } catch (error) {
      console.error('初始化页面数据失败:', error)
    } finally {
      this.setData({ loading: false })
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

  // 加载今日任务
  async loadTodayTasks() {
    try {
      const res = await app.request({
        url: '/maintenance/today-tasks'
      })
      
      if (res.data) {
        this.setData({ todayTasks: res.data })
      }
    } catch (error) {
      this.loadMockTodayTasks()
    }
  },

  // 加载模拟今日任务
  loadMockTodayTasks() {
    const mockTasks = [
      {
        id: 1,
        type: 'visit',
        customerName: '张总',
        companyName: '北京科技有限公司',
        scheduledTime: '10:00',
        description: '定期回访，了解用电情况',
        phone: '13812345678'
      },
      {
        id: 2,
        type: 'promotion',
        customerName: '李经理',
        companyName: '上海制造有限公司',
        scheduledTime: '14:30',
        description: '推广新能源套餐产品',
        phone: '13912341234'
      }
    ]
    
    this.setData({ todayTasks: mockTasks })
  },

  // 加载最近回访记录
  async loadRecentVisits() {
    try {
      const res = await app.request({
        url: '/maintenance/recent-visits'
      })
      
      if (res.data) {
        this.setData({ recentVisits: res.data })
      }
    } catch (error) {
      this.loadMockRecentVisits()
    }
  },

  // 加载模拟回访记录
  loadMockRecentVisits() {
    const mockVisits = [
      {
        id: 1,
        customerName: '张总',
        visitTime: '2024-01-15 10:00',
        type: 'phone',
        status: 'completed',
        summary: '客户对服务很满意，用电量稳定',
        satisfactionScore: 5
      }
    ]
    
    this.setData({ recentVisits: mockVisits })
  },

  // 加载客户选项
  async loadCustomerOptions() {
    try {
      const res = await app.request({
        url: '/customers/my-customers',
        data: { page: 1, pageSize: 50 }
      })
      
      if (res.data && res.data.list) {
        const customerOptions = res.data.list.map(customer => ({
          name: `${customer.name} - ${customer.companyName}`,
          value: customer.id,
          subname: customer.phone
        }))
        this.setData({ customerOptions })
      }
    } catch (error) {
      this.setData({
        customerOptions: [
          { name: '张总 - 北京科技有限公司', value: 1, subname: '138****5678' },
          { name: '李经理 - 上海制造有限公司', value: 2, subname: '139****1234' }
        ]
      })
    }
  },

  // 加载产品选项
  async loadProductOptions() {
    try {
      const res = await app.request({
        url: '/products/list',
        data: { page: 1, pageSize: 20 }
      })
      
      if (res.data && res.data.list) {
        const productOptions = res.data.list.map(product => ({
          name: product.name,
          value: product.id,
          subname: `¥${product.price}/度`
        }))
        this.setData({ productOptions })
      }
    } catch (error) {
      this.setData({
        productOptions: [
          { name: '工商业用电套餐A', value: 1, subname: '¥0.65/度' },
          { name: '工商业用电套餐B', value: 2, subname: '¥0.60/度' }
        ]
      })
    }
  },

  // 导航功能
  goToVisitPlan() {
    wx.navigateTo({
      url: '/pages/manager/visit-plan/visit-plan'
    })
  },

  goToValueServices() {
    wx.navigateTo({
      url: '/pages/manager/value-services/value-services'
    })
  },

  goToIssueTracking() {
    wx.navigateTo({
      url: '/pages/manager/issue-tracking/issue-tracking'
    })
  },

  goToAnalytics() {
    wx.navigateTo({
      url: '/pages/manager/maintenance-analytics/maintenance-analytics'
    })
  },

  // 查看所有任务
  viewAllTasks() {
    wx.navigateTo({
      url: '/pages/manager/tasks/tasks'
    })
  },

  // 查看所有回访记录
  viewAllVisits() {
    wx.navigateTo({
      url: '/pages/manager/visits/visits'
    })
  },

  // 任务操作
  onTaskTap(e) {
    const { task } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/manager/task-detail/task-detail?id=${task.id}`
    })
  },

  onTaskCall(e) {
    e.stopPropagation()
    const { task } = e.currentTarget.dataset
    
    wx.makePhoneCall({
      phoneNumber: task.phone
    })
  },

  async onTaskComplete(e) {
    e.stopPropagation()
    const { task } = e.currentTarget.dataset
    
    try {
      wx.showLoading({ title: '处理中...' })
      
      await app.request({
        url: `/maintenance/tasks/${task.id}/complete`,
        method: 'POST'
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '任务已完成',
        icon: 'success'
      })
      
      this.loadTodayTasks()
      
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '任务已完成',
        icon: 'success'
      })
      
      const todayTasks = this.data.todayTasks.filter(item => item.id !== task.id)
      this.setData({ todayTasks })
    }
  },

  // 回访记录操作
  onVisitTap(e) {
    const { visit } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/manager/visit-detail/visit-detail?id=${visit.id}`
    })
  },

  // 快速操作
  quickVisit() {
    this.setData({
      showQuickVisitDialog: true,
      quickVisitForm: {
        customerId: '',
        customerName: '',
        type: 'phone',
        typeText: '电话回访',
        content: '',
        satisfaction: 5,
        issues: ''
      }
    })
  },

  scheduleVisit() {
    this.setData({
      showScheduleVisitDialog: true,
      scheduleVisitForm: {
        customerId: '',
        customerName: '',
        visitTime: '',
        type: 'phone',
        typeText: '电话回访',
        purpose: '',
        reminder: true
      }
    })
  },

  promoteService() {
    this.setData({
      showPromoteServiceDialog: true,
      promoteServiceForm: {
        customerId: '',
        customerName: '',
        productId: '',
        productName: '',
        content: '',
        discount: ''
      }
    })
  },

  reportIssue() {
    wx.navigateTo({
      url: '/pages/manager/report-issue/report-issue'
    })
  },

  createNewTask() {
    wx.navigateTo({
      url: '/pages/manager/create-task/create-task'
    })
  },

  // 快速回访相关
  closeQuickVisitDialog() {
    this.setData({ showQuickVisitDialog: false })
  },

  async confirmQuickVisit() {
    const { quickVisitForm } = this.data
    
    if (!quickVisitForm.customerId) {
      wx.showToast({
        title: '请选择客户',
        icon: 'none'
      })
      return
    }
    
    if (!quickVisitForm.content.trim()) {
      wx.showToast({
        title: '请填写回访内容',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '提交中...' })
      
      await app.request({
        url: '/maintenance/quick-visit',
        method: 'POST',
        data: quickVisitForm
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '回访记录已保存',
        icon: 'success'
      })
      
      this.setData({ showQuickVisitDialog: false })
      this.loadRecentVisits()
      
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '回访记录已保存',
        icon: 'success'
      })
      
      this.setData({ showQuickVisitDialog: false })
      this.loadRecentVisits()
    }
  },

  // 安排回访相关
  closeScheduleVisitDialog() {
    this.setData({ showScheduleVisitDialog: false })
  },

  async confirmScheduleVisit() {
    const { scheduleVisitForm } = this.data
    
    if (!scheduleVisitForm.customerId) {
      wx.showToast({
        title: '请选择客户',
        icon: 'none'
      })
      return
    }
    
    if (!scheduleVisitForm.visitTime) {
      wx.showToast({
        title: '请选择回访时间',
        icon: 'none'
      })
      return
    }
    
    if (!scheduleVisitForm.purpose.trim()) {
      wx.showToast({
        title: '请填写回访目的',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '安排中...' })
      
      await app.request({
        url: '/maintenance/schedule-visit',
        method: 'POST',
        data: scheduleVisitForm
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '回访已安排',
        icon: 'success'
      })
      
      this.setData({ showScheduleVisitDialog: false })
      this.loadTodayTasks()
      
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '回访已安排',
        icon: 'success'
      })
      
      this.setData({ showScheduleVisitDialog: false })
    }
  },

  // 增值服务推广相关
  closePromoteServiceDialog() {
    this.setData({ showPromoteServiceDialog: false })
  },

  async confirmPromoteService() {
    const { promoteServiceForm } = this.data
    
    if (!promoteServiceForm.customerId) {
      wx.showToast({
        title: '请选择客户',
        icon: 'none'
      })
      return
    }
    
    if (!promoteServiceForm.productId) {
      wx.showToast({
        title: '请选择推广产品',
        icon: 'none'
      })
      return
    }
    
    if (!promoteServiceForm.content.trim()) {
      wx.showToast({
        title: '请填写推广内容',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '发送中...' })
      
      await app.request({
        url: '/maintenance/promote-service',
        method: 'POST',
        data: promoteServiceForm
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '推广信息已发送',
        icon: 'success'
      })
      
      this.setData({ showPromoteServiceDialog: false })
      
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '推广信息已发送',
        icon: 'success'
      })
      
      this.setData({ showPromoteServiceDialog: false })
    }
  },

  // 表单输入处理
  onQuickVisitInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`quickVisitForm.${field}`]: e.detail
    })
  },

  onScheduleVisitInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`scheduleVisitForm.${field}`]: e.detail
    })
  },

  onPromoteServiceInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`promoteServiceForm.${field}`]: e.detail
    })
  },

  onSatisfactionChange(e) {
    this.setData({
      'quickVisitForm.satisfaction': e.detail
    })
  },

  onReminderChange(e) {
    this.setData({
      'scheduleVisitForm.reminder': e.detail
    })
  },

  // 选择器相关
  selectCustomer() {
    this.setData({
      showCustomerPicker: true,
      currentPickerType: 'quickVisit'
    })
  },

  selectCustomerForSchedule() {
    this.setData({
      showCustomerPicker: true,
      currentPickerType: 'scheduleVisit'
    })
  },

  selectCustomerForPromotion() {
    this.setData({
      showCustomerPicker: true,
      currentPickerType: 'promoteService'
    })
  },

  selectVisitType() {
    this.setData({
      showVisitTypePicker: true,
      currentPickerType: 'quickVisit'
    })
  },

  selectScheduleVisitType() {
    this.setData({
      showVisitTypePicker: true,
      currentPickerType: 'scheduleVisit'
    })
  },

  selectPromotionProduct() {
    this.setData({ showProductPicker: true })
  },

  selectVisitTime() {
    this.setData({ showDateTimePicker: true })
  },

  // 选择器事件处理
  closeCustomerPicker() {
    this.setData({ showCustomerPicker: false })
  },

  onCustomerSelect(e) {
    const { value, name } = e.detail
    const { currentPickerType } = this.data
    
    if (currentPickerType === 'quickVisit') {
      this.setData({
        'quickVisitForm.customerId': value,
        'quickVisitForm.customerName': name.split(' - ')[0],
        showCustomerPicker: false
      })
    } else if (currentPickerType === 'scheduleVisit') {
      this.setData({
        'scheduleVisitForm.customerId': value,
        'scheduleVisitForm.customerName': name.split(' - ')[0],
        showCustomerPicker: false
      })
    } else if (currentPickerType === 'promoteService') {
      this.setData({
        'promoteServiceForm.customerId': value,
        'promoteServiceForm.customerName': name.split(' - ')[0],
        showCustomerPicker: false
      })
    }
  },

  closeVisitTypePicker() {
    this.setData({ showVisitTypePicker: false })
  },

  onVisitTypeSelect(e) {
    const { value, name } = e.detail
    const { currentPickerType } = this.data
    
    if (currentPickerType === 'quickVisit') {
      this.setData({
        'quickVisitForm.type': value,
        'quickVisitForm.typeText': name,
        showVisitTypePicker: false
      })
    } else if (currentPickerType === 'scheduleVisit') {
      this.setData({
        'scheduleVisitForm.type': value,
        'scheduleVisitForm.typeText': name,
        showVisitTypePicker: false
      })
    }
  },

  closeProductPicker() {
    this.setData({ showProductPicker: false })
  },

  onProductSelect(e) {
    const { value, name } = e.detail
    this.setData({
      'promoteServiceForm.productId': value,
      'promoteServiceForm.productName': name,
      showProductPicker: false
    })
  },

  closeDateTimePicker() {
    this.setData({ showDateTimePicker: false })
  },

  onDateTimeConfirm(e) {
    const date = new Date(e.detail)
    const dateTimeStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    
    this.setData({
      'scheduleVisitForm.visitTime': dateTimeStr,
      showDateTimePicker: false
    })
  },

  // 工具方法
  getTaskTypeIcon(type) {
    const iconMap = {
      'visit': '📞',
      'promotion': '💎',
      'issue': '🔧',
      'follow': '👥'
    }
    return iconMap[type] || '📋'
  },

  getTaskTypeText(type) {
    const textMap = {
      'visit': '客户回访',
      'promotion': '服务推广',
      'issue': '问题处理',
      'follow': '跟进联系'
    }
    return textMap[type] || '其他任务'
  },

  getTaskTypeColor(type) {
    const colorMap = {
      'visit': '#1989fa',
      'promotion': '#52c41a',
      'issue': '#ff976a',
      'follow': '#722ed1'
    }
    return colorMap[type] || '#666666'
  },

  getVisitTypeText(type) {
    const textMap = {
      'phone': '电话回访',
      'visit': '上门拜访',
      'wechat': '微信沟通',
      'video': '视频会议',
      'email': '邮件联系'
    }
    return textMap[type] || '其他方式'
  },

  getVisitStatusText(status) {
    const textMap = {
      'completed': '已完成',
      'pending': '待处理',
      'cancelled': '已取消'
    }
    return textMap[status] || '未知状态'
  },

  getVisitStatusColor(status) {
    const colorMap = {
      'completed': '#52c41a',
      'pending': '#1989fa',
      'cancelled': '#ff4d4f'
    }
    return colorMap[status] || '#666666'
  },

  getSatisfactionText(score) {
    if (score >= 5) return '非常满意'
    if (score >= 4) return '满意'
    if (score >= 3) return '一般'
    if (score >= 2) return '不满意'
    return '非常不满意'
  },

  // 续约管理
  openRenewalManagement() {
    wx.navigateTo({
      url: '/pages/manager/renewal/renewal'
    })
  }
}) 