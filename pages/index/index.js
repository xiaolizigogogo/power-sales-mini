const app = getApp();

Page({
  data: {
    userInfo: null,
    isLogin: false,
    userRole: '',
    loading: true
  },

  onLoad() {
    this.initPage();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }
  },

  // 初始化页面
  initPage() {
    this.setData({
      userInfo: app.globalData.userInfo,
      isLogin: app.globalData.isLogin,
      userRole: app.globalData.userRole,
      loading: false
    });
  },

  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/auth/login/login'
    });
  }
}); 