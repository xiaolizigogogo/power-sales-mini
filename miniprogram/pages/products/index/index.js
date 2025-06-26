const app = getApp()
const api = require('../../../utils/api')
const utils = require('../../../utils/util')

Page({
  data: {
    // 产品列表
    products: [],
    loading: true,
    hasMore: true,
    page: 1,
    pageSize: 10,
    
    // 筛选条件
    filters: {
      category: '',
      priceRange: '',
      suitable: false
    },
    
    // 分类选项
    categories: [
      { id: '', name: '全部' },
      { id: 'standard', name: '标准套餐' },
      { id: 'premium', name: '优选套餐' },
      { id: 'custom', name: '定制套餐' }
    ],
    
    // 价格区间选项
    priceRanges: [
      { id: '', name: '全部价格' },
      { id: '0-0.4', name: '0.4元以下' },
      { id: '0.4-0.5', name: '0.4-0.5元' },
      { id: '0.5-0.6', name: '0.5-0.6元' },
      { id: '0.6-999', name: '0.6元以上' }
    ],
    
    // 搜索
    searchKeyword: '',
    searchFocused: false,
    
    // 用户信息
    userInfo: null,
    powerInfo: null,
    
    // UI状态
    showFilter: false,
    refreshing: false,
    error: null
  },

  onLoad(options) {
    this.getUserInfo()
    this.loadProducts()
    
    // 处理分享参数
    if (options.category) {
      this.setData({
        'filters.category': options.category
      })
    }
  },

  onShow() {
    // 刷新用户信息和产品推荐
    this.getUserInfo()
  },

  onPullDownRefresh() {
    this.refreshProducts()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreProducts()
    }
  },

  onShareAppMessage() {
    return {
      title: '电力优选套餐，为您节省用电成本',
      path: '/pages/products/index/index',
      imageUrl: '/images/share-products.jpg'
    }
  },

  // 获取用户信息
  async getUserInfo() {
    try {
      const userInfo = app.globalData.userInfo || await app.getUserInfo()
      const powerInfo = await api.getUserPowerInfo()
      
      this.setData({
        userInfo,
        powerInfo
      })
    } catch (error) {
      console.log('获取用户信息失败:', error)
    }
  },

  // 加载产品列表
  async loadProducts(refresh = false) {
    if (this.data.loading && !refresh) return
    
    try {
      this.setData({ 
        loading: true,
        error: null
      })
      
      const params = {
        page: refresh ? 1 : this.data.page,
        pageSize: this.data.pageSize,
        ...this.data.filters,
        keyword: this.data.searchKeyword
      }
      
      // 如果用户已认证，添加用电信息用于推荐
      if (this.data.powerInfo) {
        params.capacity = this.data.powerInfo.capacity
        params.monthlyUsage = this.data.powerInfo.monthlyUsage
        params.industryType = this.data.powerInfo.industryType
      }
      
      const result = await api.getProducts(params)
      
      const products = refresh ? result.items : [...this.data.products, ...result.items]
      
      this.setData({
        products,
        hasMore: result.hasMore,
        page: refresh ? 2 : this.data.page + 1,
        loading: false
      })
      
      if (refresh) {
        wx.stopPullDownRefresh()
        this.setData({ refreshing: false })
      }
      
    } catch (error) {
      console.error('加载产品失败:', error)
      this.setData({
        loading: false,
        error: '加载失败，请重试'
      })
      
      if (refresh) {
        wx.stopPullDownRefresh()
        this.setData({ refreshing: false })
      }
      
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 刷新产品列表
  refreshProducts() {
    this.setData({ 
      refreshing: true,
      page: 1,
      hasMore: true
    })
    this.loadProducts(true)
  },

  // 加载更多产品
  loadMoreProducts() {
    this.loadProducts()
  },

  // 重试加载
  retryLoad() {
    this.setData({
      error: null,
      page: 1,
      hasMore: true,
      products: []
    })
    this.loadProducts()
  },

  // 搜索功能
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  onSearchFocus() {
    this.setData({ searchFocused: true })
  },

  onSearchBlur() {
    this.setData({ searchFocused: false })
  },

  onSearchConfirm(e) {
    const keyword = e.detail.value.trim()
    this.setData({ searchKeyword: keyword })
    this.refreshProducts()
  },

  clearSearch() {
    this.setData({ searchKeyword: '' })
    this.refreshProducts()
  },

  // 筛选功能
  toggleFilter() {
    this.setData({ showFilter: !this.data.showFilter })
  },

  onCategoryChange(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      'filters.category': category
    })
  },

  onPriceRangeChange(e) {
    const priceRange = e.currentTarget.dataset.range
    this.setData({
      'filters.priceRange': priceRange
    })
  },

  onSuitableToggle() {
    this.setData({
      'filters.suitable': !this.data.filters.suitable
    })
  },

  resetFilters() {
    this.setData({
      filters: {
        category: '',
        priceRange: '',
        suitable: false
      },
      searchKeyword: ''
    })
  },

  applyFilters() {
    this.setData({ showFilter: false })
    this.refreshProducts()
  },

  // 产品操作
  onProductTap(e) {
    const productId = e.currentTarget.dataset.productId
    const product = this.data.products.find(p => p.id === productId)
    
    // 记录点击行为
    this.trackProductView(product)
    
    wx.navigateTo({
      url: `/pages/products/detail/detail?id=${productId}`
    })
  },

  onCalculatorTap(e) {
    const productId = e.currentTarget.dataset.productId
    wx.navigateTo({
      url: `/pages/products/calculator/calculator?productId=${productId}`
    })
  },

  onQuickOrderTap(e) {
    const productId = e.currentTarget.dataset.productId
    
    // 检查用户认证状态
    if (!this.data.userInfo?.isAuthenticated) {
      wx.showModal({
        title: '需要认证',
        content: '下单前需要完成企业认证，是否前往认证？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/verify/verify'
            })
          }
        }
      })
      return
    }
    
    wx.navigateTo({
      url: `/pages/orders/create/create?productId=${productId}`
    })
  },

  // 数据统计
  trackProductView(product) {
    api.trackEvent('product_view', {
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price
    }).catch(console.error)
  },

  // 跳转到详情页
  goToDetail(e) {
    const productId = e.currentTarget.dataset.productId
    wx.navigateTo({
      url: `/pages/products/detail/detail?id=${productId}`
    })
  },

  // 跳转到计算器页面
  goToCalculator() {
    if (!this.data.powerInfo) {
      wx.showModal({
        title: '提示',
        content: '请先完成用电信息填写，以获得准确的收益计算',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/user/power-info/power-info'
            })
          }
        }
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/products/calculator/calculator'
    })
  },

  // 跳转到认证页面
  goToAuth() {
    wx.navigateTo({
      url: '/pages/auth/verify/verify'
    })
  },

  // 格式化价格显示
  formatPrice(price) {
    if (typeof price === 'number') {
      return price.toFixed(3)
    }
    return price
  },

  // 格式化节省金额
  formatSavings(amount) {
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}万`
    }
    return amount.toLocaleString()
  },

  // 获取产品适用标签
  getProductTags(product) {
    const tags = []
    
    if (product.isRecommended) {
      tags.push({ text: '推荐', type: 'primary' })
    }
    
    if (product.isHot) {
      tags.push({ text: '热门', type: 'danger' })
    }
    
    if (product.isSuitable && this.data.powerInfo) {
      tags.push({ text: '适合', type: 'success' })
    }
    
    if (product.hasDiscount) {
      tags.push({ text: '优惠', type: 'warning' })
    }
    
    return tags
  }
}) 