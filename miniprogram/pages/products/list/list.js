const app = getApp()
const auth = require('../../../utils/auth')
const { productAPI } = require('../../../utils/api')
const { formatProductItem } = require('../../../utils/product-helper')

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
    pageSize: 10,
    
    // 用户用电信息（用于节省金额计算）
    userPowerInfo: {
      monthlyUsage: 1000, // 默认月用电量
      currentPrice: 0.6,  // 默认当前电价
      userType: 'commercial' // 用户类型
    }
  },

  onLoad(options) {
    console.log('产品列表页面加载', options)
    
    // 从参数获取分类ID
    if (options.categoryId) {
      this.setData({
        activeTab: parseInt(options.categoryId)
      })
    }
    
    // 加载用户用电信息
    this.loadUserPowerInfo()
  },

  onShow() {
    // 检查登录状态，但不强制跳转
    const isLoggedIn = app.globalData.isLoggedIn
    console.log('产品列表页面登录状态:', isLoggedIn)
    
    // 页面显示时刷新数据
    this.loadProducts(true);
  },

  // 加载用户用电信息
  async loadUserPowerInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.setData({
          'userPowerInfo.userType': userInfo.userType || 'commercial'
        })
      }
      
      // 这里可以调用API获取用户实际用电信息
      // const res = await powerAPI.getUserPowerInfo()
      // if (res.code === 200) {
      //   this.setData({
      //     userPowerInfo: res.data
      //   })
      // }
    } catch (error) {
      console.error('加载用户用电信息失败:', error)
    }
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
        category: categories[activeTab] !== 'all' ? categories[activeTab] : ''
      }

      console.log('🔍 请求产品列表参数:', params)
      
      let list = [], total = 0;
      
      try {
        const res = await productAPI.getProducts(params)
        console.log('📦 产品列表响应:', res)
        
        // 处理返回的数据结构
        if (res.code === 200 && Array.isArray(res.data)) {
          list = res.data.map(item => formatProductItem(item, this.data.userPowerInfo));
          total = list.length;
        }
      } catch (error) {
        console.warn('⚠️ API调用失败，使用测试数据:', error);
        
        // 使用测试数据作为后备方案
        const { generateTestProducts } = require('../../../utils/product-helper');
        const testProducts = generateTestProducts();
        
        // 根据分类过滤测试数据
        let filteredProducts = testProducts;
        if (categories[activeTab] !== 'all') {
          filteredProducts = testProducts.filter(p => p.type === categories[activeTab]);
        }
        
        // 根据搜索关键词过滤
        if (searchValue) {
          filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            p.description.toLowerCase().includes(searchValue.toLowerCase())
          );
        }
        
        list = filteredProducts.map(item => formatProductItem(item, this.data.userPowerInfo));
        total = list.length;
        
        console.log('🧪 使用测试数据，产品数量:', total);
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