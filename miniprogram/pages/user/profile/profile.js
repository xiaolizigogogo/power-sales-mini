const app = getApp();

Page({
  data: {
    userInfo: null,
    userRole: '',
    isLogin: false
  },

  onLoad() {
    this.setData({
      userInfo: app.globalData.userInfo,
      userRole: app.globalData.userRole,
      isLogin: app.globalData.isLogin
    });
  },

  onShow() {
    // 刷新登录状态
    this.setData({
      userInfo: app.globalData.userInfo,
      userRole: app.globalData.userRole,
      isLogin: app.globalData.isLogin
    });
    
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 4
      });
    }
  },

  // 跳转到编辑个人信息
  goToEditProfile() {
    wx.navigateTo({
      url: '/pages/profile/edit/edit'
    });
  },

  // 跳转到我的订单
  goToOrders() {
    wx.switchTab({
      url: '/pages/orders/index/index'
    });
  },

  // 跳转到我的合同
  goToContracts() {
    wx.navigateTo({
      url: '/pages/profile/contracts/contracts'
    });
  },

  // 跳转到客户管理
  goToCustomers() {
    wx.switchTab({
      url: '/pages/manager/index/index'
    });
  },

  // 跳转到业绩统计
  goToPerformance() {
    wx.navigateTo({
      url: '/pages/manager/performance/performance'
    });
  },

  // 跳转到设置页
  goToSettings() {
    wx.navigateTo({
      url: '/pages/user/settings/settings'
    });
  },

  // 跳转到关于我们
  goToAbout() {
    wx.showModal({
      title: '关于我们',
      content: '电力渠道销售平台 v1.0.0\n为企业提供专业的电力销售服务',
      showCancel: false
    });
  },

  // 跳转到意见反馈
  goToFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '如有问题或建议，请联系客服：400-123-4567',
      showCancel: false
    });
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
        }
      }
    });
  }
}); 