// 简单的API测试页面
const { customerAPI } = require('../../../utils/api')

Page({
  data: {
    testResults: [],
    testing: false
  },

  onLoad() {
    console.log('API测试页面加载完成')
    this.testAPIs()
  },

  async testAPIs() {
    this.setData({ testing: true })
    const results = []

    // 测试1: 获取我的客户列表
    console.log('=== 测试1: 获取我的客户列表 ===')
    try {
      const result = await customerAPI.getMyCustomers({
        page: 1,
        page_size: 10
      })
      
      console.log('✅ 客户列表API调用成功:', result)
      results.push({
        test: '获取我的客户列表',
        status: 'success',
        data: result
      })
    } catch (error) {
      console.error('❌ 客户列表API调用失败:', error)
      results.push({
        test: '获取我的客户列表',
        status: 'error',
        error: error.message
      })
    }

    // 测试2: 获取客户统计
    console.log('=== 测试2: 获取客户统计 ===')
    try {
      const result = await customerAPI.getMyCustomerStatistics()
      
      console.log('✅ 客户统计API调用成功:', result)
      results.push({
        test: '获取客户统计',
        status: 'success',
        data: result
      })
    } catch (error) {
      console.error('❌ 客户统计API调用失败:', error)
      results.push({
        test: '获取客户统计',
        status: 'error',
        error: error.message
      })
    }

    // 测试3: 检查token
    console.log('=== 测试3: 检查token ===')
    const token = wx.getStorageSync('token')
    results.push({
      test: '检查token',
      status: token ? 'success' : 'error',
      data: token ? '有token' : '没有token'
    })

    // 测试4: 检查用户信息
    console.log('=== 测试4: 检查用户信息 ===')
    const userInfo = wx.getStorageSync('userInfo')
    results.push({
      test: '检查用户信息',
      status: userInfo ? 'success' : 'error',
      data: userInfo || '没有用户信息'
    })

    this.setData({
      testResults: results,
      testing: false
    })
  },

  // 手动重新测试
  onRetestTap() {
    this.setData({ testResults: [] })
    this.testAPIs()
  },

  // 清除本地存储
  onClearStorageTap() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('refreshToken')
    wx.removeStorageSync('userRole')
    
    wx.showToast({
      title: '已清除本地存储',
      icon: 'success'
    })
  },

  // 模拟登录
  onMockLoginTap() {
    wx.setStorageSync('token', 'mock_token_123')
    wx.setStorageSync('userInfo', {
      id: 1,
      name: '测试用户',
      role: 'customer_manager'
    })
    
    wx.showToast({
      title: '已设置模拟登录',
      icon: 'success'
    })
  }
}) 