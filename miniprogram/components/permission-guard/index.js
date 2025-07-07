const { roleManager } = require('../../utils/role-manager')

Component({
  properties: {
    // 必需的用户类型，可以是 'customer', 'manager' 或 ['customer', 'manager']
    requiredUserType: {
      type: null,
      value: null
    },
    // 必需的页面路径权限
    requiredPage: {
      type: String,
      value: ''
    },
    // 无权限时的回调页面
    fallbackPage: {
      type: String,
      value: '/pages/auth/login/login'
    },
    // 是否显示无权限提示
    showTip: {
      type: Boolean,
      value: true
    },
    // 自定义无权限提示文字
    tipText: {
      type: String,
      value: '您没有权限访问此页面'
    }
  },

  data: {
    hasPermission: false,
    isLoading: true
  },

  lifetimes: {
    attached() {
      this.checkPermission()
    }
  },

  methods: {
    /**
     * 检查权限
     */
    checkPermission() {
      try {
        // 检查登录状态
        if (!roleManager.checkLoginStatus()) {
          this.handleNoPermission('未登录')
          return
        }

        const currentUserType = roleManager.getCurrentUserType()
        
        // 检查用户类型权限
        if (this.properties.requiredUserType) {
          const requiredTypes = Array.isArray(this.properties.requiredUserType) 
            ? this.properties.requiredUserType 
            : [this.properties.requiredUserType]
          
          if (!requiredTypes.includes(currentUserType)) {
            this.handleNoPermission(`用户类型不匹配，需要: ${requiredTypes.join('或')}, 当前: ${currentUserType}`)
            return
          }
        }

        // 检查页面访问权限
        if (this.properties.requiredPage && this.properties.requiredPage.trim()) {
          if (!roleManager.checkPagePermission(this.properties.requiredPage)) {
            this.handleNoPermission(`没有页面访问权限: ${this.properties.requiredPage}`)
            return
          }
        }

        // 权限检查通过
        this.setData({
          hasPermission: true,
          isLoading: false
        })

        this.triggerEvent('permissionGranted', {
          userType: currentUserType,
          userInfo: roleManager.getCurrentUserInfo()
        })

      } catch (error) {
        console.error('权限检查失败:', error)
        this.handleNoPermission('权限检查失败')
      }
    },

    /**
     * 处理无权限情况
     */
    handleNoPermission(reason) {
      console.warn('权限检查失败:', reason)
      
      this.setData({
        hasPermission: false,
        isLoading: false
      })

      this.triggerEvent('permissionDenied', { reason })

      if (this.properties.showTip) {
        wx.showToast({
          title: this.properties.tipText,
          icon: 'none',
          duration: 2000
        })
      }

      // 延迟跳转到回调页面
      setTimeout(() => {
        if (this.properties.fallbackPage) {
          if (this.properties.fallbackPage.includes('switchTab')) {
            // 如果是 tabbar 页面
            wx.switchTab({
              url: this.properties.fallbackPage.replace('switchTab:', '')
            })
          } else {
            wx.redirectTo({
              url: this.properties.fallbackPage
            })
          }
        }
      }, 2000)
    },

    /**
     * 重新检查权限
     */
    recheckPermission() {
      this.setData({ isLoading: true })
      this.checkPermission()
    }
  }
}) 