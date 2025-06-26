Component({
  properties: {
    message: {
      type: String,
      value: ''
    },
    type: {
      type: String,
      value: 'default' // default, success, error, warning
    },
    duration: {
      type: Number,
      value: 3000
    }
  },

  data: {
    show: false
  },

  methods: {
    // 显示 toast
    showToast(options = {}) {
      const { message, type = 'default', duration = 3000 } = options;
      
      this.setData({
        message: message || this.data.message,
        type: type,
        show: true
      });

      // 自动隐藏
      if (duration > 0) {
        setTimeout(() => {
          this.hideToast();
        }, duration);
      }
    },

    // 隐藏 toast
    hideToast() {
      this.setData({
        show: false
      });
    }
  },

  lifetimes: {
    attached() {
      // 组件实例进入页面节点树时执行
    },
    
    detached() {
      // 组件实例被从页面节点树移除时执行
    }
  }
}) 