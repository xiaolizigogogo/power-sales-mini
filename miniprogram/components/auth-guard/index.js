Component({
  properties: {
    // 是否需要登录
    requireAuth: {
      type: Boolean,
      value: true
    }
  },

  data: {
    isLoggedIn: false
  },

  lifetimes: {
    attached() {
      this.checkAuth();
    }
  },

  pageLifetimes: {
    show() {
      this.checkAuth();
    }
  },

  methods: {
    checkAuth() {
      const app = getApp();
      const isLoggedIn = app.globalData.isLoggedIn;
      
      this.setData({ isLoggedIn });
      
      if (this.properties.requireAuth && !isLoggedIn) {
        console.log('未登录，跳转到登录页');
        wx.redirectTo({
          url: '/pages/auth/login/login'
        });
      }
    }
  }
}); 