const api = require('../../../utils/api')
const util = require('../../../utils/common')

Page({
  data: {
    // 页面状态
    loading: false,
    refreshing: false,
    loadingMore: false,
    hasMore: true,
    
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
      customerId: '',
      customerName: '',
      type: 'call',
      content: '',
      nextFollowDate: '',
      priority: 'medium',
      reminder: false
    },
    
    followTypes: [
      { value: 'call', text: '电话沟通', icon: 'phone' },
      { value: 'visit', text: '拜访客户', icon: 'location' },
      { value: 'email', text: '邮件联系', icon: 'email' },
      { value: 'wechat', text: '微信沟通', icon: 'wechat' },
      { value: 'meeting', text: '会议洽谈', icon: 'meeting' }
    ],
    
    // 统计数据
    statistics: {
      todayFollow: 0,
      overdueFollow: 0,
      weeklyTarget: 0,
      completionRate: 0
    }
  },

  onLoad(options) {
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
    
    this.loadStatistics()
    this.loadFollowList()
  },

  onShow() {
    // 页面显示时刷新数据
    if (this.data.followList.length > 0) {
      this.refreshFollowList()
    }
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
      this.setData({
        activeTab: index,
        'pagination.page': 1,
        followList: []
      })
      this.updateFilterByTab(index)
      this.loadFollowList()
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

  // 加载跟进统计
  async loadStatistics() {
    try {
      const result = await api.getFollowStatistics()
      if (result.success) {
        this.setData({ statistics: result.data })
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
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

      const result = await api.getFollowList(params)
      
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
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
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
  }
}) 