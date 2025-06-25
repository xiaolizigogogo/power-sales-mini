Component({
  properties: {
    show: {
      type: Boolean,
      value: true
    },
    type: {
      type: String,
      value: 'spinner' // spinner或dots
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
    mask: {
      type: Boolean,
      value: false
    }
  }
}) 