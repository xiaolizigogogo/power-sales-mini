// pages/manager/customers/follow-add.js
const app = getApp()
const apiService = require('../../../utils/api').apiService

Page({
  data: {
    customerId: '',
    customerName: '',
    newFollowContent: '',
    newFollowType: 'phone',
    newFollowPriority: 'medium',
    newFollowDate: '',
    newFollowTime: '',
    followTypes: [
      { value: 'phone', label: '电话跟进', icon: '📞' },
      { value: 'visit', label: '实地拜访', icon: '🏢' },
      { value: 'wechat', label: '微信沟通', icon: '💬' },
      { value: 'email', label: '邮件联系', icon: '📧' }
    ],
    priorities: [
      { value: 'high', label: '高优先级', color: '#ff4d4f' },
      { value: 'medium', label: '中优先级', color: '#faad14' },
      { value: 'low', label: '低优先级', color: '#52c41a' }
    ],
    submitting: false
  },

  onLoad(options) {
    if (options.id && options.name) {
      this.setData({
        customerId: options.id,
        customerName: options.name
      })
      
      // 设置默认的跟进时间为当前时间
      const now = new Date()
      const date = now.toISOString().split('T')[0]
      const time = now.toTimeString().split(' ')[0].slice(0, 5)
      
      this.setData({
        newFollowDate: date,
        newFollowTime: time
      })
    }
  },

  // 处理跟进内容输入
  onFollowInput(e) {
    const { field } = e.currentTarget.dataset
    // 根据不同的输入类型处理value
    let value = ''
    if (e.type === 'input') {
      // van-field的输入事件直接返回字符串值
      value = e.detail || ''
    } else {
      // 其他控件的事件返回detail.value
      value = e.detail.value || ''
    }
    
    this.setData({
      [`newFollow${field.charAt(0).toUpperCase() + field.slice(1)}`]: value
    })
  },

  // 提交跟进记录
  async submitFollow() {
    const { 
      customerId, 
      newFollowContent, 
      newFollowType, 
      newFollowPriority, 
      newFollowDate, 
      newFollowTime 
    } = this.data

    // 添加空值检查
    if (!newFollowContent || !newFollowContent.trim()) {
      wx.showToast({
        title: '请输入跟进内容',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ submitting: true })

      // 安全获取用户信息
      const userInfo = wx.getStorageSync('userInfo');
      const employeeId = userInfo && userInfo.id ? userInfo.id : 
                        (userInfo && userInfo.data && userInfo.data.id ? userInfo.data.id : null);
      
      if (!employeeId) {
        wx.showToast({
          title: '无法获取用户信息',
          icon: 'none'
        });
        return;
      }
      
      const followData = {
        userId: customerId,
        employeeId: employeeId,
        content: newFollowContent.trim(),
        followType: newFollowType,
        priority: newFollowPriority,
        nextFollowDate: `${newFollowDate} ${newFollowTime}` // 使用yyyy-MM-dd HH:mm格式
      }

      const res = await apiService.post('/manager/follows/add', followData)

      if (res.code === 200) {
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })
        
        // 返回上一页并刷新
        setTimeout(() => {
          const pages = getCurrentPages()
          const prevPage = pages[pages.length - 2]
          if (prevPage) {
            prevPage.loadFollowRecords()
          }
          wx.navigateBack()
        }, 1500)
      }
    } catch (error) {
      console.error('添加跟进记录失败:', error)
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 取消添加
  onCancel() {
    wx.navigateBack()
  }
}) 