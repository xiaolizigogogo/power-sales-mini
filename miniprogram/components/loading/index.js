// 加载组件
Component({
  properties: {
    // 是否显示加载状态
    loading: {
      type: Boolean,
      value: false
    },
    // 加载提示文字
    text: {
      type: String,
      value: '加载中...'
    },
    // 加载类型：spinner, dots, pulse
    type: {
      type: String,
      value: 'spinner'
    },
    // 尺寸：small, medium, large
    size: {
      type: String,
      value: 'medium'
    },
    // 颜色
    color: {
      type: String,
      value: '#1890FF'
    },
    // 是否显示遮罩
    mask: {
      type: Boolean,
      value: true
    },
    // 遮罩透明度
    maskOpacity: {
      type: Number,
      value: 0.7
    },
    // 是否全屏显示
    fullscreen: {
      type: Boolean,
      value: false
    },
    // 是否显示文字
    showText: {
      type: Boolean,
      value: true
    },
    // 延迟显示时间（毫秒）
    delay: {
      type: Number,
      value: 0
    }
  },
  
  data: {
    visible: false,
    delayTimer: null
  },
  
  lifetimes: {
    attached() {
      this.updateVisibility()
    },
    
    detached() {
      this.clearDelayTimer()
    }
  },
  
  observers: {
    'loading': function(loading) {
      this.updateVisibility()
    }
  },
  
  methods: {
    // 更新显示状态
    updateVisibility() {
      const { loading, delay } = this.properties
      
      this.clearDelayTimer()
      
      if (loading) {
        if (delay > 0) {
          const timer = setTimeout(() => {
            this.setData({ visible: true })
          }, delay)
          this.setData({ delayTimer: timer })
        } else {
          this.setData({ visible: true })
        }
      } else {
        this.setData({ visible: false })
      }
    },
    
    // 清除延迟定时器
    clearDelayTimer() {
      const { delayTimer } = this.data
      if (delayTimer) {
        clearTimeout(delayTimer)
        this.setData({ delayTimer: null })
      }
    },
    
    // 点击遮罩
    onMaskTap() {
      // 阻止事件冒泡
      return false
    },
    
    // 获取加载器类名
    getLoaderClass() {
      const { type, size } = this.properties
      return `loader loader-${type} loader-${size}`
    },
    
    // 获取容器类名
    getContainerClass() {
      const { fullscreen, mask } = this.properties
      let className = 'loading-container'
      
      if (fullscreen) {
        className += ' loading-fullscreen'
      }
      
      if (mask) {
        className += ' loading-mask'
      }
      
      return className
    },
    
    // 获取遮罩样式
    getMaskStyle() {
      const { maskOpacity } = this.properties
      return `background-color: rgba(0, 0, 0, ${maskOpacity});`
    },
    
    // 获取加载器样式
    getLoaderStyle() {
      const { color } = this.properties
      return `color: ${color}; border-color: ${color};`
    }
  }
}) 