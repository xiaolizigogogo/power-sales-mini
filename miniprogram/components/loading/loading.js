Component({
  properties: {
    show: {
      type: Boolean,
      value: true
    },
    type: {
      type: String,
      value: 'circular' // circular, spinner
    },
    size: {
      type: String,
      value: 'default' // small, default, large
    },
    color: {
      type: String,
      value: '#409EFF'
    },
    text: {
      type: String,
      value: '加载中...'
    },
    vertical: {
      type: Boolean,
      value: false
    },
    mask: {
      type: Boolean,
      value: false
    }
  }
}); 