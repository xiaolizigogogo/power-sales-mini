Component({
  properties: {
    width: {
      type: Number,
      value: 320
    },
    height: {
      type: Number,
      value: 200
    },
    lineWidth: {
      type: Number,
      value: 3
    },
    lineColor: {
      type: String,
      value: '#000000'
    }
  },

  data: {
    ctx: null,
    points: [],
    isPainting: false
  },

  lifetimes: {
    attached() {
      const query = this.createSelectorQuery()
      query.select('#signature-canvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')

          // 设置画布大小
          const dpr = wx.getSystemInfoSync().pixelRatio
          canvas.width = this.data.width * dpr
          canvas.height = this.data.height * dpr
          ctx.scale(dpr, dpr)

          // 设置画笔样式
          ctx.lineWidth = this.data.lineWidth
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.strokeStyle = this.data.lineColor

          this.setData({ ctx })
        })
    }
  },

  methods: {
    // 开始绘制
    onTouchStart(e) {
      const { x, y } = e.touches[0]
      this.setData({
        isPainting: true,
        points: [[x, y]]
      })
      this.data.ctx.beginPath()
      this.data.ctx.moveTo(x, y)
    },

    // 绘制中
    onTouchMove(e) {
      if (!this.data.isPainting) return

      const { x, y } = e.touches[0]
      this.data.points.push([x, y])
      
      const ctx = this.data.ctx
      const points = this.data.points
      const len = points.length
      
      if (len >= 2) {
        const p1 = points[len - 2]
        const p2 = points[len - 1]
        
        ctx.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1])
        ctx.stroke()
      }
    },

    // 结束绘制
    onTouchEnd() {
      if (!this.data.isPainting) return
      
      this.setData({ isPainting: false })
      
      // 获取签名图片
      wx.canvasToTempFilePath({
        canvas: this.data.ctx.canvas,
        success: (res) => {
          this.triggerEvent('complete', { url: res.tempFilePath })
        },
        fail: (error) => {
          console.error('生成签名图片失败:', error)
          wx.showToast({
            title: '生成签名失败',
            icon: 'none'
          })
        }
      })
    },

    // 清除签名
    clear() {
      const ctx = this.data.ctx
      ctx.clearRect(0, 0, this.data.width, this.data.height)
      this.setData({ points: [] })
      this.triggerEvent('complete', { url: '' })
    }
  }
}) 