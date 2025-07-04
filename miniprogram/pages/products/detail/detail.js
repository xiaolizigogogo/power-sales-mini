const { productAPI } = require('../../../utils/api');
const { checkRoleAccess } = require('../../../utils/auth');

Page({
  data: {
    product: null,
    loading: true,
    activeTab: 0,
    activeCollapse: [],
    showShare: false
  },

  onLoad(options) {
    // 放宽角色检查，允许所有已登录用户访问
    if (!checkRoleAccess(['user', 'admin', 'manager', 'sales'])) {
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
      return;
    }

    const { id } = options;
    if (id) {
      this.fetchProductDetail(id);
    }
  },

  async fetchProductDetail(id) {
    this.setData({ loading: true });

    try {
      const res = await productAPI.getProductDetail(id);
      console.log('产品详情响应:', res);
      
      if (res.code === 200 && res.data) {
        // 处理产品数据
        const product = {
          ...res.data,
          features: res.data.features || [],
          priceTiers: this.formatPriceTiers(res.data.priceTiers || []),
          instructions: res.data.instructions || [],
          images: res.data.images || ['/assets/images/default-product.png']
        };

        this.setData({
          product,
          loading: false
        });
      } else {
        throw new Error(res.message || '获取产品详情失败');
      }
    } catch (error) {
      console.error('获取产品详情失败:', error);
      wx.showToast({
        title: '获取产品详情失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  formatPriceTiers(tiers) {
    return tiers.map(tier => ({
      ...tier,
      range: `${tier.min}度 - ${tier.max}度`,
      note: tier.description || '标准价格'
    }));
  },

  // Tab切换
  onTabChange(e) {
    this.setData({
      activeTab: e.detail.index
    });
  },

  // 折叠面板变化
  onCollapseChange(e) {
    this.setData({
      activeCollapse: e.detail
    });
  },

  // 跳转到计算器
  goToCalculator() {
    const { product } = this.data;
    wx.navigateTo({
      url: `/pages/calculator/index/index?productId=${product.id}&basePrice=${product.basePrice}`
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
    if (!product) {
      return wx.showToast({
        title: '产品信息不完整',
        icon: 'none'
      });
    }

    wx.navigateTo({
      url: `/pages/orders/create/create?productId=${product.id}`
    });
  },

  onShareAppMessage() {
    const { product } = this.data;
    return {
      title: product.name,
      path: `/pages/products/detail/detail?id=${product.id}`,
      imageUrl: product.images[0]
    };
  },

  onShareTimeline() {
    const { product } = this.data;
    return {
      title: product.name,
      query: `id=${product.id}`,
      imageUrl: product.images[0]
    };
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

  // 显示分享面板
  showSharePanel() {
    this.setData({ showShare: true });
  },

  // 隐藏分享面板
  hideSharePanel() {
    this.setData({ showShare: false });
  },

  // 复制链接
  copyLink() {
    wx.setClipboardData({
      data: `${app.globalData.baseUrl}/products/${this.data.product.id}`,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
        this.hideSharePanel();
      }
    });
  },

  // 生成海报
  async generatePoster() {
    wx.showLoading({
      title: '生成中...',
      mask: true
    });

    try {
      // 这里应该调用生成海报接口
      const res = await productAPI.getProductPoster(this.data.product.id);

      // 保存图片到相册
      await wx.saveImageToPhotosAlbum({
        filePath: res.data.posterUrl
      });

      wx.showToast({
        title: '已保存到相册',
        icon: 'success'
      });

    } catch (error) {
      wx.showToast({
        title: error.message || '生成失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
      this.hideSharePanel();
    }
  },

  // 立即购买
  handleBuy() {
    console.log('用户点击购买按钮');
    
    // 检查产品信息
    if (!this.data.product) {
      wx.showToast({
        title: '产品信息加载中',
        icon: 'none'
      });
      return;
    }
    
    // 检查用户登录状态
    if (!app.globalData.isLogin) {
      wx.showModal({
        title: '需要登录',
        content: '购买前需要先登录，是否前往登录？',
        confirmText: '去登录',
        cancelText: '取消',
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
    
    // 直接跳转到订单创建页面
    this.goToCreateOrder();
  },

  // 跳转到创建订单页面
  goToCreateOrder() {
    const { product } = this.data;
    if (!product) {
      wx.showToast({
        title: '产品信息不完整',
        icon: 'none'
      });
      return;
    }
    
    // 构建跳转参数
    const params = {
      productId: product.id,
      productName: encodeURIComponent(product.name),
      currentPrice: product.basePrice || product.price || '0.65',
      productType: product.category || 'commercial',
      voltage: product.voltage || '380',
      phase: product.phase || '三相'
    };
    
    // 如果有预估用电量，也传递过去
    if (product.defaultUsage) {
      params.consumption = product.defaultUsage;
    }
    
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    console.log('跳转到订单创建页面，参数:', params);
    
    wx.navigateTo({
      url: `/pages/orders/create/create?${queryString}`
    });
  },

  // 切换详情选项卡
  switchTab(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    this.setData({
      activeTab: tab
    });
  },

  // 显示规格选择弹窗
  showSpecPopup() {
    // TODO: 实现规格选择弹窗
    wx.showToast({
      title: '规格选择功能开发中',
      icon: 'none'
    });
  },

  // 显示参数详情弹窗
  showParamsPopup() {
    // TODO: 实现参数详情弹窗
    wx.showToast({
      title: '参数详情功能开发中',
      icon: 'none'
    });
  }
}); 