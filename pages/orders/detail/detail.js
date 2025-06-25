const app = getApp();

Page({
  data: {
    loading: true,
    id: null,
    detail: null,
    showCancelDialog: false,
    cancelReason: '',
    submitting: false
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
      // 这里应该调用实际的订单详情接口
      const res = await app.request({
        url: `/orders/${this.data.id}`
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

  // 复制订单号
  copyOrderNo() {
    const { orderNo } = this.data.detail;
    wx.setClipboardData({
      data: orderNo,
      success: () => {
        wx.showToast({
          title: '已复制订单号',
          icon: 'success'
        });
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    if (!url) return;
    
    wx.previewImage({
      urls: [url]
    });
  },

  // 显示取消订单弹窗
  showCancelDialog() {
    this.setData({ showCancelDialog: true });
  },

  // 隐藏取消订单弹窗
  hideCancelDialog() {
    this.setData({ 
      showCancelDialog: false,
      cancelReason: ''
    });
  },

  // 输入取消原因
  onCancelReasonInput(e) {
    this.setData({
      cancelReason: e.detail.value
    });
  },

  // 取消订单
  async handleCancel() {
    const { cancelReason } = this.data;
    if (!cancelReason.trim()) {
      wx.showToast({
        title: '请输入取消原因',
        icon: 'none'
      });
      return;
    }

    this.setData({ submitting: true });

    try {
      // 这里应该调用取消订单接口
      await app.request({
        url: `/orders/${this.data.id}/cancel`,
        method: 'POST',
        data: { reason: cancelReason }
      });

      wx.showToast({
        title: '取消成功',
        icon: 'success'
      });

      this.hideCancelDialog();
      this.loadData();

    } catch (error) {
      wx.showToast({
        title: error.message || '取消失败',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 联系客服
  contactService() {
    // 这里可以根据实际需求跳转到客服会话或拨打电话
    wx.makePhoneCall({
      phoneNumber: '400-123-4567'
    });
  },

  // 跳转到产品详情
  goToProduct() {
    const { productId } = this.data.detail;
    wx.navigateTo({
      url: `/pages/products/detail/detail?id=${productId}`
    });
  }
}); 