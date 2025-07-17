Page({
  data: {
    orderId: '',
    fileList: [] // {url: '', status: 'done'}
  },
  onLoad(options) {
    if (options.orderId) {
      this.setData({ orderId: options.orderId });
    }
  },
  chooseImage() {
    wx.chooseImage({
      count: 9,
      success: res => {
        res.tempFilePaths.forEach(path => {
          this.uploadImage(path);
        });
      }
    });
  },
  uploadImage(filePath) {
    const app = getApp();
    app.uploadFile({
      url: 'http://localhost:8000/api/v1/mini/manager/oss/upload',
      filePath
    }).then(res => {
      let data = res.data;
      try {
        data = JSON.parse(data);
      } catch (e) {}
      if (data && data.data) {
        this.setData({
          fileList: this.data.fileList.concat({
            storageUrl: data.data.storageUrl || data.data.dbUrl, // 兼容后端字段
            previewUrl: data.data.previewUrl,
            status: 'done'
          })
        });
      } else {
        wx.showToast({ title: '上传失败', icon: 'none' });
      }
    }).catch(() => {
      wx.showToast({ title: '上传失败', icon: 'none' });
    });
  },
  previewImage(e) {
    wx.previewImage({
      urls: this.data.fileList.map(item => item.previewUrl),
      current: e.currentTarget.dataset.url
    });
  },
  removeImage(e) {
    const idx = e.currentTarget.dataset.index;
    const fileList = this.data.fileList;
    fileList.splice(idx, 1);
    this.setData({ fileList });
  },
  submitContracts() {
    if (!this.data.orderId) {
      wx.showToast({ title: '订单ID缺失', icon: 'none' });
      return;
    }
    const urls = this.data.fileList.map(item => item.storageUrl); // 只提交storageUrl
    if (urls.length === 0) {
      wx.showToast({ title: '请先上传图片', icon: 'none' });
      return;
    }
    const app = getApp();
    app.request({
      url: `http://localhost:8000/api/v1/mini/manager/orders/${this.data.orderId}/contracts/submit`,
      method: 'POST',
      data: urls
    }).then(res => {
      const data = res.data;
      if (data && (data.code === 200 || data.code === 0)) {
        wx.showToast({ title: '提交成功' });
        setTimeout(() => {
          // 返回订单详情页并自动刷新
          const pages = getCurrentPages();
          if (pages.length > 1) {
            const prevPage = pages[pages.length - 2];
            if (prevPage && typeof prevPage.loadOrderDetail === 'function') {
              prevPage.loadOrderDetail();
            }
          }
          wx.navigateBack();
        }, 1000);
      } else {
        wx.showToast({ title: data.message || '提交失败', icon: 'none' });
      }
    }).catch(() => {
      wx.showToast({ title: '提交失败', icon: 'none' });
    });
  }
}); 