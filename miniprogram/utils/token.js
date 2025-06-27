// Token 管理工具
const config = require('./config')

class TokenManager {
  constructor() {
    this.baseURL = config.apiConfig.baseURL
  }

  // 获取测试Token
  async generateTestToken(role = 'CUSTOMER_MANAGER') {
    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${this.baseURL}/test/generate-token?role=${role}`,
          method: 'POST',
          header: {
            'Content-Type': 'application/json'
          },
          success: resolve,
          fail: reject
        })
      })

      if (response.statusCode === 200 && response.data.code === 200) {
        const { token, username, role: userRole } = response.data.data
        
        // 保存到本地存储
        wx.setStorageSync('token', token)
        wx.setStorageSync('userInfo', {
          username,
          role: userRole,
          name: userRole === 'CUSTOMER_MANAGER' ? '张经理' : '管理员'
        })
        wx.setStorageSync('userRole', userRole)

        // 更新全局数据
        const app = getApp()
        app.globalData.token = token
        app.globalData.userInfo = {
          username,
          role: userRole,
          name: userRole === 'CUSTOMER_MANAGER' ? '张经理' : '管理员'
        }
        app.globalData.userRole = userRole
        app.globalData.isLogin = true

        console.log('测试Token生成成功:', { token, username, role: userRole })
        return { token, username, role: userRole }
      } else {
        throw new Error(response.data?.message || '生成Token失败')
      }
    } catch (error) {
      console.error('生成测试Token失败:', error)
      throw error
    }
  }

  // 验证当前Token
  async verifyCurrentToken() {
    try {
      const token = wx.getStorageSync('token')
      if (!token) {
        throw new Error('没有找到Token')
      }

      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${this.baseURL}/test/verify-token`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          success: resolve,
          fail: reject
        })
      })

      if (response.statusCode === 200 && response.data.code === 200) {
        const { valid, username, role } = response.data.data
        console.log('Token验证结果:', { valid, username, role })
        return { valid, username, role }
      } else {
        throw new Error(response.data?.message || 'Token验证失败')
      }
    } catch (error) {
      console.error('验证Token失败:', error)
      throw error
    }
  }

  // 测试客户经理权限
  async testManagerPermission() {
    try {
      const token = wx.getStorageSync('token')
      if (!token) {
        throw new Error('没有找到Token')
      }

      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${this.baseURL}/test/manager-test`,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          success: resolve,
          fail: reject
        })
      })

      if (response.statusCode === 200 && response.data.code === 200) {
        console.log('客户经理权限测试成功:', response.data.data)
        return response.data.data
      } else {
        throw new Error(response.data?.message || '权限测试失败')
      }
    } catch (error) {
      console.error('权限测试失败:', error)
      throw error
    }
  }

  // 初始化测试环境
  async initTestEnvironment() {
    try {
      wx.showLoading({ title: '初始化测试环境...' })

      // 1. 生成测试Token
      await this.generateTestToken('CUSTOMER_MANAGER')

      // 2. 验证Token
      const verification = await this.verifyCurrentToken()
      
      if (!verification.valid) {
        throw new Error('Token验证失败')
      }

      // 3. 测试权限
      await this.testManagerPermission()

      wx.hideLoading()
      wx.showToast({
        title: '测试环境初始化成功',
        icon: 'success'
      })

      return true
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '初始化失败: ' + error.message,
        icon: 'error',
        duration: 3000
      })
      throw error
    }
  }

  // 清除Token
  clearToken() {
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('userRole')

    const app = getApp()
    app.globalData.token = ''
    app.globalData.userInfo = null
    app.globalData.userRole = ''
    app.globalData.isLogin = false

    console.log('Token已清除')
  }
}

module.exports = new TokenManager() 