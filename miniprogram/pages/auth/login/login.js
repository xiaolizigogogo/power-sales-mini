const { roleManager, USER_TYPES } = require('../../../utils/role-manager')
const { authAPI, userAPI } = require('../../../utils/api')

Page({
  data: {
    loginType: 'customer', // customer 或 manager
    form: {
      phone: '',
      password: '',
      code: ''
    },
    loginMethod: 'password', // password 或 wechat 或 sms
    isLoading: false,
    codeText: '获取验证码',
    codeDisabled: false,
    showPassword: false,
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
    this.setData({
      loginType: type,
      form: {
        phone: '',
        password: '',
        code: ''
      }
    })
    console.log('切换登录类型:', type)
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
    try {
      this.setData({ isLoading: true })

      // 获取微信授权
      const { code } = await wx.login()
      
      if (!code) {
        throw new Error('微信授权失败')
      }

      // 调用后端微信登录接口
      const response = await authAPI.wechatLogin({
        code,
        loginType: this.data.loginType
      })

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

      await this.handleLoginSuccess(response)

    } catch (error) {
      console.error('密码登录失败:', error)
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      this.setData({ isLoading: false })
    }
  },

  /**
   * 短信验证码登录
   */
  async smsLogin() {
    const { phone, code } = this.data.form

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
    const { token, userInfo, userType } = response

    // 存储token
    wx.setStorageSync('token', token)

    // 设置用户信息
    const finalUserType = userType || this.data.loginType
    roleManager.setCurrentUser(finalUserType, userInfo)

    wx.showToast({
      title: '登录成功',
      icon: 'success',
      duration: 1500
    })

    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
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