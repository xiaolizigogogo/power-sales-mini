// 小程序模态框组件
Component({
  properties: {
    // 是否显示模态框
    visible: {
      type: Boolean,
      value: false
    },
    // 标题
    title: {
      type: String,
      value: ''
    },
    // 内容
    content: {
      type: String,
      value: ''
    },
    // 是否显示确认按钮
    showConfirm: {
      type: Boolean,
      value: true
    },
    // 是否显示取消按钮
    showCancel: {
      type: Boolean,
      value: true
    },
    // 确认按钮文本
    confirmText: {
      type: String,
      value: '确定'
    },
    // 取消按钮文本
    cancelText: {
      type: String,
      value: '取消'
    },
    // 确认按钮颜色
    confirmColor: {
      type: String,
      value: '#007aff'
    },
    // 取消按钮颜色
    cancelColor: {
      type: String,
      value: '#000'
    },
    // 是否可点击遮罩关闭
    maskClosable: {
      type: Boolean,
      value: true
    },
    // 模态框类型
    type: {
      type: String,
      value: 'default' // default, success, warning, error
    },
    // 自定义样式类
    customClass: {
      type: String,
      value: ''
    }
  },

  data: {
    // 动画状态
    animationData: {}
  },

  lifetimes: {
    attached() {
      this.animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease'
      });
    }
  },

  observers: {
    'visible'(visible) {
      if (visible) {
        this.showModal();
      } else {
        this.hideModal();
      }
    }
  },

  methods: {
    // 显示模态框动画
    showModal() {
      this.animation.opacity(1).scale(1).step();
      this.setData({
        animationData: this.animation.export()
      });
    },

    // 隐藏模态框动画
    hideModal() {
      this.animation.opacity(0).scale(0.9).step();
      this.setData({
        animationData: this.animation.export()
      });
    },

    // 点击遮罩
    onMaskTap() {
      if (this.data.maskClosable) {
        this.onCancel();
      }
    },

    // 点击确认按钮
    onConfirm() {
      this.triggerEvent('confirm', {
        type: 'confirm'
      });
    },

    // 点击取消按钮
    onCancel() {
      this.triggerEvent('cancel', {
        type: 'cancel'
      });
    },

    // 阻止冒泡
    preventTap() {
      // 阻止点击事件冒泡到遮罩层
    }
  }
}); 