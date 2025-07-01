const { checkRoleAccess } = require('../../../utils/auth');
const { request } = require('../../../utils/api');

Page({
  data: {
    product: null,
    loading: true,
    activeTab: 0,
    activeCollapse: [],
    showShare: false
  },

  onLoad(options) {
    // 检查角色权限
    if (!checkRoleAccess('products')) {
      return;
    }

    const { id } = options;
    if (id) {
      this.loadProductDetail(id);
    }
  },

  // 加载产品详情
  async loadProductDetail(id) {
    this.setData({ loading: true });

    try {
      const res = await request('GET', `/api/products/${id}`);
      
      // 处理产品数据
      const product = {
        ...res.data,
        images: res.data.images || [res.data.image],
        tags: [
          res.data.category,
          `${res.data.voltage}V`,
          `${res.data.phase}相`
        ].filter(Boolean)
      };

      this.setData({
        product,
        loading: false
      });
    } catch (error) {
      console.error('加载产品详情失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
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
    const { id, name, price } = this.data.product;
    wx.navigateTo({
      url: `/pages/products/calculator/calculator?id=${id}&name=${encodeURIComponent(name)}&price=${price}`
    });
  },

  // 联系客服
  contactService() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail() {
        wx.showToast({
          title: '拨打失败，请稍后重试',
          icon: 'none'
        });
      }
    });
  },

  // 创建订单
  createOrder() {
    const { id } = this.data.product;
    wx.navigateTo({
      url: `/pages/orders/create/create?productId=${id}`
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
      const res = await request('GET', `/api/products/${this.data.product.id}/poster`);

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
    
    // 显示购买选项
    wx.showModal({
      title: '购买咨询',
      content: `您选择的是「${this.data.product.name}」，该产品需要专业评估用电需求。是否联系客服进行详细咨询？`,
      confirmText: '立即咨询',
      cancelText: '查看更多',
      success: (res) => {
        if (res.confirm) {
          this.contactService();
        } else {
          // 跳转到订单创建页面或产品计算器
          wx.navigateTo({
            url: `/pages/products/calculator/calculator?id=${this.data.product.id}`
          });
        }
      }
    });
  }
}); 