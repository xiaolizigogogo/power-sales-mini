const app = getApp()
const auth = require('../../../utils/auth')
const { productAPI } = require('../../../utils/api')

Page({
  data: {
    // 搜索相关
    searchValue: '',
    activeTab: 0,
    
    // 分类相关
    categories: ['all', 'industrial', 'commercial', 'residential'],
    
    // 产品列表
    products: {
      list: [],
      total: 0
    },
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad(options) {
    console.log('产品列表页面加载', options)
    
    // 从参数获取分类ID
    if (options.categoryId) {
      this.setData({
        activeTab: parseInt(options.categoryId)
      })
    }
  },

  onShow() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
      return;
    }
    
    // 页面显示时刷新数据
    this.loadProducts(true);
  },

  // 加载产品列表
  async loadProducts(refresh = false) {
    if (refresh) {
      this.setData({
        page: 1,
        'products.list': [],
        hasMore: true
      })
    }

    if (!this.data.hasMore || this.data.loading) return

    this.setData({ loading: true })

    try {
      const { searchValue, page, pageSize, categories, activeTab } = this.data
      const params = {
        page,
        pageSize,
        keyword: searchValue,
        category: categories[activeTab]
      }

      console.log('🔍 请求产品列表参数:', params)
      const res = await productAPI.getProducts(params)
      console.log('📦 产品列表响应:', res)
      
      // 处理返回的数据结构
      let list = [], total = 0;
      
      if (res.code === 200 && Array.isArray(res.data)) {
        list = res.data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          basePrice: item.basePrice,
          imageUrl: item.imageUrl,
          isNew: item.isNew,
          isHot: item.isHot
        }));
        total = list.length; // 由于后端没有返回总数，暂时用列表长度代替
      }
      
      console.log('🎯 处理后的数据:', { list, total })
      
      // 判断是否还有更多数据
      const hasMore = list.length >= pageSize
      
      this.setData({
        'products.list': refresh ? list : [...(this.data.products.list || []), ...list],
        'products.total': total,
        page: hasMore ? page + 1 : page,
        hasMore,
        loading: false
      })

      // 如果是刷新且没有数据，显示提示
      if (refresh && list.length === 0) {
        wx.showToast({
          title: '暂无产品数据',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('❌ 加载产品列表失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      this.setData({ 
        loading: false
      })
    }
  },

  // 搜索相关
  onSearchChange(e) {
    this.setData({
      searchValue: e.detail.value
    })
  },

  onSearch(e) {
    this.loadProducts(true)
  },

  // 分类切换
  onTabChange(e) {
    const index = e.currentTarget.dataset.index
    if (this.data.activeTab === index) return
    
    this.setData({
      activeTab: index
    })
    this.loadProducts(true)
  },

  // 产品点击
  onProductTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/products/detail/detail?id=${id}`
    })
  },

  onPullDownRefresh() {
    this.loadProducts(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    this.loadProducts()
  },

  // 跳转到电费计算器
  goToCalculator() {
    wx.navigateTo({
      url: '/pages/products/calculator/calculator'
    })
  }
}) 