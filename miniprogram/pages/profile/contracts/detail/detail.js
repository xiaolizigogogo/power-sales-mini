const app = getApp()

Page({
  data: {
    loading: true,
    contract: null,
    isManager: false,
    showSignDialog: false,
    signatureUrl: '',
    sealUrl: '',
    statusMap: {
      'pending': '待签署',
      'customer_signed': '客户已签署',
      'completed': '签署完成',
      'cancelled': '已取消'
    },
    statusColorMap: {
      'pending': '#1989fa',
      'customer_signed': '#ff976a',
      'completed': '#07c160',
      'cancelled': '#969799'
    }
  },

  onLoad(options) {
    const { id } = options
    this.setData({ contractId: id })
    this.checkUserRole()
    this.loadContractDetail()
  },

  // 检查用户角色
  async checkUserRole() {
    try {
      const res = await app.request({
        url: '/user/role'
      })
      
      if (res.data) {
        this.setData({
          isManager: res.data.role === 'manager'
        })
      }
    } catch (error) {
      console.error('检查用户角色失败:', error)
    }
  },

  // 加载合同详情
  async loadContractDetail() {
    try {
      this.setData({ loading: true })

      const res = await app.request({
        url: `/contracts/${this.data.contractId}`
      })

      if (res.data) {
        this.setData({
          contract: res.data,
          loading: false
        })
      }
    } catch (error) {
      console.error('加载合同详情失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 预览合同
  async previewContract() {
    try {
      const res = await app.request({
        url: `/contracts/${this.data.contractId}/preview`
      })

      if (res.data?.url) {
        wx.downloadFile({
          url: res.data.url,
          success: (res) => {
            wx.openDocument({
              filePath: res.tempFilePath,
              showMenu: true,
              success: () => {
                console.log('打开合同文档成功')
              },
              fail: (error) => {
                console.error('打开合同文档失败:', error)
                wx.showToast({
                  title: '打开文档失败',
                  icon: 'none'
                })
              }
            })
          },
          fail: (error) => {
            console.error('下载合同文档失败:', error)
            wx.showToast({
              title: '下载文档失败',
              icon: 'none'
            })
          }
        })
      }
    } catch (error) {
      console.error('预览合同失败:', error)
      wx.showToast({
        title: '预览失败',
        icon: 'none'
      })
    }
  },

  // 打开签署弹窗
  showSignatureDialog() {
    this.setData({ showSignDialog: true })
  },

  // 关闭签署弹窗
  closeSignatureDialog() {
    this.setData({ 
      showSignDialog: false,
      signatureUrl: '',
      sealUrl: ''
    })
  },

  // 签名完成
  onSignatureComplete(e) {
    const { url } = e.detail
    this.setData({ signatureUrl: url })
  },

  // 上传印章
  async uploadSeal() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (res.tempFilePaths?.length > 0) {
        // 上传印章图片
        const uploadRes = await app.uploadFile({
          url: '/upload/seal',
          filePath: res.tempFilePaths[0],
          name: 'seal'
        })

        if (uploadRes.data?.url) {
          this.setData({ sealUrl: uploadRes.data.url })
        }
      }
    } catch (error) {
      console.error('上传印章失败:', error)
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      })
    }
  },

  // 提交签署
  async submitSign() {
    try {
      if (!this.data.signatureUrl) {
        wx.showToast({
          title: '请完成签名',
          icon: 'none'
        })
        return
      }

      const data = {
        signature: this.data.signatureUrl,
        seal: this.data.sealUrl || ''
      }

      await app.request({
        url: `/contracts/${this.data.contractId}/sign`,
        method: 'POST',
        data
      })

      wx.showToast({
        title: '签署成功',
        icon: 'success'
      })

      this.setData({ showSignDialog: false })
      this.loadContractDetail()

    } catch (error) {
      console.error('提交签署失败:', error)
      wx.showToast({
        title: '签署失败',
        icon: 'none'
      })
    }
  },

  // 企业签署
  async companySign() {
    try {
      await app.request({
        url: `/contracts/${this.data.contractId}/company-sign`,
        method: 'POST'
      })

      wx.showToast({
        title: '签署成功',
        icon: 'success'
      })

      this.loadContractDetail()

    } catch (error) {
      console.error('企业签署失败:', error)
      wx.showToast({
        title: '签署失败',
        icon: 'none'
      })
    }
  }
}) 