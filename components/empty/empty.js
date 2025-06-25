Component({
  properties: {
    description: {
      type: String,
      value: '暂无数据'
    },
    image: {
      type: String,
      value: '/assets/images/empty.png'
    },
    buttonText: {
      type: String,
      value: ''
    }
  },

  methods: {
    onButtonTap() {
      this.triggerEvent('button-click');
    }
  }
}); 