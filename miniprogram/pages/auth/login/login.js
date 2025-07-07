const { roleManager, USER_TYPES } = require('../../../utils/role-manager')
const { authAPI, userAPI } = require('../../../utils/api')

Page({
  data: {
    loginType: 'customer', // customer | manager
    loginMethod: 'wechat', // wechat | password | sms
    form: {
      phone: '',
      username: '', // 新增用户名字段
      password: '',
      code: ''
    },
    showPassword: false,
    isLoading: false,
    
    // 短信验证码相关
    codeText: '获取验证码',
    codeDisabled: false,
    countdown: 0
  },

  onLoad() {
    console.log('登录页面加载')
  },

  /**
   * 切换登录类型
   */
  switchLoginType(e) {
    const type = e.currentTarget.dataset.type
    console.log('切换登录类型:', type)
    
    this.setData({ 
      loginType: type,
      form: {
        phone: '',
        username: '',
        password: '',
        code: ''
      }
    })
    
    // 客户经理不支持短信验证码登录，自动切换到密码登录
    if (type === 'manager' && this.data.loginMethod === 'sms') {
      this.setData({ 
        loginMethod: 'password'
      })
    }
  },

  /**
   * 切换登录方式
   */
  switchLoginMethod(e) {
    const method = e.currentTarget.dataset.method
    this.setData({
      loginMethod: method,
      form: {
        phone: this.data.form.phone,
        password: '',
        code: ''
      }
    })
    console.log('切换登录方式:', method)
  },

  /**
   * 输入处理
   */
  onInputChange(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`form.${field}`]: value
    })
  },

  /**
   * 切换密码显示
   */
  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    })
  },

  /**
   * 获取短信验证码
   */
  async getSmsCode() {
    const { phone } = this.data.form
    
    if (!phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ codeDisabled: true })
      
      // 调用发送验证码接口
      await authAPI.sendSmsCode({
        phone,
        type: this.data.loginType === 'manager' ? 'manager_login' : 'customer_login'
      })

      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      })

      // 开始倒计时
      this.startCountdown()

    } catch (error) {
      console.error('获取验证码失败:', error)
      wx.showToast({
        title: error.message || '获取验证码失败',
        icon: 'none'
      })
      this.setData({ codeDisabled: false })
    }
  },

  /**
   * 开始倒计时
   */
  startCountdown() {
    let countdown = 60
    this.setData({ countdown })

    const timer = setInterval(() => {
      countdown--
      this.setData({
        countdown,
        codeText: `${countdown}s后重新获取`
      })

      if (countdown <= 0) {
        clearInterval(timer)
        this.setData({
          codeDisabled: false,
          codeText: '获取验证码',
          countdown: 0
        })
      }
    }, 1000)
  },

  /**
   * 微信登录
   */
  async wechatLogin() {
    console.log('开始微信登录:', { loginType: this.data.loginType })
    
    try {
      this.setData({ isLoading: true })

      // 获取微信授权
      const { code } = await wx.login()
      console.log('获取微信授权码:', code)
      
      if (!code) {
        throw new Error('微信授权失败')
      }

      // 调用后端微信登录接口
      const response = await authAPI.wechatLogin({
        code,
        loginType: this.data.loginType
      })

      console.log('微信登录接口响应:', response)
      await this.handleLoginSuccess(response)

    } catch (error) {
      console.error('微信登录失败:', error)
      wx.showToast({
        title: error.message || '微信登录失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  /**
   * 账号密码登录
   */
  async passwordLogin() {
    console.log('开始密码登录:', { loginType: this.data.loginType })

    // 根据登录类型验证不同的字段
    if (this.data.loginType === 'manager') {
      // 客户经理使用用户名登录
      const { username, password } = this.data.form
      if (!username || !password) {
        wx.showToast({
          title: '请输入用户名和密码',
          icon: 'none'
        })
        return
      }
      
      try {
        this.setData({ isLoading: true })

        const response = await authAPI.login({
          username,
          password,
          loginType: this.data.loginType
        })

        console.log('客户经理密码登录接口响应:', response)
        await this.handleLoginSuccess(response)

      } catch (error) {
        console.error('客户经理密码登录失败:', error)
        wx.showToast({
          title: error.message || '登录失败',
          icon: 'none'
        })
      } finally {
        this.setData({ isLoading: false })
      }
    } else {
      // 普通客户使用手机号登录
      const { phone, password } = this.data.form
      if (!phone || !password) {
        wx.showToast({
          title: '请输入手机号和密码',
          icon: 'none'
        })
        return
      }
      
      try {
        this.setData({ isLoading: true })

        const response = await authAPI.login({
          phone,
          password,
          loginType: this.data.loginType
        })

        console.log('客户密码登录接口响应:', response)
        await this.handleLoginSuccess(response)

      } catch (error) {
        console.error('客户密码登录失败:', error)
        wx.showToast({
          title: error.message || '登录失败',
          icon: 'none'
        })
      } finally {
        this.setData({ isLoading: false })
      }
    }
  },

  /**
   * 短信验证码登录
   */
  async smsLogin() {
    const { phone, code } = this.data.form
    console.log('开始短信登录:', { phone, loginType: this.data.loginType })

    if (!phone || !code) {
      wx.showToast({
        title: '请输入手机号和验证码',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ isLoading: true })

      const response = await authAPI.smsLogin({
        phone,
        code,
        loginType: this.data.loginType
      })

      console.log('短信登录接口响应:', response)
      await this.handleLoginSuccess(response)

    } catch (error) {
      console.error('短信登录失败:', error)
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  /**
   * 处理登录成功
   */
  async handleLoginSuccess(response) {
    console.log('登录成功响应:', response)
    
    const { token, userInfo, userType, refreshToken } = response

    // 存储token
    wx.setStorageSync('token', token)
    console.log('Token已存储:', token)

    // 设置用户信息
    const finalUserType = userType || this.data.loginType
    console.log('最终用户类型:', finalUserType)
    console.log('用户信息:', userInfo)
    
    // 使用role-manager设置用户信息
    roleManager.setCurrentUser(finalUserType, userInfo)
    
    // 同时更新app全局状态，确保兼容性
    const app = getApp()
    app.login(userInfo, token, finalUserType, refreshToken)
    console.log('已更新app全局状态')

    wx.showToast({
      title: '登录成功',
      icon: 'success',
      duration: 1500
    })

    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      console.log('开始跳转到首页')
      // 跳转到对应的首页
      roleManager.navigateToHomePage()
    }, 1500)
  },

  /**
   * 执行登录
   */
  async doLogin() {
    if (this.data.isLoading) return

    const { loginMethod } = this.data

    switch (loginMethod) {
      case 'wechat':
        await this.wechatLogin()
        break
      case 'password':
        await this.passwordLogin()
        break
      case 'sms':
        await this.smsLogin()
        break
      default:
        wx.showToast({
          title: '请选择登录方式',
          icon: 'none'
        })
    }
  },

  /**
   * 跳转到注册页面
   */
  goToRegister() {
    wx.navigateTo({
      url: '/pages/auth/register/register'
    })
  },

  /**
   * 跳转到忘记密码页面
   */
  goToForgotPassword() {
    wx.navigateTo({
      url: '/pages/auth/forgot-password/forgot-password'
    })
  }
}) 