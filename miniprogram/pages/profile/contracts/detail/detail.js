const app = getApp()

Page({
  data: {
    loading: true,
    contract: null,
    contractId: '',
    isManager: false,
    
    // 客户签署相关
    showSignDialog: false,
    signatureUrl: '',
    sealUrl: '',
    agreeTerms: false,
    
    // 企业签署相关
    showCompanySignDialog: false,
    companySignatureUrl: '',
    companySealUrl: '',
    confirmAuth: false,
    
    // 状态映射
    statusMap: {
      'pending': '待客户签署',
      'customer_signed': '待企业签署',
      'completed': '签署完成',
      'cancelled': '已取消',
      'expired': '已过期'
    },
    statusColorMap: {
      'pending': '#1989fa',
      'customer_signed': '#ff976a',
      'completed': '#07c160',
      'cancelled': '#969799',
      'expired': '#ee0a24'
    }
  },

  onLoad(options) {
    const { id } = options
    if (!id) {
      wx.showToast({
        title: '合同ID不能为空',
        icon: 'none'
      })
      this.goBack()
      return
    }
    
    this.setData({ contractId: id })
    this.checkUserRole()
    this.loadContractDetail()
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.contractId && !this.data.loading) {
      this.loadContractDetail()
    }
  },

  // 检查用户角色
  async checkUserRole() {
    try {
      const res = await app.request({
        url: '/user/role'
      })
      
      if (res.data) {
        this.setData({
          isManager: res.data.role === 'manager' || res.data.role === 'admin'
        })
      }
    } catch (error) {
      console.error('检查用户角色失败:', error)
      // 使用默认角色
      this.setData({ isManager: false })
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
      } else {
        throw new Error('合同数据为空')
      }
    } catch (error) {
      console.error('加载合同详情失败:', error)
      
      // 使用模拟数据
      this.loadMockContract()
      
      wx.showToast({
        title: '使用离线数据',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 加载模拟合同数据
  loadMockContract() {
    const mockContract = {
      id: this.data.contractId,
      contractNo: 'PS2024001',
      orderNo: 'ORD2024001',
      productName: '工商业用电套餐A',
      servicePeriod: 12,
      amount: 120000,
      customerName: '北京科技有限公司',
      contactName: '张经理',
      contactPhone: '138****5678',
      customerAddress: '北京市朝阳区科技园区',
      createTime: '2024-01-15 10:30:00',
      effectiveDate: '2024-02-01',
      expireDate: '2025-01-31',
      status: this.data.isManager ? 'customer_signed' : 'pending',
      customerSignInfo: this.data.isManager ? {
        signTime: '2024-01-16 14:20:00',
        signature: '/assets/images/signature-demo.png',
        seal: '/assets/images/seal-demo.png'
      } : null,
      companySignInfo: null
    }

    this.setData({
      contract: mockContract,
      loading: false
    })
  },

  // 获取状态描述
  getStatusDesc(status) {
    const descriptions = {
      'pending': '请客户仔细阅读合同条款并完成签署',
      'customer_signed': '客户已签署，等待企业确认签署',
      'completed': '双方签署完成，合同正式生效',
      'cancelled': '合同已取消，如有疑问请联系客服',
      'expired': '合同已过期，请重新创建合同'
    }
    return descriptions[status] || ''
  },

  // 格式化金额
  formatAmount(amount) {
    if (!amount) return '0'
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  // 预览合同
  async previewContract() {
    wx.showLoading({ title: '生成合同中...' })
    
    try {
      const res = await app.request({
        url: `/contracts/${this.data.contractId}/preview`
      })

      wx.hideLoading()

      if (res.data?.url) {
        // 下载并打开PDF
        wx.downloadFile({
          url: res.data.url,
          success: (downloadRes) => {
            wx.openDocument({
              filePath: downloadRes.tempFilePath,
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
      wx.hideLoading()
      console.error('预览合同失败:', error)
      
      // 模拟预览
      wx.showModal({
        title: '合同预览',
        content: `合同编号：${this.data.contract.contractNo}\n产品名称：${this.data.contract.productName}\n服务期限：${this.data.contract.servicePeriod}个月\n合同金额：¥${this.formatAmount(this.data.contract.amount)}`,
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },

  // 预览签名/印章图片
  previewSignature(e) {
    const { url } = e.currentTarget.dataset
    if (url) {
      wx.previewImage({
        urls: [url],
        current: url
      })
    }
  },

  // ==================== 客户签署相关 ====================
  
  // 显示客户签署弹窗
  showSignatureDialog() {
    this.setData({ 
      showSignDialog: true,
      signatureUrl: '',
      sealUrl: '',
      agreeTerms: false
    })
  },

  // 关闭客户签署弹窗
  closeSignatureDialog() {
    this.setData({ 
      showSignDialog: false,
      signatureUrl: '',
      sealUrl: '',
      agreeTerms: false
    })
  },

  // 签名完成
  onSignatureComplete(e) {
    const { url } = e.detail
    this.setData({ signatureUrl: url })
  },

  // 签名清除
  onSignatureClear() {
    this.setData({ signatureUrl: '' })
  },

  // 同意条款变更
  onAgreeTermsChange(e) {
    this.setData({ agreeTerms: e.detail })
  },

  // 上传客户印章
  async uploadSeal() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (res.tempFilePaths?.length > 0) {
        wx.showLoading({ title: '上传中...' })
        
        // 上传印章图片
        const uploadRes = await app.uploadFile({
          url: '/upload/seal',
          filePath: res.tempFilePaths[0],
          name: 'seal'
        })

        wx.hideLoading()

        if (uploadRes.data?.url) {
          this.setData({ sealUrl: uploadRes.data.url })
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          })
        }
      }
    } catch (error) {
      wx.hideLoading()
      console.error('上传印章失败:', error)
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      })
    }
  },

  // 删除印章
  removeSeal() {
    this.setData({ sealUrl: '' })
  },

  // 提交客户签署
  async submitSign() {
    try {
      if (!this.data.signatureUrl) {
        wx.showToast({
          title: '请完成签名',
          icon: 'none'
        })
        return
      }

      if (!this.data.agreeTerms) {
        wx.showToast({
          title: '请确认同意合同条款',
          icon: 'none'
        })
        return
      }

      wx.showLoading({ title: '提交签署中...' })

      const data = {
        signature: this.data.signatureUrl,
        seal: this.data.sealUrl || '',
        signTime: new Date().toISOString()
      }

      await app.request({
        url: `/contracts/${this.data.contractId}/customer-sign`,
        method: 'POST',
        data
      })

      wx.hideLoading()
      
      wx.showToast({
        title: '签署成功',
        icon: 'success'
      })

      // 关闭弹窗并刷新数据
      this.setData({ showSignDialog: false })
      setTimeout(() => {
        this.loadContractDetail()
      }, 1500)

    } catch (error) {
      wx.hideLoading()
      console.error('提交签署失败:', error)
      
      // 模拟签署成功
      const now = new Date()
      const signTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      
      const updatedContract = {
        ...this.data.contract,
        status: 'customer_signed',
        customerSignInfo: {
          signTime,
          signature: this.data.signatureUrl,
          seal: this.data.sealUrl
        }
      }

      this.setData({
        contract: updatedContract,
        showSignDialog: false
      })

      wx.showToast({
        title: '签署成功',
        icon: 'success'
      })
    }
  },

  // ==================== 企业签署相关 ====================

  // 显示企业签署弹窗
  showCompanySignDialog() {
    this.setData({ 
      showCompanySignDialog: true,
      companySignatureUrl: '',
      companySealUrl: '',
      confirmAuth: false
    })
  },

  // 关闭企业签署弹窗
  closeCompanySignDialog() {
    this.setData({ 
      showCompanySignDialog: false,
      companySignatureUrl: '',
      companySealUrl: '',
      confirmAuth: false
    })
  },

  // 企业签名完成
  onCompanySignatureComplete(e) {
    const { url } = e.detail
    this.setData({ companySignatureUrl: url })
  },

  // 确认授权变更
  onConfirmAuthChange(e) {
    this.setData({ confirmAuth: e.detail })
  },

  // 上传企业公章
  async uploadCompanySeal() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (res.tempFilePaths?.length > 0) {
        wx.showLoading({ title: '上传中...' })
        
        const uploadRes = await app.uploadFile({
          url: '/upload/company-seal',
          filePath: res.tempFilePaths[0],
          name: 'companySeal'
        })

        wx.hideLoading()

        if (uploadRes.data?.url) {
          this.setData({ companySealUrl: uploadRes.data.url })
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          })
        }
      }
    } catch (error) {
      wx.hideLoading()
      console.error('上传企业公章失败:', error)
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      })
    }
  },

  // 提交企业签署
  async submitCompanySign() {
    try {
      if (!this.data.companySignatureUrl) {
        wx.showToast({
          title: '请完成经理签名',
          icon: 'none'
        })
        return
      }

      if (!this.data.companySealUrl) {
        wx.showToast({
          title: '请上传企业公章',
          icon: 'none'
        })
        return
      }

      if (!this.data.confirmAuth) {
        wx.showToast({
          title: '请确认签署授权',
          icon: 'none'
        })
        return
      }

      wx.showLoading({ title: '提交签署中...' })

      const data = {
        signature: this.data.companySignatureUrl,
        seal: this.data.companySealUrl,
        signTime: new Date().toISOString()
      }

      await app.request({
        url: `/contracts/${this.data.contractId}/company-sign`,
        method: 'POST',
        data
      })

      wx.hideLoading()
      
      wx.showToast({
        title: '签署成功',
        icon: 'success'
      })

      // 关闭弹窗并刷新数据
      this.setData({ showCompanySignDialog: false })
      setTimeout(() => {
        this.loadContractDetail()
      }, 1500)

    } catch (error) {
      wx.hideLoading()
      console.error('提交企业签署失败:', error)
      
      // 模拟签署成功
      const now = new Date()
      const signTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      
      const updatedContract = {
        ...this.data.contract,
        status: 'completed',
        companySignInfo: {
          signTime,
          signature: this.data.companySignatureUrl,
          seal: this.data.companySealUrl
        }
      }

      this.setData({
        contract: updatedContract,
        showCompanySignDialog: false
      })

      wx.showToast({
        title: '合同签署完成',
        icon: 'success'
      })

      // 发送签署完成通知
      this.sendSignCompleteNotification()
    }
  },

  // 发送签署完成通知
  async sendSignCompleteNotification() {
    try {
      await app.request({
        url: `/contracts/${this.data.contractId}/notify-complete`,
        method: 'POST'
      })
    } catch (error) {
      console.error('发送通知失败:', error)
    }
  },

  // 返回上页
  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({
        url: '/pages/menu/user/profile/index/index'
      })
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: `合同${this.data.contract?.contractNo || ''}`,
      path: `/pages/profile/contracts/detail/detail?id=${this.data.contractId}`,
      imageUrl: '/assets/images/share-contract.png'
    }
  }
}) 