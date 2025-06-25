Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    showBack: {
      type: Boolean,
      value: true
    },
    backgroundColor: {
      type: String,
      value: '#409EFF'
    },
    textColor: {
      type: String,
      value: '#ffffff'
    },
    fixed: {
      type: Boolean,
      value: true
    }
  },

  data: {
    statusBarHeight: 0,
    navBarHeight: 0
  },

  lifetimes: {
    attached() {
      const systemInfo = wx.getSystemInfoSync()
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect()
      
      // 状态栏高度
      const statusBarHeight = systemInfo.statusBarHeight
      // 导航栏高度 = 胶囊按钮上下间距 + 胶囊按钮高度
      const navBarHeight = (menuButtonInfo.top - statusBarHeight) * 2 + menuButtonInfo.height

      this.setData({
        statusBarHeight,
        navBarHeight
      })
    }
  },

  methods: {
    handleBack() {
      if (this.data.showBack) {
        const pages = getCurrentPages()
        if (pages.length > 1) {
          wx.navigateBack()
        } else {
          wx.reLaunch({
            url: '/pages/index/index'
          })
        }
      }
    }
  }
}) 