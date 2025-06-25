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
    bgColor: {
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
      const systemInfo = wx.getSystemInfoSync();
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
      
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight,
        navBarHeight: (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height
      });
    }
  },

  methods: {
    handleBack() {
      if (this.data.showBack) {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack();
        } else {
          wx.reLaunch({
            url: '/pages/index/index'
          });
        }
      }
    }
  }
}); 