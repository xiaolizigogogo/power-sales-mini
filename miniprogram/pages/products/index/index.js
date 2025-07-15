const app = getApp()
const { api } = require('../../../utils/api')
const utils = require('../../../utils/common')

// 模拟产品数据
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
    voltage: '380',
    phase: '三相',
    category: 'commercial',
    isHot: false,
    isRecommended: false,
    hasDiscount: false,
    isNew: true
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
    voltage: '380',
    phase: '三相',
    category: 'commercial',
    isHot: true,
    isRecommended: true,
    hasDiscount: true,
    isNew: false
  },
  {
    id: 3,
    name: '工商业定制用电套餐',
    categoryName: '定制套餐',
    price: '面议',
    priceRange: '根据需求定制',
    priceDesc: '个性化定制方案',
    estimatedSavings: '25000',
    features: ['个性定制', '专属经理', 'VIP服务'],
    suitableDesc: '适合大型工商业企业和集团客户',
    voltage: '380',
    phase: '三相',
    category: 'commercial',
    isHot: false,
    isRecommended: true,
    hasDiscount: false,
    isNew: false
  },
  {
    id: 4,
    name: '居民生活用电套餐',
    categoryName: '标准套餐',
    price: '0.56',
    priceRange: '0.52-0.60',
    priceDesc: '阶梯电价优惠',
    estimatedSavings: '1200',
    features: ['家庭优惠', '安全可靠', '便民服务'],
    suitableDesc: '适合普通居民家庭',
    voltage: '220',
    phase: '单相',
    category: 'residential',
    isHot: true,
    isRecommended: false,
    hasDiscount: true,
    isNew: false
  }
]

