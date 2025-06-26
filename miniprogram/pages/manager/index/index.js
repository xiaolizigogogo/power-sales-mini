// 客户经理工作台首页
const app = getApp()
const api = require('../../../utils/api')

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

  onLoad(options) {
    this.checkManagerAuth()
  },

  onShow() {
    this.loadWorkbenchData()
    this.loadRecentData()
  },

  // 检查客户经理权限
  checkManagerAuth() {
    const userInfo = app.globalData.userInfo
    if (!userInfo || userInfo.role !== 'manager') {
      wx.showModal({
        title: '权限不足',
        content: '您没有客户经理权限，请联系管理员',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/profile/index/index'
          })
        }
      })
      return false
    }
    this.setData({ userInfo })
    return true
  },

  // 加载工作台数据
  async loadWorkbenchData() {
    try {
      this.setData({ loading: true })
      
      const result = await api.get('/manager/workbench')
      
      if (result.success) {
        this.setData({
          workbenchData: result.data,
          loading: false
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('加载工作台数据失败:', error)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  // 加载最近数据
  async loadRecentData() {
    try {
      const [customersResult, tasksResult] = await Promise.all([
        api.get('/manager/recent-customers', { limit: 5 }),
        api.get('/manager/urgent-tasks', { limit: 5 })
      ])

      if (customersResult.success) {
        this.setData({
          recentCustomers: customersResult.data
        })
      }

      if (tasksResult.success) {
        this.setData({
          urgentTasks: tasksResult.data
        })
      }
    } catch (error) {
      console.error('加载最近数据失败:', error)
    }
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
  }
}) 