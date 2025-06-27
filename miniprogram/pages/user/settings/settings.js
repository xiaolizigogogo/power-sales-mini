Page({
  data: {
    settings: [
      {
        id: 'notification',
        name: '消息通知',
        icon: '🔔',
        enabled: true
      },
      {
        id: 'privacy',
        name: '隐私设置',
        icon: '🔒',
        enabled: true
      },
      {
        id: 'cache',
        name: '清除缓存',
        icon: '🗑️',
        action: true
      }
    ]
  },

  onLoad() {},

  // 切换设置
  toggleSetting(e) {
    const { id } = e.currentTarget.dataset
    const settings = this.data.settings.map(item => {
      if (item.id === id) {
        item.enabled = !item.enabled
      }
      return item
    })
    this.setData({ settings })
  },

  // 执行操作
  performAction(e) {
    const { id } = e.currentTarget.dataset
    
    if (id === 'cache') {
      wx.showModal({
        title: '清除缓存',
        content: '确定要清除本地缓存吗？',
        success: (res) => {
          if (res.confirm) {
            wx.clearStorageSync()
            wx.showToast({
              title: '缓存已清除',
              icon: 'success'
            })
          }
        }
      })
    }
  }
}) 