const app = getApp()
const api = require('../../../utils/api')
const utils = require('../../../utils/common')

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
    console.log('产品页面加载开始')
    
    // 先设置基础测试数据，确保页面不空白
    this.setData({
      products: [
        {
          id: 999,
          name: '测试产品套餐',
          categoryName: '工商业用电',
          price: '0.65',
          priceRange: '0.60-0.70',
          priceDesc: '根据用电量浮动',
          estimatedSavings: '12800',
          features: ['稳定供电', '优惠价格', '专业服务'],
          suitableDesc: '适合中小型工商业企业',
          tags: [
            { text: '热门', type: 'hot' },
            { text: '推荐', type: 'recommend' }
          ]
        }
      ],
      loading: false
    })
    
    this.getUserInfo()
    this.loadMockProducts() // 加载模拟数据
    this.loadProducts()     // 尝试加载真实数据
    
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

  // 加载模拟产品数据
  loadMockProducts() {
    const mockProducts = [
      {
        id: 1,
        name: '工商业基础用电套餐',
        categoryName: '标准套餐',
        price: '0.65',
        priceRange: '0.60-0.70',
        priceDesc: '根据用电量阶梯定价',
        estimatedSavings: '8600',
        features: ['稳定供电', '基础服务', '标准价格'],
        suitableDesc: '适合中小型工商业企业',
        tags: [
          { text: '基础', type: 'basic' }
        ]
      },
      {
        id: 2,
        name: '工商业优选用电套餐',
        categoryName: '优选套餐',
        price: '0.58',
        priceRange: '0.55-0.65',
        priceDesc: '大客户专享优惠价',
        estimatedSavings: '15200',
        features: ['专属服务', '优惠价格', '绿色通道'],
        suitableDesc: '适合中大型工商业企业',
        tags: [
          { text: '热门', type: 'hot' },
          { text: '优惠', type: 'discount' }
        ]
      },
      {
        id: 3,
        name: '工商业定制用电套餐',
        categoryName: '定制套餐',
        price: '面议',
        priceRange: '根据需求定制',
        priceDesc: '个性化定制方案',
        estimatedSavings: '25000+',
        features: ['个性定制', '专属经理', 'VIP服务'],
        suitableDesc: '适合大型工商业企业和集团客户',
        tags: [
          { text: '推荐', type: 'recommend' },
          { text: '定制', type: 'custom' }
        ]
      },
      {
        id: 4,
        name: '居民生活用电套餐',
        categoryName: '居民套餐',
        price: '0.56',
        priceRange: '0.52-0.60',
        priceDesc: '阶梯电价优惠',
        estimatedSavings: '1200',
        features: ['家庭优惠', '安全可靠', '便民服务'],
        suitableDesc: '适合普通居民家庭',
        tags: [
          { text: '家庭', type: 'family' }
        ]
      }
    ]

    // 根据当前筛选条件过滤数据
    let filteredProducts = mockProducts
    
    if (this.data.filters.category) {
      const categoryMap = {
        'standard': '标准套餐',
        'premium': '优选套餐', 
        'custom': '定制套餐'
      }
      const categoryName = categoryMap[this.data.filters.category]
      if (categoryName) {
        filteredProducts = mockProducts.filter(p => p.categoryName === categoryName)
      }
    }

    // 关键词搜索
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.trim().toLowerCase()
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(keyword) ||
        p.categoryName.toLowerCase().includes(keyword) ||
        p.features.some(f => f.toLowerCase().includes(keyword))
      )
    }

    this.setData({
      products: filteredProducts,
      hasMore: false,
      page: 2
    })
    
    console.log('设置模拟产品数据:', filteredProducts.length, '个产品')
  },

  // 获取用户信息
  async getUserInfo() {
    try {
      console.log('开始获取用户信息')
      const userInfo = app.globalData.userInfo || await app.getUserInfo()
      
      // 设置默认的用户信息
      const defaultUserInfo = {
        isAuthenticated: false,
        ...userInfo
      }
      
      // 尝试获取用户用电信息
      let powerInfo = null
      try {
        powerInfo = await api.getUserPowerInfo()
        console.log('用户用电信息获取成功:', powerInfo)
      } catch (powerError) {
        console.log('获取用户用电信息失败，使用默认数据:', powerError)
        // 使用模拟的用电信息
        powerInfo = {
          capacity: '500kW',
          monthlyUsage: '50000',
          industryType: '制造业',
          hasInfo: false
        }
      }
      
      this.setData({
        userInfo: defaultUserInfo,
        powerInfo
      })
      
      console.log('用户信息设置完成')
    } catch (error) {
      console.log('获取用户信息失败，使用默认数据:', error)
      // 设置默认用户信息
      this.setData({
        userInfo: {
          isAuthenticated: false,
          nickName: '用户',
          avatarUrl: ''
        },
        powerInfo: {
          hasInfo: false
        }
      })
    }
  },

  // 加载产品列表
  async loadProducts(refresh = false) {
    if (this.data.loading && !refresh) return
    
    try {
      this.setData({ 
        loading: false, // 不显示loading，因为已经有模拟数据
        error: null
      })
      
      const params = {
        page: refresh ? 1 : this.data.page,
        pageSize: this.data.pageSize,
        ...this.data.filters,
        keyword: this.data.searchKeyword
      }
      
      // 如果用户已认证，添加用电信息用于推荐
      if (this.data.powerInfo && this.data.powerInfo.hasInfo !== false) {
        params.capacity = this.data.powerInfo.capacity
        params.monthlyUsage = this.data.powerInfo.monthlyUsage
        params.industryType = this.data.powerInfo.industryType
      }
      
      console.log('尝试加载产品列表，参数:', params)
      const result = await api.getProducts(params)
      
      console.log('产品列表加载成功:', result)
      
      // 处理API返回的数据格式
      let items = []
      if (result.success && result.data) {
        items = Array.isArray(result.data) ? result.data : 
                result.data.items || result.data.list || result.data.content || []
      } else if (Array.isArray(result)) {
        items = result
      }
      
      // 处理产品数据格式
      const processedItems = items.map(item => ({
        id: item.id,
        name: item.name || item.productName,
        categoryName: item.categoryName || item.category,
        price: item.price || item.basePrice || '0.00',
        priceRange: item.priceRange || `${item.minPrice || '0.00'}-${item.maxPrice || '0.00'}`,
        priceDesc: item.priceDesc || '价格说明',
        estimatedSavings: item.estimatedSavings || item.savings || '0',
        features: item.features || [],
        suitableDesc: item.suitableDesc || item.description,
        tags: item.tags || []
      }))
      
      if (processedItems.length > 0) {
        const products = refresh ? processedItems : [...this.data.products, ...processedItems]
        
        this.setData({
          products,
          hasMore: result.hasMore || false,
          page: refresh ? 2 : this.data.page + 1,
          loading: false
        })
        
        console.log('真实产品数据设置成功，共', products.length, '个产品')
      }
      
      if (refresh) {
        wx.stopPullDownRefresh()
        this.setData({ refreshing: false })
      }
      
    } catch (error) {
      console.error('加载产品失败:', error)
      
      // 不设置错误状态，保持现有的模拟数据
      if (this.data.products.length === 0) {
        console.log('API失败且无数据，重新加载模拟数据')
        this.loadMockProducts()
      } else {
        console.log('API失败但有现有数据，保持现状')
      }
      
      this.setData({
        loading: false
      })
      
      if (refresh) {
        wx.stopPullDownRefresh()
        this.setData({ refreshing: false })
      }
      
      // 只有在没有现有数据时才显示错误提示
      if (this.data.products.length === 0) {
        wx.showToast({
          title: '加载失败，显示演示数据',
          icon: 'none'
        })
      }
    }
  },

  // 刷新产品列表
  refreshProducts() {
    this.setData({ 
      refreshing: true,
      page: 1,
      hasMore: true
    })
    
    // 重新加载模拟数据以应用筛选
    this.loadMockProducts()
    
    // 尝试加载真实数据
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