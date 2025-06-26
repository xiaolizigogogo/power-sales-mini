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
      // 使用新的 API 替代废弃的 getSystemInfoSync
      wx.getWindowInfo({
        success: (windowInfo) => {
          const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
          
          this.setData({
            statusBarHeight: windowInfo.statusBarHeight,
            navBarHeight: (menuButtonInfo.top - windowInfo.statusBarHeight) * 2 + menuButtonInfo.height
          });
        },
        fail: () => {
          // 降级处理：如果新 API 不支持，使用旧 API
          const systemInfo = wx.getSystemInfoSync();
          const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
          
          this.setData({
            statusBarHeight: systemInfo.statusBarHeight,
            navBarHeight: (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height
          });
        }
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