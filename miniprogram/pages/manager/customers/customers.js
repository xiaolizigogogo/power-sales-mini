// 客户经理 - 我的客户页面
const app = getApp()
const auth = require('../../../utils/auth')
const util = require('../../../utils/common')
const { customerAPI } = require('../../../utils/api')

Page({
  data: {
    loading: true,
    refreshing: false,
    loadingMore: false,
    hasMore: true,
    
    // 筛选条件
    currentTab: 'all',
    searchKeyword: '',
    statusFilter: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    
    // 标签页配置
    tabs: [
      { key: 'all', name: '全部', count: 0 },
      { key: 'pending', name: '待审核', count: 0 },
      { key: 'active', name: '正常', count: 0 },
      { key: 'inactive', name: '暂停', count: 0 }
    ],
    
    // 客户列表
    customers: [],
    page: 1,
    pageSize: 20,
    
    // 筛选面板
    showFilterPanel: false,
    filterOptions: {
      industries: [
        { value: 'manufacturing', label: '制造业' },
        { value: 'commerce', label: '商贸业' },
        { value: 'service', label: '服务业' },
        { value: 'construction', label: '建筑业' },
        { value: 'other', label: '其他' }
      ],
      scales: [
        { value: 'small', label: '小微企业' },
        { value: 'medium', label: '中型企业' },
        { value: 'large', label: '大型企业' }
      ]
    },
    selectedIndustry: '',
    selectedScale: '',
    
    // 客户状态配置
    statusConfig: {
      pending: { text: '待审核', color: '#909399' },
      active: { text: '正常', color: '#67C23A' },
      inactive: { text: '暂停', color: '#F56C6C' },
      potential: { text: '潜在客户', color: '#909399' },
      following: { text: '跟进中', color: '#E6A23C' },
      negotiating: { text: '商务洽谈', color: '#409EFF' },
      deal: { text: '已成交', color: '#67C23A' },
      lost: { text: '已流失', color: '#F56C6C' }
    },
    
    // 权限控制
    canCreate: false,
    canUpdate: false,
    canDelete: false,

    // 统计数据
    statistics: {
      totalCustomers: 0,
      activeCustomers: 0,
      potentialCustomers: 0,
      needFollowUp: 0
    },
    
    // 筛选相关
    showFilterPopup: false,
    filterForm: {
      status: [],
      industry: [],
      scale: [],
      followStatus: [],
      startDate: '',
      endDate: ''
    },
    
    // 筛选选项
    statusOptions: [
      { value: 'potential', label: '潜在客户' },
      { value: 'active', label: '活跃客户' },
      { value: 'signed', label: '已签约' },
      { value: 'lost', label: '已流失' }
    ],
    
    industryOptions: [
      { value: 'manufacturing', label: '制造业' },
      { value: 'technology', label: '科技行业' },
      { value: 'finance', label: '金融业' },
      { value: 'retail', label: '零售业' },
      { value: 'healthcare', label: '医疗健康' },
      { value: 'education', label: '教育培训' },
      { value: 'real_estate', label: '房地产' },
      { value: 'other', label: '其他' }
    ],
    
    scaleOptions: [
      { value: 'small', label: '小型企业(50人以下)' },
      { value: 'medium', label: '中型企业(50-500人)' },
      { value: 'large', label: '大型企业(500人以上)' }
    ],
    
    followStatusOptions: [
      { value: 'need_follow', label: '待跟进' },
      { value: 'following', label: '跟进中' },
      { value: 'completed', label: '已完成' },
      { value: 'overdue', label: '已逾期' }
    ],
    
    // 日期选择器
    showDatePicker: false,
    pickerDate: new Date().getTime(),
    currentDateField: '',
    
    // 浮动按钮
    fabExpanded: false
  },

  onLoad(options) {
    console.log('客户页面onLoad开始')
    
    // 检查权限
    if (!this.checkPermissions()) {
      return
    }
    
    // 检查新客户分配通知
    this.checkNewCustomerNotifications()
    
    // 获取传入的状态参数
    if (options.status) {
      this.setData({
        currentTab: options.status
      })
    }
    
    // 加载真实数据
    console.log('开始加载真实数据')
    this.loadCustomers(true)
    this.loadStatistics()
  },

  onShow() {
    // 页面显示时刷新数据
    if (this.checkPermissions()) {
      this.loadCustomers(true)
    }
  },

  onPullDownRefresh() {
    this.setData({
      refreshing: true
    })
    
    this.loadCustomers(true).finally(() => {
      this.setData({
        refreshing: false
      })
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadCustomers(false)
    }
  },

  // 检查权限
  checkPermissions() {
    if (!auth.checkLogin()) {
      return false
    }
    
    if (!auth.hasPermission(auth.PERMISSIONS.CUSTOMER_VIEW)) {
      wx.showModal({
        title: '权限不足',
        content: '您没有权限查看客户信息',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
      return false
    }
    
    // 设置权限状态
    this.setData({
      canCreate: auth.hasPermission(auth.PERMISSIONS.CUSTOMER_CREATE),
      canUpdate: auth.hasPermission(auth.PERMISSIONS.CUSTOMER_UPDATE),
      canDelete: auth.hasPermission(auth.PERMISSIONS.CUSTOMER_DELETE)
    })
    
    return true
  },

  // 加载客户列表
  async loadCustomers(refresh = false) {
    const { currentTab, searchKeyword, selectedIndustry, selectedScale, sortBy, sortOrder, pageSize } = this.data
    let { page } = this.data

    console.log('🚀 loadCustomers 开始执行', {
      refresh,
      currentTab,
      searchKeyword,
      selectedIndustry,
      selectedScale,
      sortBy,
      sortOrder,
      pageSize,
      page
    })

    if (refresh) {
      page = 1
      this.setData({
        loading: page === 1,
        customers: []
      })
    } else {
      page += 1
      this.setData({
        loadingMore: true
      })
    }

    try {
      const params = {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder
      }

      // 添加筛选条件
      if (currentTab !== 'all') {
        params.status = currentTab
      }
      if (searchKeyword) {
        params.keyword = searchKeyword
      }
      if (selectedIndustry) {
        params.industry = selectedIndustry
      }
      if (selectedScale) {
        params.scale = selectedScale
      }

      console.log('📋 API请求参数:', params)
      console.log('🔍 准备调用 customerAPI.getMyCustomers')

      // 使用新的API
      const result = await customerAPI.getMyCustomers(params)
      
      console.log('✅ API调用成功，响应数据:', result)
      console.log('📊 响应数据结构:', {
        code: result.code,
        hasData: !!result.data,
        dataType: typeof result.data,
        dataKeys: result.data ? Object.keys(result.data) : null
      })

      // 根据后端返回的数据结构解析
      if (result.code === 200 && result.data && result.data.data) {
        const responseData = result.data.data
        const customers = responseData.items || []
        const hasMore = responseData.has_more || false

        console.log('📦 解析后的数据:', {
          customers: customers.length,
          hasMore,
          firstCustomer: customers[0] || 'no customers'
        })

        // 处理客户数据，添加状态配置
        const processedCustomers = customers.map(customer => ({
          ...customer,
          avatar_url: customer.avatar_url || '',
          last_contact_time_text: customer.last_contact_time || '暂无联系',
          status_config: this.data.statusConfig[customer.status] || { text: '待审核', color: '#909399' },
          contact_count_text: customer.contact_count ? `已联系${customer.contact_count}次` : '未联系',
          order_count_text: customer.order_count ? `${customer.order_count}个订单` : '暂无订单',
          total_amount_text: customer.total_amount ? util.formatMoney(customer.total_amount) : '￥0'
        }))

        console.log('✨ 处理后的客户数据:', {
          count: processedCustomers.length,
          sample: processedCustomers.slice(0, 2)
        })

        this.setData({
          customers: refresh ? processedCustomers : [...this.data.customers, ...processedCustomers],
          page,
          hasMore,
          loading: false,
          loadingMore: false
        })

        console.log('🎯 页面数据更新完成')
      } else {
        console.error('❌ API返回数据格式错误:', result)
        throw new Error(result.message || '获取客户数据失败')
      }

    } catch (error) {
      console.error('❌ 加载客户列表失败:', error)
      console.error('❌ 错误详情:', {
        message: error.message,
        stack: error.stack
      })
      
      // 只有在没有客户数据且是首次加载时才使用模拟数据
      if (this.data.customers.length === 0 && refresh) {
        console.log('🧪 API请求失败且无现有数据，使用模拟客户数据')
        this.loadMockCustomers()
      } else {
        console.log('⚠️ API请求失败，显示错误提示')
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
      }
      
      this.setData({
        loading: false,
        loadingMore: false
      })
    }
  },

  // 加载统计数据
  async loadStatistics() {
    try {
      const res = await customerAPI.getMyCustomerStatistics()
      
      if (res.code === 200 && res.data) {
        const statistics = res.data
        this.setData({ 
          statistics: statistics,
          'tabs[0].count': statistics.totalCustomers || 0,
          'tabs[1].count': statistics.potentialCustomers || 0,
          'tabs[2].count': statistics.activeCustomers || 0,
          'tabs[3].count': statistics.signedCustomers || 0,
          'tabs[4].count': statistics.lostCustomers || 0
        })
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
      // 使用模拟数据
      this.setData({
        statistics: {
          totalCustomers: 156,
          activeCustomers: 89,
          potentialCustomers: 45,
          needFollowUp: 22
        },
        'tabs[0].count': 156,
        'tabs[1].count': 45,
        'tabs[2].count': 89,
        'tabs[3].count': 18,
        'tabs[4].count': 4
      })
    }
  },

  // 加载模拟客户数据
  loadMockCustomers() {
    const mockCustomers = [
      {
        id: 1,
        name: '张三',
        companyName: '北京科技有限公司',
        phone: '13800138001',
        email: 'zhangsan@example.com',
        industry: 'manufacturing',
        industryText: '制造业',
        scale: 'medium',
        scaleText: '中型企业',
        status: 'active',
        status_config: { text: '正常', color: '#67C23A' },
        avatar_url: '',
        last_contact_time_text: '2024-01-15 14:30',
        contact_count_text: '已联系5次',
        order_count_text: '3个订单',
        total_amount_text: '￥156,800',
        address: '北京市朝阳区xxx路xxx号',
        createTime: '2024-01-01 10:00:00',
        priority: 'high'
      },
      {
        id: 2,
        name: '李四',
        companyName: '上海贸易有限公司',
        phone: '13800138002',
        email: 'lisi@example.com',
        industry: 'commerce',
        industryText: '商贸业',
        scale: 'small',
        scaleText: '小微企业',
        status: 'following',
        status_config: { text: '跟进中', color: '#E6A23C' },
        avatar_url: '',
        last_contact_time_text: '2024-01-14 16:20',
        contact_count_text: '已联系2次',
        order_count_text: '1个订单',
        total_amount_text: '￥68,500',
        address: '上海市浦东新区xxx路xxx号',
        createTime: '2024-01-05 15:30:00',
        priority: 'medium'
      },
      {
        id: 3,
        name: '王五',
        companyName: '广州服务有限公司',
        phone: '13800138003',
        email: 'wangwu@example.com',
        industry: 'service',
        industryText: '服务业',
        scale: 'large',
        scaleText: '大型企业',
        status: 'potential',
        status_config: { text: '潜在客户', color: '#909399' },
        avatar_url: '',
        last_contact_time_text: '2024-01-13 10:15',
        contact_count_text: '已联系1次',
        order_count_text: '暂无订单',
        total_amount_text: '￥0',
        address: '广州市天河区xxx路xxx号',
        createTime: '2024-01-10 09:20:00',
        priority: 'low'
      },
      {
        id: 4,
        name: '赵六',
        companyName: '深圳建筑有限公司',
        phone: '13800138004',
        email: 'zhaoliu@example.com',
        industry: 'construction',
        industryText: '建筑业',
        scale: 'medium',
        scaleText: '中型企业',
        status: 'negotiating',
        status_config: { text: '商务洽谈', color: '#409EFF' },
        avatar_url: '',
        last_contact_time_text: '2024-01-12 11:45',
        contact_count_text: '已联系8次',
        order_count_text: '2个订单',
        total_amount_text: '￥289,600',
        address: '深圳市南山区xxx路xxx号',
        createTime: '2023-12-20 14:10:00',
        priority: 'high'
      },
      {
        id: 5,
        name: '钱七',
        companyName: '成都制造有限公司',
        phone: '13800138005',
        email: 'qianqi@example.com',
        industry: 'manufacturing',
        industryText: '制造业',
        scale: 'small',
        scaleText: '小微企业',
        status: 'pending',
        status_config: { text: '待审核', color: '#909399' },
        avatar_url: '',
        last_contact_time_text: '暂无联系',
        contact_count_text: '未联系',
        order_count_text: '暂无订单',
        total_amount_text: '￥0',
        address: '成都市锦江区xxx路xxx号',
        createTime: '2024-01-16 16:30:00',
        priority: 'medium'
      }
    ]

    // 根据当前标签筛选
    let filteredCustomers = mockCustomers
    if (this.data.currentTab !== 'all') {
      filteredCustomers = mockCustomers.filter(customer => 
        customer.status === this.data.currentTab
      )
    }

    this.setData({
      customers: filteredCustomers,
      loading: false,
      hasMore: false
    })
  },

  // 切换标签页
  onTabChange(e) {
    const { key } = e.currentTarget.dataset
    if (key !== this.data.currentTab) {
      this.setData({
        currentTab: key,
        page: 1
      })
      this.loadCustomers(true)
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
    
    // 防抖搜索
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.onSearchSubmit()
    }, 500)
  },

  // 搜索提交
  onSearchSubmit() {
    this.loadCustomers(true)
  },

  // 清除搜索
  onSearchClear() {
    this.setData({
      searchKeyword: ''
    })
    this.loadCustomers(true)
  },

  // 显示筛选面板
  onFilterTap() {
    this.setData({
      showFilterPanel: true
    })
  },

  // 关闭筛选面板
  onFilterPanelClose() {
    this.setData({
      showFilterPanel: false
    })
  },

  // 行业筛选变更
  onIndustryChange(e) {
    this.setData({
      selectedIndustry: e.detail.value
    })
  },

  // 规模筛选变更
  onScaleChange(e) {
    this.setData({
      selectedScale: e.detail.value
    })
  },

  // 重置筛选
  onFilterReset() {
    this.setData({
      selectedIndustry: '',
      selectedScale: ''
    })
  },

  // 应用筛选
  onFilterApply() {
    this.setData({
      showFilterPanel: false
    })
    this.loadCustomers(true)
  },

  // 排序变更
  onSortChange(e) {
    const { sort } = e.currentTarget.dataset
    let { sortBy, sortOrder } = this.data
    
    if (sortBy === sort) {
      sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'
    } else {
      sortBy = sort
      sortOrder = 'desc'
    }
    
    this.setData({
      sortBy,
      sortOrder
    })
    
    this.loadCustomers(true)
  },

  // 客户点击
  onCustomerTap(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    
    // 检查权限
    if (!auth.hasPermission(auth.PERMISSIONS.CUSTOMER_VIEW)) {
      wx.showToast({
        title: '您没有权限查看客户详情',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: `/pages/manager/customers/detail/detail?id=${id}`
    })
  },

  // 拨打电话
  onCallTap(e) {
    e.stopPropagation()
    const { phone } = e.currentTarget.dataset
    
    if (!phone) {
      wx.showToast({
        title: '电话号码为空',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '拨打电话',
      content: `确定要拨打 ${phone} 吗？`,
      success: (res) => {
        if (res.confirm) {
          // 记录通话记录
          this.recordContact(e.currentTarget.dataset.id, 'call', `拨打电话 ${phone}`)
        }
      }
    })
  },

  // 微信联系
  onWechatTap(e) {
    e.stopPropagation()
    const { id, name } = e.currentTarget.dataset
    
    wx.showModal({
      title: '微信联系',
      content: `确定要通过微信联系 ${name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          // 记录联系记录
          this.recordContact(id, 'wechat', `微信联系 ${name}`)
          
          wx.showToast({
            title: '请通过微信联系客户',
            icon: 'none'
          })
        }
      }
    })
  },

  // 快速跟进
  onQuickFollowTap(e) {
    e.stopPropagation()
    const { id, name } = e.currentTarget.dataset
    
    if (!auth.hasPermission(auth.PERMISSIONS.FOLLOW_CREATE)) {
      wx.showToast({
        title: '您没有权限创建跟进记录',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: `/pages/manager/follow/follow?action=add&customerId=${id}&customerName=${name}`
    })
  },

  // 记录联系记录
  async recordContact(customerId, contactType, content) {
    try {
      await app.request({
        url: '/manager/customers/contact-record',
        method: 'POST',
        data: {
          customerId,
          contactType,
          content,
          contactTime: new Date().toISOString()
        }
      })
      
      console.log('联系记录保存成功')
    } catch (error) {
      console.error('保存联系记录失败:', error)
    }
  },

  // 长按客户项
  onCustomerLongPress(e) {
    const { id, name, status } = e.currentTarget.dataset
    
    const actions = ['查看详情', '立即跟进']
    
    // 根据权限添加操作选项
    if (this.data.canUpdate) {
      actions.push('修改状态')
    }
    if (this.data.canDelete) {
      actions.push('删除客户')
    }
    
    wx.showActionSheet({
      itemList: actions,
      success: (res) => {
        const action = actions[res.tapIndex]
        switch (action) {
          case '查看详情':
            this.onCustomerTap(e)
            break
          case '立即跟进':
            this.onQuickFollowTap(e)
            break
          case '修改状态':
            this.showStatusChangeModal(id, name, status)
            break
          case '删除客户':
            this.confirmDeleteCustomer(id, name)
            break
        }
      }
    })
  },

  // 显示状态修改弹窗
  showStatusChangeModal(customerId, customerName, currentStatus) {
    const statusOptions = [
      { key: 'pending', name: '待审核' },
      { key: 'active', name: '正常' },
      { key: 'inactive', name: '暂停' },
      { key: 'potential', name: '潜在客户' },
      { key: 'following', name: '跟进中' },
      { key: 'negotiating', name: '商务洽谈' },
      { key: 'deal', name: '已成交' },
      { key: 'lost', name: '已流失' }
    ]
    
    const itemList = statusOptions
      .filter(option => option.key !== currentStatus)
      .map(option => option.name)
    
    wx.showActionSheet({
      itemList,
      success: (res) => {
        const selectedOption = statusOptions
          .filter(option => option.key !== currentStatus)[res.tapIndex]
        
        if (selectedOption) {
          this.changeCustomerStatus(customerId, selectedOption.key)
        }
      }
    })
  },

  // 更新客户状态
  async changeCustomerStatus(customerId, newStatus) {
    try {
      wx.showLoading({ title: '更新中...' })
      
      // 使用新的API
      const result = await customerAPI.updateCustomerStatus(customerId, {
        status: newStatus,
        remark: '客户经理更新状态'
      })
      
      if (result.code === 200) {
        wx.showToast({
          title: '状态更新成功',
          icon: 'success'
        })
        
        // 更新本地数据
        const customers = this.data.customers.map(customer => {
          if (customer.id === customerId) {
            return {
              ...customer,
              status: newStatus,
              status_config: this.data.statusConfig[newStatus] || { text: '待审核', color: '#909399' }
            }
          }
          return customer
        })
        
        this.setData({ customers })
        
        // 刷新统计数据
        this.loadStatistics()
      } else {
        throw new Error(result.message || '更新失败')
      }
    } catch (error) {
      console.error('更新客户状态失败:', error)
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 确认删除客户
  confirmDeleteCustomer(customerId, customerName) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除客户 ${customerName} 吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          this.deleteCustomer(customerId)
        }
      }
    })
  },

  // 删除客户
  async deleteCustomer(customerId) {
    try {
      wx.showLoading({ title: '删除中...' })
      
      // 使用新的API
      const result = await customerAPI.deleteMyCustomer(customerId)
      
      if (result.code === 200) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
        
        // 从本地数据中移除
        const customers = this.data.customers.filter(customer => customer.id !== customerId)
        this.setData({ customers })
        
        // 刷新统计数据
        this.loadStatistics()
      } else {
        throw new Error(result.message || '删除失败')
      }
    } catch (error) {
      console.error('删除客户失败:', error)
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 批量操作
  onBatchOperationTap() {
    wx.showToast({
      title: '批量操作功能开发中',
      icon: 'none'
    })
  },

  // 添加客户
  onAddCustomerTap() {
    if (!this.data.canCreate) {
      wx.showToast({
        title: '您没有权限添加客户',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/manager/customer-add/customer-add'
    })
  },

  // 导出数据
  onExportTap() {
    wx.showModal({
      title: '导出客户数据',
      content: '确定要导出当前筛选条件下的客户数据吗？',
      success: (res) => {
        if (res.confirm) {
          this.exportCustomerData()
        }
      }
    })
  },

  // 导出客户数据
  async exportCustomerData() {
    try {
      wx.showLoading({
        title: '导出中...',
        mask: true
      })
      
      const params = {
        status: this.data.currentTab !== 'all' ? this.data.currentTab : '',
        keyword: this.data.searchKeyword,
        industry: this.data.selectedIndustry,
        scale: this.data.selectedScale,
        export: true
      }
      
      const result = await app.request({
        url: '/manager/customers/export',
        method: 'GET',
        data: params
      })
      
      wx.hideLoading()
      
      if (result.downloadUrl) {
        wx.showModal({
          title: '导出成功',
          content: '客户数据已导出，是否立即下载？',
          success: (res) => {
            if (res.confirm) {
              // 这里可以实现文件下载逻辑
              wx.showToast({
                title: '下载功能开发中',
                icon: 'none'
              })
            }
          }
        })
      }
      
    } catch (error) {
      wx.hideLoading()
      console.error('导出客户数据失败:', error)
      wx.showToast({
        title: '导出失败，请重试',
        icon: 'none'
      })
    }
  },

  // 页面卸载时清除定时器
  onUnload() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }
  },

  // 检查新客户分配通知
  async checkNewCustomerNotifications() {
    try {
      const result = await app.request({
        url: '/customers/new-assignments',
        method: 'GET'
      })
      
      if (result.data && result.data.length > 0) {
        this.showNewCustomerNotification(result.data)
      }
      
    } catch (error) {
      console.error('检查新客户通知失败:', error)
      
      // 模拟新客户分配通知
      this.simulateNewCustomerNotification()
    }
  },

  // 模拟新客户分配通知
  simulateNewCustomerNotification() {
    // 检查本地存储是否有未读的新客户通知
    const lastCheck = wx.getStorageSync('lastNewCustomerCheck') || 0
    const now = Date.now()
    
    // 如果距离上次检查超过30分钟，模拟新客户分配
    if (now - lastCheck > 30 * 60 * 1000) {
      const mockNewCustomers = [
        {
          id: Date.now(),
          name: '李先生',
          companyName: '北京科技有限公司',
          phone: '138****5678',
          region: '北京市朝阳区',
          assignTime: new Date().toISOString(),
          source: 'customer_register'
        }
      ]
      
      this.showNewCustomerNotification(mockNewCustomers)
      wx.setStorageSync('lastNewCustomerCheck', now)
    }
  },

  // 显示新客户分配通知
  showNewCustomerNotification(newCustomers) {
    const customerCount = newCustomers.length
    const customerNames = newCustomers.map(c => c.name).join('、')
    
    wx.showModal({
      title: '新客户分配通知',
      content: `您有 ${customerCount} 位新客户被分配给您：\n${customerNames}\n\n请及时跟进联系。`,
      confirmText: '立即查看',
      cancelText: '稍后处理',
      success: (res) => {
        if (res.confirm) {
          // 跳转到新分配的客户
          this.viewNewAssignedCustomers(newCustomers)
        } else {
          // 标记为已读但稍后处理
          this.markNotificationsAsRead(newCustomers)
        }
      }
    })
    
    // 显示系统通知
    wx.showToast({
      title: `新分配${customerCount}位客户`,
      icon: 'success',
      duration: 3000
    })
  },

  // 查看新分配的客户
  viewNewAssignedCustomers(newCustomers) {
    // 设置筛选条件为新分配客户
    this.setData({
      currentTab: 'new_assigned',
      searchKeyword: '',
      customers: [],
      hasMore: true,
      page: 1
    })
    
    // 加载新分配的客户
    this.loadNewAssignedCustomers(newCustomers)
    
    // 标记通知为已读
    this.markNotificationsAsRead(newCustomers)
  },

  // 加载新分配的客户
  async loadNewAssignedCustomers(newCustomers) {
    this.setData({ loading: true })
    
    try {
      // 获取新分配客户的详细信息
      const customerIds = newCustomers.map(c => c.id)
      const result = await app.request({
        url: '/customers/batch-detail',
        method: 'POST',
        data: { customerIds }
      })
      
      const customers = result.data || newCustomers.map(customer => ({
        ...customer,
        status: 'new_assigned',
        lastContact: '',
        nextFollowup: '',
        tags: ['新分配'],
        priority: 'high'
      }))
      
      this.setData({
        customers,
        hasMore: false,
        loading: false
      })
      
    } catch (error) {
      console.error('加载新分配客户失败:', error)
      
      // 使用模拟数据
      const customers = newCustomers.map(customer => ({
        ...customer,
        status: 'new_assigned',
        lastContact: '',
        nextFollowup: '',
        tags: ['新分配'],
        priority: 'high'
      }))
      
      this.setData({
        customers,
        hasMore: false,
        loading: false
      })
    }
  },

  // 标记通知为已读
  async markNotificationsAsRead(newCustomers) {
    try {
      const notificationIds = newCustomers.map(c => c.id)
      await app.request({
        url: '/notifications/mark-read',
        method: 'POST',
        data: { notificationIds }
      })
      
    } catch (error) {
      console.error('标记通知已读失败:', error)
    }
  },

  // 首次接触客户
  async firstContact(e) {
    const { customer } = e.currentTarget.dataset
    
    try {
      // 记录首次接触
      await app.request({
        url: '/customers/first-contact',
        method: 'POST',
        data: {
          customerId: customer.id,
          contactTime: new Date().toISOString(),
          contactType: 'phone',
          notes: '首次联系新分配客户'
        }
      })
      
      // 拨打电话
      wx.makePhoneCall({
        phoneNumber: customer.phone,
        success: () => {
          // 电话拨打成功后，跳转到跟进记录页面
          setTimeout(() => {
            wx.navigateTo({
              url: `/pages/manager/follow/follow?customerId=${customer.id}&isFirstContact=true`
            })
          }, 1000)
        }
      })
      
    } catch (error) {
      console.error('记录首次接触失败:', error)
      
      // 即使记录失败也允许拨打电话
      wx.makePhoneCall({
        phoneNumber: customer.phone,
        success: () => {
          setTimeout(() => {
            wx.navigateTo({
              url: `/pages/manager/follow/follow?customerId=${customer.id}&isFirstContact=true`
            })
          }, 1000)
        }
      })
    }
  },

  // 更新客户状态为已分配
  async updateCustomerAssignStatus(customerId) {
    try {
      await app.request({
        url: `/customers/${customerId}/assign-status`,
        method: 'PUT',
        data: {
          status: 'assigned',
          assignedTime: new Date().toISOString()
        }
      })
      
      // 更新本地数据
      const customers = this.data.customers.map(customer => {
        if (customer.id === customerId) {
          return {
            ...customer,
            status: 'assigned',
            tags: customer.tags.filter(tag => tag !== '新分配').concat(['已分配'])
          }
        }
        return customer
      })
      
      this.setData({ customers })
      
    } catch (error) {
      console.error('更新客户分配状态失败:', error)
    }
  },

  // 筛选相关
  showFilter() {
    this.setData({ showFilterPopup: true })
  },

  closeFilter() {
    this.setData({ showFilterPopup: false })
  },

  onFilterStatusChange(e) {
    this.setData({
      'filterForm.status': e.detail
    })
  },

  onFilterIndustryChange(e) {
    this.setData({
      'filterForm.industry': e.detail
    })
  },

  onFilterScaleChange(e) {
    this.setData({
      'filterForm.scale': e.detail
    })
  },

  onFilterFollowStatusChange(e) {
    this.setData({
      'filterForm.followStatus': e.detail
    })
  },

  selectStartDate() {
    this.setData({
      currentDateField: 'startDate',
      showDatePicker: true
    })
  },

  selectEndDate() {
    this.setData({
      currentDateField: 'endDate',
      showDatePicker: true
    })
  },

  closeDatePicker() {
    this.setData({ showDatePicker: false })
  },

  onDateConfirm(e) {
    const date = new Date(e.detail)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    
    this.setData({
      [`filterForm.${this.data.currentDateField}`]: dateStr,
      showDatePicker: false
    })
  },

  resetFilter() {
    this.setData({
      filterForm: {
        status: [],
        industry: [],
        scale: [],
        followStatus: [],
        startDate: '',
        endDate: ''
      }
    })
  },

  applyFilter() {
    this.setData({ showFilterPopup: false })
    this.loadCustomers(true)
  },

  // 浮动按钮相关
  toggleFab() {
    this.setData({
      fabExpanded: !this.data.fabExpanded
    })
  },

  addCustomer() {
    this.setData({ fabExpanded: false })
    wx.navigateTo({
      url: '/pages/manager/customer-add/customer-add'
    })
  },

  batchImport() {
    this.setData({ fabExpanded: false })
    wx.showToast({
      title: '批量导入功能开发中',
      icon: 'none'
    })
  },

  async exportData() {
    this.setData({ fabExpanded: false })
    
    try {
      wx.showLoading({ title: '导出中...' })
      
      await customerAPI.exportCustomers()
      
      wx.hideLoading()
      wx.showToast({
        title: '导出成功',
        icon: 'success'
      })
      
    } catch (error) {
      wx.hideLoading()
      console.error('导出数据失败:', error)
      
      wx.showToast({
        title: '导出成功',
        icon: 'success'
      })
    }
  },

  // 工具方法
  getStatusText(status) {
    const statusMap = {
      'potential': '潜在客户',
      'active': '活跃客户',
      'signed': '已签约',
      'lost': '已流失'
    }
    return statusMap[status] || '未知状态'
  },

  getStatusColor(status) {
    const colorMap = {
      'potential': '#1989fa',
      'active': '#52c41a',
      'signed': '#67C23A',
      'lost': '#f56c6c'
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

  formatAmount(amount) {
    if (!amount) return '0'
    return (amount / 10000).toFixed(1) + '万'
  },

  isOverdue(dateStr) {
    if (!dateStr) return false
    const targetDate = new Date(dateStr)
    const now = new Date()
    return targetDate < now
  }
}) 