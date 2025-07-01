// 客户经理工作台首页
const app = getApp()
const auth = require('../../../utils/auth')
const { formatMoney, formatDate } = require('../../../utils/common')

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
        color: '#1890ff',
        permission: auth.PERMISSIONS.CUSTOMER_VIEW
      },
      {
        icon: 'follow',
        title: '跟进任务',
        subtitle: '待跟进客户',
        url: '/pages/manager/follow/follow',
        color: '#52c41a',
        permission: auth.PERMISSIONS.FOLLOW_VIEW
      },
      {
        icon: 'maintenance',
        title: '客户维护',
        subtitle: '回访续约',
        url: '/pages/manager/maintenance/maintenance',
        color: '#f56c6c',
        permission: auth.PERMISSIONS.CUSTOMER_VIEW
      },
      {
        icon: 'performance',
        title: '业绩统计',
        subtitle: '我的业绩',
        url: '/pages/manager/performance/performance',
        color: '#faad14',
        permission: auth.PERMISSIONS.PERFORMANCE_VIEW
      },
      {
        icon: 'orders',
        title: '订单管理',
        subtitle: '客户订单',
        url: '/pages/orders/index/index',
        color: '#722ed1',
        permission: auth.PERMISSIONS.ORDER_VIEW
      }
    ],
    recentCustomers: [],
    urgentTasks: [],
    loading: true,
    refreshing: false,
    
    // 权限控制
    hasCustomerPermission: false,
    hasFollowPermission: false,
    hasPerformancePermission: false
  },

  async onLoad(options) {
    console.log('📱 管理员首页开始加载...')
    
    try {
      // 检查登录状态和权限
      if (!this.checkAuth()) {
        return
      }
      
      // 直接加载数据
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
    
    // 检查权限
    if (!this.checkAuth()) {
      return
    }
    
    // 如果数据还在加载中，重新加载
    if (this.data.loading) {
      console.log('🔄 重新加载数据...')
      this.loadAllData()
    }
  },

  // 检查认证和权限
  checkAuth() {
    // 检查登录状态
    if (!auth.checkLogin()) {
      return false
    }
    
    // 检查是否为客户经理
    if (!auth.isCustomerManager() && !auth.isManager()) {
      wx.showModal({
        title: '权限不足',
        content: '您没有权限访问客户经理功能',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      })
      return false
    }
    
    // 设置权限状态
    this.setData({
      hasCustomerPermission: auth.hasPermission(auth.PERMISSIONS.CUSTOMER_VIEW),
      hasFollowPermission: auth.hasPermission(auth.PERMISSIONS.FOLLOW_VIEW),
      hasPerformancePermission: auth.hasPermission(auth.PERMISSIONS.PERFORMANCE_VIEW)
    })
    
    // 设置用户信息
    const userInfo = auth.getUserInfo()
    if (userInfo) {
      this.setData({ userInfo })
    }
    
    return true
  },

  // 加载工作台数据
  async loadWorkbenchData() {
    try {
      console.log('正在加载工作台数据...')
      
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
      console.log('正在加载最近客户和任务数据...')
      
      const [customersRes, tasksRes] = await Promise.all([
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
      ])
      
      console.log('最近数据加载成功:', { customers: customersRes, tasks: tasksRes })
      
      this.setData({
        recentCustomers: customersRes.data || [],
        urgentTasks: tasksRes.data || []
      })
      
    } catch (error) {
      console.error('加载最近数据失败:', error)
      // 使用模拟数据
      this.loadMockRecentData()
    }
  },

  // 加载模拟工作台数据
  loadMockWorkbenchData() {
    const mockData = {
      todayData: {
        newCustomers: 3,
        followUpTasks: 8,
        newOrders: 2,
        orderAmount: 45600
      },
      monthData: {
        newCustomers: 28,
        totalOrders: 15,
        orderAmount: 326800,
        targetProgress: 65
      },
      statistics: {
        totalCustomers: 156,
        activeCustomers: 89,
        completedOrders: 234,
        satisfaction: 4.6
      }
    }
    
    this.setData({
      workbenchData: mockData,
      loading: false
    })
  },

  // 加载模拟最近数据
  loadMockRecentData() {
    const mockRecentCustomers = [
      {
        id: 1,
        name: '张三',
        companyName: '某某科技有限公司',
        phone: '13800138001',
        lastContactTime: '2024-01-15 14:30',
        status: 'active',
        statusText: '正常',
        priority: 'high'
      },
      {
        id: 2,
        name: '李四',
        companyName: '某某贸易公司',
        phone: '13800138002',
        lastContactTime: '2024-01-14 16:20',
        status: 'following',
        statusText: '跟进中',
        priority: 'medium'
      },
      {
        id: 3,
        name: '王五',
        companyName: '某某制造企业',
        phone: '13800138003',
        lastContactTime: '2024-01-13 10:15',
        status: 'potential',
        statusText: '潜在客户',
        priority: 'low'
      }
    ]
    
    const mockUrgentTasks = [
      {
        id: 1,
        customerId: 1,
        customerName: '张三',
        type: 'call',
        typeText: '电话回访',
        content: '跟进产品使用情况',
        dueDate: '2024-01-16 09:00',
        priority: 'high',
        isOverdue: false
      },
      {
        id: 2,
        customerId: 2,
        customerName: '李四',
        type: 'visit',
        typeText: '客户拜访',
        content: '商务洽谈，签署合同',
        dueDate: '2024-01-15 14:00',
        priority: 'high',
        isOverdue: true
      },
      {
        id: 3,
        customerId: 3,
        customerName: '王五',
        type: 'email',
        typeText: '邮件跟进',
        content: '发送产品资料',
        dueDate: '2024-01-17 10:00',
        priority: 'medium',
        isOverdue: false
      }
    ]
    
    this.setData({
      recentCustomers: mockRecentCustomers,
      urgentTasks: mockUrgentTasks
    })
  },

  // 下拉刷新
  async onPullDownRefresh() {
    console.log('🔄 下拉刷新开始')
    this.setData({ refreshing: true })
    
    try {
      await this.loadAllData()
    } catch (error) {
      console.error('刷新失败:', error)
    } finally {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
      console.log('🔄 下拉刷新完成')
    }
  },

  // 快捷操作点击
  onQuickActionTap(e) {
    const { index } = e.currentTarget.dataset
    const action = this.data.quickActions[index]
    
    if (!action) return
    
    // 检查权限
    if (action.permission && !auth.hasPermission(action.permission)) {
      wx.showToast({
        title: '您没有权限访问此功能',
        icon: 'none'
      })
      return
    }
    
    if (action.url.startsWith('/pages/orders/')) {
      wx.switchTab({ url: action.url })
    } else {
      wx.navigateTo({ url: action.url })
    }
  },

  // 今日数据点击
  onTodayDataTap(e) {
    const { type } = e.currentTarget.dataset
    
    switch (type) {
      case 'customers':
        if (auth.hasPermission(auth.PERMISSIONS.CUSTOMER_VIEW)) {
          wx.navigateTo({
            url: '/pages/manager/customers/customers?status=pending'
          })
        }
        break
      case 'tasks':
        if (auth.hasPermission(auth.PERMISSIONS.FOLLOW_VIEW)) {
          wx.navigateTo({
            url: '/pages/manager/follow/follow?tab=0'
          })
        }
        break
      case 'orders':
        wx.switchTab({
          url: '/pages/orders/index/index'
        })
        break
    }
  },

  // 客户点击
  onCustomerTap(e) {
    const { id } = e.currentTarget.dataset
    if (auth.hasPermission(auth.PERMISSIONS.CUSTOMER_VIEW)) {
      wx.navigateTo({
        url: `/pages/manager/customers/detail/detail?id=${id}`
      })
    }
  },

  // 跟进任务点击
  onFollowTap(e) {
    const { id } = e.currentTarget.dataset
    if (auth.hasPermission(auth.PERMISSIONS.FOLLOW_VIEW)) {
      wx.navigateTo({
        url: `/pages/manager/follow/follow?taskId=${id}`
      })
    }
  },

  // 拨打电话
  onCallTap(e) {
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
          wx.makePhoneCall({
            phoneNumber: phone,
            fail: (err) => {
              console.error('拨打电话失败:', err)
              wx.showToast({
                title: '拨打电话失败',
                icon: 'none'
              })
            }
          })
        }
      }
    })
  },

  // 查看更多客户
  onMoreCustomersTap() {
    if (auth.hasPermission(auth.PERMISSIONS.CUSTOMER_VIEW)) {
      wx.navigateTo({
        url: '/pages/manager/customers/customers'
      })
    }
  },

  // 查看更多任务
  onMoreTasksTap() {
    if (auth.hasPermission(auth.PERMISSIONS.FOLLOW_VIEW)) {
      wx.navigateTo({
        url: '/pages/manager/follow/follow'
      })
    }
  },

  // 添加客户
  onAddCustomerTap() {
    if (auth.hasPermission(auth.PERMISSIONS.CUSTOMER_CREATE)) {
      wx.navigateTo({
        url: '/pages/manager/customer-add/customer-add'
      })
    }
  },

  // 目标设置
  onTargetTap() {
    wx.showToast({
      title: '目标设置功能开发中',
      icon: 'none'
    })
  },

  // 格式化金额
  formatAmount(amount) {
    return formatMoney(amount)
  },

  // 格式化日期
  formatDate(dateStr) {
    return formatDate(dateStr)
  },

  // 获取任务优先级颜色
  getTaskPriorityColor(priority) {
    const colors = {
      high: '#ff4757',
      medium: '#ffa502',
      low: '#7bed9f'
    }
    return colors[priority] || '#ddd'
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '电力销售平台 - 客户经理工作台',
      path: '/pages/manager/index/index'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '电力销售平台 - 专业的电力销售管理工具'
    }
  },

  // 加载所有数据
  async loadAllData() {
    try {
      this.setData({ loading: true })
      
      // 并行加载工作台数据和最近数据
      await Promise.all([
        this.loadWorkbenchData(),
        this.loadRecentData()
      ])
      
      console.log('✅ 所有数据加载完成')
    } catch (error) {
      console.error('❌ 加载数据失败:', error)
      
      // 加载失败时使用模拟数据
      this.loadMockWorkbenchData()
      this.loadMockRecentData()
    } finally {
      this.setData({ loading: false })
    }
  },

  // 测试网络连接
  async testNetworkConnection() {
    try {
      const res = await app.request({
        url: '/health',
        method: 'GET'
      })
      console.log('网络连接正常:', res)
      return true
    } catch (error) {
      console.error('网络连接失败:', error)
      return false
    }
  },

  // Token调试
  async onTokenDebugTap() {
    const token = auth.getToken()
    const userInfo = auth.getUserInfo()
    
    console.log('当前Token:', token ? token.substring(0, 20) + '...' : '无Token')
    console.log('用户信息:', userInfo)
    console.log('登录状态:', auth.isLoggedIn())
    console.log('用户角色:', auth.getUserRole())
    console.log('是否客户经理:', auth.isCustomerManager())
    
    wx.showModal({
      title: 'Token调试信息',
      content: `Token: ${token ? '已设置' : '未设置'}\n用户: ${userInfo?.name || '未知'}\n角色: ${auth.getUserRole() || '未知'}`,
      showCancel: false
    })
  }
})