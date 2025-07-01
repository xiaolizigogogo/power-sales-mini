const app = getApp()
const auth = require('../../../utils/auth')
const { checkRoleAccess } = require('../../../utils/auth')
const { request } = require('../../../utils/api')

Page({
  data: {
    // 搜索相关
    searchValue: '',
    activeTab: 0,
    
    // 分类相关
    categories: ['all', 'industrial', 'commercial', 'residential'],
    
    // 产品列表
    products: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    compareList: [],
  },

  onLoad(options) {
    console.log('产品列表页面加载', options)
    
    // 检查角色权限
    if (!checkRoleAccess('products')) {
      return
    }
    
    // 从参数获取分类ID
    if (options.categoryId) {
      this.setData({
        activeTab: parseInt(options.categoryId)
      })
    }
    
    this.loadProducts()
  },

  // 加载产品列表
  async loadProducts(refresh = false) {
    if (refresh) {
      this.setData({
        page: 1,
        products: [],
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

      const res = await request('GET', '/api/products', params)
      
      const { list, total } = res.data
      const hasMore = page * pageSize < total
      
      this.setData({
        products: [...this.data.products, ...list],
        page: hasMore ? page + 1 : page,
        hasMore,
        loading: false
      })
    } catch (error) {
      console.error('加载产品列表失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 搜索相关
  onSearchChange(e) {
    this.setData({
      searchValue: e.detail
    })
  },

  onSearch() {
    this.loadProducts(true)
  },

  // 分类切换
  onTabChange(e) {
    this.setData({
      activeTab: e.detail.index
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

  // 对比相关
  toggleCompare(e) {
    const { id } = e.currentTarget.dataset
    const { compareList } = this.data
    
    if (compareList.includes(id)) {
      this.setData({
        compareList: compareList.filter(item => item !== id)
      })
    } else {
      if (compareList.length >= 3) {
        wx.showToast({
          title: '最多只能对比3个产品',
          icon: 'none'
        })
        return
      }
      this.setData({
        compareList: [...compareList, id]
      })
    }
  },

  showCompare() {
    const { compareList } = this.data
    if (compareList.length < 2) {
      wx.showToast({
        title: '请至少选择2个产品进行对比',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: `/pages/products/compare/compare?ids=${compareList.join(',')}`,
    })
  },

  onPullDownRefresh() {
    this.loadProducts(true)
    wx.stopPullDownRefresh()
  },

  onReachBottom() {
    this.loadProducts()
  },

  // 检查权限
  checkPermissions() {
    if (!auth.checkLogin()) {
      return false
    }
    
    if (!auth.hasPermission(auth.PERMISSIONS.PRODUCT_VIEW)) {
      wx.showModal({
        title: '权限不足',
        content: '您没有权限查看产品信息',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
      return false
    }
    
    return true
  },

  onShow() {
    // 页面显示时刷新数据
    this.refreshProducts()
  },

  // 刷新产品列表
  refreshProducts() {
    this.setData({
      page: 1,
      hasMore: true
    })
    this.loadProducts(true)
  },

  // 跳转到电费计算器
  goToCalculator() {
    wx.navigateTo({
      url: '/pages/products/calculator/calculator'
    })
  }
}) 