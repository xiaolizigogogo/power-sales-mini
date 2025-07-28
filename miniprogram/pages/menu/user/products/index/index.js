const app = getApp()
const { api } = require('../../../../../utils/api')
const utils = require('../../../../../utils/common')

// 模拟产品数据（作为后备方案）
const mockProducts = [
  {
    id: 1,
    logo: '/assets/images/icons/business.png',
    companyName: '风电公司',
    name: '一口价,包偏差,各月一致',
    productNo: '20250715062939857911',
    price: '0.417',
    priceUnit: '元/度',
    type: '普通',
    targetPeriod: '2025.08~2025.12',
    purchasePeriod: '1~5自然月',
    inventory: '35808.08',
    sold: '300',
    upwardCoefficient: '-',
    downwardCoefficient: '-',
    agreement: '经双方确认解约 量价变更 不可议价',
    packageName: '基础价格套餐',
    packageDesc: '不分时段 不约定电量',
    packagePrice: '0.417',
    packageUnit: '元/度',
    isEstimated: false
  },
  {
    id: 2,
    logo: '/assets/images/icons/company.png',
    companyName: '国家电网 STATE GRID',
    name: '一口价,包偏差,不限压,不限量,可…',
    productNo: '20241223030643323794',
    price: '0.415',
    priceUnit: '元/度',
    type: '普通',
    targetPeriod: '2025.01~2025.12',
    purchasePeriod: '1~4自然月',
    inventory: '2091758.876',
    sold: '84916.973',
    upwardCoefficient: '-',
    downwardCoefficient: '-',
    agreement: '经双方确认解约 量价变更 可议价',
    packageName: '基础价格套餐',
    packageDesc: '不分时段 不约定电量',
    packagePrice: '0.415',
    packageUnit: '元/度',
    isEstimated: false
  },
  {
    id: 3,
    logo: '/assets/images/icons/company.png',
    companyName: '国家电网 STATE GRID',
    name: '分时签,包偏差,不限压,不限量,可',
    productNo: '20250714024032087470',
    price: '0.401',
    priceUnit: '元/度',
    type: '普通',
    targetPeriod: '2025.08~2025.12',
    purchasePeriod: '1~4自然月',
    inventory: '2091758.876',
    sold: '0',
    upwardCoefficient: '-',
    downwardCoefficient: '-',
    agreement: '经双方确认解约 量价变更 可议价',
    packageName: '基础价格套餐',
    packageDesc: '不分时段 不约定电量',
    packagePrice: '0.401',
    packageUnit: '元/度',
    isEstimated: true
  }
];

