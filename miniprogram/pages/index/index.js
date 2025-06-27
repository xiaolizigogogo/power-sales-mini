Page({
  data: {
    // 产品分类
    categories: [
      { id: 1, name: '工商业用电', icon: '🏢' },
      { id: 2, name: '居民用电', icon: '🏠' },
      { id: 3, name: '农业用电', icon: '🌾' },
      { id: 4, name: '临时用电', icon: '⚡' }
    ],
    // 热门产品
    hotProducts: [],
    // 加载状态
    loading: true
  },

  onLoad() {
    console.log('首页加载')
    this.loadHotProducts()
  },

  // 加载热门产品
  async loadHotProducts() {
    try {
      const app = getApp()
      console.log('开始加载热门产品，登录状态:', app.globalData.isLogin)
      
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
      // 不显示错误提示，避免影响用户体验
      this.setData({ 
        hotProducts: [],
        loading: false 
      })
    }
  },

  // 跳转到产品列表
  navigateToList(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/products/list/list?categoryId=${id}`
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
    wx.switchTab({
      url: '/pages/orders/index/index'
    })
  },

  // 跳转到客户管理
  navigateToCustomers() {
    wx.switchTab({
      url: '/pages/manager/index/index'
    })
  },

  // 跳转到我的合同
  navigateToContracts() {
    wx.navigateTo({
      url: '/pages/profile/contracts/contracts'
    })
  }
}) 