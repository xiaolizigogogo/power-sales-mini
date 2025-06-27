// 客户经理 - 我的客户页面
const app = getApp()
const util = require('../../../utils/common')

Page({
  data: {
    loading: false,
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
      { key: 'potential', name: '潜在客户', count: 0 },
      { key: 'following', name: '跟进中', count: 0 },
      { key: 'negotiating', name: '商务洽谈', count: 0 },
      { key: 'deal', name: '已成交', count: 0 },
      { key: 'lost', name: '已流失', count: 0 }
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
      potential: { text: '潜在客户', color: '#909399' },
      following: { text: '跟进中', color: '#E6A23C' },
      negotiating: { text: '商务洽谈', color: '#409EFF' },
      deal: { text: '已成交', color: '#67C23A' },
      lost: { text: '已流失', color: '#F56C6C' }
    }
  },

  onLoad(options) {
    // 获取传入的状态参数
    if (options.status) {
      this.setData({
        currentTab: options.status
      })
    }
    
    this.loadCustomers(true)
    this.loadStatistics()
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadCustomers(true)
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

  // 加载客户列表
  async loadCustomers(refresh = false) {
    const { currentTab, searchKeyword, selectedIndustry, selectedScale, sortBy, sortOrder, pageSize } = this.data
    let { page } = this.data

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

      const result = await app.request({
        url: '/manager/customers',
        method: 'GET',
        data: params
      })

      const customers = result.data.items || []
      const hasMore = customers.length === pageSize

      // 处理客户数据
      const processedCustomers = customers.map(customer => ({
        ...customer,
        avatar_url: customer.avatar_url || '/images/default-company.png',
        last_contact_time_text: customer.last_contact_time ? 
          util.formatDate(customer.last_contact_time) : '暂无联系',
        status_config: this.data.statusConfig[customer.status] || { text: '未知', color: '#909399' },
        contact_count_text: customer.contact_count ? `已联系${customer.contact_count}次` : '未联系',
        order_count_text: customer.order_count ? `${customer.order_count}个订单` : '暂无订单',
        total_amount_text: customer.total_amount ? util.formatAmount(customer.total_amount) : '￥0'
      }))

      this.setData({
        customers: refresh ? processedCustomers : [...this.data.customers, ...processedCustomers],
        page,
        hasMore,
        loading: false,
        loadingMore: false
      })

    } catch (error) {
      console.error('加载客户列表失败:', error)
      
      // 使用模拟数据
      console.log('API请求失败，使用模拟客户数据')
      if (refresh || this.data.customers.length === 0) {
        this.loadMockCustomers()
      } else {
        wx.showToast({
          title: '加载失败',
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
      const result = await app.request({
        url: '/manager/customers/statistics',
        method: 'GET'
      })
      const stats = result.data || {}
      
      // 更新标签页计数
      const updatedTabs = this.data.tabs.map(tab => ({
        ...tab,
        count: stats[tab.key] || 0
      }))
      
      this.setData({
        tabs: updatedTabs
      })
      
    } catch (error) {
      console.error('加载统计数据失败:', error)
      // 使用模拟统计数据
      this.loadMockStatistics()
    }
  },

  // 加载模拟客户数据
  loadMockCustomers() {
    console.log('开始加载模拟客户数据')
    const mockCustomers = [
      {
        id: 1,
        name: '张三',
        phone: '13800138001',
        company_name: '北京科技有限公司',
        industry: 'manufacturing',
        status: 'following',
        avatar_url: '',
        last_contact_time: '2024-12-26 15:30:00',
        contact_count: 5,
        order_count: 2,
        total_amount: 25000.00
      },
      {
        id: 2,
        name: '李四',
        phone: '13800138002',
        company_name: '上海贸易有限公司',
        industry: 'commerce',
        status: 'negotiating',
        avatar_url: '',
        last_contact_time: '2024-12-25 09:15:00',
        contact_count: 8,
        order_count: 1,
        total_amount: 18000.00
      },
      {
        id: 3,
        name: '王五',
        phone: '13800138003',
        company_name: '广州服务有限公司',
        industry: 'service',
        status: 'deal',
        avatar_url: '',
        last_contact_time: '2024-12-24 11:20:00',
        contact_count: 12,
        order_count: 3,
        total_amount: 45000.00
      },
      {
        id: 4,
        name: '赵六',
        phone: '13800138004',
        company_name: '深圳建筑有限公司',
        industry: 'construction',
        status: 'potential',
        avatar_url: '',
        last_contact_time: null,
        contact_count: 0,
        order_count: 0,
        total_amount: 0
      },
      {
        id: 5,
        name: '陈七',
        phone: '13800138005',
        company_name: '杭州制造有限公司',
        industry: 'manufacturing',
        status: 'lost',
        avatar_url: '',
        last_contact_time: '2024-12-20 14:45:00',
        contact_count: 3,
        order_count: 0,
        total_amount: 0
      }
    ]

    // 根据当前筛选条件过滤数据
    let filteredCustomers = mockCustomers
    if (this.data.currentTab !== 'all') {
      filteredCustomers = mockCustomers.filter(customer => customer.status === this.data.currentTab)
    }

    // 根据搜索关键词筛选
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase()
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.name.toLowerCase().includes(keyword) ||
        customer.company_name.toLowerCase().includes(keyword) ||
        customer.phone.includes(keyword)
      )
    }

    // 根据行业筛选
    if (this.data.selectedIndustry) {
      filteredCustomers = filteredCustomers.filter(customer => customer.industry === this.data.selectedIndustry)
    }

    // 处理客户数据
    const processedCustomers = filteredCustomers.map(customer => ({
      ...customer,
      avatar_url: customer.avatar_url || '',
      last_contact_time_text: customer.last_contact_time ? 
        util.formatDate(customer.last_contact_time, 'MM-DD HH:mm') : '暂无联系',
      status_config: this.data.statusConfig[customer.status] || { text: '未知', color: '#909399' },
      contact_count_text: customer.contact_count ? `已联系${customer.contact_count}次` : '未联系',
      order_count_text: customer.order_count ? `${customer.order_count}个订单` : '暂无订单',
      total_amount_text: customer.total_amount ? `￥${util.formatMoney(customer.total_amount)}` : '￥0'
    }))

    console.log('设置模拟客户数据:', processedCustomers.length, '个客户')
    this.setData({
      customers: processedCustomers,
      hasMore: false,
      loading: false,
      loadingMore: false
    })
  },

  // 加载模拟统计数据
  loadMockStatistics() {
    const mockStats = {
      all: 5,
      potential: 1,
      following: 1,
      negotiating: 1,
      deal: 1,
      lost: 1
    }

    const updatedTabs = this.data.tabs.map(tab => ({
      ...tab,
      count: mockStats[tab.key] || 0
    }))
    
    this.setData({
      tabs: updatedTabs
    })
  },

  // 标签页切换
  onTabChange(e) {
    const { key } = e.currentTarget.dataset
    
    if (key === this.data.currentTab) return
    
    this.setData({
      currentTab: key
    })
    
    this.loadCustomers(true)
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value.trim()
    this.setData({
      searchKeyword: keyword
    })
    
    // 防抖搜索
    clearTimeout(this.searchTimer)
    this.searchTimer = setTimeout(() => {
      this.loadCustomers(true)
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

  // 隐藏筛选面板
  onFilterPanelClose() {
    this.setData({
      showFilterPanel: false
    })
  },

  // 行业筛选
  onIndustryChange(e) {
    const industry = e.currentTarget.dataset.value
    this.setData({
      selectedIndustry: this.data.selectedIndustry === industry ? '' : industry
    })
  },

  // 规模筛选
  onScaleChange(e) {
    const scale = e.currentTarget.dataset.value
    this.setData({
      selectedScale: this.data.selectedScale === scale ? '' : scale
    })
  },

  // 重置筛选
  onFilterReset() {
    this.setData({
      selectedIndustry: '',
      selectedScale: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
  },

  // 应用筛选
  onFilterApply() {
    this.setData({
      showFilterPanel: false
    })
    this.loadCustomers(true)
  },

  // 排序切换
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

  // 客户详情
  onCustomerTap(e) {
    const { customerId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/manager/customer-detail/customer-detail?id=${customerId}`
    })
  },

  // 拨打电话
  onCallTap(e) {
    e.stopPropagation()
    const { phone } = e.currentTarget.dataset
    
    if (!phone) {
      wx.showToast({
        title: '暂无电话号码',
        icon: 'none'
      })
      return
    }
    
    wx.showActionSheet({
      items: [
        {
          name: '拨打电话',
          color: '#07C160'
        },
        {
          name: '复制号码',
          color: '#576B95'
        }
      ],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 拨打电话
          wx.makePhoneCall({
            phoneNumber: phone,
            fail: (err) => {
              console.error('拨打电话失败:', err)
              wx.showToast({
                title: '拨打失败',
                icon: 'none'
              })
            }
          })
        } else if (res.tapIndex === 1) {
          // 复制号码
          wx.setClipboardData({
            data: phone,
            success: () => {
              wx.showToast({
                title: '号码已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 微信聊天
  onWechatTap(e) {
    e.stopPropagation()
    const { customerId, customerName } = e.currentTarget.dataset
    
    wx.showModal({
      title: '联系客户',
      content: `确定要通过微信联系${customerName}吗？`,
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 这里可以跳转到聊天页面或记录联系记录
          this.recordContact(customerId, 'wechat', '通过微信联系客户')
        }
      }
    })
  },

  // 快速跟进
  onQuickFollowTap(e) {
    e.stopPropagation()
    const { customerId, customerName } = e.currentTarget.dataset
    
    wx.navigateTo({
      url: `/pages/manager/follow/follow?customerId=${customerId}&customerName=${encodeURIComponent(customerName)}&type=quick`
    })
  },

  // 记录联系记录
  async recordContact(customerId, contactType, content) {
    try {
      await app.request({
        url: '/manager/customers/contact-record',
        method: 'POST',
        data: {
          customer_id: customerId,
          contact_type: contactType,
          content: content,
          contact_time: new Date().toISOString()
        }
      })
      
      wx.showToast({
        title: '记录成功',
        icon: 'success'
      })
      
      // 刷新客户列表
      this.loadCustomers(true)
      
    } catch (error) {
      console.error('记录联系失败:', error)
      wx.showToast({
        title: '记录失败',
        icon: 'none'
      })
    }
  },

  // 长按客户项
  onCustomerLongPress(e) {
    const { customerId, customerName, status } = e.currentTarget.dataset
    
    const menuItems = ['查看详情', '添加跟进', '修改状态']
    
    // 根据客户状态添加特定操作
    if (status === 'potential') {
      menuItems.push('转为跟进中')
    } else if (status === 'following') {
      menuItems.push('转为商务洽谈')
    }
    
    wx.showActionSheet({
      itemList: menuItems,
      success: (res) => {
        const selectedItem = menuItems[res.tapIndex]
        
        switch (selectedItem) {
          case '查看详情':
            this.onCustomerTap(e)
            break
          case '添加跟进':
            this.onQuickFollowTap(e)
            break
          case '修改状态':
            this.showStatusChangeModal(customerId, customerName, status)
            break
          case '转为跟进中':
            this.changeCustomerStatus(customerId, 'following')
            break
          case '转为商务洽谈':
            this.changeCustomerStatus(customerId, 'negotiating')
            break
        }
      }
    })
  },

  // 显示状态修改弹窗
  showStatusChangeModal(customerId, customerName, currentStatus) {
    const statusOptions = [
      { key: 'potential', name: '潜在客户' },
      { key: 'following', name: '跟进中' },
      { key: 'negotiating', name: '商务洽谈' },
      { key: 'deal', name: '已成交' },
      { key: 'lost', name: '已流失' }
    ]
    
    const itemList = statusOptions
      .filter(item => item.key !== currentStatus)
      .map(item => item.name)
    
    wx.showActionSheet({
      itemList,
      success: (res) => {
        const selectedStatus = statusOptions
          .filter(item => item.key !== currentStatus)[res.tapIndex]
        
        wx.showModal({
          title: '确认修改',
          content: `确定将${customerName}的状态修改为"${selectedStatus.name}"吗？`,
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.changeCustomerStatus(customerId, selectedStatus.key)
            }
          }
        })
      }
    })
  },

  // 修改客户状态
  async changeCustomerStatus(customerId, newStatus) {
    try {
      await app.request({
        url: `/manager/customers/${customerId}/status`,
        method: 'PUT',
        data: {
          status: newStatus,
          remark: `状态修改为${this.data.statusConfig[newStatus]?.text || newStatus}`
        }
      })
      
      wx.showToast({
        title: '状态已更新',
        icon: 'success'
      })
      
      // 刷新数据
      this.loadCustomers(true)
      this.loadStatistics()
      
    } catch (error) {
      console.error('修改状态失败:', error)
      wx.showToast({
        title: '修改失败',
        icon: 'none'
      })
    }
  },

  // 批量操作
  onBatchOperationTap() {
    // 这里可以实现批量操作功能
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 新增客户
  onAddCustomerTap() {
    wx.navigateTo({
      url: '/pages/manager/customer-add/customer-add'
    })
  },

  // 导出客户数据
  onExportTap() {
    wx.showLoading({
      title: '导出中...'
    })
    
    app.request({
      url: '/manager/customers/export',
      method: 'POST',
      data: {
        status: this.data.currentTab === 'all' ? '' : this.data.currentTab,
        keyword: this.data.searchKeyword,
        industry: this.data.selectedIndustry,
        scale: this.data.selectedScale
      }
    }).then(result => {
      wx.hideLoading()
      
      if (result.data.download_url) {
        wx.showModal({
          title: '导出成功',
          content: '客户数据导出完成，是否立即下载？',
          success: (res) => {
            if (res.confirm) {
              // 这里可以处理文件下载
              wx.downloadFile({
                url: result.data.download_url,
                success: (downloadRes) => {
                  wx.openDocument({
                    filePath: downloadRes.tempFilePath,
                    success: () => {
                      console.log('打开文档成功')
                    }
                  })
                }
              })
            }
          }
        })
      }
    }).catch(error => {
      wx.hideLoading()
      console.error('导出失败:', error)
      wx.showToast({
        title: '导出失败',
        icon: 'none'
      })
    })
  },

  // 页面卸载
  onUnload() {
    // 清除定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }
  }
}) 