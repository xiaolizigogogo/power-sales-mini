const app = getApp()

Page({
  data: {
    complaintTypes: [
      { id: 'service', name: '服务问题' },
      { id: 'product', name: '产品问题' },
      { id: 'contract', name: '合同问题' },
      { id: 'other', name: '其他问题' }
    ],
    selectedType: '',
    content: '',
    images: [],
    submitting: false,
    rules: {
      type: { required: true, message: '请选择投诉类型' },
      content: { required: true, message: '请填写投诉内容', min: 10 }
    }
  },

  onLoad() {
    // 页面加载
  },

  // 选择投诉类型
  onTypeChange(e) {
    this.setData({
      selectedType: e.detail
    })
  },

  // 输入投诉内容
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    })
  },

  // 上传图片
  async onUploadImage() {
    if (this.data.images.length >= 3) {
      wx.showToast({
        title: '最多上传3张图片',
        icon: 'none'
      })
      return
    }

    try {
      const res = await wx.chooseImage({
        count: 3 - this.data.images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      const uploadTasks = res.tempFilePaths.map(path => {
        return app.uploadFile('/upload/complaint', path)
      })

      wx.showLoading({ title: '上传中' })
      const uploadResults = await Promise.all(uploadTasks)
      wx.hideLoading()

      this.setData({
        images: [...this.data.images, ...uploadResults.map(r => r.url)]
      })
    } catch (error) {
      console.error('上传图片失败:', error)
      wx.showToast({
        title: '上传图片失败',
        icon: 'none'
      })
    }
  },

  // 删除图片
  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = [...this.data.images]
    images.splice(index, 1)
    this.setData({ images })
  },

  // 提交投诉
  async onSubmit() {
    if (!this.validateForm()) {
      return
    }

    this.setData({ submitting: true })

    try {
      const result = await app.request({
        url: '/complaint/submit',
        method: 'POST',
        data: {
          type: this.data.selectedType,
          content: this.data.content,
          images: this.data.images
        }
      })

      wx.showToast({
        title: '提交成功',
        icon: 'success'
      })

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (error) {
      console.error('提交投诉失败:', error)
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 表单验证
  validateForm() {
    let isValid = true
    const { type, content } = this.data.rules

    if (type.required && !this.data.selectedType) {
      wx.showToast({
        title: type.message,
        icon: 'none'
      })
      isValid = false
    }

    if (content.required && !this.data.content) {
      wx.showToast({
        title: content.message,
        icon: 'none'
      })
      isValid = false
    } else if (content.min && this.data.content.length < content.min) {
      wx.showToast({
        title: `投诉内容至少${content.min}个字`,
        icon: 'none'
      })
      isValid = false
    }

    return isValid
  }
}) 