Page({
  data: {
    // 产品列表
    products: [], // 初始化为空，接口获取
    loading: false,
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
      { id: '工商业用电', name: '工商业用电' },
      { id: '居民用电', name: '居民用电' },
      { id: '农业用电', name: '农业用电' },
      { id: '临时用电', name: '临时用电' }
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
    this.loadSearchHistory();
    this.getUserInfo();
    this.loadProducts(true);
    if (options.category) {
      this.setData({
        'filters.category': options.category
      });
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
      path: '/pages/menu/user/products/index/index',
      imageUrl: '/assets/images/share-products.png'
    }
  },

  // 数据格式转换函数 - 将原有接口数据转换为新格式
  formatProductData(product) {
    // 如果已经是新格式，直接返回
    if (product.logo && product.companyName && product.productNo) {
      return product;
    }
    
    // 转换旧格式到新格式
    return {
      id: product.id,
      logo: product.logo || product.companyLogo || '/assets/images/icons/company.png',
      companyName: product.companyName || product.company || '未知公司',
      name: product.name || product.productName || '产品名称',
      productNo: product.productNo || product.productNumber || `PROD${product.id}`,
      price: product.price || product.basePrice || '0.00',
      priceUnit: product.priceUnit || '元/度',
      type: product.type || product.userTypeText || '普通',
      targetPeriod: product.targetPeriod || product.period || '2025.01~2025.12',
      purchasePeriod: product.purchasePeriod || product.minPurchasePeriod || '1自然月',
      inventory: product.inventory || product.stock || '0',
      sold: product.sold || product.soldAmount || '0',
      upwardCoefficient: product.upwardCoefficient || '-',
      downwardCoefficient: product.downwardCoefficient || '-',
      agreement: product.agreement || '经双方确认解约 量价变更 不可议价',
      packageName: product.packageName || product.productType || '基础价格套餐',
      packageDesc: product.packageDesc || '不分时段 不约定电量',
      packagePrice: product.packagePrice || product.price || '0.00',
      packageUnit: product.packageUnit || '元/度',
      isEstimated: product.isEstimated || false,
      // 保留原有字段，以防其他地方还在使用
      ...product
    };
  },

  async loadProducts(refresh = false) {
    if (this.data.loading && !refresh) return;
    this.setData({ loading: true, error: null });
    
    try {
      const params = {
        page: refresh ? 1 : this.data.page,
        pageSize: this.data.pageSize,
        category: this.data.filters.category,
        keyword: this.data.searchKeyword,
        priceRange: this.data.filters.priceRange,
        suitable: this.data.filters.suitable
      };

      console.log('🔍 尝试加载产品列表，参数:', params);

      let productData = null;
      
      try {
        // 调用原有的API接口
        const res = await api.getProducts(params);
        console.log('📦 API响应:', res);
        
        if (res.code === 200 && res.data) {
          productData = res.data;
        } else {
          throw new Error(res.message || '接口返回数据格式错误');
        }
      } catch (error) {
        console.log('⚠️ API调用失败，使用模拟数据:', error);
        // API调用失败时使用模拟数据
        productData = mockProducts;
      }

      // 筛选数据
      let filteredProducts = Array.isArray(productData) ? productData : [];
      
      // 分类筛选
      if (params.category) {
        filteredProducts = filteredProducts.filter(p => 
          (p.categoryName && p.categoryName.includes(params.category)) ||
          (p.category && p.category.includes(params.category))
        );
      }

      // 关键词搜索
      if (params.keyword) {
        const keyword = params.keyword.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          (p.name && p.name.toLowerCase().includes(keyword)) ||
          (p.productName && p.productName.toLowerCase().includes(keyword)) ||
          (p.companyName && p.companyName.toLowerCase().includes(keyword)) ||
          (p.company && p.company.toLowerCase().includes(keyword))
        );
      }

      // 价格区间筛选
      if (params.priceRange) {
        const [min, max] = params.priceRange.split('-').map(Number);
        filteredProducts = filteredProducts.filter(p => {
          const price = p.price || p.basePrice;
          if (!price || price === '面议') return true;
          const priceNum = parseFloat(price);
          return priceNum >= min && priceNum <= max;
        });
      }

      // 适用性筛选
      if (params.suitable) {
        const powerInfo = this.data.powerInfo;
        if (powerInfo) {
          filteredProducts = filteredProducts.filter(p => {
            // 根据用户用电量判断是否适合
            const consumption = powerInfo.currentMonth?.consumption || 0;
            if (consumption < 5000) {
              return p.categoryName?.includes('标准') || p.category?.includes('标准');
            } else if (consumption < 20000) {
              return p.categoryName?.includes('优选') || p.category?.includes('优选');
            } else {
              return p.categoryName?.includes('定制') || p.category?.includes('定制');
            }
          });
        }
      }

      // 分页处理
      const start = (params.page - 1) * params.pageSize;
      const end = start + params.pageSize;
      const pageProducts = filteredProducts.slice(start, end);

      // 格式化产品数据
      const formattedProducts = pageProducts.map(product => 
        this.formatProductData(product)
      );

      this.setData({
        products: refresh ? formattedProducts : [...this.data.products, ...formattedProducts],
        page: params.page + 1,
        hasMore: end < filteredProducts.length,
        loading: false,
        refreshing: false
      });

      if (refresh) {
        wx.stopPullDownRefresh();
      }

      console.log('✅ 产品列表加载完成:', formattedProducts.length, '个产品');
    } catch (error) {
      console.error('❌ 加载产品列表失败:', error);
      this.setData({
        loading: false,
        refreshing: false,
        error: error.message || '加载失败，请重试'
      });
      if (refresh) {
        wx.stopPullDownRefresh();
      }
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
  }
}) 