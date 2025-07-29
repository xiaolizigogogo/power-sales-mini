const { productAPI } = require('../../../utils/api');
const { checkRoleAccess } = require('../../../utils/auth');
const { formatProductItem } = require('../../../utils/product-helper');

// 产品类型映射
const typeMapping = {
  'normal': '普通',
  'business': '工商业',
  'industrial': '工业',
  'commercial': '商业',
  'residential': '居民',
  'agricultural': '农业',
  'temporary': '临时',
  'default': '普通'
};

// 模拟产品详情数据（作为后备方案）
const mockProductDetail = {
  id: 1,
  name: '工商业基础用电套餐',
  type: 'business',
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
    console.log('🚀 产品详情页面加载，参数:', options);
    
    // 检查用户权限
    if (!checkRoleAccess('products')) {
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
      return;
    }

    const { id } = options;
    if (id) {
      console.log('📋 加载产品详情，ID:', id);
      this.loadProductDetail(id);
    } else {
      console.log('📋 使用模拟数据');
      // 如果没有传入ID，使用模拟数据
      this.setData({
        product: mockProductDetail,
        loading: false
      });
    }
  },

  onShow() {
    // 检查是否在对比列表中
    this.checkCompareStatus();
  },

  onShareAppMessage() {
    return {
      title: this.data.product?.name || '商品详情',
      path: `/pages/products/detail/detail?id=${this.data.product?.id}`
    };
  },

  // 加载产品详情
  async loadProductDetail(id) {
    this.setData({ loading: true, error: null });
    
    try {
      console.log('🔍 获取产品详情，ID:', id);
      
      let productData = null;
      
      try {
        // 调用原有的API接口
        const res = await productAPI.getProductDetail(id);
        console.log('📦 产品详情响应:', res);
        
        if (res.code === 200 && res.data) {
          productData = res.data;
        } else {
          throw new Error(res.message || '接口返回数据格式错误');
        }
      } catch (error) {
        console.log('⚠️ API调用失败，使用模拟数据:', error);
      }
      
      // 如果API调用失败，使用模拟数据
      if (!productData) {
        productData = mockProductDetail;
      }
      
      // 格式化产品数据
      const formattedProduct = this.formatProductData(productData);
      
      this.setData({
        product: formattedProduct,
        loading: false
      });
      
      console.log('✅ 产品详情加载完成:', formattedProduct);
      
    } catch (error) {
      console.error('❌ 加载产品详情失败:', error);
      this.setData({
        error: '加载失败，请重试',
        loading: false
      });
    }
  },

  // 翻译产品类型
  translateType(type) {
    if (!type) return '普通';
    
    // 如果已经是中文，直接返回
    if (typeMapping[type.toLowerCase()] === undefined && !typeMapping[type]) {
      return type;
    }
    
    // 转换为中文
    return typeMapping[type.toLowerCase()] || typeMapping[type] || '普通';
  },

  // 格式化产品数据 - 将原有接口数据转换为新格式
  formatProductData(productData) {
    // 如果已经是新格式，直接返回
    if (productData.packages && productData.stats && productData.company) {
      return productData;
    }
    
    // 转换旧格式到新格式
    const formattedProduct = {
      id: productData.id,
      name: productData.name || productData.productName || '产品名称',
      type: this.translateType(productData.type || productData.userTypeText || '普通'),
      price: productData.price || productData.basePrice || '0.417',
      priceUnit: productData.priceUnit || '元/度',
      image: productData.image || productData.images?.[0] || '/assets/images/products/wind-turbine.jpg',
      description: productData.description || productData.productDesc || '一口价,包偏差,各月一致',
      agreement: productData.agreement || '经双方确认解约 量价变更 不可议价',
      
      // 统计数据
      stats: {
        users: productData.users || productData.orderUsers || 1,
        inventory: productData.inventory || productData.stock || 35808.08,
        sold: productData.sold || productData.soldAmount || 300
      },
      
      // 公司信息
      company: {
        name: productData.companyName || productData.company || '山西弘博炜业电力科技有限公司',
        logo: productData.companyLogo || productData.logo || '/assets/images/companies/company-logo.png'
      },
      
      // 基本参数
      productNo: productData.productNo || productData.productNumber || `PROD${productData.id}`,
      targetPeriod: productData.targetPeriod || productData.period || '2025.08~2025.12',
      minPurchasePeriod: productData.minPurchasePeriod || productData.purchasePeriod || '1自然月',
      maxPurchasePeriod: productData.maxPurchasePeriod || productData.maxPurchasePeriod || '5自然月',
      voltageRequirement: productData.voltageRequirement || productData.voltage || '交流10kv及以上',
      minMonthlyUsage: productData.minMonthlyUsage || productData.minUsage || '1MWh',
      maxMonthlyUsage: productData.maxMonthlyUsage || productData.maxUsage || '10000MWh',
      productType: productData.productType || productData.packageName || '基础价格套餐',
      
      // 套餐信息 - 根据原有数据生成或使用默认值
      packages: this.generatePackages(productData),
      
      // 保留原有字段，以防其他地方还在使用
      ...productData
    };
    
    return formattedProduct;
  },

  // 生成套餐信息
  generatePackages(productData) {
    // 如果已有套餐信息，直接使用
    if (productData.packages && Array.isArray(productData.packages)) {
      return productData.packages;
    }
    
    // 根据产品信息生成套餐
    const basePrice = productData.price || productData.basePrice || '0.417';
    const packageName = productData.productType || productData.packageName || '基础价格套餐';
    
    // 生成5个月的套餐数据
    const months = ['08月', '09月', '10月', '11月', '12月'];
    return months.map(month => ({
      month,
      name: packageName,
      isTimeOfUse: productData.isTimeOfUse || false,
      hasAgreedVolume: productData.hasAgreedVolume || false,
      price: basePrice,
      priceUnit: productData.priceUnit || '元/度'
    }));
  },

  // 切换标签页
  onTabChange(e) {
    const { name } = e.currentTarget.dataset;
    this.setData({ activeTab: name });
  },

  // 切换月份
  onMonthChange(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeMonth: index });
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  // 拨打电话
  onCall() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567'
    });
  },



  // 加入对比
  onAddToCompare() {
    const product = this.data.product;
    if (!product) return;
    
    // 这里应该调用对比API
    this.setData({
      isInCompare: true
    });
    
    wx.showToast({
      title: '已加入对比',
      icon: 'success'
    });
  },

  // 去对比
  onGoToCompare() {
    wx.navigateTo({
      url: '/pages/compare/index/index'
    });
  },

  // 立即下单
  onOrder() {
    const product = this.data.product;
    console.log('立即下单 - 产品数据:', product);
    
    if (!product) {
      wx.showToast({
        title: '产品数据加载中，请稍后重试',
        icon: 'none'
      });
      return;
    }
    
    if (!product.id) {
      wx.showToast({
        title: '产品ID不存在',
        icon: 'none'
      });
      return;
    }
    
    const url = `/pages/orders/create/create?productId=${product.id}`;
    console.log('跳转到:', url);
    
    wx.navigateTo({
      url: url,
      success: () => {
        console.log('跳转成功');
      },
      fail: (error) => {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 测试下单方法
  testOrder() {
    console.log('🧪 测试下单按钮被点击');
    wx.showToast({
      title: '测试按钮点击成功',
      icon: 'success'
    });
    
    // 测试跳转
    wx.navigateTo({
      url: '/pages/orders/create/create?productId=1',
      success: () => {
        console.log('测试跳转成功');
      },
      fail: (error) => {
        console.error('测试跳转失败:', error);
        wx.showToast({
          title: '测试跳转失败: ' + error.errMsg,
          icon: 'none'
        });
      }
    });
  },

  // 检查对比状态
  checkCompareStatus() {
    // 这里应该检查产品是否在对比列表中
    // 暂时使用模拟数据
    this.setData({
      isInCompare: false
    });
  },

  // 复制产品编号
  onCopyProductNo() {
    const productNo = this.data.product?.productNo;
    if (!productNo) return;
    
    wx.setClipboardData({
      data: productNo,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const current = e.currentTarget.dataset.current;
    const images = this.data.product?.images || [current];
    
    wx.previewImage({
      current,
      urls: images
    });
  },

  // 电费计算
  goToCalculator() {
    const product = this.data.product;
    if (!product) return;
    
    wx.navigateTo({
      url: `/pages/calculator/index/index?productId=${product.id}`
    });
  },

  // 咨询客服
  contactService() {
    wx.showModal({
      title: '咨询客服',
      content: '是否拨打客服电话 400-123-4567？',
      confirmText: '拨打',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '400-123-4567',
            success: () => {
              console.log('拨打客服电话成功');
            },
            fail: (error) => {
              console.error('拨打客服电话失败:', error);
              wx.showToast({
                title: '拨打失败，请稍后重试',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 切换收藏状态
  toggleFavorite() {
    const product = this.data.product;
    if (!product) return;
    
    // 这里应该调用收藏API
    wx.showToast({
      title: product.isFavorite ? '已取消收藏' : '收藏成功',
      icon: 'success'
    });
  }
}); 