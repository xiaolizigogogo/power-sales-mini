const app = getApp();

Page({
  data: {
    // 认证状态
    authStatus: 'pending', // pending, processing, approved, rejected
    
    // 用户信息
    userInfo: {
      realName: '',
      phone: '',
      companyName: '',
      submitTime: ''
    },
    
    // 审核进度
    auditProgress: [
      {
        title: '提交申请',
        desc: '您已成功提交注册申请',
        status: 'completed',
        time: ''
      },
      {
        title: '材料审核',
        desc: '正在审核您提交的认证材料',
        status: 'processing',
        time: ''
      },
      {
        title: '身份验证',
        desc: '验证企业信息和个人身份',
        status: 'pending',
        time: ''
      },
      {
        title: '账户激活',
        desc: '审核通过，账户正式激活',
        status: 'pending',
        time: ''
      }
    ],
    
    // 审核信息
    auditInfo: {
      estimatedTime: '1-3个工作日',
      contactPhone: '400-123-4567',
      rejectReason: '',
      approvedTime: '',
      nextSteps: []
    },
    
    // 页面状态
    loading: false,
    refreshing: false
  },

  onLoad(options) {
    console.log('认证审核页面加载')
    
    // 获取用户信息
    this.loadUserInfo()
    
    // 检查审核状态
    this.checkAuthStatus()
    
    // 设置定时刷新
    this.startStatusPolling()
  },

  onShow() {
    // 每次显示页面时检查状态
    this.checkAuthStatus()
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    
    this.setData({
      'userInfo.realName': userInfo.realName || '',
      'userInfo.phone': userInfo.phone || '',
      'userInfo.companyName': userInfo.companyName || '',
      'userInfo.submitTime': userInfo.registerTime || new Date().toISOString()
    })
    
    // 更新进度时间
    const submitTime = new Date(userInfo.registerTime || Date.now())
    this.setData({
      'auditProgress[0].time': this.formatTime(submitTime)
    })
  },

  // 检查认证状态
  async checkAuthStatus() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      const result = await app.request({
        url: '/auth/status',
        method: 'GET'
      })
      
      this.updateAuthStatus(result.data)
      
    } catch (error) {
      console.error('获取认证状态失败:', error)
      
      // 模拟认证状态
      this.simulateAuthStatus()
      
    } finally {
      this.setData({ loading: false })
    }
  },

  // 模拟认证状态
  simulateAuthStatus() {
    const submitTime = new Date(this.data.userInfo.submitTime)
    const now = new Date()
    const diffHours = (now - submitTime) / (1000 * 60 * 60)
    
    let status = 'pending'
    let progress = [...this.data.auditProgress]
    
    if (diffHours > 0.1) { // 6分钟后开始处理
      status = 'processing'
      progress[1].status = 'processing'
      progress[1].time = this.formatTime(new Date(submitTime.getTime() + 6 * 60 * 1000))
    }
    
    if (diffHours > 0.2) { // 12分钟后身份验证
      progress[2].status = 'processing'
      progress[2].time = this.formatTime(new Date(submitTime.getTime() + 12 * 60 * 1000))
    }
    
    if (diffHours > 0.3) { // 18分钟后审核通过（仅用于演示）
      status = 'approved'
      progress[1].status = 'completed'
      progress[2].status = 'completed'
      progress[3].status = 'completed'
      progress[3].time = this.formatTime(new Date(submitTime.getTime() + 18 * 60 * 1000))
      
      this.setData({
        'auditInfo.approvedTime': this.formatTime(new Date()),
        'auditInfo.nextSteps': [
          '完善企业详细信息',
          '设置用电需求偏好',
          '开始浏览产品和服务',
          '联系专属客户经理'
        ]
      })
    }
    
    this.setData({
      authStatus: status,
      auditProgress: progress
    })
  },

  // 更新认证状态
  updateAuthStatus(data) {
    const { status, progress, auditInfo } = data
    
    this.setData({
      authStatus: status,
      auditProgress: progress || this.data.auditProgress,
      auditInfo: { ...this.data.auditInfo, ...auditInfo }
    })
  },

  // 格式化时间
  formatTime(date) {
    const d = new Date(date)
    const month = d.getMonth() + 1
    const day = d.getDate()
    const hour = d.getHours()
    const minute = d.getMinutes()
    
    return `${month}月${day}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  },

  // 开始状态轮询
  startStatusPolling() {
    if (this.data.authStatus === 'approved' || this.data.authStatus === 'rejected') {
      return
    }
    
    this.pollingTimer = setInterval(() => {
      this.checkAuthStatus()
    }, 30000) // 每30秒检查一次
  },

  // 停止状态轮询
  stopStatusPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
    }
  },

  // 下拉刷新
  async onRefresh() {
    this.setData({ refreshing: true })
    
    try {
      await this.checkAuthStatus()
      
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
      
    } catch (error) {
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      })
    } finally {
      this.setData({ refreshing: false })
    }
  },

  // 联系客服
  contactService() {
    wx.showActionSheet({
      itemList: ['拨打客服电话', '在线客服咨询', '查看帮助文档'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            wx.makePhoneCall({
              phoneNumber: this.data.auditInfo.contactPhone
            })
            break
          case 1:
            wx.showToast({
              title: '功能开发中',
              icon: 'none'
            })
            break
          case 2:
            wx.navigateTo({
              url: '/pages/help/index'
            })
            break
        }
      }
    })
  },

  // 重新提交申请
  resubmitApplication() {
    wx.showModal({
      title: '重新提交',
      content: '是否要重新提交认证申请？',
      success: (res) => {
        if (res.confirm) {
          wx.redirectTo({
            url: '/pages/auth/register/register'
          })
        }
      }
    })
  },

  // 查看审核详情
  viewAuditDetails() {
    wx.showModal({
      title: '审核详情',
      content: `提交时间：${this.formatTime(this.data.userInfo.submitTime)}\n预计审核时间：${this.data.auditInfo.estimatedTime}\n\n我们会在审核完成后通过短信通知您。`,
      showCancel: false
    })
  },

  // 开始使用
  startUsing() {
    wx.showModal({
      title: '欢迎使用',
      content: '恭喜您通过认证！现在可以开始使用我们的服务了。',
      showCancel: false,
      success: () => {
        // 更新本地存储状态
        const userInfo = wx.getStorageSync('userInfo') || {}
        userInfo.authStatus = 'approved'
        wx.setStorageSync('userInfo', userInfo)
        
        // 跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    })
  },

  // 返回登录
  goToLogin() {
    wx.redirectTo({
      url: '/pages/auth/login/login'
    })
  },

  // 页面卸载
  onUnload() {
    this.stopStatusPolling()
  },

  // 页面隐藏
  onHide() {
    this.stopStatusPolling()
  }
}); 