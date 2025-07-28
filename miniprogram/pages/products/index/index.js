const app = getApp()
const { api } = require('../../../utils/api')
const utils = require('../../../utils/common')

// 模拟产品详情数据
const mockProductDetail = {
  id: 1,
  name: '工商业基础用电套餐',
  type: '普通',
  price: '0.417',
  priceUnit: '元/度',
  image: '/assets/images/products/wind-turbine.jpg',
  description: '一口价,包偏差,各月一致',
  agreement: '经双方确认解约 量价变更 不可议价',
  stats: {
    users: 1,
    inventory: 35808.08,
    sold: 300
  },
  company: {
    name: '山西弘博炜业电力科技有限公司',
    logo: '/assets/images/companies/company-logo.png'
  },
  productNo: '20250715062939857911',
  targetPeriod: '2025.08~2025.12',
  minPurchasePeriod: '1自然月',
  maxPurchasePeriod: '5自然月',
  voltageRequirement: '交流10kv及以上',
  minMonthlyUsage: '1MWh',
  maxMonthlyUsage: '10000MWh',
  productType: '基础价格套餐',
  packages: [
    {
      month: '08月',
      name: '基础价格套餐',
      isTimeOfUse: false,
      hasAgreedVolume: false,
      price: '0.417',
      priceUnit: '元/度'
    },
    {
      month: '09月',
      name: '基础价格套餐',
      isTimeOfUse: false,
      hasAgreedVolume: false,
      price: '0.417',
      priceUnit: '元/度'
    },
    {
      month: '10月',
      name: '基础价格套餐',
      isTimeOfUse: false,
      hasAgreedVolume: false,
      price: '0.417',
      priceUnit: '元/度'
    },
    {
      month: '11月',
      name: '基础价格套餐',
      isTimeOfUse: false,
      hasAgreedVolume: false,
      price: '0.417',
      priceUnit: '元/度'
    },
    {
      month: '12月',
      name: '基础价格套餐',
      isTimeOfUse: false,
      hasAgreedVolume: false,
      price: '0.417',
      priceUnit: '元/度'
    }
  ]
}

Page({
  data: {
    // 产品详情
    product: null,
    loading: false,
    error: null,
    
    // 标签页
    activeTab: 'basic', // basic: 基本参数, package: 套餐详情
    activeMonth: 0, // 当前选中的月份索引
    
    // 对比功能
    compareList: [],
    isInCompare: false
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      this.loadProductDetail(id)
    } else {
      // 如果没有传入ID，使用模拟数据
      this.setData({
        product: mockProductDetail,
        loading: false
      })
    }
  },

  onShow() {
    // 检查是否在对比列表中
    this.checkCompareStatus()
  },

  onShareAppMessage() {
    return {
      title: this.data.product?.name || '商品详情',
      path: `/pages/products/index/index?id=${this.data.product?.id}`
    }
  },

  // 加载产品详情
  async loadProductDetail(id) {
    this.setData({ loading: true, error: null })
    
    try {
      // 这里应该调用真实的API
      // const res = await api.getProductDetail(id)
      
      // 使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 500))
      this.setData({
        product: mockProductDetail,
        loading: false
      })
    } catch (error) {
      console.error('加载产品详情失败:', error)
      this.setData({
        error: '加载失败，请重试',
        loading: false
      })
    }
  },

  // 切换标签页
  onTabChange(e) {
    const { name } = e.detail
    this.setData({ activeTab: name })
  },

  // 切换月份
  onMonthChange(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ activeMonth: index })
  },

  // 返回上一页
  onBack() {
    wx.navigateBack()
  },

  // 拨打电话
  onCall() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567'
    })
  },

  // 跳转到店铺
  onShop() {
    wx.navigateTo({
      url: '/pages/shop/index/index'
    })
  },

  // 收藏/取消收藏
  onFavorite() {
    const product = this.data.product
    if (!product) return
    
    // 这里应该调用收藏API
    wx.showToast({
      title: '收藏成功',
      icon: 'success'
    })
  },

  // 加入对比
  onAddToCompare() {
    const product = this.data.product
    if (!product) return
    
    // 这里应该调用对比API
    this.setData({
      isInCompare: true
    })
    
    wx.showToast({
      title: '已加入对比',
      icon: 'success'
    })
  },

  // 去对比
  onGoToCompare() {
    wx.navigateTo({
      url: '/pages/compare/index/index'
    })
  },

  // 立即下单
  onOrder() {
    const product = this.data.product
    if (!product) return
    
    wx.navigateTo({
      url: `/pages/order/create/index?productId=${product.id}`
    })
  },

  // 检查对比状态
  checkCompareStatus() {
    // 这里应该检查产品是否在对比列表中
    // 暂时使用模拟数据
    this.setData({
      isInCompare: false
    })
  },

  // 复制产品编号
  onCopyProductNo() {
    const productNo = this.data.product?.productNo
    if (!productNo) return
    
    wx.setClipboardData({
      data: productNo,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        })
      }
    })
  }
}) 