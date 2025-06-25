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
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
  },

  // 跳转到设置页
  goToSettings() {
    wx.navigateTo({
      url: '/pages/user/settings/settings'
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