Component({
  properties: {
    width: {
      type: Number,
      value: 300
    },
    height: {
      type: Number,
      value: 200
    },
    strokeStyle: {
      type: String,
      value: '#000000'
    },
    lineWidth: {
      type: Number,
      value: 3
    }
  },

  data: {
    canvas: null,
    ctx: null,
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    isEmpty: true
  },

  lifetimes: {
    attached() {
      this.initCanvas()
    }
  },

  methods: {
    // 初始化画布
    async initCanvas() {
      try {
        const query = this.createSelectorQuery()
        const canvas = await new Promise((resolve) => {
          query.select('#signature-canvas')
            .fields({ node: true, size: true })
            .exec((res) => {
              resolve(res[0])
            })
        })

        if (canvas?.node) {
          const canvasNode = canvas.node
          const ctx = canvasNode.getContext('2d')

          // 设置画布尺寸
          const dpr = wx.getSystemInfoSync().pixelRatio
          canvasNode.width = this.data.width * dpr
          canvasNode.height = this.data.height * dpr
          ctx.scale(dpr, dpr)

          // 设置绘制样式
          ctx.strokeStyle = this.data.strokeStyle
          ctx.lineWidth = this.data.lineWidth
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'

          // 设置背景色
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, this.data.width, this.data.height)

          this.setData({
            canvas: canvasNode,
            ctx: ctx
          })

          console.log('签名画布初始化成功')
        }
      } catch (error) {
        console.error('初始化签名画布失败:', error)
        wx.showToast({
          title: '签名功能初始化失败',
          icon: 'none'
        })
      }
    },

    // 开始绘制
    onTouchStart(e) {
      if (!this.data.ctx) return

      const touch = e.touches[0]
      const rect = e.currentTarget.getBoundingClientRect()
      
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top

      this.setData({
        isDrawing: true,
        lastX: x,
        lastY: y
      })

      // 开始新路径
      this.data.ctx.beginPath()
      this.data.ctx.moveTo(x, y)
    },

    // 绘制过程
    onTouchMove(e) {
      if (!this.data.isDrawing || !this.data.ctx) return

      const touch = e.touches[0]
      const rect = e.currentTarget.getBoundingClientRect()
      
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top

      // 绘制线条
      this.data.ctx.lineTo(x, y)
      this.data.ctx.stroke()

      this.setData({
        lastX: x,
        lastY: y,
        isEmpty: false
      })
    },

    // 结束绘制
    onTouchEnd() {
      if (!this.data.isDrawing) return

      this.setData({
        isDrawing: false
      })

      // 如果有内容，生成图片
      if (!this.data.isEmpty) {
        this.generateImage()
      }
    },

    // 生成签名图片
    async generateImage() {
      try {
        if (!this.data.canvas) return

        const tempFilePath = await new Promise((resolve, reject) => {
          wx.canvasToTempFilePath({
            canvas: this.data.canvas,
            success: (res) => resolve(res.tempFilePath),
            fail: reject
          })
        })

        // 触发完成事件
        this.triggerEvent('complete', {
          url: tempFilePath,
          canvas: this.data.canvas
        })

      } catch (error) {
        console.error('生成签名图片失败:', error)
        wx.showToast({
          title: '生成签名失败',
          icon: 'none'
        })
      }
    },

    // 清除签名
    clear() {
      if (!this.data.ctx) return

      // 清除画布
      this.data.ctx.clearRect(0, 0, this.data.width, this.data.height)
      
      // 重新设置背景色
      this.data.ctx.fillStyle = '#ffffff'
      this.data.ctx.fillRect(0, 0, this.data.width, this.data.height)

      this.setData({
        isEmpty: true,
        isDrawing: false
      })

      // 触发清除事件
      this.triggerEvent('clear')

      wx.showToast({
        title: '已清除签名',
        icon: 'success',
        duration: 1000
      })
    },

    // 获取签名状态
    isEmpty() {
      return this.data.isEmpty
    },

    // 设置画笔样式
    setStrokeStyle(style) {
      if (this.data.ctx) {
        this.data.ctx.strokeStyle = style
        this.setData({ strokeStyle: style })
      }
    },

    // 设置画笔宽度
    setLineWidth(width) {
      if (this.data.ctx) {
        this.data.ctx.lineWidth = width
        this.setData({ lineWidth: width })
      }
    }
  }
}) 