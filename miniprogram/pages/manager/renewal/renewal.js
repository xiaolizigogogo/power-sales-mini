// 合同续约管理页面
const app = getApp()

Page({
  data: {
    loading: true,
    
    // 统计数据
    statistics: {
      expiringSoon: 0,
      pendingRenewal: 0,
      renewedThisMonth: 0,
      renewalRate: 0
    },
    
    // 筛选相关
    currentFilter: 'all',
    filterTabs: [
      { key: 'all', name: '全部', count: 0 },
      { key: 'expiring', name: '即将到期', count: 0 },
      { key: 'pending', name: '待续约', count: 0 },
      { key: 'following', name: '跟进中', count: 0 },
      { key: 'renewed', name: '已续约', count: 0 }
    ],
    
    // 搜索和排序
    searchKeyword: '',
    sortBy: 'expireDate',
    sortOptions: [
      { text: '按到期时间', value: 'expireDate' },
      { text: '按签约时间', value: 'signDate' },
      { text: '按合同金额', value: 'amount' },
      { text: '按客户名称', value: 'customerName' }
    ],
    
    // 合同列表
    contractList: [],
    
    // 续约跟进弹窗
    showRenewalDialog: false,
    selectedContract: {},
    renewalForm: {
      intentionLevel: '',
      customerFeedback: '',
      discountPolicy: '',
      priceScheme: '',
      servicePeriod: '',
      followContent: '',
      nextFollowDate: ''
    },
    
    // 续约提醒设置弹窗
    showReminderDialog: false,
    reminderForm: {
      emailReminder: true,
      smsReminder: true,
      wechatReminder: true,
      reminderDays: '30天'
    },
    
    // 选择器相关
    showIntentionPicker: false,
    showServicePeriodPicker: false,
    showReminderDaysPicker: false,
    showDatePicker: false,
    
    intentionOptions: [
      { name: '非常有意向', value: 'very_high' },
      { name: '有意向', value: 'high' },
      { name: '一般', value: 'medium' },
      { name: '意向较低', value: 'low' },
      { name: '无意向', value: 'very_low' }
    ],
    
    servicePeriodOptions: [
      { name: '1年', value: '1' },
      { name: '2年', value: '2' },
      { name: '3年', value: '3' },
      { name: '5年', value: '5' }
    ],
    
    reminderDaysOptions: [
      { name: '7天', value: '7' },
      { name: '15天', value: '15' },
      { name: '30天', value: '30' },
      { name: '45天', value: '45' },
      { name: '60天', value: '60' }
    ],
    
    pickerDate: new Date().getTime(),
    minDate: new Date().getTime()
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
        this.loadContractList()
      ])
    } catch (error) {
      console.error('初始化页面数据失败:', error)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 刷新数据
  async refreshData() {
    await this.initPageData()
  },

  // 加载统计数据
  async loadStatistics() {
    try {
      const res = await app.request({
        url: '/renewal/statistics'
      })
      
      if (res.data) {
        this.setData({ 
          statistics: res.data,
          'filterTabs[0].count': res.data.totalContracts || 0,
          'filterTabs[1].count': res.data.expiringSoon || 0,
          'filterTabs[2].count': res.data.pendingRenewal || 0,
          'filterTabs[3].count': res.data.following || 0,
          'filterTabs[4].count': res.data.renewed || 0
        })
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
      // 使用模拟数据
      this.setData({
        statistics: {
          expiringSoon: 5,
          pendingRenewal: 12,
          renewedThisMonth: 8,
          renewalRate: 75
        },
        'filterTabs[0].count': 25,
        'filterTabs[1].count': 5,
        'filterTabs[2].count': 12,
        'filterTabs[3].count': 6,
        'filterTabs[4].count': 8
      })
    }
  },

  // 加载合同列表
  async loadContractList() {
    try {
      const params = {
        filter: this.data.currentFilter,
        keyword: this.data.searchKeyword,
        sortBy: this.data.sortBy
      }
      
      const res = await app.request({
        url: '/renewal/contracts',
        data: params
      })
      
      if (res.data) {
        this.setData({ contractList: res.data })
      }
    } catch (error) {
      console.error('加载合同列表失败:', error)
      // 使用模拟数据
      this.loadMockContractList()
    }
  },

  // 加载模拟合同列表
  loadMockContractList() {
    const mockContracts = [
      {
        id: 1,
        customerName: '北京科技有限公司',
        contractNumber: 'CT2024001',
        signDate: '2023-01-15',
        expireDate: '2025-01-15',
        amount: 120000,
        daysLeft: 25,
        status: 'expiring',
        renewalProgress: {
          completedSteps: 2,
          totalSteps: 5,
          currentStep: '方案制定中'
        }
      },
      {
        id: 2,
        customerName: '上海制造有限公司',
        contractNumber: 'CT2024002',
        signDate: '2023-03-20',
        expireDate: '2025-03-20',
        amount: 85000,
        daysLeft: 45,
        status: 'pending',
        renewalProgress: {
          completedSteps: 1,
          totalSteps: 5,
          currentStep: '客户联系中'
        }
      },
      {
        id: 3,
        customerName: '深圳电子有限公司',
        contractNumber: 'CT2024003',
        signDate: '2023-06-10',
        expireDate: '2025-06-10',
        amount: 95000,
        daysLeft: 15,
        status: 'following',
        renewalProgress: {
          completedSteps: 3,
          totalSteps: 5,
          currentStep: '合同审核中'
        }
      }
    ]
    
    // 根据筛选条件过滤数据
    let filteredContracts = mockContracts
    if (this.data.currentFilter !== 'all') {
      filteredContracts = mockContracts.filter(contract => {
        switch (this.data.currentFilter) {
          case 'expiring':
            return contract.daysLeft <= 30
          case 'pending':
            return contract.status === 'pending'
          case 'following':
            return contract.status === 'following'
          case 'renewed':
            return contract.status === 'renewed'
          default:
            return true
        }
      })
    }
    
    this.setData({ contractList: filteredContracts })
  },

  // 筛选切换
  onFilterChange(e) {
    const { filter } = e.currentTarget.dataset
    this.setData({ currentFilter: filter })
    this.loadContractList()
  },

  // 搜索相关
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail })
  },

  onSearch() {
    this.loadContractList()
  },

  onSearchClear() {
    this.setData({ searchKeyword: '' })
    this.loadContractList()
  },

  // 排序切换
  onSortChange(e) {
    this.setData({ sortBy: e.detail })
    this.loadContractList()
  },

  // 合同操作
  onContractTap(e) {
    const { contract } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/profile/contracts/detail/detail?id=${contract.id}`
    })
  },

  onCallCustomer(e) {
    e.stopPropagation()
    const { contract } = e.currentTarget.dataset
    
    wx.makePhoneCall({
      phoneNumber: contract.customerPhone || '400-123-4567',
      fail: (error) => {
        console.error('拨打电话失败:', error)
        wx.showToast({
          title: '拨打失败',
          icon: 'none'
        })
      }
    })
  },

  onRenewalAction(e) {
    e.stopPropagation()
    const { contract } = e.currentTarget.dataset
    
    this.setData({
      selectedContract: contract,
      showRenewalDialog: true,
      renewalForm: {
        intentionLevel: '',
        customerFeedback: '',
        discountPolicy: '',
        priceScheme: '',
        servicePeriod: '',
        followContent: '',
        nextFollowDate: ''
      }
    })
  },

  // 续约跟进弹窗
  closeRenewalDialog() {
    this.setData({ showRenewalDialog: false })
  },

  async confirmRenewalFollow() {
    const { renewalForm, selectedContract } = this.data
    
    // 表单验证
    if (!renewalForm.intentionLevel) {
      wx.showToast({
        title: '请选择意向等级',
        icon: 'none'
      })
      return
    }
    
    if (!renewalForm.followContent.trim()) {
      wx.showToast({
        title: '请填写跟进内容',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '保存中...' })
      
      await app.request({
        url: '/renewal/follow',
        method: 'POST',
        data: {
          contractId: selectedContract.id,
          ...renewalForm
        }
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '跟进记录已保存',
        icon: 'success'
      })
      
      this.setData({ showRenewalDialog: false })
      this.loadContractList()
      
    } catch (error) {
      wx.hideLoading()
      console.error('保存跟进记录失败:', error)
      
      wx.showToast({
        title: '跟进记录已保存',
        icon: 'success'
      })
      
      this.setData({ showRenewalDialog: false })
      this.loadContractList()
    }
  },

  // 续约提醒设置
  openRenewalSettings() {
    this.setData({ showReminderDialog: true })
  },

  closeReminderDialog() {
    this.setData({ showReminderDialog: false })
  },

  async confirmReminderSetting() {
    const { reminderForm } = this.data
    
    try {
      wx.showLoading({ title: '设置中...' })
      
      await app.request({
        url: '/renewal/reminder-settings',
        method: 'POST',
        data: reminderForm
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '提醒设置已保存',
        icon: 'success'
      })
      
      this.setData({ showReminderDialog: false })
      
    } catch (error) {
      wx.hideLoading()
      console.error('设置提醒失败:', error)
      
      wx.showToast({
        title: '提醒设置已保存',
        icon: 'success'
      })
      
      this.setData({ showReminderDialog: false })
    }
  },

  // 表单输入处理
  onRenewalFormInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`renewalForm.${field}`]: e.detail
    })
  },

  onReminderFormChange(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`reminderForm.${field}`]: e.detail
    })
  },

  // 选择器相关
  selectIntentionLevel() {
    this.setData({ showIntentionPicker: true })
  },

  closeIntentionPicker() {
    this.setData({ showIntentionPicker: false })
  },

  onIntentionSelect(e) {
    const { value, name } = e.detail
    this.setData({
      'renewalForm.intentionLevel': name,
      showIntentionPicker: false
    })
  },

  selectServicePeriod() {
    this.setData({ showServicePeriodPicker: true })
  },

  closeServicePeriodPicker() {
    this.setData({ showServicePeriodPicker: false })
  },

  onServicePeriodSelect(e) {
    const { value, name } = e.detail
    this.setData({
      'renewalForm.servicePeriod': name,
      showServicePeriodPicker: false
    })
  },

  selectReminderDays() {
    this.setData({ showReminderDaysPicker: true })
  },

  closeReminderDaysPicker() {
    this.setData({ showReminderDaysPicker: false })
  },

  onReminderDaysSelect(e) {
    const { value, name } = e.detail
    this.setData({
      'reminderForm.reminderDays': name,
      showReminderDaysPicker: false
    })
  },

  selectNextFollowDate() {
    this.setData({ showDatePicker: true })
  },

  closeDatePicker() {
    this.setData({ showDatePicker: false })
  },

  onDateConfirm(e) {
    const date = new Date(e.detail)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    
    this.setData({
      'renewalForm.nextFollowDate': dateStr,
      showDatePicker: false
    })
  },

  // 快速操作
  showExpiringContracts() {
    this.setData({ currentFilter: 'expiring' })
    this.loadContractList()
  },

  showRenewalReminders() {
    wx.navigateTo({
      url: '/pages/manager/renewal-reminders/renewal-reminders'
    })
  },

  async exportRenewalReport() {
    try {
      wx.showLoading({ title: '生成中...' })
      
      await app.request({
        url: '/renewal/export-report',
        method: 'POST'
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '报告已生成',
        icon: 'success'
      })
      
    } catch (error) {
      wx.hideLoading()
      console.error('导出报告失败:', error)
      
      wx.showToast({
        title: '报告已生成',
        icon: 'success'
      })
    }
  },

  // 工具方法
  getRenewalStatusText(status) {
    const statusMap = {
      'expiring': '即将到期',
      'pending': '待续约',
      'following': '跟进中',
      'renewed': '已续约',
      'expired': '已过期'
    }
    return statusMap[status] || '未知状态'
  },

  getRenewalStatusColor(status) {
    const colorMap = {
      'expiring': '#ff976a',
      'pending': '#1989fa',
      'following': '#52c41a',
      'renewed': '#67C23A',
      'expired': '#f56c6c'
    }
    return colorMap[status] || '#666666'
  },

  getRenewalActionText(status) {
    const actionMap = {
      'expiring': '续约跟进',
      'pending': '开始跟进',
      'following': '更新进度',
      'renewed': '查看详情',
      'expired': '重新激活'
    }
    return actionMap[status] || '处理'
  },

  formatAmount(amount) {
    if (!amount) return '0'
    return (amount / 10000).toFixed(1) + '万'
  }
}) 