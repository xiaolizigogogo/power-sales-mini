const { productAPI } = require('../../../utils/api');
const { checkRoleAccess } = require('../../../utils/auth');
const { formatProductItem } = require('../../../utils/product-helper');

Page({
  data: {
    product: null,
    loading: true,
    activeTab: 0,
    showShare: false,
    
    // 用户用电信息
    userPowerInfo: {
      monthlyUsage: 1000,
      currentPrice: 0.6,
      userType: 'commercial'
    },
    
    // 图表数据
    chartData: {
      priceComposition: [],
      usageAnalysis: []
    },
    
    // 客户案例
    customerCases: [],
    
    // 服务内容
    serviceContents: [],
    
    // 风险提示
    riskWarnings: [],
    
    // 结算方式
    settlementMethods: [],
    
    // 标签页配置
    tabList: [
      { name: '产品介绍', key: 'intro' },
      { name: '价格构成', key: 'price' },
      { name: '结算方式', key: 'settlement' },
      { name: '服务内容', key: 'service' },
      { name: '风险提示', key: 'risk' },
      { name: '客户案例', key: 'cases' }
    ]
  },

  onLoad(options) {
    // 检查用户权限
    if (!checkRoleAccess('products')) {
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
      return;
    }

    const { id } = options;
    if (id) {
      this.loadUserPowerInfo();
      this.fetchProductDetail(id);
    }
  },

  // 加载用户用电信息
  async loadUserPowerInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.setData({
          'userPowerInfo.userType': userInfo.userType || 'commercial'
        });
      }
      
      // 可以调用API获取用户实际用电信息
      // const res = await powerAPI.getUserPowerInfo()
      // if (res.code === 200) {
      //   this.setData({ userPowerInfo: res.data })
      // }
    } catch (error) {
      console.error('加载用户用电信息失败:', error);
    }
  },

  // 获取产品详情
  async fetchProductDetail(id) {
    this.setData({ loading: true });

    try {
      console.log('🔍 获取产品详情，ID:', id);
      
      let productData = null;
      
      try {
        const res = await productAPI.getProductDetail(id);
        console.log('📦 产品详情响应:', res);
        
        if (res.code === 200 && res.data) {
          productData = res.data;
        }
      } catch (error) {
        console.warn('⚠️ API调用失败，尝试使用测试数据:', error);
        
        // 使用测试数据作为后备方案
        const { generateTestProducts } = require('../../../utils/product-helper');
        const testProducts = generateTestProducts();
        
        // 查找对应ID的测试产品
        const testProduct = testProducts.find(p => p.id == id);
        if (testProduct) {
          productData = testProduct;
          console.log('🧪 使用测试产品数据:', testProduct);
        }
      }
      
      if (!productData) {
        throw new Error('产品不存在或已下架');
      }
      
      // 格式化产品数据
      const product = formatProductItem(productData, this.data.userPowerInfo);
      
      // 补充详情页特有数据
      const detailProduct = {
        ...product,
        images: productData.images || ['/assets/images/default-product.png'],
        specifications: productData.specifications || [],
        features: productData.features || [],
        applicableRange: productData.applicableRange || '适用于各类用电场景'
      };

      console.log('✅ 最终产品数据:', detailProduct);

      this.setData({
        product: detailProduct,
        loading: false
      });

      // 加载相关数据
      this.loadChartData(detailProduct);
      this.loadCustomerCases(detailProduct);
      this.loadServiceContents(detailProduct);
      this.loadRiskWarnings(detailProduct);
      this.loadSettlementMethods(detailProduct);
    } catch (error) {
      console.error('❌ 获取产品详情失败:', error);
      wx.showToast({
        title: error.message || '获取产品详情失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 加载图表数据
  loadChartData(product) {
    // 电价构成分析
    const priceComposition = [
      { 
        label: '基础电价', 
        value: product.basePrice * 0.6, 
        color: '#409EFF',
        valueFormatted: (product.basePrice * 0.6).toFixed(3),
        percentage: (0.6 * 100).toFixed(1),
        widthPercent: 60
      },
      { 
        label: '输配电价', 
        value: product.basePrice * 0.25, 
        color: '#67C23A',
        valueFormatted: (product.basePrice * 0.25).toFixed(3),
        percentage: (0.25 * 100).toFixed(1),
        widthPercent: 25
      },
      { 
        label: '政府性基金', 
        value: product.basePrice * 0.1, 
        color: '#E6A23C',
        valueFormatted: (product.basePrice * 0.1).toFixed(3),
        percentage: (0.1 * 100).toFixed(1),
        widthPercent: 10
      },
      { 
        label: '附加费用', 
        value: product.basePrice * 0.05, 
        color: '#F56C6C',
        valueFormatted: (product.basePrice * 0.05).toFixed(3),
        percentage: (0.05 * 100).toFixed(1),
        widthPercent: 5
      }
    ];

    // 用电分析数据
    const usageAnalysis = [
      { month: '1月', usage: 980, cost: 588 },
      { month: '2月', usage: 1200, cost: 720 },
      { month: '3月', usage: 1100, cost: 660 },
      { month: '4月', usage: 1050, cost: 630 },
      { month: '5月', usage: 1300, cost: 780 },
      { month: '6月', usage: 1400, cost: 840 }
    ];

    // 计算预估月费用
    const estimatedMonthlyCost = (product.basePrice * this.data.userPowerInfo.monthlyUsage).toFixed(0);

    this.setData({
      chartData: {
        priceComposition,
        usageAnalysis
      },
      estimatedMonthlyCost
    });
  },

  // 加载客户案例
  loadCustomerCases(product) {
    const cases = [
      {
        id: 1,
        companyName: '某制造企业',
        industry: '制造业',
        monthlyUsage: 50000,
        savingsAmount: 15000,
        savingsRate: 15.5,
        description: '通过我们的工业用电套餐，该企业月节省电费1.5万元',
        avatar: '/assets/images/icons/industry.png'
      },
      {
        id: 2,
        companyName: '某商业综合体',
        industry: '商业',
        monthlyUsage: 30000,
        savingsAmount: 8000,
        savingsRate: 12.3,
        description: '商业用电套餐帮助商业综合体优化用电成本',
        avatar: '/assets/images/icons/business.png'
      },
      {
        id: 3,
        companyName: '某办公楼宇',
        industry: '办公',
        monthlyUsage: 20000,
        savingsAmount: 5000,
        savingsRate: 10.8,
        description: '智能用电管理系统有效降低办公成本',
        avatar: '/assets/images/icons/office.png'
      }
    ];

    this.setData({ customerCases: cases });
  },

  // 加载服务内容
  loadServiceContents(product) {
    const contents = [
      {
        category: '基础服务',
        items: [
          { name: '24小时供电保障', description: '确保供电稳定性和连续性' },
          { name: '电量实时监控', description: '提供实时用电数据监控' },
          { name: '故障快速响应', description: '2小时内响应，4小时内解决' }
        ]
      },
      {
        category: '增值服务',
        items: [
          { name: '用电优化咨询', description: '专业团队提供用电方案优化建议' },
          { name: '设备运维服务', description: '定期检查和维护电力设备' },
          { name: '能效分析报告', description: '月度能效分析和成本控制建议' }
        ]
      },
      {
        category: '专业支持',
        items: [
          { name: '技术培训', description: '为客户提供用电知识和技能培训' },
          { name: '应急预案', description: '制定完善的应急响应预案' },
          { name: '定制化方案', description: '根据客户需求提供定制化解决方案' }
        ]
      }
    ];

    this.setData({ serviceContents: contents });
  },

  // 加载风险提示
  loadRiskWarnings(product) {
    const warnings = [
      {
        type: '价格风险',
        level: 'medium',
        content: '电价可能受政策调整、市场波动等因素影响，存在价格变动风险',
        suggestion: '建议关注政策动向，合理规划用电成本'
      },
      {
        type: '供应风险',
        level: 'low',
        content: '在极端天气或设备故障情况下，可能出现短时供电中断',
        suggestion: '建议配备备用电源，制定应急预案'
      },
      {
        type: '合同风险',
        level: 'low',
        content: '请仔细阅读合同条款，了解权利义务和违约责任',
        suggestion: '建议咨询专业人士，确保合同条款清晰明确'
      },
      {
        type: '技术风险',
        level: 'low',
        content: '新技术应用可能存在适应期，需要一定时间磨合',
        suggestion: '建议加强技术培训，确保操作人员熟悉系统'
      }
    ];

    this.setData({ riskWarnings: warnings });
  },

  // 加载结算方式
  loadSettlementMethods(product) {
    const methods = [
      {
        name: '按月结算',
        description: '每月根据实际用电量进行结算',
        features: ['结算周期短', '资金压力小', '便于预算管理'],
        applicable: '适用于用电量相对稳定的企业',
        icon: '/assets/images/icons/calendar.png'
      },
      {
        name: '按季结算',
        description: '每季度根据累计用电量进行结算',
        features: ['享受季度优惠', '减少结算频次', '现金流优化'],
        applicable: '适用于用电量有季节性变化的企业',
        icon: '/assets/images/icons/season.png'
      },
      {
        name: '年度结算',
        description: '年度一次性结算，享受最大优惠',
        features: ['最大价格优惠', '年度预算锁定', '服务保障升级'],
        applicable: '适用于用电量大且稳定的大型企业',
        icon: '/assets/images/icons/year.png'
      }
    ];

    this.setData({ settlementMethods: methods });
  },

  // 标签页切换
  onTabChange(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({ activeTab: index });
  },

  // 预览图片
  previewImage(e) {
    const { current } = e.currentTarget.dataset;
    const { images } = this.data.product;
    
    wx.previewImage({
      current,
      urls: images
    });
  },

  // 跳转到电费计算器
  goToCalculator() {
    const { product } = this.data;
    wx.navigateTo({
      url: `/pages/products/calculator/calculator?productId=${product.id}&basePrice=${product.basePrice}`
    });
  },

  // 联系客服
  contactService() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail() {
        wx.showToast({
          title: '请稍后再试',
          icon: 'none'
        });
      }
    });
  },

  // 创建订单
  createOrder() {
    const { product } = this.data;
    console.log('🛒 创建订单按钮点击');
    console.log('📦 当前产品数据:', product);
    
    // 检查登录状态
    const { roleManager } = require('../../../utils/role-manager');
    if (!roleManager.checkLoginStatus()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再下单',
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
    
    if (!product) {
      console.error('❌ 产品信息不存在');
      return wx.showToast({
        title: '产品信息不完整',
        icon: 'none'
      });
    }
    
    if (!product.id) {
      console.error('❌ 产品ID不存在');
      console.error('❌ 产品对象详情:', JSON.stringify(product, null, 2));
      return wx.showToast({
        title: '产品ID不能为空',
        icon: 'none'
      });
    }

    console.log('✅ 产品ID验证通过:', product.id);
    
    const url = `/pages/orders/create/create?productId=${product.id}`;
    console.log('🔗 准备跳转到:', url);
    
    wx.navigateTo({
      url: url,
      success: () => {
        console.log('✅ 跳转成功');
      },
      fail: (error) => {
        console.error('❌ 跳转失败:', error);
        wx.showToast({
          title: '跳转失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 分享功能
  onShareAppMessage() {
    const { product } = this.data;
    return {
      title: `${product.name} - 优质电力服务`,
      path: `/pages/products/detail/detail?id=${product.id}`,
      imageUrl: product.images[0]
    };
  },

  onShareTimeline() {
    const { product } = this.data;
    return {
      title: `${product.name} - 优质电力服务`,
      query: `id=${product.id}`,
      imageUrl: product.images[0]
    };
  },

  // 显示/隐藏分享面板
  showSharePanel() {
    this.setData({ showShare: true });
  },

  hideSharePanel() {
    this.setData({ showShare: false });
  },

  // 复制链接
  copyLink() {
    const { product } = this.data;
    wx.setClipboardData({
      data: `小程序查看产品详情：${product.name}`,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
        this.hideSharePanel();
      }
    });
  },

  // 收藏产品
  toggleFavorite() {
    const { product } = this.data;
    // 这里可以调用收藏API
    wx.showToast({
      title: product.isFavorite ? '已取消收藏' : '已收藏',
      icon: 'success'
    });
    
    this.setData({
      'product.isFavorite': !product.isFavorite
    });
  }
}); 