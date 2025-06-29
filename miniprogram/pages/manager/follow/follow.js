const api = require('../../../utils/api')
const util = require('../../../utils/common')

Page({
  data: {
    // 页面状态
    loading: false,
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
    searchKeyword: '',
    
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
      reminder: true
    },
    
    // 跟进类型选择
    showFollowTypeModal: false,
    followTypeActions: [
      { name: '电话沟通', value: 'call' },
      { name: '拜访客户', value: 'visit' },
      { name: '邮件联系', value: 'email' },
      { name: '微信沟通', value: 'wechat' },
      { name: '会议洽谈', value: 'meeting' }
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
    
    // 批量操作
    selectMode: false,
    selectedItems: [],
    
    // 统计数据
    statistics: {
      todayFollow: 0,
      overdueFollow: 0,
      weeklyTarget: 0,
      completionRate: 0,
      completionRatePercent: 0
    }
  },

  onLoad(options) {
    console.log('跟进管理页面onLoad开始')
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
    
    // 加载模拟数据
    this.loadMockStatistics()
    this.loadMockFollowList()
    
    // 尝试加载真实数据（但不覆盖模拟数据）
    this.loadStatistics()
    // 暂时注释掉loadFollowList，避免覆盖模拟数据
    // this.loadFollowList()
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
      const result = await api.getFollowStatistics()
      if (result.success) {
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
      const result = await api.getFollowList(params)
      
      console.log('跟进列表加载成功:', result)
      if (result.success) {
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
      
      const result = await api.updateFollowStatus({
        id: followId,
        status: 'completed',
        completedAt: new Date().toISOString()
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
  showAddFollowDialog() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    this.setData({
      followForm: {
        customerId: '',
        customerName: '',
        type: 'call',
        content: '',
        nextFollowDate: util.formatDate(tomorrow, 'YYYY-MM-DD'),
        priority: 'medium',
        reminder: true
      },
      showAddFollow: true
    })
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

    try {
      wx.showLoading({ title: '保存中...' })
      
      const result = form.id 
        ? await api.updateFollow(form.id, form)
        : await api.createFollow(form)
      
      if (result.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        
        this.setData({ showAddFollow: false })
        this.refreshFollowList()
        this.loadStatistics()
      }
    } catch (error) {
      console.error('保存跟进失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 关闭添加跟进
  closeAddFollow() {
    this.setData({ showAddFollow: false })
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
        apiMethod = api.batchCompleteFollow
        break
      case 'delete':
        title = '批量删除跟进'
        apiMethod = api.batchDeleteFollow
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
  }
}) 