const app = getApp()
const api = require('../../../utils/api')
const auth = require('../../../utils/auth')

Page({
  data: {
    userInfo: null,
    stats: {
      totalOrders: 0,
      totalAmount: 0,
      totalSavings: 0,
      carbonReduction: 0
    },
    menuItems: [
      {
        id: 'orders',
        icon: 'icon-order',
        title: '我的订单',
        subtitle: '查看订单状态',
        url: '/pages/orders/index/index',
        badge: 0
      },
      {
        id: 'contracts',
        icon: 'icon-contract',
        title: '我的合同',
        subtitle: '合同管理',
        url: '/pages/profile/contracts/contracts',
        badge: 0
      },
      {
        id: 'consumption',
        icon: 'icon-chart',
        title: '用电数据',
        subtitle: '用电统计分析',
        url: '/pages/profile/consumption/consumption'
      },
      {
        id: 'savings',
        icon: 'icon-money',
        title: '节费记录',
        subtitle: '查看节省费用',
        url: '/pages/profile/savings/savings'
      },
      {
        id: 'notifications',
        icon: 'icon-message',
        title: '消息通知',
        subtitle: '系统通知消息',
        url: '/pages/profile/notifications/notifications',
        badge: 0
      },
      {
        id: 'settings',
        icon: 'icon-setting',
        title: '设置',
        subtitle: '个人设置',
        url: '/pages/profile/settings/settings'
      }
    ],
    quickActions: [
      {
        id: 'contact-manager',
        icon: 'icon-phone',
        title: '联系客户经理',
        color: '#1890FF'
      },
      {
        id: 'online-service',
        icon: 'icon-service',
        title: '在线客服',
        color: '#52C41A'
      },
      {
        id: 'feedback',
        icon: 'icon-feedback',
        title: '意见反馈',
        color: '#FAAD14'
      },
      {
        id: 'help',
        icon: 'icon-help',
        title: '帮助中心',
        color: '#722ED1'
      }
    ],
    showAuthDialog: false,
    loading: true,
    refreshing: false
  },

  onLoad() {
    this.checkAuth()
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.userInfo) {
      this.loadUserData()
      this.loadStats()
      this.loadNotificationCount()
    }
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadUserData().finally(() => {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    })
  },

  // 检查登录状态
  async checkAuth() {
    try {
      const isLoggedIn = await auth.checkAuth()
      if (isLoggedIn) {
        await this.loadUserData()
        await this.loadStats()
        await this.loadNotificationCount()
      } else {
        this.setData({ 
          showAuthDialog: true,
          loading: false 
        })
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
      this.setData({ 
        showAuthDialog: true,
        loading: false 
      })
    }
  },

  // 加载用户数据
  async loadUserData() {
    try {
      this.setData({ loading: true })
      
      const userInfo = await api.getCurrentUser()
      this.setData({ 
        userInfo,
        loading: false 
      })
      
      // 更新全局用户信息
      app.globalData.userInfo = userInfo
      
    } catch (error) {
      console.error('加载用户信息失败:', error)
      this.setData({ loading: false })
      
      if (error.code === 401) {
        this.setData({ showAuthDialog: true })
      } else {
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
      }
    }
  },

  // 加载统计数据
  async loadStats() {
    try {
      const stats = await api.getUserStats()
      this.setData({ stats })
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  },

  // 加载通知数量
  async loadNotificationCount() {
    try {
      const result = await api.getUnreadNotificationCount()
      const menuItems = this.data.menuItems.map(item => {
        if (item.id === 'notifications') {
          return { ...item, badge: result.count || 0 }
        }
        return item
      })
      this.setData({ menuItems })
    } catch (error) {
      console.error('加载通知数量失败:', error)
    }
  },

  // 处理头像点击
  onAvatarTap() {
    if (!this.data.userInfo) {
      this.setData({ showAuthDialog: true })
      return
    }
    
    wx.navigateTo({
      url: '/pages/profile/edit/edit'
    })
  },

  // 处理菜单点击
  onMenuTap(e) {
    const { item } = e.currentTarget.dataset
    
    if (!this.data.userInfo) {
      this.setData({ showAuthDialog: true })
      return
    }
    
    // 清除对应菜单的徽章
    if (item.badge > 0) {
      const menuItems = this.data.menuItems.map(menu => {
        if (menu.id === item.id) {
          return { ...menu, badge: 0 }
        }
        return menu
      })
      this.setData({ menuItems })
    }
    
    wx.navigateTo({
      url: item.url
    })
  },

  // 处理快捷操作
  onQuickActionTap(e) {
    const { action } = e.currentTarget.dataset
    
    switch (action.id) {
      case 'contact-manager':
        this.contactManager()
        break
      case 'online-service':
        this.openOnlineService()
        break
      case 'feedback':
        this.openFeedback()
        break
      case 'help':
        this.openHelp()
        break
    }
  },

  // 联系客户经理
  async contactManager() {
    if (!this.data.userInfo) {
      this.setData({ showAuthDialog: true })
      return
    }

    try {
      const managerInfo = await api.getCustomerManager()
      
      if (managerInfo && managerInfo.phone) {
        wx.showActionSheet({
          itemList: ['拨打电话', '发送短信'],
          success: (res) => {
            if (res.tapIndex === 0) {
              wx.makePhoneCall({
                phoneNumber: managerInfo.phone
              })
            } else if (res.tapIndex === 1) {
              // 发送短信（小程序无法直接发送短信，可以复制号码）
              wx.setClipboardData({
                data: managerInfo.phone,
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
      } else {
        wx.showModal({
          title: '提示',
          content: '暂未分配客户经理，请联系在线客服',
          showCancel: false
        })
      }
    } catch (error) {
      console.error('获取客户经理信息失败:', error)
      wx.showToast({
        title: '获取信息失败',
        icon: 'none'
      })
    }
  },

  // 打开在线客服
  openOnlineService() {
    if (!this.data.userInfo) {
      this.setData({ showAuthDialog: true })
      return
    }
    
    wx.navigateTo({
      url: '/pages/service/chat/chat'
    })
  },

  // 打开意见反馈
  openFeedback() {
    if (!this.data.userInfo) {
      this.setData({ showAuthDialog: true })
      return
    }
    
    wx.navigateTo({
      url: '/pages/profile/feedback/feedback'
    })
  },

  // 打开帮助中心
  openHelp() {
    wx.navigateTo({
      url: '/pages/help/index/index'
    })
  },

  // 处理认证对话框
  onAuthConfirm() {
    this.setData({ showAuthDialog: false })
    wx.navigateTo({
      url: '/pages/auth/login/login'
    })
  },

  onAuthCancel() {
    this.setData({ showAuthDialog: false })
  },

  // 处理统计卡片点击
  onStatsTap(e) {
    const { type } = e.currentTarget.dataset
    
    if (!this.data.userInfo) {
      this.setData({ showAuthDialog: true })
      return
    }
    
    switch (type) {
      case 'orders':
        wx.navigateTo({
          url: '/pages/orders/index/index'
        })
        break
      case 'amount':
      case 'savings':
        wx.navigateTo({
          url: '/pages/profile/savings/savings'
        })
        break
      case 'carbon':
        wx.navigateTo({
          url: '/pages/profile/consumption/consumption'
        })
        break
    }
  },

  // 格式化金额显示
  formatAmount(amount) {
    if (amount >= 10000) {
      return (amount / 10000).toFixed(1) + '万'
    }
    return amount.toFixed(2)
  },

  // 格式化数字显示
  formatNumber(num) {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万'
    }
    return num.toString()
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '电力渠道销售平台 - 专业的电力服务',
      path: '/pages/index/index',
      imageUrl: '/images/share-bg.png'
    }
  },

  onShareTimeline() {
    return {
      title: '电力渠道销售平台 - 专业的电力服务',
      query: '',
      imageUrl: '/images/share-bg.png'
    }
  }
}) 