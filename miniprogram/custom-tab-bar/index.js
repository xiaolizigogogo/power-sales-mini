Component({
  data: {
    active: 0,
    color: "#999999",
    selectedColor: "#409EFF",
    list: [
      {
        icon: 'home-o',
        text: '首页',
        url: '/pages/index/index'
      },
      {
        icon: 'shop-o',
        text: '产品',
        url: '/pages/products/index/index'
      },
      {
        icon: 'orders-o',
        text: '订单',
        url: '/pages/orders/index/index'
      },
      {
        icon: 'user-o',
        text: '我的',
        url: '/pages/profile/index/index'
      }
    ]
  },

  methods: {
    onChange(event) {
      const index = event.detail;
      const url = this.data.list[index].url;
      
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
            active: index
          });
        }
      });
    },

    init() {
      const page = getCurrentPages().pop();
      const route = page ? page.route : '';
      const active = this.data.list.findIndex(item => 
        item.url.includes(route.split('/').slice(1, 3).join('/'))
      );
      
      this.setData({ active: active !== -1 ? active : 0 });
    }
  },

  lifetimes: {
    attached() {
      this.init();
    },

    pageShow() {
      this.init();
    }
  }
}) 