const app = getApp();

Page({
  data: {
    loading: true,
    id: null,
    detail: null,
    showShare: false
  },

  onLoad(options) {
    const { id } = options;
    this.setData({ id });
    this.loadData();
  },

  // 加载数据
  async loadData() {
    if (!this.data.id) return;

    this.setData({ loading: true });

    try {
      // 这里应该调用实际的产品详情接口
      const res = await app.request({
        url: `/products/${this.data.id}`
      });

      this.setData({
        detail: res.data
      });

    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 预览图片
  previewImage(e) {
    const { current } = e.currentTarget.dataset;
    const { images } = this.data.detail;

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

  // 分享给好友
  onShareAppMessage() {
    const { detail } = this.data;
    return {
      title: detail.name,
      path: `/pages/products/detail/detail?id=${detail.id}`,
      imageUrl: detail.images[0]
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { detail } = this.data;
    return {
      title: detail.name,
      query: `id=${detail.id}`,
      imageUrl: detail.images[0]
    };
  },

  // 复制链接
  copyLink() {
    wx.setClipboardData({
      data: `${app.globalData.baseUrl}/products/${this.data.id}`,
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
      const res = await app.request({
        url: `/products/${this.data.id}/poster`
      });

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

  // 跳转到计算器
  goToCalculator() {
    wx.navigateTo({
      url: `/pages/products/calculator/calculator?id=${this.data.id}`
    });
  },

  // 联系客服
  contactService() {
    // 这里可以根据实际需求跳转到客服会话或拨打电话
    wx.makePhoneCall({
      phoneNumber: '400-123-4567'
    });
  },

  // 立即购买
  handleBuy() {
    if (!app.globalData.isLogin) {
      wx.navigateTo({
        url: '/pages/auth/login/login'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/orders/create/create?productId=${this.data.id}`
    });
  }
}); 