const { roleManager } = require('../../utils/role-manager')

Page({
  data: {
    // 轮播图数据
    banners: [
      {
        id: 1,
        title: '智能电力解决方案',
        description: '为您提供专业的电力服务',
        imageUrl: '/assets/images/banner1.jpg',
        linkUrl: '/pages/products/list/list'
      },
      {
        id: 2,
        title: '节费高达40%',
        description: '选择我们，让用电更经济',
        imageUrl: '/assets/images/banner2.jpg',
        linkUrl: '/pages/calculator/index/index'
      },
      {
        id: 3,
        title: '24小时在线服务',
        description: '专业团队随时为您服务',
        imageUrl: '/assets/images/banner3.jpg',
        linkUrl: '/pages/menu/user/profile/index/index'
      }
    ],
    
    // 统计数据
    statistics: {
      totalOrders: 0,
      totalCustomers: 0,
      totalSavings: 0,
      totalCapacity: 0
    },
    
    // 产品分类
    categories: [
      { id: 1, name: '工商业用电', icon: '🏢' },
      { id: 2, name: '居民用电', icon: '🏠'},
      { id: 3, name: '农业用电', icon: '🌾'},
      { id: 4, name: '临时用电', icon: '⚡'}
    ],
    
    // 最新公告
    notices: [],
    
    // 热门产品
    hotProducts: [],
    
    // 加载状态
    loading: true,

    // 用户信息
    userInfo: null
  },

  onLoad() {
    console.log('首页加载')
    this.initPageData()
  },

  onShow() {
    console.log('首页onShow，检查登录状态')
    
    // 检查登录状态，但不强制跳转
    const isLoggedIn = roleManager.checkLoginStatus()
    console.log('登录状态:', isLoggedIn)
    
    if (isLoggedIn) {
      console.log('已登录，刷新页面数据')
      // 已登录时刷新用户信息和统计数据
      this.refreshUserInfo()
      this.loadStatistics()
    } else {
      console.log('未登录，显示基础页面内容')
      // 未登录时设置loading为false，显示基础内容
      this.setData({ loading: false })
    }
    
    // 保证tabbar高亮同步
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateActiveTab();
    }
  },

  // 初始化页面数据
  async initPageData() {
    try {
      // 并行加载数据
      await Promise.all([
        this.refreshUserInfo(),
        this.loadStatistics(),
        this.loadNotices(),
        this.loadHotProducts()
      ])
    } catch (error) {
      console.error('页面数据加载失败:', error)
      // 确保即使出错也设置基本数据
      this.setData({
        loading: false
      })
    }
  },

  // 刷新用户信息
  async refreshUserInfo() {
    try {
      const { authAPI } = require('../../utils/api')
      const userInfo = await authAPI.getUserInfo()
      console.log('获取用户信息成功:', userInfo)
      
      if (userInfo) {
        this.setData({ userInfo })
        
        // 更新全局状态
        const app = getApp()
        app.globalData.userInfo = userInfo
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      
      // 如果是未登录错误，不跳转登录页，只记录日志
      if (error.message === '未登录' || error.message === '登录已失效') {
        console.log('用户未登录，不强制跳转登录页')
      }
    }
  },

  // 加载统计数据
  async loadStatistics() {
    try {
      // 获取用户统计数据
      const { authAPI } = require('../../utils/api')
      const stats = await authAPI.getUserStats();
      console.log('用户统计数据:', stats);

      // 更新页面数据
      this.setData({
        statistics: {
          totalOrders: stats.totalOrders || 0,
          totalAmount: stats.totalAmount || 0,
          totalSavings: stats.totalSavings || 0,
          pendingOrders: stats.pendingOrders || 0,
          completedOrders: stats.completedOrders || 0
        }
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
      // 设置默认数据（未登录时显示0）
      this.setData({
        statistics: {
          totalOrders: 0,
          totalAmount: 0,
          totalSavings: 0,
          pendingOrders: 0,
          completedOrders: 0
        }
      });
    }
  },

  // 加载最新公告
  async loadNotices() {
    try {
      // 暂时使用模拟数据，避免API不存在的错误
      console.log('加载公告数据 - 使用模拟数据')
      this.setData({
        notices: [
          {
            id: 1,
            title: '电力市场化改革最新政策解读',
            publishTime: '2024-01-15',
            isImportant: true
          },
          {
            id: 2,
            title: '春节期间服务安排通知',
            publishTime: '2024-01-10',
            isImportant: false
          },
          {
            id: 3,
            title: '新产品上线公告',
            publishTime: '2024-01-08',
            isImportant: false
          }
        ]
      })
    } catch (error) {
      console.error('加载公告失败:', error)
      // 设置默认公告
      this.setData({
        notices: [
          {
            id: 1,
            title: '电力市场化改革最新政策解读',
            publishTime: '2024-01-15',
            isImportant: true
          },
          {
            id: 2,
            title: '春节期间服务安排通知',
            publishTime: '2024-01-10',
            isImportant: false
          }
        ]
      })
    }
  },

  // 加载热门产品
  async loadHotProducts() {
    try {
      const app = getApp()
      const isLoggedIn = roleManager.checkLoginStatus()
      console.log('开始加载热门产品，登录状态:', isLoggedIn)
      
      const res = await app.request({
        url: '/products/hot',
        method: 'GET'
      })
      
      console.log('热门产品加载成功:', res)
      this.setData({
        hotProducts: res.data || [],
        loading: false
      })
    } catch (error) {
      console.error('加载热门产品失败:', error)
      // 设置默认产品数据
      this.setData({ 
        hotProducts: [
          {
            id: 1,
            name: '工商业电力优化方案',
            description: '专为中小企业设计的节能方案',
            imageUrl: '/assets/images/product1.jpg',
            minCapacity: 100,
            maxCapacity: 1000,
            basePrice: 0.65,
            isHot: true,
            isNew: false,
            hasDiscount: true
          },
          {
            id: 2,
            name: '绿色能源解决方案',
            description: '环保节能，降低用电成本',
            imageUrl: '/assets/images/product2.jpg',
            minCapacity: 500,
            maxCapacity: 5000,
            basePrice: 0.58,
            isHot: false,
            isNew: true,
            hasDiscount: false
          }
        ],
        loading: false 
      })
    }
  },

  // 轮播图点击事件
  onBannerTap(e) {
    const { id, url } = e.currentTarget.dataset
    console.log('轮播图点击:', id, url)
    if (url) {
      wx.navigateTo({
        url: url
      })
    }
  },

  // 搜索点击事件
  onSearchTap() {
    wx.navigateTo({
      url: '/pages/search/index/index'
    })
  },

  // 公告点击事件
  onNoticeTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/notices/detail/detail?id=${id}`
    })
  },

  // 查看全部公告
  navigateToNotices() {
    wx.navigateTo({
      url: '/pages/notices/list/list'
    })
  },

  // 产品咨询
  onConsultTap(e) {
    const product = e.currentTarget.dataset.product
    wx.showModal({
      title: '产品咨询',
      content: `您想咨询"${product.name}"产品吗？我们的专业顾问将为您详细介绍。`,
      confirmText: '立即咨询',
      success: (res) => {
        if (res.confirm) {
          // 跳转到客服页面或拨打电话
          wx.makePhoneCall({
            phoneNumber: '400-123-4567'
          })
        }
      }
    })
  },

  // 立即下单
  onOrderTap(e) {
    if (!roleManager.checkLoginStatus()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再下单',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/login/login'
            })
          }
        }
      })
      return
    }
    const product = e.currentTarget.dataset.product
    wx.navigateTo({
      url: `/pages/orders/create/create?productId=${product.id}`
    })
  },

  // 跳转到产品列表
  navigateToList(e) {
    const { id } = e.currentTarget.dataset
    
    // 根据ID找到对应的分类名称
    const category = this.data.categories.find(cat => cat.id == id)
    if (category) {
      // 将分类名称存储到本地存储，供产品页面读取
      wx.setStorageSync('selectedCategory', category.name)
    }
    
    wx.switchTab({
      url: '/pages/menu/user/products/index/index'
    })
  },

  // 跳转到产品详情
  navigateToDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/products/detail/detail?id=${id}`
    })
  },

  // 跳转到电费计算器
  navigateToCalculator() {
    wx.navigateTo({
      url: '/pages/products/calculator/calculator'
    })
  },

  // 跳转到我的订单
  navigateToOrders() {
    if (!roleManager.checkLoginStatus()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再查看订单',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/login/login'
            })
          }
        }
      })
      return
    }
    wx.navigateTo({
      url: '/pages/menu/user/orders/index/index'
    })
  },

  // 跳转到客户管理
  navigateToCustomers() {
    if (!roleManager.checkLoginStatus()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再访问客户管理',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/login/login'
            })
          }
        }
      })
      return
    }
    wx.switchTab({
      url: '/pages/manager/index/index'
    })
  },

  // 跳转到我的合同
  navigateToContracts() {
    if (!roleManager.checkLoginStatus()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再查看合同',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/login/login'
            })
          }
        }
      })
      return
    }
    wx.navigateTo({
      url: '/pages/profile/contracts/contracts'
    })
  },

  // 跳转到数据报表
  navigateToReports() {
    wx.navigateTo({
      url: '/pages/reports/index/index'
    })
  },

  // 跳转到行业资讯
  navigateToNews() {
    wx.navigateTo({
      url: '/pages/news/list/list'
    })
  },

  // 跳转到客服支持
  navigateToSupport() {
    wx.navigateTo({
      url: '/pages/support/index/index'
    })
  },

  // 跳转到系统设置
  navigateToSettings() {
    wx.navigateTo({
      url: '/pages/settings/index/index'
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.initPageData().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 快捷功能点击
  onQuickActionTap(e) {
    const { action } = e.currentTarget.dataset
    
    // 检查是否需要登录
    const needLoginActions = ['orders', 'customers', 'performance', 'contracts', 'contract-detail', 'products']
    if (needLoginActions.includes(action) && !roleManager.checkLoginStatus()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再使用此功能',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/login/login'
            })
          }
        }
      })
      return
    }
    
    switch (action) {
      case 'calculator':
        wx.navigateTo({
          url: '/pages/calculator/index/index'
        })
        break
      case 'orders':
        wx.navigateTo({
          url: '/pages/menu/user/orders/index/index'
        })
        break
      case 'customers':
        wx.navigateTo({
          url: '/pages/manager/customers/customers'
        })
        break
      case 'performance':
        wx.navigateTo({
          url: '/pages/manager/performance/performance'
        })
        break
      case 'contracts':
        // 测试合同签署功能
        wx.navigateTo({
          url: '/pages/profile/contracts/contracts'
        })
        break
      case 'contract-detail':
        // 测试合同详情页面
        wx.navigateTo({
          url: '/pages/profile/contracts/detail/detail?id=1'
        })
        break
      case 'products':
        wx.navigateTo({
          url: '/pages/menu/user/products/index/index'
        })
        break
      case 'support':
        wx.makePhoneCall({
          phoneNumber: '400-123-4567'
        })
        break
      default:
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        })
    }
  },

  navigateToComparison() {
    wx.navigateTo({
      url: '/pages/products/compare/compare'
    })
  },

  navigateToCustomerMatching() {
    wx.navigateTo({
      url: '/pages/customer-matching/index/index'
    })
  },

  navigateToContract() {
    wx.navigateTo({
      url: '/pages/profile/contracts/contracts'
    })
  },

  navigateToConsumption() {
    if (!roleManager.checkLoginStatus()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再查看用电分析',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/login/login'
            })
          }
        }
      })
      return
    }
    wx.navigateTo({
      url: '/pages/profile/consumption/consumption'
    })
  },

  navigateToSavings() {
    if (!roleManager.checkLoginStatus()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再查看节费记录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/login/login'
            })
          }
        }
      })
      return
    }
    wx.navigateTo({
      url: '/pages/profile/savings/savings'
    })
  },

  navigateToService() {
    if (!roleManager.checkLoginStatus()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再联系专属客服',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/login/login'
            })
          }
        }
      })
      return
    }
    wx.navigateTo({
      url: '/pages/profile/service/service'
    })
  },
}) 