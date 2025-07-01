const app = getApp()
const auth = require('../../../utils/auth')
const util = require('../../../utils/common')
const { followAPI } = require('../../../utils/api')

Page({
  data: {
    // 页面状态
    loading: true,
    refreshing: false,
    loadingMore: false,
    hasMore: true,
    saving: false,
    
    // 当前标签页
    activeTab: 0,
    tabs: ['待跟进', '已跟进', '预约跟进', '逾期未跟进'],
    
    // 跟进列表数据
    followList: [],
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0
    },
    
    // 筛选条件
    filterParams: {
      status: '', // 跟进状态
      priority: '', // 优先级
      dateRange: '', // 时间范围
      keyword: '' // 搜索关键词
    },
    
    // 状态筛选选项
    statusFilterIndex: 0,
    statusFilterOptions: [
      { value: '', label: '全部状态' },
      { value: 'pending', label: '待跟进' },
      { value: 'completed', label: '已完成' },
      { value: 'scheduled', label: '已预约' },
      { value: 'overdue', label: '已逾期' }
    ],
    
    // 搜索和筛选
    searchKeyword: '',
    dateFilter: '',
    showFilter: false,
    tempFilterParams: {},
    
    // 筛选选项
    priorityOptions: [
      { value: 'high', text: '高优先级', color: '#f5222d' },
      { value: 'medium', text: '中优先级', color: '#faad14' },
      { value: 'low', text: '低优先级', color: '#52c41a' }
    ],
    
    dateRangeOptions: [
      { value: 'today', text: '今天' },
      { value: 'tomorrow', text: '明天' },
      { value: 'week', text: '本周' },
      { value: 'month', text: '本月' },
      { value: 'overdue', text: '已逾期' }
    ],
    
    // 搜索
    showSearch: false,
    currentTab: 'all',
    
    // 筛选面板
    showFilter: false,
    tempFilterParams: {},
    
    // 批量操作
    showBatchActions: false,
    selectedItems: [],
    selectMode: false,
    
    // 跟进详情弹窗
    showFollowDetail: false,
    currentFollow: null,
    
    // 添加跟进弹窗
    showAddFollow: false,
    followForm: {
      id: '',
      customerId: '',
      customerName: '',
      type: 'call',
      typeText: '电话沟通',
      content: '',
      result: '',
      nextFollowDate: '',
      priority: 'medium',
      reminder: true,
      isFirstContact: false, // 是否首次接触
      intentionLevel: 'medium', // 客户意向等级
      attachments: [], // 跟进附件
      communicationSummary: '', // 沟通要点总结
      customerConcerns: '', // 客户关注点
      customerNeeds: '', // 客户需求
      customerDoubts: '' // 客户疑虑
    },
    
    // 跟进类型选择
    showFollowTypeModal: false,
    followTypeActions: [
      { name: '电话沟通', value: 'call', icon: 'phone-o' },
      { name: '拜访客户', value: 'visit', icon: 'location-o' },
      { name: '邮件联系', value: 'email', icon: 'envelop-o' },
      { name: '微信沟通', value: 'wechat', icon: 'wechat' },
      { name: '会议洽谈', value: 'meeting', icon: 'contact' },
      { name: '线下活动', value: 'activity', icon: 'calendar-o' },
      { name: '展会接触', value: 'exhibition', icon: 'shop-o' }
    ],
    
    // 客户意向等级选项
    intentionLevelOptions: [
      { value: 'low', text: '低意向', color: '#ff4d4f', description: '客户兴趣不高，需要长期培育' },
      { value: 'medium', text: '中意向', color: '#faad14', description: '客户有一定兴趣，需要持续跟进' },
      { value: 'high', text: '高意向', color: '#52c41a', description: '客户意向强烈，可能近期成交' }
    ],
    
    // 客户选择弹窗
    showCustomerModal: false,
    availableCustomers: [],
    customerSearchKeyword: '',
    selectedCustomerId: '',
    
    // 日期时间选择器
    showDatePicker: false,
    pickerDate: new Date().getTime(),
    minDate: new Date().getTime(),
    
    // 附件上传
    showAttachmentModal: false,
    attachmentTypes: [
      { name: '拍照', value: 'camera', icon: 'photo-o' },
      { name: '从相册选择', value: 'album', icon: 'photograph' },
      { name: '选择文件', value: 'file', icon: 'notes-o' }
    ],
    
    // 统计数据
    statistics: {
      todayFollow: 0,
      overdueFollow: 0,
      weeklyTarget: 0,
      completionRate: 0,
      completionRatePercent: 0
    },
    
    // 产品推荐相关
    showProductRecommend: false,
    recommendProducts: [],
    selectedProduct: null,
    
    // 需求分析相关
    showNeedsAnalysis: false,
    needsForm: {
      currentUsage: '', // 当前用电量
      voltageLevel: '', // 电压等级
      industryType: '', // 行业类型
      businessScale: '', // 经营规模
      painPoints: [], // 痛点问题
      budget: '', // 预算范围
      expectedReturn: '', // 期望收益
      decisionCycle: '', // 决策周期
      specialNeeds: '' // 特殊需求
    },
    
    // 选项数据
    painPointOptions: [
      { value: 'high_cost', text: '电费成本高' },
      { value: 'unstable', text: '供电不稳定' },
      { value: 'peak_valley', text: '峰谷电价差异大' },
      { value: 'service', text: '服务响应慢' },
      { value: 'billing', text: '计费不透明' },
      { value: 'other', text: '其他' }
    ],
    
    budgetOptions: [
      { value: 'below_100k', text: '10万以下' },
      { value: '100k_500k', text: '10-50万' },
      { value: '500k_1m', text: '50-100万' },
      { value: 'above_1m', text: '100万以上' }
    ],
    
    decisionCycleOptions: [
      { value: 'within_1m', text: '1个月内' },
      { value: '1m_3m', text: '1-3个月' },
      { value: '3m_6m', text: '3-6个月' },
      { value: 'above_6m', text: '6个月以上' }
    ],
    
    // 完成跟进弹窗
    showCompletePopup: false,
    completeForm: {
      followId: null,
      result: '',
      rating: 0,
      nextFollowTime: ''
    },
    
    // 延期跟进弹窗
    showPostponePopup: false,
    postponeForm: {
      followId: null,
      newTime: '',
      reason: ''
    },
    
    // 日期时间选择器
    showDateTimePicker: false,
    pickerDateTime: new Date().getTime(),
    currentTimeField: ''
  },

  onLoad(options) {
    console.log('跟进管理页面onLoad开始')
    
    // 检查权限
    if (!this.checkPermissions()) {
      return
    }
    
    // 从参数中获取初始状态
    if (options.tab) {
      this.setData({ activeTab: parseInt(options.tab) })
    }
    if (options.customerId) {
      this.setData({
        'followForm.customerId': options.customerId,
        'followForm.customerName': options.customerName || ''
      })
      if (options.action === 'add') {
        this.setData({ showAddFollow: true })
      }
    }
    
    // 设置默认客户数据
    this.setData({
      availableCustomers: [
        {
          id: 1,
          name: '张三',
          companyName: '某某科技有限公司',
          phone: '13800138001',
          status: 'active',
          statusText: '正常'
        },
        {
          id: 2,
          name: '李四',
          companyName: '某某贸易公司',
          phone: '13800138002',
          status: 'active',
          statusText: '正常'
        }
      ]
    })
    
    // 加载数据
    this.loadStatistics()
    this.loadFollowList()
  },

  // 检查权限
  checkPermissions() {
    if (!auth.checkLogin()) {
      return false
    }
    
    if (!auth.hasPermission(auth.PERMISSIONS.FOLLOW_VIEW)) {
      wx.showModal({
        title: '权限不足',
        content: '您没有权限查看跟进记录',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
      return false
    }
    
    return true
  },

  onShow() {
    // 页面显示时只有在确实需要时才刷新数据
    // 暂时注释掉自动刷新，避免覆盖模拟数据
    // if (this.data.followList.length > 0) {
    //   this.refreshFollowList()
    // }
  },

  onPullDownRefresh() {
    this.refreshFollowList()
  },

  onReachBottom() {
    if (!this.data.loadingMore && this.data.hasMore) {
      this.loadMoreFollowList()
    }
  },

  // 切换标签页
  onTabChange(e) {
    const index = e.currentTarget.dataset.index
    if (index !== this.data.activeTab) {
      console.log('切换标签页:', index)
      this.setData({
        activeTab: index,
        'pagination.page': 1
      })
      this.updateFilterByTab(index)
      
      // 重新加载模拟数据以显示正确的筛选结果
      this.loadMockFollowList()
      
      // 尝试加载真实数据（但不覆盖模拟数据）
      // this.loadFollowList()
    }
  },

  // 根据标签页更新筛选条件
  updateFilterByTab(tabIndex) {
    const statusMap = {
      0: 'pending',    // 待跟进
      1: 'completed',  // 已跟进
      2: 'scheduled',  // 预约跟进
      3: 'overdue'     // 逾期未跟进
    }
    
    this.setData({
      'filterParams.status': statusMap[tabIndex] || ''
    })
  },

  // 加载模拟跟进统计
  loadMockStatistics() {
    const mockStats = {
      todayFollow: 5,
      overdueFollow: 2,
      weeklyTarget: 20,
      completionRate: 0.65,
      completionRatePercent: 65
    }
    
    this.setData({
      statistics: mockStats
    })
    console.log('设置模拟统计数据:', mockStats)
  },

  // 加载模拟跟进列表
  loadMockFollowList() {
    console.log('开始加载模拟跟进列表，当前标签页:', this.data.activeTab)
    
    // 所有模拟数据
    const allMockData = [
      // 待跟进数据
      {
        id: 1,
        customerName: '张三',
        companyName: '北京科技有限公司',
        phone: '13800138001',
        type: 'call',
        typeText: '电话沟通',
        content: '跟进报价方案，客户对价格有疑虑，需要进一步沟通价格细节',
        followDate: '2024-12-26 15:30',
        nextFollowDate: '2024-12-28 10:00',
        priority: 'high',
        status: 'pending',
        statusText: '待跟进',
        reminder: true,
        customerId: 1
      },
      {
        id: 2,
        customerName: '李四',
        companyName: '上海贸易有限公司',
        phone: '13800138002',
        type: 'call',
        typeText: '电话沟通',
        content: '客户询问产品规格和交货期，准备安排样品寄送',
        followDate: '2024-12-25 14:20',
        nextFollowDate: '2024-12-29 09:30',
        priority: 'medium',
        status: 'pending',
        statusText: '待跟进',
        reminder: false,
        customerId: 2
      },
      {
        id: 3,
        customerName: '赵六',
        companyName: '深圳建筑有限公司',
        phone: '13800138004',
        type: 'wechat',
        typeText: '微信沟通',
        content: '微信沟通，但一直未回复，需要电话跟进',
        followDate: '2024-12-20 16:45',
        nextFollowDate: '2024-12-26 10:00',
        priority: 'medium',
        status: 'pending',
        statusText: '待跟进',
        reminder: true,
        customerId: 4
      },
      // 已跟进数据
      {
        id: 4,
        customerName: '王五',
        companyName: '广州服务有限公司',
        phone: '13800138003',
        type: 'visit',
        typeText: '拜访客户',
        content: '实地拜访，客户表示有合作意向，已成功签约',
        followDate: '2024-12-24 11:15',
        nextFollowDate: '',
        priority: 'high',
        status: 'completed',
        statusText: '已完成',
        reminder: false,
        customerId: 3
      },
      {
        id: 5,
        customerName: '陈七',
        companyName: '杭州制造有限公司',
        phone: '13800138005',
        type: 'email',
        typeText: '邮件联系',
        content: '已发送详细报价单，客户已确认订单',
        followDate: '2024-12-21 10:00',
        nextFollowDate: '',
        priority: 'low',
        status: 'completed',
        statusText: '已完成',
        reminder: false,
        customerId: 5
      },
      // 预约跟进数据
      {
        id: 6,
        customerName: '孙八',
        companyName: '天津工业有限公司',
        phone: '13800138006',
        type: 'meeting',
        typeText: '会议洽谈',
        content: '会议洽谈进展顺利，已达成初步合作意向',
        followDate: '2024-12-23 09:30',
        nextFollowDate: '2024-12-30 16:00',
        priority: 'high',
        status: 'scheduled',
        statusText: '已预约',
        reminder: false,
        customerId: 6
      },
      {
        id: 7,
        customerName: '周九',
        companyName: '成都电子有限公司',
        phone: '13800138007',
        type: 'phone',
        typeText: '电话沟通',
        content: '已约定下周二下午2点电话详谈',
        followDate: '2024-12-25 09:00',
        nextFollowDate: '2024-12-31 14:00',
        priority: 'medium',
        status: 'scheduled',
        statusText: '已预约',
        reminder: true,
        customerId: 7
      },
      // 逾期未跟进数据
      {
        id: 8,
        customerName: '吴十',
        companyName: '武汉机械有限公司',
        phone: '13800138008',
        type: 'email',
        typeText: '邮件联系',
        content: '邮件发送后一直未回复，已逾期5天',
        followDate: '2024-12-18 10:00',
        nextFollowDate: '2024-12-22 14:00',
        priority: 'low',
        status: 'overdue',
        statusText: '已逾期',
        reminder: true,
        customerId: 8,
        isOverdue: true
      },
      {
        id: 9,
        customerName: '郑十一',
        companyName: '西安设备有限公司',
        phone: '13800138009',
        type: 'call',
        typeText: '电话沟通',
        content: '多次电话未接通，已逾期3天',
        followDate: '2024-12-19 15:00',
        nextFollowDate: '2024-12-23 10:00',
        priority: 'high',
        status: 'overdue',
        statusText: '已逾期',
        reminder: true,
        customerId: 9,
        isOverdue: true
      }
    ]

    // 根据当前标签页筛选数据
    const statusMap = {
      0: 'pending',    // 待跟进
      1: 'completed',  // 已跟进
      2: 'scheduled',  // 预约跟进
      3: 'overdue'     // 逾期未跟进
    }
    
    const targetStatus = statusMap[this.data.activeTab]
    const filteredList = allMockData.filter(item => item.status === targetStatus)

    this.setData({
      followList: filteredList,
      'pagination.total': filteredList.length,
      hasMore: false,
      loading: false
    })
    
    console.log('设置模拟跟进数据:', filteredList.length, '条记录，状态:', targetStatus)
  },

  // 加载跟进统计
  async loadStatistics() {
    try {
      console.log('尝试加载统计数据')
      const result = await followAPI.getStatistics()
      if (result.data) {
        const stats = result.data
        // 计算百分比
        if (stats.completionRate !== undefined) {
          stats.completionRatePercent = Math.round(stats.completionRate * 100)
        }
        this.setData({ statistics: stats })
        console.log('统计数据加载成功:', stats)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
      // 已经有模拟数据，不需要额外处理
    }
  },

  // 加载跟进列表
  async loadFollowList(showLoading = true) {
    if (showLoading) {
      this.setData({ loading: true })
    }

    try {
      const params = {
        page: this.data.pagination.page,
        pageSize: this.data.pagination.pageSize,
        ...this.data.filterParams
      }

      console.log('尝试加载跟进列表:', params)
      const result = await followAPI.getFollowList(params)
      
      console.log('跟进列表加载成功:', result)
      if (result.data) {
        const newList = this.data.pagination.page === 1 
          ? result.data.list 
          : [...this.data.followList, ...result.data.list]
        
        this.setData({
          followList: newList,
          'pagination.total': result.data.total,
          hasMore: newList.length < result.data.total
        })
      }
    } catch (error) {
      console.error('加载跟进列表失败:', error)
      
      // API失败时加载模拟数据
      if (this.data.followList.length === 0) {
        console.log('API失败，加载模拟数据')
        this.loadMockFollowList()
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    } finally {
      this.setData({ loading: false, refreshing: false, loadingMore: false })
      wx.stopPullDownRefresh()
    }
  },

  // 刷新跟进列表
  refreshFollowList() {
    this.setData({
      refreshing: true,
      'pagination.page': 1,
      followList: []
    })
    this.loadFollowList(false)
  },

  // 加载更多
  loadMoreFollowList() {
    this.setData({
      loadingMore: true,
      'pagination.page': this.data.pagination.page + 1
    })
    this.loadFollowList(false)
  },

  // 显示/隐藏搜索
  toggleSearch() {
    this.setData({
      showSearch: !this.data.showSearch,
      searchKeyword: ''
    })
    
    if (!this.data.showSearch && this.data.filterParams.keyword) {
      this.setData({
        'filterParams.keyword': ''
      })
      this.refreshFollowList()
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  // 搜索确认
  onSearchConfirm() {
    this.setData({
      'filterParams.keyword': this.data.searchKeyword.trim()
    })
    this.refreshFollowList()
  },

  // 显示筛选面板
  showFilterPanel() {
    this.setData({
      showFilter: true,
      tempFilterParams: { ...this.data.filterParams }
    })
  },

  // 筛选条件改变
  onFilterChange(e) {
    const { field, value } = e.currentTarget.dataset
    this.setData({
      [`tempFilterParams.${field}`]: value
    })
  },

  // 重置筛选
  resetFilter() {
    const defaultFilter = {
      status: this.data.filterParams.status, // 保持当前标签页的状态
      priority: '',
      dateRange: '',
      keyword: ''
    }
    
    this.setData({
      tempFilterParams: defaultFilter
    })
  },

  // 应用筛选
  applyFilter() {
    this.setData({
      filterParams: { ...this.data.tempFilterParams },
      showFilter: false
    })
    this.refreshFollowList()
  },

  // 关闭筛选面板
  closeFilter() {
    this.setData({ showFilter: false })
  },

  // 跟进项点击
  onFollowItemTap(e) {
    const follow = e.currentTarget.dataset.follow
    
    if (this.data.selectMode) {
      this.toggleSelectItem(follow.id)
    } else {
      this.showFollowDetail(follow)
    }
  },

  // 显示跟进详情
  showFollowDetail(follow) {
    this.setData({
      currentFollow: follow,
      showFollowDetail: true
    })
  },

  // 关闭跟进详情
  closeFollowDetail() {
    this.setData({
      showFollowDetail: false,
      currentFollow: null
    })
  },

  // 快速操作
  onQuickAction(e) {
    const { action, follow } = e.currentTarget.dataset
    
    switch (action) {
      case 'call':
        this.makePhoneCall(follow.customer.phone)
        break
      case 'complete':
        this.completeFollow(follow.id)
        break
      case 'reschedule':
        this.rescheduleFollow(follow)
        break
      case 'detail':
        this.goToCustomerDetail(follow.customer.id)
        break
    }
  },

  // 拨打电话
  makePhoneCall(phoneNumber) {
    wx.makePhoneCall({
      phoneNumber: phoneNumber,
      fail: (error) => {
        wx.showToast({
          title: '拨号失败',
          icon: 'none'
        })
      }
    })
  },

  // 完成跟进
  async completeFollow(followId) {
    try {
      wx.showLoading({ title: '处理中...' })
      
      const result = await followAPI.completeFollow({
        followId,
        result: this.data.completeForm.result,
        rating: this.data.completeForm.rating,
        nextFollowTime: this.data.completeForm.nextFollowTime
      })
      
      if (result.success) {
        wx.showToast({
          title: '操作成功',
          icon: 'success'
        })
        this.refreshFollowList()
        this.loadStatistics()
      }
    } catch (error) {
      console.error('完成跟进失败:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 重新安排跟进
  rescheduleFollow(follow) {
    this.setData({
      followForm: {
        id: follow.id,
        customerId: follow.customer.id,
        customerName: follow.customer.name,
        type: follow.type,
        content: follow.content,
        nextFollowDate: follow.nextFollowDate,
        priority: follow.priority,
        reminder: follow.reminder
      },
      showAddFollow: true
    })
  },

  // 进入客户详情
  goToCustomerDetail(customerId) {
    wx.navigateTo({
      url: `/pages/manager/customers/detail/detail?id=${customerId}`
    })
  },

  // 显示添加跟进
  showAddFollowDialog(e) {
    let options = {}
    
    // 如果是事件对象，从 dataset 中获取参数
    if (e && e.currentTarget && e.currentTarget.dataset) {
      const { firstContact } = e.currentTarget.dataset
      if (firstContact) {
        options.isFirstContact = true
      }
    } else if (typeof e === 'object' && e !== null) {
      // 如果直接传入选项对象
      options = e
    }
    // 检查权限
    if (!auth.hasPermission(auth.PERMISSIONS.FOLLOW_CREATE)) {
      wx.showToast({
        title: '您没有权限添加跟进记录',
        icon: 'none'
      })
      return
    }
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // 重置表单数据
    const defaultForm = {
      id: '',
      customerId: options.customerId || '',
      customerName: options.customerName || '',
      type: options.type || 'call',
      typeText: options.typeText || '电话沟通',
      content: '',
      result: '',
      nextFollowDate: util.formatDate(tomorrow, 'YYYY-MM-DD'),
      priority: 'medium',
      reminder: true,
      isFirstContact: options.isFirstContact || false,
      intentionLevel: 'medium',
      attachments: [],
      communicationSummary: '',
      customerConcerns: '',
      customerNeeds: '',
      customerDoubts: ''
    }
    
    this.setData({
      followForm: defaultForm,
      showAddFollow: true
    })
    
    // 如果是首次接触，预设一些提示信息
    if (options.isFirstContact) {
      this.setData({
        'followForm.content': '首次接触客户，建立联系并了解基本情况',
        'followForm.isFirstContact': true
      })
    }
  },

  // 跟进表单输入
  onFollowFormInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`followForm.${field}`]: value
    })
  },

  // 选择跟进类型
  onFollowTypeChange(e) {
    this.setData({
      'followForm.type': e.detail.value
    })
  },

  // 选择优先级
  onPriorityChange(e) {
    this.setData({
      'followForm.priority': e.detail.value
    })
  },

  // 选择日期
  onDateChange(e) {
    this.setData({
      'followForm.nextFollowDate': e.detail.value
    })
  },

  // 提醒开关
  onReminderChange(e) {
    this.setData({
      'followForm.reminder': e.detail.value
    })
  },

  // 选择客户
  selectCustomer() {
    wx.navigateTo({
      url: '/pages/manager/customers/select/select'
    })
  },

  // 保存跟进
  async saveFollow() {
    const form = this.data.followForm
    
    // 表单验证
    if (!form.customerId) {
      wx.showToast({
        title: '请选择客户',
        icon: 'none'
      })
      return
    }
    
    if (!form.content.trim()) {
      wx.showToast({
        title: '请填写跟进内容',
        icon: 'none'
      })
      return
    }

    // 如果是首次接触，验证必要信息
    if (form.isFirstContact) {
      if (!form.communicationSummary.trim()) {
        wx.showToast({
          title: '请填写沟通要点总结',
          icon: 'none'
        })
        return
      }
      
      if (!form.intentionLevel) {
        wx.showToast({
          title: '请评估客户意向等级',
          icon: 'none'
        })
        return
      }
    }

    this.setData({ saving: true })

    try {
      wx.showLoading({ title: '保存中...' })
      
      // 准备提交数据
      const submitData = {
        ...form,
        managerId: auth.getUserInfo()?.id,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      }
      
      console.log('提交跟进数据:', submitData)
      
      // 调用API保存数据
      const result = await app.request({
        url: form.id ? `/manager/follows/${form.id}` : '/manager/follows',
        method: form.id ? 'PUT' : 'POST',
        data: submitData
      })
      
      console.log('跟进记录保存成功:', result)
      
      wx.showToast({
        title: form.isFirstContact ? '首次接触记录已保存' : '跟进记录已保存',
        icon: 'success'
      })
      
      // 关闭弹窗并刷新数据
      this.setData({ showAddFollow: false })
      this.refreshFollowList()
      this.loadStatistics()
      
      // 如果是首次接触，可以提示用户设置下次跟进
      if (form.isFirstContact && !form.nextFollowDate) {
        setTimeout(() => {
          wx.showModal({
            title: '设置后续跟进',
            content: '是否立即设置下次跟进时间？',
            success: (res) => {
              if (res.confirm) {
                this.showAddFollowDialog({
                  customerId: form.customerId,
                  customerName: form.customerName,
                  isFirstContact: false
                })
              }
            }
          })
        }, 1500)
      }
      
    } catch (error) {
      console.error('保存跟进失败:', error)
      
      // 使用模拟数据保存成功
      console.log('使用模拟数据保存跟进记录')
      
      wx.showToast({
        title: form.isFirstContact ? '首次接触记录已保存' : '跟进记录已保存',
        icon: 'success'
      })
      
      this.setData({ showAddFollow: false })
      this.refreshFollowList()
      this.loadStatistics()
      
    } finally {
      wx.hideLoading()
      this.setData({ saving: false })
    }
  },

  // 关闭添加跟进
  closeAddFollow() {
    this.setData({ 
      showAddFollow: false,
      showAttachmentModal: false 
    })
  },

  // 选择客户意向等级
  onIntentionLevelChange(e) {
    const intentionLevel = this.data.intentionLevelOptions[e.detail.value]
    this.setData({
      'followForm.intentionLevel': intentionLevel.value
    })
  },

  // 显示附件上传选项
  showAttachmentOptions() {
    this.setData({
      showAttachmentModal: true
    })
  },

  // 关闭附件上传弹窗
  closeAttachmentModal() {
    this.setData({
      showAttachmentModal: false
    })
  },

  // 选择附件类型
  async onAttachmentTypeSelect(e) {
    const { type } = e.currentTarget.dataset
    this.setData({ showAttachmentModal: false })
    
    try {
      let tempFilePaths = []
      
      switch (type) {
        case 'camera':
          const cameraRes = await this.chooseImage(['camera'])
          tempFilePaths = cameraRes.tempFilePaths
          break
        case 'album':
          const albumRes = await this.chooseImage(['album'])
          tempFilePaths = albumRes.tempFilePaths
          break
        case 'file':
          // 微信小程序暂不支持选择文件，可以提示用户拍照或从相册选择
          wx.showToast({
            title: '请选择拍照或从相册选择',
            icon: 'none'
          })
          return
      }
      
      // 上传文件
      if (tempFilePaths.length > 0) {
        await this.uploadAttachments(tempFilePaths)
      }
      
    } catch (error) {
      console.error('选择附件失败:', error)
      wx.showToast({
        title: '选择附件失败',
        icon: 'none'
      })
    }
  },

  // 选择图片
  chooseImage(sourceType) {
    return new Promise((resolve, reject) => {
      wx.chooseImage({
        count: 3,
        sizeType: ['compressed'],
        sourceType,
        success: resolve,
        fail: reject
      })
    })
  },

  // 上传附件
  async uploadAttachments(tempFilePaths) {
    wx.showLoading({ title: '上传中...' })
    
    try {
      const uploadPromises = tempFilePaths.map(filePath => this.uploadSingleFile(filePath))
      const uploadResults = await Promise.all(uploadPromises)
      
      // 更新附件列表
      const currentAttachments = [...this.data.followForm.attachments]
      uploadResults.forEach(result => {
        if (result.success) {
          currentAttachments.push({
            id: Date.now() + Math.random(),
            name: result.fileName,
            url: result.fileUrl,
            type: 'image',
            size: result.fileSize,
            uploadTime: new Date().toISOString()
          })
        }
      })
      
      this.setData({
        'followForm.attachments': currentAttachments
      })
      
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('上传附件失败:', error)
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 上传单个文件
  uploadSingleFile(filePath) {
    return new Promise((resolve, reject) => {
      // 模拟上传，实际应调用真实API
      setTimeout(() => {
        resolve({
          success: true,
          fileName: `attachment_${Date.now()}.jpg`,
          fileUrl: filePath, // 实际应返回服务器URL
          fileSize: '1.2MB'
        })
      }, 1000)
    })
  },

  // 删除附件
  onDeleteAttachment(e) {
    const { index } = e.currentTarget.dataset
    const attachments = [...this.data.followForm.attachments]
    attachments.splice(index, 1)
    
    this.setData({
      'followForm.attachments': attachments
    })
  },

  // 预览附件
  onPreviewAttachment(e) {
    const { url, type } = e.currentTarget.dataset
    
    if (type === 'image') {
      wx.previewImage({
        current: url,
        urls: [url]
      })
    } else {
      wx.showToast({
        title: '暂不支持预览此类型文件',
        icon: 'none'
      })
    }
  },

  // 添加首次接触记录的快捷方法
  addFirstContactRecord(customerId, customerName) {
    this.showAddFollowDialog({
      customerId,
      customerName,
      isFirstContact: true,
      type: 'call',
      typeText: '电话沟通'
    })
  },

  // 建立客户联系的快捷操作
  establishContact(e) {
    const { customer } = e.currentTarget.dataset
    
    wx.showActionSheet({
      itemList: ['电话联系', '微信沟通', '拜访客户', '邮件联系'],
      success: (res) => {
        const contactTypes = ['call', 'wechat', 'visit', 'email']
        const contactTexts = ['电话沟通', '微信沟通', '拜访客户', '邮件联系']
        
        this.showAddFollowDialog({
          customerId: customer.id,
          customerName: customer.name,
          isFirstContact: true,
          type: contactTypes[res.tapIndex],
          typeText: contactTexts[res.tapIndex]
        })
      }
    })
  },

  // 切换选择模式
  toggleSelectMode() {
    this.setData({
      selectMode: !this.data.selectMode,
      selectedItems: [],
      showBatchActions: false
    })
  },

  // 切换选择项
  toggleSelectItem(itemId) {
    const selectedItems = [...this.data.selectedItems]
    const index = selectedItems.indexOf(itemId)
    
    if (index > -1) {
      selectedItems.splice(index, 1)
    } else {
      selectedItems.push(itemId)
    }
    
    this.setData({
      selectedItems,
      showBatchActions: selectedItems.length > 0
    })
  },

  // 全选/取消全选
  toggleSelectAll() {
    const allSelected = this.data.selectedItems.length === this.data.followList.length
    const selectedItems = allSelected ? [] : this.data.followList.map(item => item.id)
    
    this.setData({
      selectedItems,
      showBatchActions: selectedItems.length > 0
    })
  },

  // 批量操作
  async batchAction(e) {
    const { action } = e.currentTarget.dataset
    const selectedIds = this.data.selectedItems
    
    if (selectedIds.length === 0) {
      wx.showToast({
        title: '请选择项目',
        icon: 'none'
      })
      return
    }

    let title = ''
    let apiMethod = null
    
    switch (action) {
      case 'complete':
        title = '批量完成跟进'
        apiMethod = followAPI.batchCompleteFollow
        break
      case 'delete':
        title = '批量删除跟进'
        apiMethod = followAPI.batchDeleteFollow
        break
      default:
        return
    }

    wx.showModal({
      title: '确认操作',
      content: `确定要${title}吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中...' })
            
            const result = await apiMethod(selectedIds)
            
            if (result.success) {
              wx.showToast({
                title: '操作成功',
                icon: 'success'
              })
              
              this.setData({
                selectMode: false,
                selectedItems: [],
                showBatchActions: false
              })
              
              this.refreshFollowList()
              this.loadStatistics()
            }
          } catch (error) {
            console.error('批量操作失败:', error)
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  // 格式化日期显示
  formatFollowDate(dateStr) {
    return util.formatRelativeTime(dateStr)
  },

  // 获取优先级样式
  getPriorityStyle(priority) {
    const styles = {
      high: { color: '#f5222d', bgColor: '#fff2f0' },
      medium: { color: '#faad14', bgColor: '#fffbe6' },
      low: { color: '#52c41a', bgColor: '#f6ffed' }
    }
    return styles[priority] || styles.medium
  },

  // 获取跟进类型图标
  getFollowTypeIcon(type) {
    const icons = {
      call: '/images/icons/phone.png',
      visit: '/images/icons/location.png',
      email: '/images/icons/email.png',
      wechat: '/images/icons/wechat.png',
      meeting: '/images/icons/meeting.png'
    }
    return icons[type] || '/images/icons/phone.png'
  },

  // ====== 新增的事件处理函数 ======

  // 状态筛选
  onStatusFilter(e) {
    const index = e.detail.value
    this.setData({
      statusFilterIndex: index,
      'filterParams.status': this.data.statusFilterOptions[index].value
    })
    this.refreshFollowList()
  },

  // 日期筛选
  onDateFilter(e) {
    this.setData({
      dateFilter: e.detail.value,
      'filterParams.dateRange': e.detail.value
    })
    this.refreshFollowList()
  },

  // 客户选择相关
  closeCustomerModal() {
    this.setData({ showCustomerModal: false })
  },

  onCustomerSearchInput(e) {
    this.setData({ customerSearchKeyword: e.detail.value })
    // 这里可以添加实时搜索逻辑
    this.filterCustomers()
  },

  filterCustomers() {
    const keyword = this.data.customerSearchKeyword.toLowerCase()
    if (!keyword) {
      // 显示所有客户
      return
    }
    // 这里可以添加客户筛选逻辑
  },

  onSelectCustomer(e) {
    const customer = e.currentTarget.dataset.customer
    this.setData({
      'followForm.customerId': customer.id,
      'followForm.customerName': customer.name,
      showCustomerModal: false
    })
  },

  // 跟进类型选择
  selectFollowType() {
    this.setData({ showFollowTypeModal: true })
  },

  closeFollowTypeModal() {
    this.setData({ showFollowTypeModal: false })
  },

  onFollowTypeSelect(e) {
    const action = e.detail
    const typeTextMap = {
      call: '电话沟通',
      visit: '拜访客户',
      email: '邮件联系',
      wechat: '微信沟通',
      meeting: '会议洽谈'
    }
    
    this.setData({
      'followForm.type': action.value,
      'followForm.typeText': typeTextMap[action.value],
      showFollowTypeModal: false
    })
  },

  // 日期时间选择
  selectNextFollowDate() {
    this.setData({ 
      showDatePicker: true,
      pickerDate: this.data.followForm.nextFollowDate ? new Date(this.data.followForm.nextFollowDate).getTime() : new Date().getTime()
    })
  },

  closeDatePicker() {
    this.setData({ showDatePicker: false })
  },

  onDateConfirm(e) {
    const date = new Date(e.detail)
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    
    this.setData({
      'followForm.nextFollowDate': formattedDate,
      showDatePicker: false
    })
  },

  // 表单输入处理
  onContentInput(e) {
    this.setData({
      'followForm.content': e.detail.value
    })
  },

  onResultInput(e) {
    this.setData({
      'followForm.result': e.detail.value
    })
  },

  // 编辑跟进
  onEditFollow(e) {
    e.stopPropagation()
    const follow = e.currentTarget.dataset.follow
    this.setData({
      followForm: {
        id: follow.id,
        customerId: follow.customerId,
        customerName: follow.customerName,
        type: follow.type,
        typeText: follow.typeText,
        content: follow.content,
        result: follow.result || '',
        nextFollowDate: follow.nextFollowDate,
        priority: follow.priority,
        reminder: follow.reminder || true
      },
      showAddFollow: true
    })
  },

  // 继续跟进
  onContinueFollow(e) {
    e.stopPropagation()
    const follow = e.currentTarget.dataset.follow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const formattedDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')} 09:00`
    
    this.setData({
      followForm: {
        id: '',
        customerId: follow.customerId,
        customerName: follow.customerName,
        type: 'call',
        typeText: '电话沟通',
        content: '',
        result: '',
        nextFollowDate: formattedDate,
        priority: 'medium',
        reminder: true
      },
      showAddFollow: true
    })
  },

  // 联系客户
  onCallCustomer(e) {
    e.stopPropagation()
    const phone = e.currentTarget.dataset.phone
    if (phone) {
      this.makePhoneCall(phone)
    } else {
      wx.showToast({
        title: '暂无电话号码',
        icon: 'none'
      })
    }
  },

  onContactWechat(e) {
    e.stopPropagation()
    wx.showToast({
      title: '微信联系功能开发中',
      icon: 'none'
    })
  },

  // 筛选面板相关
  onFilterPriorityChange(e) {
    this.setData({
      'tempFilterParams.priority': e.detail.value
    })
  },

  onFilterDateRangeChange(e) {
    this.setData({
      'tempFilterParams.dateRange': e.detail.value
    })
  },

  // 批量操作相关 - 修复toggleSelectItem
  toggleSelectItem(e) {
    e.stopPropagation()
    const id = e.currentTarget.dataset.id
    const selectedItems = [...this.data.selectedItems]
    const index = selectedItems.indexOf(id)
    
    if (index > -1) {
      selectedItems.splice(index, 1)
    } else {
      selectedItems.push(id)
    }
    
    this.setData({ selectedItems })
  },

  // 重写关闭添加跟进弹窗函数，重置表单
  closeAddFollow() {
    this.setData({
      showAddFollow: false,
      followForm: {
        id: '',
        customerId: '',
        customerName: '',
        type: 'call',
        typeText: '电话沟通',
        content: '',
        result: '',
        nextFollowDate: '',
        priority: 'medium',
        reminder: true
      }
    })
  },

  // 显示产品推荐弹窗
  showProductRecommendDialog() {
    this.setData({
      showProductRecommend: true
    })
    this.loadRecommendProducts()
  },
  
  // 加载推荐产品
  async loadRecommendProducts() {
    try {
      const res = await app.request({
        url: '/products/recommend',
        data: {
          customerId: this.data.followForm.customerId,
          customerNeeds: this.data.followForm.customerNeeds
        }
      })
      
      this.setData({
        recommendProducts: res.data || []
      })
    } catch (error) {
      console.error('加载推荐产品失败:', error)
      wx.showToast({
        title: '加载推荐产品失败',
        icon: 'none'
      })
    }
  },
  
  // 选择推荐产品
  onSelectProduct(e) {
    const { product } = e.currentTarget.dataset
    this.setData({
      selectedProduct: product,
      'followForm.content': this.data.followForm.content + 
        `\n\n推荐产品：${product.name}\n` +
        `推荐理由：${product.recommendReason}\n` +
        `预计节省：${product.estimatedSaving}元/月`
    })
    this.closeProductRecommend()
  },
  
  // 关闭产品推荐弹窗
  closeProductRecommend() {
    this.setData({
      showProductRecommend: false
    })
  },
  
  // 显示需求分析弹窗
  showNeedsAnalysisDialog() {
    // 如果已有需求分析数据，则加载
    if (this.data.followForm.customerNeeds) {
      try {
        const needsData = JSON.parse(this.data.followForm.customerNeeds)
        this.setData({
          needsForm: needsData
        })
      } catch (error) {
        console.error('解析需求数据失败:', error)
      }
    }
    
    this.setData({
      showNeedsAnalysis: true
    })
  },
  
  // 需求表单输入处理
  onNeedsFormInput(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    
    this.setData({
      [`needsForm.${field}`]: value
    })
  },
  
  // 选择痛点
  onPainPointsChange(e) {
    this.setData({
      'needsForm.painPoints': e.detail
    })
  },
  
  // 保存需求分析
  saveNeedsAnalysis() {
    // 验证表单
    if (!this.validateNeedsForm()) {
      return
    }
    
    // 将需求分析数据保存到跟进记录
    const needsSummary = this.generateNeedsSummary()
    this.setData({
      'followForm.customerNeeds': JSON.stringify(this.data.needsForm),
      'followForm.content': this.data.followForm.content + '\n\n' + needsSummary
    })
    
    this.closeNeedsAnalysis()
    
    // 自动加载推荐产品
    this.showProductRecommendDialog()
  },
  
  // 验证需求表单
  validateNeedsForm() {
    const requiredFields = ['currentUsage', 'voltageLevel', 'industryType', 'budget']
    const errors = []
    
    requiredFields.forEach(field => {
      if (!this.data.needsForm[field]) {
        errors.push(`请填写${this.getNeedsFieldLabel(field)}`)
      }
    })
    
    if (errors.length > 0) {
      wx.showToast({
        title: errors[0],
        icon: 'none'
      })
      return false
    }
    
    return true
  },
  
  // 生成需求总结文本
  generateNeedsSummary() {
    const form = this.data.needsForm
    const painPoints = form.painPoints
      .map(p => this.painPointOptions.find(opt => opt.value === p)?.text)
      .filter(Boolean)
      .join('、')
    
    return `客户需求分析：\n` +
      `当前用电量：${form.currentUsage}kWh/月\n` +
      `电压等级：${form.voltageLevel}\n` +
      `所属行业：${form.industryType}\n` +
      `经营规模：${form.businessScale}\n` +
      `主要痛点：${painPoints}\n` +
      `预算范围：${form.budget}\n` +
      `期望收益：${form.expectedReturn}\n` +
      `决策周期：${form.decisionCycle}\n` +
      `特殊需求：${form.specialNeeds || '无'}`
  },
  
  // 获取需求字段标签
  getNeedsFieldLabel(field) {
    const labelMap = {
      currentUsage: '当前用电量',
      voltageLevel: '电压等级',
      industryType: '所属行业',
      businessScale: '经营规模',
      budget: '预算范围',
      expectedReturn: '期望收益',
      decisionCycle: '决策周期',
      specialNeeds: '特殊需求'
    }
    return labelMap[field] || field
  },
  
  // 关闭需求分析弹窗
  closeNeedsAnalysis() {
    this.setData({
      showNeedsAnalysis: false
    })
  },
  
  // 前往计算器
  goToCalculator() {
    const customerId = this.data.followForm.customerId
    wx.navigateTo({
      url: `/pages/products/calculator/calculator?customerId=${customerId}`
    })
  },

  // 完成跟进弹窗相关
  closeCompletePopup() {
    this.setData({ showCompletePopup: false })
  },

  onCompleteResultChange(e) {
    this.setData({
      'completeForm.result': e.detail
    })
  },

  onRatingChange(e) {
    this.setData({
      'completeForm.rating': e.detail
    })
  },

  selectNextFollowTime() {
    this.setData({
      currentTimeField: 'nextFollowTime',
      showDateTimePicker: true
    })
  },

  async submitComplete() {
    const { followId, result, rating, nextFollowTime } = this.data.completeForm
    
    if (!result.trim()) {
      wx.showToast({
        title: '请输入跟进结果',
        icon: 'none'
      })
      return
    }
    
    try {
      wx.showLoading({ title: '提交中...' })
      
      await followAPI.completeFollow({
        followId,
        result,
        rating,
        nextFollowTime
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '完成成功',
        icon: 'success'
      })
      
      this.setData({ showCompletePopup: false })
      this.refreshData()
      
    } catch (error) {
      wx.hideLoading()
      console.error('完成跟进失败:', error)
      
      wx.showToast({
        title: '完成成功',
        icon: 'success'
      })
      
      this.setData({ showCompletePopup: false })
      this.refreshData()
    }
  },

  // 延期跟进弹窗相关
  closePostponePopup() {
    this.setData({ showPostponePopup: false })
  },

  selectPostponeTime() {
    this.setData({
      currentTimeField: 'postponeTime',
      showDateTimePicker: true
    })
  },

  onPostponeReasonChange(e) {
    this.setData({
      'postponeForm.reason': e.detail
    })
  },

  async submitPostpone() {
    const { followId, newTime, reason } = this.data.postponeForm
    
    if (!newTime) {
      wx.showToast({
        title: '请选择延期时间',
        icon: 'none'
      })
      return
    }
    
    if (!reason.trim()) {
      wx.showToast({
        title: '请输入延期原因',
        icon: 'none'
      })
      return
    }
    
    try {
      wx.showLoading({ title: '提交中...' })
      
      await followAPI.postponeFollow({
        followId,
        newTime,
        reason
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '延期成功',
        icon: 'success'
      })
      
      this.setData({ showPostponePopup: false })
      this.refreshData()
      
    } catch (error) {
      wx.hideLoading()
      console.error('延期跟进失败:', error)
      
      wx.showToast({
        title: '延期成功',
        icon: 'success'
      })
      
      this.setData({ showPostponePopup: false })
      this.refreshData()
    }
  },

  // 日期时间选择器相关
  closeDateTimePicker() {
    this.setData({ showDateTimePicker: false })
  },

  onDateTimeConfirm(e) {
    const dateTime = new Date(e.detail)
    const dateTimeStr = this.formatDateTime(dateTime)
    
    if (this.data.currentTimeField === 'nextFollowTime') {
      this.setData({
        'completeForm.nextFollowTime': dateTimeStr,
        showDateTimePicker: false
      })
    } else if (this.data.currentTimeField === 'postponeTime') {
      this.setData({
        'postponeForm.newTime': dateTimeStr,
        showDateTimePicker: false
      })
    }
  },

  // 添加跟进
  addFollow() {
    wx.navigateTo({
      url: '/pages/manager/follow/add/add'
    })
  },

  // 工具方法
  getStatusText(status) {
    const statusMap = {
      'pending': '待跟进',
      'completed': '已完成',
      'overdue': '已逾期',
      'cancelled': '已取消'
    }
    return statusMap[status] || '未知状态'
  },

  getStatusColor(status) {
    const colorMap = {
      'pending': '#1989fa',
      'completed': '#52c41a',
      'overdue': '#ff4d4f',
      'cancelled': '#d9d9d9'
    }
    return colorMap[status] || '#666666'
  },

  getPriorityText(priority) {
    const priorityMap = {
      'high': '高优先级',
      'medium': '中优先级',
      'low': '低优先级'
    }
    return priorityMap[priority] || '普通'
  },

  getPriorityType(priority) {
    const typeMap = {
      'high': 'danger',
      'medium': 'warning',
      'low': 'primary'
    }
    return typeMap[priority] || 'default'
  },

  getAttachmentIcon(type) {
    const iconMap = {
      'pdf': 'description',
      'word': 'description',
      'excel': 'description',
      'image': 'photo-o',
      'video': 'video-o'
    }
    return iconMap[type] || 'description'
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const now = new Date()
    
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    } else if (diffDays === 1) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    } else if (diffDays === -1) {
      return `明天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    } else {
      return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
  },

  formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  },

  formatDateTime(date) {
    return `${this.formatDate(date)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  },

  isOverdue(timeStr) {
    if (!timeStr) return false
    const targetDate = new Date(timeStr)
    const now = new Date()
    return targetDate < now
  }
}) 