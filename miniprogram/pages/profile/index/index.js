const app = getApp()
const { authAPI } = require('../../../utils/api')
const auth = require('../../../utils/auth')
const { checkRoleAccess } = require('../../../utils/auth')
const { request } = require('../../../utils/api')

Page({
  data: {
    userInfo: null,
    stats: {
      totalOrders: 0,
      totalAmount: 0,
      totalSavings: 0,
      carbonReduction: 0,
      orderCount: 0,
      contractCount: 0,
      powerPoints: 0
    },
    powerData: {
      monthlyConsumption: 0,
      monthlyBill: 0,
      savingRate: 0
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
        id: 'renewal-notice',
        icon: 'icon-time',
        title: '续约提醒',
        subtitle: '合同续约管理',
        url: '/pages/profile/renewal-notice/renewal-notice',
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
    // 检查角色权限
    if (!checkRoleAccess('profile')) {
      return
    }
    this.checkAuth()
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.userInfo) {
      this.loadUserData()
      this.loadStats()
      this.loadNotificationCount()
      this.loadPowerData()
    }
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true })
    Promise.all([
      this.loadUserData(),
      this.loadStats(),
      this.loadPowerData()
    ]).finally(() => {
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
        await this.loadPowerData()
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
      
      // 先尝试从本地存储获取用户信息
      const localUserInfo = wx.getStorageSync('userInfo')
      if (localUserInfo) {
        this.setData({ 
          userInfo: localUserInfo,
          loading: false 
        })
        app.globalData.userInfo = localUserInfo
        return
      }

      // 如果本地没有，尝试从服务器获取
      try {
        const userInfo = await authAPI.getCurrentUser()
        this.setData({ 
          userInfo,
          loading: false 
        })
        
        // 更新全局用户信息
        app.globalData.userInfo = userInfo
        wx.setStorageSync('userInfo', userInfo)
      } catch (error) {
        // 如果服务器获取失败，使用模拟数据
        console.log('从服务器获取用户信息失败，使用模拟数据:', error)
        const mockUserInfo = {
          id: 1,
          name: '张三',
          phone: '13800138000',
          company_name: '北京科技有限公司',
          auth_status: 'verified',
          avatar_url: ''
        }
        this.setData({ 
          userInfo: mockUserInfo,
          loading: false 
        })
        app.globalData.userInfo = mockUserInfo
      }
      
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
      const res = await request('GET', '/api/user/stats')
      this.setData({
        stats: res.data
      })
    } catch (error) {
      console.error('加载统计数据失败:', error)
      // 使用模拟统计数据
      const mockStats = {
        totalOrders: 15,
        totalAmount: 125000,
        totalSavings: 18500,
        carbonReduction: 12.5
      }
      this.setData({ stats: mockStats })
    }
  },

  // 加载通知数量
  async loadNotificationCount() {
    try {
      const result = await authAPI.getUnreadNotificationCount()
      const menuItems = this.data.menuItems.map(item => {
        if (item.id === 'notifications') {
          return { ...item, badge: result.count || 0 }
        }
        return item
      })
      this.setData({ menuItems })
    } catch (error) {
      console.error('加载通知数量失败:', error)
      // 设置模拟通知数量
      const menuItems = this.data.menuItems.map(item => {
        if (item.id === 'notifications') {
          return { ...item, badge: 3 }
        }
        return item
      })
      this.setData({ menuItems })
    }
  },

  // 加载用电数据
  async loadPowerData() {
    try {
      const res = await request('GET', '/api/user/power-data')
      this.setData({
        powerData: res.data
      })
    } catch (error) {
      console.error('加载用电数据失败:', error)
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
      const managerInfo = await authAPI.getCustomerManager()
      
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
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          this.performLogout()
        }
      }
    })
  },

  // 执行退出登录
  async performLogout() {
    try {
      wx.showLoading({
        title: '退出中...',
        mask: true
      })

      // 调用后端退出登录接口（如果有的话）
      try {
        await authAPI.logout()
      } catch (error) {
        console.log('后端退出登录失败，继续本地清理:', error)
      }

      // 清除本地存储的用户信息
      wx.removeStorageSync('token')
      wx.removeStorageSync('userInfo')
      wx.removeStorageSync('userRole')

      // 清除全局数据
      app.globalData.token = ''
      app.globalData.userInfo = null
      app.globalData.userRole = ''
      app.globalData.isLogin = false

      // 清除页面数据
      this.setData({
        userInfo: null,
        stats: {
          totalOrders: 0,
          totalAmount: 0,
          totalSavings: 0,
          carbonReduction: 0
        },
        powerData: {
          monthlyConsumption: 0,
          monthlyBill: 0,
          savingRate: 0
        }
      })

      wx.hideLoading()

      wx.showToast({
        title: '已退出登录',
        icon: 'success',
        duration: 2000
      })

      // 延迟跳转到登录页面
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/auth/login/login'
        })
      }, 2000)

    } catch (error) {
      wx.hideLoading()
      console.error('退出登录失败:', error)
      wx.showToast({
        title: '退出失败，请重试',
        icon: 'error'
      })
    }
  },

  // 查看用电数据详情
  viewPowerData() {
    wx.navigateTo({
      url: '/pages/power/statistics/statistics'
    })
  },

  // 页面跳转
  navigateTo(e) {
    const { url } = e.currentTarget.dataset
    wx.navigateTo({ url })
  },

  // 联系客服
  contactService() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail() {
        wx.showToast({
          title: '拨打失败，请稍后重试',
          icon: 'none'
        })
      }
    })
  }
}) 