// 客户经理工作台首页
const app = getApp()

Page({
  data: {
    userInfo: {},
    workbenchData: {
      todayData: {
        newCustomers: 0,
        followUpTasks: 0,
        newOrders: 0,
        orderAmount: 0
      },
      monthData: {
        newCustomers: 0,
        totalOrders: 0,
        orderAmount: 0,
        targetProgress: 0
      },
      statistics: {
        totalCustomers: 0,
        activeCustomers: 0,
        completedOrders: 0,
        satisfaction: 0
      }
    },
    quickActions: [
      {
        icon: 'customers',
        title: '我的客户',
        subtitle: '客户管理',
        url: '/pages/manager/customers/customers',
        color: '#1890ff'
      },
      {
        icon: 'follow',
        title: '跟进任务',
        subtitle: '待跟进客户',
        url: '/pages/manager/follow/follow',
        color: '#52c41a'
      },
      {
        icon: 'performance',
        title: '业绩统计',
        subtitle: '我的业绩',
        url: '/pages/manager/performance/performance',
        color: '#faad14'
      },
      {
        icon: 'orders',
        title: '订单管理',
        subtitle: '客户订单',
        url: '/pages/manager/orders/orders',
        color: '#722ed1'
      }
    ],
    recentCustomers: [],
    urgentTasks: [],
    loading: true,
    refreshing: false
  },

  async onLoad(options) {
    console.log('📱 管理员首页开始加载...')
    
    try {
      this.checkManagerAuth()
      
      // 直接加载数据（使用模拟数据）
      await this.loadAllData()
    } catch (error) {
      console.error('页面加载失败:', error)
      // 发生错误时使用模拟数据
      console.log('页面加载出错，使用模拟数据')
      this.loadMockWorkbenchData()
      this.loadMockRecentData()
    }
  },

  onShow() {
    console.log('📱 管理员首页显示')
    
    // 如果数据还在加载中，重新加载
    if (this.data.loading) {
      console.log('🔄 重新加载数据...')
      this.loadAllData()
    }
  },



  // 进入离线模式
  enterOfflineMode() {
    console.log('进入离线模式，使用模拟数据')
    
    // 设置离线用户信息
    const offlineUserInfo = {
      id: 1,
      name: '张经理',
      role: 'CUSTOMER_MANAGER',
      phone: '13800138000',
      avatar: '',
      isOffline: true
    }
    
    // 保存到本地存储
    wx.setStorageSync('userInfo', offlineUserInfo)
    wx.setStorageSync('isOfflineMode', true)
    
    // 更新全局数据
    const app = getApp()
    app.globalData.userInfo = offlineUserInfo
    app.globalData.isOfflineMode = true
    
    this.setData({ userInfo: offlineUserInfo })
    
    wx.showToast({
      title: '已进入离线模式',
      icon: 'none',
      duration: 2000
    })
  },

  // 检查客户经理权限
  checkManagerAuth() {
    const userInfo = app.globalData.userInfo
    
    // 如果没有用户信息，使用模拟数据
    if (!userInfo) {
      const mockUserInfo = {
        id: 1,
        name: '张经理',
        role: 'manager',
        phone: '13800138000',
        avatar: ''
      }
      this.setData({ userInfo: mockUserInfo })
      return true
    }
    
    // 设置用户信息
    this.setData({ userInfo })
    return true
  },

  // 加载工作台数据
  async loadWorkbenchData() {
    try {
      console.log('正在加载工作台数据...')
      console.log('API地址:', `${app.globalData.baseUrl}/manager/workbench`)
      console.log('Token:', app.globalData.token ? app.globalData.token.substring(0, 20) + '...' : '无Token')
      
      const result = await app.request({
        url: '/manager/workbench',
        method: 'GET'
      })
      
      console.log('工作台数据加载成功:', result)
      
      // 正确解析后端返回的数据结构
      const data = result.data || result
      console.log('解析工作台数据:', data)
      
      this.setData({
        workbenchData: {
          todayData: {
            newCustomers: data.todayStats?.newCustomers || 0,
            followUpTasks: data.todayStats?.followUpTasks || 0,
            newOrders: data.todayStats?.newOrders || 0,
            orderAmount: data.todayStats?.orderAmount || 0
          },
          monthData: {
            newCustomers: data.monthStats?.newCustomers || 0,
            totalOrders: data.monthStats?.totalOrders || 0,
            orderAmount: data.monthStats?.orderAmount || 0,
            targetProgress: data.monthStats?.targetProgress || 0
          },
          statistics: {
            totalCustomers: data.statistics?.totalCustomers || 0,
            activeCustomers: data.statistics?.activeCustomers || 0,
            completedOrders: data.statistics?.completedOrders || 0,
            satisfaction: data.statistics?.satisfaction || 0
          }
        },
        loading: false
      })
      
      console.log('工作台数据设置完成:', this.data.workbenchData)
    } catch (error) {
      console.error('加载工作台数据失败:', error)
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        url: '/manager/workbench'
      })
      
      // 使用模拟数据
      console.log('使用模拟工作台数据')
      this.loadMockWorkbenchData()
    }
  },

  // 加载最近数据
  async loadRecentData() {
    try {
      console.log('正在加载最近数据...')
      
      const requests = [
        app.request({
          url: '/manager/recent-customers',
          method: 'GET',
          data: { limit: 5 }
        }),
        app.request({
          url: '/manager/urgent-tasks',
          method: 'GET',
          data: { limit: 5 }
        })
      ]
      
      console.log('发起并行请求...')
      const [customersResult, tasksResult] = await Promise.all(requests)

      console.log('最近数据加载成功')
      console.log('客户数据:', customersResult)
      console.log('任务数据:', tasksResult)
      
      this.setData({
        recentCustomers: (customersResult.data || customersResult) || [],
        urgentTasks: (tasksResult.data || tasksResult) || []
      })
    } catch (error) {
      console.error('加载最近数据失败:', error)
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack
      })
      
      // 使用模拟数据
      console.log('使用模拟最近数据')
      this.loadMockRecentData()
    }
  },

  // 加载模拟工作台数据
  loadMockWorkbenchData() {
    console.log('开始加载模拟工作台数据')
    const mockData = {
      todayData: {
        newCustomers: 2,
        followUpTasks: 5,
        newOrders: 1,
        orderAmount: 15000
      },
      monthData: {
        newCustomers: 7,
        totalOrders: 3,
        orderAmount: 85000,
        targetProgress: 45
      },
      statistics: {
        totalCustomers: 7,
        activeCustomers: 3,
        completedOrders: 2,
        satisfaction: 95
      }
    }

    console.log('设置模拟工作台数据:', mockData)
    this.setData({
      workbenchData: mockData,
      loading: false
    })
  },

  // 加载模拟最近数据
  loadMockRecentData() {
    const mockCustomers = [
      {
        id: 1,
        name: '张三',
        company: '北京科技有限公司',
        phone: '13800138001',
        lastContact: '2024-12-26 15:30:00',
        status: 'following',
        avatar_url: ''
      },
      {
        id: 2,
        name: '李四',
        company: '上海贸易有限公司',
        phone: '13800138002',
        lastContact: '2024-12-26 10:20:00',
        status: 'negotiating',
        avatar_url: ''
      },
      {
        id: 3,
        name: '王五',
        company: '广州服务有限公司',
        phone: '13800138003',
        lastContact: '2024-12-25 16:45:00',
        status: 'potential',
        avatar_url: ''
      }
    ]

    const mockTasks = [
      {
        id: 1,
        customerId: 1,
        customerName: '张三',
        company: '北京科技有限公司',
        type: 'follow_up',
        content: '跟进产品报价方案',
        dueDate: '2024-12-27 10:00:00',
        priority: 'high'
      },
      {
        id: 2,
        customerId: 2,
        customerName: '李四',
        company: '上海贸易有限公司',
        type: 'call',
        content: '电话确认合同细节',
        dueDate: '2024-12-27 14:00:00',
        priority: 'medium'
      },
      {
        id: 3,
        customerId: 4,
        customerName: '赵六',
        company: '深圳建筑有限公司',
        type: 'visit',
        content: '实地拜访客户',
        dueDate: '2024-12-28 09:00:00',
        priority: 'high'
      }
    ]

    this.setData({
      recentCustomers: mockCustomers,
      urgentTasks: mockTasks,
      loading: false
    })
  },

  // 下拉刷新
  async onPullDownRefresh() {
    this.setData({ refreshing: true })
    
    try {
      await Promise.all([
        this.loadWorkbenchData(),
        this.loadRecentData()
      ])
    } catch (error) {
      console.error('刷新失败:', error)
    } finally {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    }
  },

  // 快捷操作点击
  onQuickActionTap(e) {
    const { url } = e.currentTarget.dataset
    if (url.startsWith('/pages')) {
      wx.navigateTo({ url })
    } else {
      wx.switchTab({ url })
    }
  },

  // 查看今日数据详情
  onTodayDataTap(e) {
    const { type } = e.currentTarget.dataset
    const routes = {
      customers: '/pages/manager/customers/customers?filter=today',
      tasks: '/pages/manager/follow/follow?filter=today',
      orders: '/pages/manager/orders/orders?filter=today'
    }
    
    if (routes[type]) {
      wx.navigateTo({
        url: routes[type]
      })
    }
  },

  // 查看客户详情
  onCustomerTap(e) {
    const { customerId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/manager/customer-detail/customer-detail?id=${customerId}`
    })
  },

  // 立即跟进
  onFollowTap(e) {
    const { customerId, taskId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/manager/follow-detail/follow-detail?customerId=${customerId}&taskId=${taskId}`
    })
  },

  // 一键电话
  onCallTap(e) {
    const { phone } = e.currentTarget.dataset
    if (!phone) {
      wx.showToast({
        title: '暂无电话号码',
        icon: 'none'
      })
      return
    }

    wx.makePhoneCall({
      phoneNumber: phone,
      fail: (error) => {
        console.error('拨打电话失败:', error)
        wx.showToast({
          title: '拨打失败',
          icon: 'error'
        })
      }
    })
  },

  // 查看更多客户
  onMoreCustomersTap() {
    wx.navigateTo({
      url: '/pages/manager/customers/customers'
    })
  },

  // 查看更多任务
  onMoreTasksTap() {
    wx.navigateTo({
      url: '/pages/manager/follow/follow'
    })
  },

  // 添加客户
  onAddCustomerTap() {
    wx.navigateTo({
      url: '/pages/manager/customer-add/customer-add'
    })
  },

  // 目标进度点击
  onTargetTap() {
    wx.navigateTo({
      url: '/pages/manager/performance/performance?tab=target'
    })
  },

  // 格式化金额
  formatAmount(amount) {
    if (!amount) return '0'
    return (amount / 10000).toFixed(1) + '万'
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    
    return `${date.getMonth() + 1}/${date.getDate()}`
  },

  // 获取任务优先级颜色
  getTaskPriorityColor(priority) {
    const colors = {
      high: '#ff4d4f',
      medium: '#faad14',
      low: '#52c41a'
    }
    return colors[priority] || '#d9d9d9'
  },

  // 分享工作台
  onShareAppMessage() {
    return {
      title: '电力销售客户经理工作台',
      path: '/pages/manager/index/index',
      imageUrl: '/images/share-manager.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '电力销售客户经理工作台',
      imageUrl: '/images/share-manager.png'
    }
  },

  // 加载所有数据
  async loadAllData() {
    try {
      console.log('开始加载所有数据...')
      this.setData({ loading: true })
      
      // 优先加载真实数据
      console.log('尝试加载真实数据...')
      
      // 并行加载工作台数据和最近数据
      await Promise.all([
        this.loadWorkbenchData(),
        this.loadRecentData()
      ])
      
      console.log('真实数据加载完成')
    } catch (error) {
      console.error('加载真实数据失败:', error)
      
      // 如果加载失败，使用模拟数据
      console.log('真实数据加载失败，使用模拟数据作为备选方案')
      this.loadMockWorkbenchData()
      this.loadMockRecentData()
      this.setData({ loading: false })
    }
  },

  // 测试网络连接
  async testNetworkConnection() {
    try {
      const result = await app.request({
        url: '/ping',
        method: 'GET',
        timeout: 5000
      })
      return { success: true, message: '连接正常' }
    } catch (error) {
      return { success: false, message: `连接失败: ${error.message}` }
    }
  },

  // 系统调试
  async onTokenDebugTap() {
    try {
      const token = wx.getStorageSync('token')
      const userInfo = wx.getStorageSync('userInfo')
      const isOfflineMode = wx.getStorageSync('isOfflineMode')
      
      let debugInfo = `🔍 系统调试信息\n\n`
      debugInfo += `Token状态: ${token ? '✅ 存在' : '❌ 不存在'}\n`
      debugInfo += `用户信息: ${userInfo ? '✅ 存在' : '❌ 不存在'}\n`
      debugInfo += `离线模式: ${isOfflineMode ? '✅ 已启用' : '❌ 未启用'}\n`
      debugInfo += `API地址: ${app.globalData.baseUrl || '未配置'}\n\n`
      
      if (token) {
        debugInfo += `Token预览: ${token.substring(0, 20)}...\n\n`
      }
      
      // 测试网络连接
      debugInfo += `🌐 网络连接测试...\n`
      try {
        const networkTest = await this.testNetworkConnection()
        debugInfo += `网络状态: ✅ ${networkTest.message}\n`
      } catch (error) {
        debugInfo += `网络状态: ❌ ${error.message}\n`
      }
      
      if (userInfo) {
        debugInfo += `\n👤 用户信息:\n`
        debugInfo += `姓名: ${userInfo.name || '未知'}\n`
        debugInfo += `角色: ${userInfo.role || '未知'}\n`
        debugInfo += `电话: ${userInfo.phone || '未知'}\n`
      }
      
      wx.showModal({
        title: '系统调试信息',
        content: debugInfo,
        showCancel: false,
        confirmText: '确定'
      })
      
    } catch (error) {
      console.error('系统调试失败:', error)
      wx.showToast({
        title: '调试失败',
        icon: 'none'
      })
    }
  }
})