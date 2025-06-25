Page({
  data: {
    // 产品分类
    categories: [
      { id: 1, name: '工商业用电', icon: '/assets/images/icons/business.png' },
      { id: 2, name: '居民用电', icon: '/assets/images/icons/home.png' },
      { id: 3, name: '农业用电', icon: '/assets/images/icons/agriculture.png' },
      { id: 4, name: '临时用电', icon: '/assets/images/icons/temporary.png' }
    ],
    // 热门产品
    hotProducts: [],
    // 加载状态
    loading: true
  },

  onLoad() {
    this.loadHotProducts()
  },

  // 加载热门产品
  async loadHotProducts() {
    try {
      const app = getApp()
      const res = await app.request({
        url: '/api/products/hot',
        method: 'GET'
      })
      
      this.setData({
        hotProducts: res.data,
        loading: false
      })
    } catch (error) {
      console.error('加载热门产品失败:', error)
      app.showToast('加载热门产品失败')
      this.setData({ loading: false })
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
  }
}) 