Page({
  data: {
    // 产品列表
    products: mockProducts, // 直接使用模拟数据
    loading: false,
    hasMore: false, // 由于使用模拟数据，设置为false
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

    // 适用性选项
    suitableOptions: [
      { text: '全部', value: '' },
      { text: '适合我的', value: true }
    ],
    
    // 搜索相关
    searchKeyword: '',
    searchFocused: false,
    searchHistory: [],
    hotSearches: ['优惠套餐', '工业用电', '绿色能源', '峰谷电价'],
    
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
    
    // 获取搜索历史
    this.loadSearchHistory()
    
    // 获取用户信息
    this.getUserInfo()
    
    // 不再调用 loadProducts，因为已经使用模拟数据
    console.log('初始产品数据：', this.data.products)
    
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
    // 保证tabbar高亮同步
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().updateActiveTab();
    }
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
    const userType = this.data.userInfo?.customerType || '用户'
    return {
      title: `为${userType}推荐的电力优选套餐`,
      path: '/pages/products/index/index',
      imageUrl: '/assets/images/share-products.png'
    }
  },

  // 获取用户信息
  async getUserInfo() {
    try {
      console.log('开始获取用户信息')
      const userInfo = await api.getUserInfo()
      const powerInfo = await api.getUserPowerInfo()
      
      this.setData({
        userInfo: userInfo.data,
        powerInfo: powerInfo.data
      })
      
      console.log('用户信息设置完成')
    } catch (error) {
      console.error('获取用户信息失败：', error)
      utils.showToast('获取用户信息失败')
    }
  },

  // 加载搜索历史
  loadSearchHistory() {
    const history = wx.getStorageSync('searchHistory') || []
    this.setData({ searchHistory: history })
  },

  // 保存搜索历史
  saveSearchHistory(keyword) {
    if (!keyword) return
    
    let history = this.data.searchHistory
    // 删除已存在的相同关键词
    history = history.filter(item => item !== keyword)
    // 添加到开头
    history.unshift(keyword)
    // 最多保存10条
    history = history.slice(0, 10)
    
    this.setData({ searchHistory: history })
    wx.setStorageSync('searchHistory', history)
  },

  // 清空搜索历史
  clearSearchHistory() {
    this.setData({ searchHistory: [] })
    wx.removeStorageSync('searchHistory')
    utils.showToast('已清空搜索历史')
  },

  // 搜索相关事件处理
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  onSearchFocus() {
    this.setData({ searchFocused: true })
  },

  onSearchBlur() {
    setTimeout(() => {
      this.setData({ searchFocused: false })
    }, 200)
  },

  onSearchConfirm(e) {
    const keyword = this.data.searchKeyword.trim()
    if (keyword) {
      this.saveSearchHistory(keyword)
      this.refreshProducts()
    }
  },

  clearSearch() {
    this.setData({ 
      searchKeyword: '',
      searchFocused: false
    })
    this.refreshProducts()
  },

  onHistoryTap(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ 
      searchKeyword: keyword,
      searchFocused: false
    })
    this.refreshProducts()
  },

  onHotSearchTap(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ 
      searchKeyword: keyword,
      searchFocused: false
    })
    this.refreshProducts()
  },

  // 筛选条件变化处理
  onCategoryChange(e) {
    this.setData({
      'filters.category': e.detail.name
    })
    this.refreshProducts()
  },

  onPriceRangeChange(e) {
    this.setData({
      'filters.priceRange': e.detail
    })
    this.refreshProducts()
  },

  onSuitableChange(e) {
    this.setData({
      'filters.suitable': e.detail
    })
    this.refreshProducts()
  },

  // 产品操作
  onProductTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/products/detail/detail?id=${id}`
    })
  },

  // 跳转到计算器页面
  onCalculatorTap(e) {
    console.log('计算收益按钮被点击', e)
    
    // 获取产品ID
    const id = e.currentTarget.dataset.id
    console.log('产品ID:', id)
    
    // 查找产品信息
    const product = this.data.products.find(p => p.id === id)
    console.log('产品信息:', product)
    
    if (!product) {
      console.error('产品信息不存在')
      utils.showToast('产品信息不存在')
      return
    }
    
    // 检查是否已登录
    const token = wx.getStorageSync('token')
    console.log('用户token:', token)
    
    if (!token) {
      console.log('用户未登录，显示登录提示')
      wx.showModal({
        title: '提示',
        content: '请先登录后再使用计算器功能',
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

    // 检查是否有用电信息
    console.log('用户电力信息:', this.data.powerInfo)
    
    if (!this.data.powerInfo) {
      console.log('用户电力信息不存在，显示完善信息提示')
      wx.showModal({
        title: '提示',
        content: '请先完善用电信息，以便为您提供更准确的计算结果',
        confirmText: '去完善',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/profile/info/info'
            })
          }
        }
      })
      return
    }

    // 构建计算器页面的参数
    const params = {
      productId: id,
      productName: product.name,
      currentPrice: product.price,
      consumption: this.data.powerInfo?.currentMonth?.consumption || 0
    }
    
    console.log('跳转参数:', params)
    // 构建正确的跳转URL
    const url = `/pages/products/calculator/calculator?${this.objectToQuery(params)}`
    console.log('跳转URL:', url)

    // 跳转到计算器页面
    wx.navigateTo({
      url: url,
      fail: (error) => {
        console.error('跳转失败:', error)
        utils.showToast('跳转失败，请重试')
      }
    })
  },

  // 对象转查询字符串
  objectToQuery(obj) {
    if (!obj) return ''
    return Object.keys(obj)
      .filter(key => obj[key] != null) // 过滤掉 null 和 undefined 值
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
      .join('&')
  },

  // 快速购买
  onQuickOrderTap(e) {
    // 阻止事件冒泡
    if (e && e.detail && e.detail.userInfo) {
      return; // 如果是授权按钮的回调，直接返回
    }
    
    const id = e.currentTarget.dataset.id;
    
    // 查找产品信息
    const product = this.data.products.find(p => p.id === id);
    if (!product) {
      utils.showToast('产品信息不存在');
      return;
    }
    
    // 检查是否已登录
    if (!wx.getStorageSync('token')) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再进行购买',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/login/login'
            });
          }
        }
      });
      return;
    }
    
    // 构建跳转参数
    const params = {
      productId: id,
      productName: encodeURIComponent(product.name),
      currentPrice: product.price,
      productType: product.category || 'commercial',
      voltage: product.voltage || '380',
      phase: product.phase || '三相'
    };
    
    // 如果有用户用电信息，也传递过去
    if (this.data.powerInfo?.currentMonth?.consumption) {
      params.consumption = this.data.powerInfo.currentMonth.consumption;
    }
    
    const queryString = this.objectToQuery(params);
    console.log('快速购买跳转参数:', params);
    
    // 跳转到订单创建页
    wx.navigateTo({
      url: `/pages/orders/create/create?${queryString}`,
      fail: (error) => {
        console.error('跳转失败:', error);
        utils.showToast('跳转失败，请重试');
      }
    });
  },

  // 刷新产品列表
  refreshProducts() {
    this.setData({
      page: 1,
      products: [],
      hasMore: true,
      refreshing: true
    })
    this.loadProducts(true)
  },

  // 加载更多产品
  loadMoreProducts() {
    this.loadProducts()
  },

  // 重试加载
  retryLoad() {
    this.setData({ error: null })
    this.loadProducts()
  },

  // 获取产品标签
  getProductTags(product) {
    const tags = []
    
    // 热门标签
    if (product.isHot) {
      tags.push({ text: '热门', type: 'danger' })
    }
    
    // 推荐标签
    if (product.isRecommended) {
      tags.push({ text: '推荐', type: 'primary' })
    }
    
    // 优惠标签
    if (product.hasDiscount) {
      tags.push({ text: '优惠', type: 'warning' })
    }
    
    // 新品标签
    if (product.isNew) {
      tags.push({ text: '新品', type: 'success' })
    }
    
    return tags
  },

  // 加载产品列表
  async loadProducts(refresh = false) {
    if (this.data.loading && !refresh) return
    
    this.setData({ 
      loading: true,
      error: null
    })
    
    try {
      const params = {
        page: refresh ? 1 : this.data.page,
        pageSize: this.data.pageSize,
        category: this.data.filters.category,
        keyword: this.data.searchKeyword,
        priceRange: this.data.filters.priceRange,
        suitable: this.data.filters.suitable
      }

      console.log('尝试加载产品列表，参数:', params)

      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))

      // 筛选模拟数据
      let filteredProducts = [...mockProducts]

      // 分类筛选
      if (params.category) {
        filteredProducts = filteredProducts.filter(p => p.categoryName.includes(params.category))
      }

      // 关键词搜索
      if (params.keyword) {
        const keyword = params.keyword.toLowerCase()
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(keyword) ||
          p.categoryName.toLowerCase().includes(keyword) ||
          p.features.some(f => f.toLowerCase().includes(keyword))
        )
      }

      // 价格区间筛选
      if (params.priceRange) {
        const [min, max] = params.priceRange.split('-').map(Number)
        filteredProducts = filteredProducts.filter(p => {
          if (p.price === '面议') return true
          const price = parseFloat(p.price)
          return price >= min && price <= max
        })
      }

      // 适用性筛选
      if (params.suitable) {
        const powerInfo = this.data.powerInfo
        if (powerInfo) {
          filteredProducts = filteredProducts.filter(p => {
            // 根据用户用电量判断是否适合
            const consumption = powerInfo.currentMonth.consumption
            if (consumption < 5000) {
              return p.categoryName.includes('标准')
            } else if (consumption < 20000) {
              return p.categoryName.includes('优选')
            } else {
              return p.categoryName.includes('定制')
            }
          })
        }
      }

      // 分页处理
      const start = (params.page - 1) * params.pageSize
      const end = start + params.pageSize
      const pageProducts = filteredProducts.slice(start, end)

      // 格式化产品数据
      const formattedProducts = pageProducts.map(product => ({
        ...product,
        tags: this.getProductTags(product)
      }))

      this.setData({
        products: refresh ? formattedProducts : [...this.data.products, ...formattedProducts],
        page: params.page + 1,
        hasMore: end < filteredProducts.length,
        loading: false,
        refreshing: false
      })

      if (refresh) {
        wx.stopPullDownRefresh()
      }

      console.log('设置模拟产品数据:', formattedProducts.length, '个产品')
    } catch (error) {
      console.error('加载产品列表失败:', error)
      this.setData({
        loading: false,
        refreshing: false,
        error: error.message || '加载失败，请重试'
      })

      if (refresh) {
        wx.stopPullDownRefresh()
      }
    }
  }
}) 