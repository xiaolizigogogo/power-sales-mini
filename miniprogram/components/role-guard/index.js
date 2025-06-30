// 角色权限路由守卫组件
const auth = require('../../utils/auth')

Component({
  properties: {
    // 需要的角色列表
    roles: {
      type: Array,
      value: []
    },
    // 需要的权限列表
    permissions: {
      type: Array,
      value: []
    },
    // 是否显示错误提示
    showTip: {
      type: Boolean,
      value: true
    },
    // 无权限时的回调页面
    fallbackUrl: {
      type: String,
      value: '/pages/index/index'
    }
  },

  data: {
    hasAccess: false,
    loading: true
  },

  lifetimes: {
    attached() {
      this.checkAccess()
    }
  },

  methods: {
    // 检查访问权限
    checkAccess() {
      console.log('检查角色权限守卫')
      
      // 检查登录状态
      if (!auth.isLoggedIn()) {
        if (this.properties.showTip) {
          wx.showToast({
            title: '请先登录',
            icon: 'none'
          })
        }
        
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/auth/login/login'
          })
        }, 1500)
        
        this.setData({ loading: false, hasAccess: false })
        return
      }

      const userRole = auth.getUserRole()
      let hasRoleAccess = true
      let hasPermissionAccess = true

      // 检查角色权限
      if (this.properties.roles.length > 0) {
        hasRoleAccess = this.properties.roles.includes(userRole)
      }

      // 检查功能权限
      if (this.properties.permissions.length > 0) {
        hasPermissionAccess = this.properties.permissions.every(permission => 
          auth.hasPermission(permission)
        )
      }

      const hasAccess = hasRoleAccess && hasPermissionAccess

      if (!hasAccess) {
        if (this.properties.showTip) {
          wx.showModal({
            title: '权限不足',
            content: '您没有权限访问此功能',
            showCancel: false,
            success: () => {
              if (this.properties.fallbackUrl) {
                wx.redirectTo({
                  url: this.properties.fallbackUrl
                })
              } else {
                wx.navigateBack()
              }
            }
          })
        }
      }

      this.setData({ 
        loading: false, 
        hasAccess 
      })

      // 触发权限检查完成事件
      this.triggerEvent('accessChecked', { hasAccess })
    },

    // 重新检查权限
    recheckAccess() {
      this.setData({ loading: true })
      this.checkAccess()
    }
  }
}) 