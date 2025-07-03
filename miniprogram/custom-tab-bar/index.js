Component({
  data: {
    selected: 0,
    color: "#999999",
    selectedColor: "#409EFF",
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        icon: "home-o",
        selectedIcon: "home"
      },
      {
        pagePath: "/pages/products/list/list",
        text: "产品",
        icon: "shop-o",
        selectedIcon: "shop"
      },
      {
        pagePath: "/pages/orders/index/index",
        text: "订单",
        icon: "orders-o",
        selectedIcon: "orders"
      },
      {
        pagePath: "/pages/profile/index/index",
        text: "我的",
        icon: "user-o",
        selectedIcon: "user"
      }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      
      // 检查登录状态
      const app = getApp();
      console.log('登录状态:', app.globalData.isLoggedIn)
      if (!app.globalData.isLoggedIn) {
        wx.redirectTo({
          url: '/pages/auth/login/login'
        });
        return;
      }

      // 使用reLaunch而不是switchTab，因为是自定义tabBar
      wx.reLaunch({
        url,
        success: () => {
          this.setData({
            selected: data.index
          });
        }
      });
    }
  }
}) 