const app = getApp()

Page({
  data: {
    // 搜索相关
    searchValue: '',
    
    // 分类相关
    categories: [
      { id: 0, name: '全部' },
      { id: 1, name: '工商业用电' },
      { id: 2, name: '居民用电' },
      { id: 3, name: '农业用电' },
      { id: 4, name: '临时用电' }
    ],
    currentCategory: 0,
    
    // 产品列表
    list: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad(options) {
    console.log('产品列表页面加载', options)
    
    // 从参数获取分类ID
    if (options.categoryId) {
      this.setData({
        currentCategory: parseInt(options.categoryId)
      })
    }
    
    this.loadProducts()
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshProducts()
  },

  onPullDownRefresh() {
    this.refreshProducts()
  },

  onReachBottom() {
    this.loadMoreProducts()
  },

  // 加载产品列表
  async loadProducts(reset = false) {
    if (this.data.loading && !reset) return

    const page = reset ? 1 : this.data.page
    
    this.setData({
      loading: reset || this.data.list.length === 0,
      loadingMore: !reset && this.data.list.length > 0
    })

    try {
      const params = {
        page: page - 1,
        size: this.data.pageSize
      }

      // 添加分类筛选
      if (this.data.currentCategory > 0) {
        params.categoryId = this.data.currentCategory
      }

      // 添加搜索关键词
      if (this.data.searchValue) {
        params.keyword = this.data.searchValue
      }

      console.log('加载产品列表，参数:', params)

      const res = await app.request({
        url: '/products',
        method: 'GET',
        data: params
      })

      console.log('产品列表响应:', res)

      // 处理响应数据
      let products = []
      if (res.data) {
        if (Array.isArray(res.data)) {
          products = res.data
        } else if (res.data.content) {
          products = res.data.content
        } else if (res.data.list) {
          products = res.data.list
        }
      }

      // 处理产品数据
      const processedProducts = products.map(product => ({
        ...product,
        image: product.imageUrl || product.image_url || '/assets/images/product-default.png',
        price: product.basePrice || product.base_price || product.price || '0.00',
        categoryName: this.getCategoryName(product.type || product.category_id)
      }))

      this.setData({
        list: reset ? processedProducts : [...this.data.list, ...processedProducts],
        hasMore: processedProducts.length >= this.data.pageSize,
        page: page + 1
      })

    } catch (error) {
      console.error('加载产品列表失败:', error)
      
      // 如果是首次加载失败，显示模拟数据
      if (reset || this.data.list.length === 0) {
        this.loadMockData()
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    } finally {
      this.setData({
        loading: false,
        loadingMore: false
      })
      
      wx.stopPullDownRefresh()
    }
  },

  // 加载模拟数据
  loadMockData() {
    const mockProducts = [
      {
        id: 1,
        name: '工商业基础用电套餐',
        description: '适合中小型工商业企业，提供稳定可靠的电力供应服务',
        price: '0.65',
        image: '/assets/images/product-1.png',
        categoryName: '工商业用电',
        type: 'commercial'
      },
      {
        id: 2,
        name: '工商业标准用电套餐',
        description: '针对中等规模工商业企业设计，提供更多用电量和更优惠的价格',
        price: '0.62',
        image: '/assets/images/product-2.png',
        categoryName: '工商业用电',
        type: 'commercial'
      },
      {
        id: 3,
        name: '工商业高级用电套餐',
        description: '为大型工商业企业量身定制，提供大容量用电服务和最优惠的价格',
        price: '0.58',
        image: '/assets/images/product-3.png',
        categoryName: '工商业用电',
        type: 'commercial'
      },
      {
        id: 4,
        name: '居民生活用电套餐',
        description: '为普通居民家庭提供的基础用电服务，价格实惠，用电稳定',
        price: '0.56',
        image: '/assets/images/product-4.png',
        categoryName: '居民用电',
        type: 'residential'
      },
      {
        id: 5,
        name: '农业生产用电套餐',
        description: '专为农业生产设计的用电套餐，支持农业现代化发展',
        price: '0.45',
        image: '/assets/images/product-5.png',
        categoryName: '农业用电',
        type: 'agricultural'
      },
      {
        id: 6,
        name: '临时施工用电套餐',
        description: '为建筑工地、临时活动等提供的短期用电服务，灵活便捷',
        price: '0.75',
        image: '/assets/images/product-6.png',
        categoryName: '临时用电',
        type: 'temporary'
      }
    ]

    // 根据当前分类筛选
    let filteredProducts = mockProducts
    if (this.data.currentCategory > 0) {
      const categoryMap = {
        1: 'commercial',
        2: 'residential', 
        3: 'agricultural',
        4: 'temporary'
      }
      const targetType = categoryMap[this.data.currentCategory]
      filteredProducts = mockProducts.filter(p => p.type === targetType)
    }

    // 根据搜索关键词筛选
    if (this.data.searchValue) {
      const keyword = this.data.searchValue.toLowerCase()
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(keyword) || 
        p.description.toLowerCase().includes(keyword)
      )
    }

    this.setData({
      list: filteredProducts,
      hasMore: false
    })
  },

  // 获取分类名称
  getCategoryName(type) {
    const categoryMap = {
      'commercial': '工商业用电',
      'residential': '居民用电',
      'agricultural': '农业用电',
      'temporary': '临时用电',
      '工商业用电': '工商业用电',
      '居民用电': '居民用电',
      '农业用电': '农业用电',
      '临时用电': '临时用电'
    }
    return categoryMap[type] || '其他'
  },

  // 刷新产品列表
  refreshProducts() {
    this.setData({
      page: 1,
      hasMore: true
    })
    this.loadProducts(true)
  },

  // 加载更多产品
  loadMoreProducts() {
    if (!this.data.hasMore || this.data.loading || this.data.loadingMore) {
      return
    }
    this.loadProducts()
  },

  // 处理分类切换
  handleCategoryChange(e) {
    const categoryId = parseInt(e.currentTarget.dataset.id)
    if (categoryId === this.data.currentCategory) return

    this.setData({
      currentCategory: categoryId
    })
    this.refreshProducts()
  },

  // 处理搜索
  handleSearch(e) {
    const value = e.detail.value.trim()
    this.setData({
      searchValue: value
    })
    this.refreshProducts()
  },

  // 清除搜索
  handleSearchClear() {
    this.setData({
      searchValue: ''
    })
    this.refreshProducts()
  },

  // 跳转到产品详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/products/detail/detail?id=${id}`
    })
  },

  // 跳转到电费计算器
  goToCalculator() {
    wx.navigateTo({
      url: '/pages/products/calculator/calculator'
    })
  }
}) 