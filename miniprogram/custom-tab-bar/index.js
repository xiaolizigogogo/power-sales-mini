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
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({
        url
      })
      this.setData({
        selected: data.index
      })
    }
  }
}) 