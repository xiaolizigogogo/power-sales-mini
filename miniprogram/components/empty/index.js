// 空状态组件
Component({
  properties: {
    // 是否显示空状态
    show: {
      type: Boolean,
      value: false
    },
    // 空状态类型：default, nodata, network, search, cart, order, customer
    type: {
      type: String,
      value: 'default'
    },
    // 图标名称（优先级高于type）
    icon: {
      type: String,
      value: ''
    },
    // 图标大小
    iconSize: {
      type: Number,
      value: 120
    },
    // 图标颜色
    iconColor: {
      type: String,
      value: '#d9d9d9'
    },
    // 主标题
    title: {
      type: String,
      value: ''
    },
    // 描述文字
    description: {
      type: String,
      value: ''
    },
    // 按钮文字
    buttonText: {
      type: String,
      value: ''
    },
    // 按钮类型：primary, default
    buttonType: {
      type: String,
      value: 'primary'
    },
    // 是否显示按钮
    showButton: {
      type: Boolean,
      value: false
    },
    // 自定义样式
    customStyle: {
      type: String,
      value: ''
    }
  },
  
  data: {
    // 预设的空状态配置
    presetConfigs: {
      default: {
        icon: 'empty-box',
        title: '暂无数据',
        description: '当前没有相关数据'
      },
      nodata: {
        icon: 'file-text',
        title: '暂无数据',
        description: '暂时没有找到相关内容'
      },
      network: {
        icon: 'wifi-off',
        title: '网络异常',
        description: '请检查网络连接后重试'
      },
      search: {
        icon: 'search',
        title: '暂无搜索结果',
        description: '试试其他关键词吧'
      },
      cart: {
        icon: 'shopping-cart',
        title: '购物车为空',
        description: '快去选购心仪的产品吧'
      },
      order: {
        icon: 'file-text',
        title: '暂无订单',
        description: '您还没有任何订单记录'
      },
      customer: {
        icon: 'users',
        title: '暂无客户',
        description: '还没有分配的客户'
      },
      follow: {
        icon: 'message-circle',
        title: '暂无跟进记录',
        description: '开始添加客户跟进记录吧'
      },
      contract: {
        icon: 'file',
        title: '暂无合同',
        description: '您还没有签署任何合同'
      },
      performance: {
        icon: 'trending-up',
        title: '暂无业绩数据',
        description: '继续努力，创造更好的业绩'
      }
    }
  },
  
  lifetimes: {
    attached() {
      this.updateConfig()
    }
  },
  
  observers: {
    'type, title, description, icon': function() {
      this.updateConfig()
    }
  },
  
  methods: {
    // 更新配置
    updateConfig() {
      const { type, title, description, icon } = this.properties
      const { presetConfigs } = this.data
      
      const presetConfig = presetConfigs[type] || presetConfigs.default
      
      // 使用属性值或预设值
      const finalConfig = {
        icon: icon || presetConfig.icon,
        title: title || presetConfig.title,
        description: description || presetConfig.description
      }
      
      this.setData({ currentConfig: finalConfig })
    },
    
    // 按钮点击事件
    onButtonTap() {
      this.triggerEvent('buttonTap', {
        type: this.properties.type
      })
    },
    
    // 获取图标类名
    getIconClass() {
      const { currentConfig } = this.data
      const { iconSize } = this.properties
      
      if (!currentConfig || !currentConfig.icon) {
        return ''
      }
      
      return `icon icon-${currentConfig.icon}`
    },
    
    // 获取图标样式
    getIconStyle() {
      const { iconSize, iconColor } = this.properties
      return `font-size: ${iconSize}rpx; color: ${iconColor};`
    },
    
    // 获取容器样式
    getContainerStyle() {
      const { customStyle } = this.properties
      return customStyle
    },
    
    // 获取按钮类名
    getButtonClass() {
      const { buttonType } = this.properties
      return `empty-button empty-button-${buttonType}`
    }
  }
}) 