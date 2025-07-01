// 合同管理页面
const app = getApp()

Page({
  data: {
    // 统计数据
    statistics: {
      total: 0,
      signed: 0,
      executing: 0,
      nearExpiry: 0
    },
    
    // 搜索和筛选
    searchKeyword: '',
    currentStatus: 'all',
    selectedStatus: 'all',
    dateRange: {
      start: '',
      end: ''
    },
    
    // 状态标签
    statusTabs: [
      { value: 'all', label: '全部', icon: '📋', count: 0 },
      { value: 'pending', label: '待签署', icon: '⏳', count: 0 },
      { value: 'signed', label: '已签署', icon: '✅', count: 0 },
      { value: 'executing', label: '执行中', icon: '⚡', count: 0 },
      { value: 'expired', label: '已到期', icon: '⏰', count: 0 }
    ],
    
    // 状态选项
    statusOptions: [
      { value: 'all', label: '全部状态', icon: '📋' },
      { value: 'pending', label: '待签署', icon: '⏳' },
      { value: 'signed', label: '已签署', icon: '✅' },
      { value: 'executing', label: '执行中', icon: '⚡' },
      { value: 'completed', label: '已完成', icon: '✔️' },
      { value: 'expired', label: '已到期', icon: '⏰' }
    ],
    
    // 合同数据
    contracts: [],
    filteredContracts: [],
    
    // 弹窗状态
    filterVisible: false,
    previewVisible: false,
    previewContract: null,
    
    // 页面状态
    loading: true,
    refreshing: false,
    statusMap: {
      'pending': '待客户签署',
      'customer_signed': '待企业签署',
      'completed': '签署完成',
      'cancelled': '已取消',
      'expired': '已过期'
    },
    statusColorMap: {
      'pending': '#1989fa',
      'customer_signed': '#ff976a',
      'completed': '#07c160',
      'cancelled': '#969799',
      'expired': '#ee0a24'
    },
    isManager: false,
    
    // 分页相关
    pageNum: 1,
    pageSize: 10,
    hasMore: true,
    
    // 筛选相关
    activeTab: 'all',
    tabs: [
      { key: 'all', name: '全部' },
      { key: 'pending', name: '待签署' },
      { key: 'customer_signed', name: '待企业签署' },
      { key: 'completed', name: '已完成' }
    ]
  },

  onLoad(options) {
    this.checkUserRole()
    this.loadContracts()
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (!this.data.loading) {
      this.loadContracts()
    }
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadContracts(true).finally(() => {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    })
  },

  // 检查用户角色
  async checkUserRole() {
    try {
      const res = await app.request({
        url: '/user/role'
      })
      
      if (res.data) {
        this.setData({
          isManager: res.data.role === 'manager'
        })
      }
    } catch (error) {
      console.error('检查用户角色失败:', error)
    }
  },

  // 加载合同列表
  async loadContracts(refresh = false) {
    if (refresh) {
      this.setData({
        pageNum: 1,
        hasMore: true,
        contracts: []
      })
    }

    if (!this.data.hasMore) return

    try {
      this.setData({ loading: true })

      const { pageNum, pageSize, activeTab } = this.data
      const params = {
        pageNum,
        pageSize,
        status: activeTab === 'all' ? '' : activeTab
      }

      const res = await app.request({
        url: '/contracts',
        data: params
      })

      const { list = [], total = 0 } = res.data || {}
      const hasMore = pageNum * pageSize < total

      this.setData({
        contracts: refresh ? list : this.data.contracts.concat(list),
        hasMore,
        pageNum: hasMore ? pageNum + 1 : pageNum,
        loading: false
      })

      this.updateStatistics()
      this.filterContracts()
      
      wx.showToast({
        title: '数据加载成功',
        icon: 'success',
        duration: 1500
      })
      
    } catch (error) {
      console.error('加载合同列表失败:', error)
      console.error('错误详情:', {
        message: error.message,
        url: '/contracts'
      })
      
      // 使用模拟数据
      console.log('使用模拟合同数据')
      this.loadMockData()
      this.setData({ loading: false })
      
      wx.showToast({
        title: '已使用离线数据',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 加载模拟数据
  loadMockData() {
    const mockContracts = [
      {
        id: 1,
        contractName: '工商业电力服务合同',
        contractNumber: 'PS2024001',
        status: 'executing',
        signedDate: '2024-01-15',
        startDate: '2024-02-01',
        endDate: '2025-01-31',
        amount: 120000,
        productName: '工商业用电套餐A',
        partyAName: '电力销售有限公司',
        partyAAddress: '北京市朝阳区电力大厦',
        partyBName: '北京科技有限公司',
        partyBAddress: '北京市海淀区中关村',
        serviceContent: '提供工商业电力供应服务，包括电力配送、计量、维护等',
        paymentMethod: '按月结算'
      },
      {
        id: 2,
        contractName: '居民用电服务协议',
        contractNumber: 'PS2024002',
        status: 'signed',
        signedDate: '2024-11-20',
        startDate: '2024-12-01',
        endDate: '2025-11-30',
        amount: 36000,
        productName: '居民用电套餐B',
        partyAName: '电力销售有限公司',
        partyAAddress: '北京市朝阳区电力大厦',
        partyBName: '张先生',
        partyBAddress: '北京市西城区某小区',
        serviceContent: '提供居民用电服务，包括电力供应、抄表、维修等',
        paymentMethod: '按季度结算'
      },
      {
        id: 3,
        contractName: '农业用电合作协议',
        contractNumber: 'PS2024003',
        status: 'pending',
        signedDate: '',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        amount: 80000,
        productName: '农业用电套餐C',
        partyAName: '电力销售有限公司',
        partyAAddress: '北京市朝阳区电力大厦',
        partyBName: '绿色农业合作社',
        partyBAddress: '河北省廊坊市某农场',
        serviceContent: '提供农业生产用电服务，包括灌溉、加工等用电需求',
        paymentMethod: '按年结算'
      },
      {
        id: 4,
        contractName: '临时用电服务合同',
        contractNumber: 'PS2024004',
        status: 'expired',
        signedDate: '2024-06-01',
        startDate: '2024-06-15',
        endDate: '2024-12-15',
        amount: 25000,
        productName: '临时用电套餐D',
        partyAName: '电力销售有限公司',
        partyAAddress: '北京市朝阳区电力大厦',
        partyBName: '建筑工程有限公司',
        partyBAddress: '北京市丰台区某工地',
        serviceContent: '提供临时建筑工地用电服务',
        paymentMethod: '一次性结算'
      },
      {
        id: 5,
        contractName: '商业综合体电力合同',
        contractNumber: 'PS2024005',
        status: 'executing',
        signedDate: '2024-03-10',
        startDate: '2024-04-01',
        endDate: '2025-03-31',
        amount: 200000,
        productName: '商业用电套餐E',
        partyAName: '电力销售有限公司',
        partyAAddress: '北京市朝阳区电力大厦',
        partyBName: '购物中心管理公司',
        partyBAddress: '北京市朝阳区某商业区',
        serviceContent: '提供商业综合体全面电力服务，包括照明、空调、电梯等',
        paymentMethod: '按月结算'
      }
    ]

    this.setData({ contracts: mockContracts })
    this.updateStatistics()
    this.filterContracts()
  },

  // 更新统计数据
  updateStatistics() {
    const contracts = this.data.contracts
    const statistics = {
      total: contracts.length,
      signed: contracts.filter(c => c.status === 'signed').length,
      executing: contracts.filter(c => c.status === 'executing').length,
      nearExpiry: contracts.filter(c => this.isNearExpiry(c.endDate)).length
    }

    // 更新状态标签计数
    const statusTabs = this.data.statusTabs.map(tab => ({
      ...tab,
      count: tab.value === 'all' ? statistics.total : 
             contracts.filter(c => c.status === tab.value).length
    }))

    this.setData({ statistics, statusTabs })
  },

  // 筛选合同
  filterContracts() {
    let filtered = [...this.data.contracts]
    
    // 按状态筛选
    if (this.data.currentStatus !== 'all') {
      filtered = filtered.filter(contract => contract.status === this.data.currentStatus)
    }
    
    // 按关键词搜索
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase()
      filtered = filtered.filter(contract => 
        contract.contractName.toLowerCase().includes(keyword) ||
        contract.contractNumber.toLowerCase().includes(keyword) ||
        (contract.productName && contract.productName.toLowerCase().includes(keyword))
      )
    }
    
    // 按日期范围筛选
    if (this.data.dateRange.start && this.data.dateRange.end) {
      filtered = filtered.filter(contract => {
        if (!contract.signedDate) return false
        const signedDate = new Date(contract.signedDate)
        const startDate = new Date(this.data.dateRange.start)
        const endDate = new Date(this.data.dateRange.end)
        return signedDate >= startDate && signedDate <= endDate
      })
    }
    
    this.setData({ filteredContracts: filtered })
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    this.filterContracts()
  },

  // 搜索确认
  onSearchConfirm() {
    this.filterContracts()
  },

  // 清除搜索
  onSearchClear() {
    this.setData({ searchKeyword: '' })
    this.filterContracts()
  },

  // 状态标签点击
  onStatusTabTap(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ currentStatus: status })
    this.filterContracts()
  },

  // 显示筛选弹窗
  showFilter() {
    this.setData({ 
      filterVisible: true,
      selectedStatus: this.data.currentStatus
    })
  },

  // 隐藏筛选弹窗
  hideFilter() {
    this.setData({ filterVisible: false })
  },

  // 选择状态
  onStatusSelect(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ selectedStatus: status })
  },

  // 选择开始日期
  selectStartDate() {
    wx.showModal({
      title: '提示',
      content: '日期选择功能开发中',
      showCancel: false
    })
  },

  // 选择结束日期
  selectEndDate() {
    wx.showModal({
      title: '提示',
      content: '日期选择功能开发中',
      showCancel: false
    })
  },

  // 重置筛选
  resetFilter() {
    this.setData({
      selectedStatus: 'all',
      dateRange: { start: '', end: '' }
    })
  },

  // 应用筛选
  applyFilter() {
    this.setData({
      currentStatus: this.data.selectedStatus,
      filterVisible: false
    })
    this.filterContracts()
  },

  // 合同点击
  onContractTap(e) {
    const id = e.currentTarget.dataset.id
    const contract = this.data.contracts.find(c => c.id == id)
    if (contract) {
      this.setData({
        previewContract: contract,
        previewVisible: true
      })
    }
  },

  // 签署合同
  signContract(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认签署',
      content: '确定要签署这份合同吗？',
      success: (res) => {
        if (res.confirm) {
          // 模拟签署成功
          const contracts = this.data.contracts.map(contract => {
            if (contract.id == id) {
              return {
                ...contract,
                status: 'signed',
                signedDate: new Date().toISOString().split('T')[0]
              }
            }
            return contract
          })
          
          this.setData({ contracts })
          this.updateStatistics()
          this.filterContracts()
          
          wx.showToast({
            title: '签署成功',
            icon: 'success'
          })
        }
      }
    })
  },

  // 申请续签
  renewContract(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '申请续签',
      content: '确定要申请续签这份合同吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '续签申请已提交',
            icon: 'success'
          })
        }
      }
    })
  },

  // 预览合同
  previewContract(e) {
    const id = e.currentTarget.dataset.id
    const contract = this.data.contracts.find(c => c.id == id)
    if (contract) {
      this.setData({
        previewContract: contract,
        previewVisible: true
      })
    }
  },

  // 下载合同
  downloadContract(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({
      title: '下载功能开发中',
      icon: 'none'
    })
  },

  // 关闭预览
  closePreview() {
    this.setData({
      previewVisible: false,
      previewContract: null
    })
  },

  // 去产品页面
  goToProducts() {
    wx.switchTab({
      url: '/pages/products/index/index'
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    })
  },

  // 获取状态图标
  getStatusIcon(status) {
    const icons = {
      pending: '⏳',
      signed: '✅',
      executing: '⚡',
      completed: '✔️',
      expired: '⏰'
    }
    return icons[status] || '📋'
  },

  // 获取状态文本
  getStatusText(status) {
    const texts = {
      pending: '待签署',
      signed: '已签署',
      executing: '执行中',
      completed: '已完成',
      expired: '已到期'
    }
    return texts[status] || '未知'
  },

  // 获取空状态标题
  getEmptyTitle() {
    if (this.data.searchKeyword) {
      return '未找到相关合同'
    }
    if (this.data.currentStatus !== 'all') {
      return `暂无${this.getStatusText(this.data.currentStatus)}合同`
    }
    return '暂无合同记录'
  },

  // 获取空状态描述
  getEmptyDesc() {
    if (this.data.searchKeyword) {
      return '请尝试其他关键词搜索'
    }
    if (this.data.currentStatus !== 'all') {
      return '可以查看其他状态的合同'
    }
    return '您还没有任何合同，去看看我们的产品吧'
  },

  // 格式化金额
  formatAmount(amount) {
    if (!amount) return '0'
    return '¥' + (amount / 10000).toFixed(1) + '万'
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  },

  // 判断是否即将到期
  isNearExpiry(endDate) {
    if (!endDate) return false
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days <= 30 && days > 0
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '我的合同管理',
      path: '/pages/profile/contracts/contracts'
    }
  },

  // 切换标签
  onTabChange(e) {
    const { key } = e.detail
    this.setData({ activeTab: key })
    this.loadContracts(true)
  },

  // 查看合同详情
  viewContractDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/profile/contracts/detail/detail?id=${id}`
    })
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.loading && this.data.hasMore) {
      this.loadContracts()
    }
  }
}) 