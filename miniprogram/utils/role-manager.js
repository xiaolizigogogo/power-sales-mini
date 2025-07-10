/**
 * 角色管理器 - 管理普通客户和客户经理两种用户类型
 */

// 用户类型常量
const USER_TYPES = {
  CUSTOMER: 'customer',    // 普通客户
  MANAGER: 'manager'       // 客户经理
}

// 角色权限配置
const ROLE_PERMISSIONS = {
  [USER_TYPES.CUSTOMER]: {
    pages: [
      '/pages/index/index',
      '/pages/products/index/index',
      '/pages/products/detail/detail',
      '/pages/products/calculator/calculator',
      '/pages/orders/index/index',
      '/pages/orders/create/create',
      '/pages/orders/detail/detail',
      '/pages/profile/index/index',
      '/pages/profile/auth/auth',
      '/pages/profile/contracts/contracts',
      '/pages/profile/consumption/consumption',
      '/pages/profile/savings/savings',
      '/pages/profile/service/service',
      '/pages/complaint/list/list',
      '/pages/complaint/submit/submit',
      '/pages/complaint/detail/detail'
    ],
    tabbar: [
      {
        pagePath: "pages/index/index",
        iconPath: "assets/images/icons/home.png",
        selectedIconPath: "assets/images/icons/home-active.png",
        text: "首页"
      },
      {
        pagePath: "pages/products/index/index",
        iconPath: "assets/images/icons/product.png",
        selectedIconPath: "assets/images/icons/product-active.png",
        text: "产品"
      },
      {
        pagePath: "pages/orders/index/index",
        iconPath: "assets/images/icons/order.png",
        selectedIconPath: "assets/images/icons/order-active.png",
        text: "订单"
      },
      {
        pagePath: "pages/profile/index/index",
        iconPath: "assets/images/icons/profile.png",
        selectedIconPath: "assets/images/icons/profile-active.png",
        text: "我的"
      }
    ]
  },
  [USER_TYPES.MANAGER]: {
    pages: [
      '/pages/manager/index/index',
      '/pages/manager/workplace/workplace',
      '/pages/manager/customers/customers',
      '/pages/manager/customers/list',
      '/pages/manager/customers/detail',
      '/pages/manager/customers/detail/index',
      '/pages/manager/customers/add',
      '/pages/manager/customer-add/customer-add',
      '/pages/manager/follow/follow',
      '/pages/manager/follow/list',
      '/pages/manager/follow/add',
      '/pages/manager/service/service',
      '/pages/manager/service/index',
      '/pages/manager/performance/performance',
      '/pages/manager/performance/index',
      '/pages/manager/maintenance/maintenance',
      '/pages/manager/maintenance/index',
      '/pages/manager/renewal/renewal',
      '/pages/manager/renewal/index',
      '/pages/manager/profile/index',
      '/pages/manager/profile/change-password',
      '/pages/manager/profile/edit',
      '/pages/products/index/index',
      '/pages/products/detail/detail',
      '/pages/products/calculator/calculator',
      '/pages/orders/index/index',
      '/pages/orders/create/create',
      '/pages/orders/detail/detail',
      '/pages/profile/index/index',
      'customer-detail'  // 添加简短路径匹配
    ],
    tabbar: [
      {
        pagePath: "pages/manager/workplace/workplace",
        iconPath: "",
        selectedIconPath: "",
        text: "工作台"
      },
      {
        pagePath: "pages/manager/customers/list",
        iconPath: "",
        selectedIconPath: "",
        text: "客户"
      },
      {
        pagePath: "pages/manager/follow/list",
        iconPath: "",
        selectedIconPath: "",
        text: "跟进"
      },
      {
        pagePath: "pages/manager/performance/index",
        iconPath: "",
        selectedIconPath: "",
        text: "业绩"
      },
      {
        pagePath: "pages/manager/profile/index",
        iconPath: "",
        selectedIconPath: "",
        text: "我的"
      }
    ]
  }
}

class RoleManager {
  constructor() {
    this.currentUserType = null
    this.currentUserInfo = null
  }

  /**
   * 设置当前用户类型和信息
   * @param {string|object} userType - 用户类型或用户信息对象
   * @param {object} userInfo - 用户信息（可选）
   */
  setCurrentUser(userType, userInfo) {
    console.log('设置当前用户开始:', { userType, userInfo })
    
    // 如果第一个参数是对象，则认为是用户信息，从中提取用户类型
    if (typeof userType === 'object' && userType !== null) {
      userInfo = userType
      userType = userInfo.userType || userInfo.role || 'customer'
      console.log('从用户信息中提取用户类型:', userType)
    }
    
    // 如果没有明确的userType，尝试从userInfo中获取
    if (!userType && userInfo) {
      userType = userInfo.userType || userInfo.role || 'customer'
      console.log('从用户信息中获取用户类型:', userType)
    }
    
    // 确保userType是有效的
    if (!userType || (userType !== USER_TYPES.CUSTOMER && userType !== USER_TYPES.MANAGER)) {
      console.warn('无效的用户类型，默认设置为customer:', userType)
      userType = USER_TYPES.CUSTOMER
    }
    
    console.log('即将设置用户类型为:', userType)
    this.currentUserType = userType
    this.currentUserInfo = userInfo
    
    // 存储到本地
    wx.setStorageSync('userType', userType)
    wx.setStorageSync('userInfo', userInfo)
    
    console.log('用户信息已存储到本地存储')
    console.log('验证用户类型是否正确设置:', this.getCurrentUserType())
    
    // 延迟一点点再更新tabbar，确保用户类型已经设置好
    setTimeout(() => {
      console.log('延迟更新tabbar，当前用户类型:', this.getCurrentUserType())
      this.updateTabBar()
    }, 100)
    
    console.log('设置当前用户完成:', { userType, userInfo })
  }

  /**
   * 获取当前用户类型
   */
  getCurrentUserType() {
    if (!this.currentUserType) {
      this.currentUserType = wx.getStorageSync('userType')
      console.log('从本地存储获取用户类型:', this.currentUserType)
    }
    return this.currentUserType
  }

  /**
   * 获取当前用户信息
   */
  getCurrentUserInfo() {
    if (!this.currentUserInfo) {
      this.currentUserInfo = wx.getStorageSync('userInfo')
    }
    return this.currentUserInfo
  }

  /**
   * 检查是否为客户经理
   */
  isManager() {
    return this.getCurrentUserType() === USER_TYPES.MANAGER
  }

  /**
   * 检查是否为普通客户
   */
  isCustomer() {
    return this.getCurrentUserType() === USER_TYPES.CUSTOMER
  }

  /**
   * 检查页面访问权限
   * @param {string} pagePath - 页面路径
   */
  checkPagePermission(pagePath) {
    const userType = this.getCurrentUserType()
    
    // 参数验证
    if (!pagePath || typeof pagePath !== 'string') {
      console.warn('权限检查警告: 页面路径为空或无效', { 
        pagePath, 
        userType,
        stack: new Error().stack 
      })
      return false
    }
    
    console.log('检查页面权限:', { pagePath, userType })
    
    if (!userType) {
      console.log('权限检查失败: 用户类型为空')
      return false
    }
    
    const permissions = ROLE_PERMISSIONS[userType]
    if (!permissions) {
      console.log('权限检查失败: 未找到用户类型对应的权限配置', userType)
      return false
    }
    
    // 规范化页面路径 - 移除开头的斜杠进行比较
    const normalizedPagePath = pagePath.startsWith('/') ? pagePath.substring(1) : pagePath
    const normalizedPages = permissions.pages.map(page => 
      page.startsWith('/') ? page.substring(1) : page
    )
    
    const hasPermission = normalizedPages.includes(normalizedPagePath) || 
                         permissions.pages.includes(pagePath)
    
    console.log('权限检查结果:', { 
      pagePath, 
      normalizedPagePath,
      userType, 
      hasPermission,
      availablePages: permissions.pages 
    })
    
    return hasPermission
  }

  /**
   * 获取当前用户类型的tabbar配置
   */
  getTabBarConfig() {
    const userType = this.getCurrentUserType()
    console.log('getTabBarConfig - 当前用户类型:', userType)
    
    if (!userType) {
      console.log('用户类型为空，返回客户tabbar')
      return ROLE_PERMISSIONS[USER_TYPES.CUSTOMER].tabbar
    }
    
    const config = ROLE_PERMISSIONS[userType].tabbar
    console.log('getTabBarConfig - 返回配置:', config)
    return config
  }

  /**
   * 更新自定义tabbar
   */
  updateTabBar() {
    console.log('开始更新自定义tabbar')
    
    try {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      console.log('当前页面:', currentPage ? currentPage.route : 'no page')
      
      if (currentPage && typeof currentPage.getTabBar === 'function' && currentPage.getTabBar()) {
        const tabbar = currentPage.getTabBar()
        
        // 强制重新初始化tabbar，确保获取最新的用户类型
        console.log('强制重新初始化custom-tab-bar')
        if (typeof tabbar.init === 'function') {
          tabbar.init()
        }
        
        console.log('自定义tabbar更新成功')
      } else {
        console.log('当前页面没有tabbar或getTabBar方法')
      }
    } catch (error) {
      console.error('更新tabbar失败:', error)
    }
  }

  /**
   * 获取首页路径
   */
  getHomePage() {
    const userType = this.getCurrentUserType()
    console.log('获取首页路径，当前用户类型:', userType)
    
    let homePage
    if (userType === USER_TYPES.MANAGER) {
      // 与自定义tabBar中的第一个tab保持一致
      homePage = '/pages/manager/workplace/workplace'
    } else {
      homePage = '/pages/index/index'
    }
    
    console.log('获取到的首页路径:', homePage)
    return homePage
  }

  /**
   * 根据用户类型跳转到对应首页
   */
  navigateToHomePage() {
    const userType = this.getCurrentUserType()
    const homePage = this.getHomePage()
    
    console.log('准备跳转到首页:', { userType, homePage })
    
    // 客户经理的首页在tabbar中，优先使用switchTab
    if (userType === USER_TYPES.MANAGER) {
      wx.switchTab({
        url: homePage,
        success: () => {
          console.log('使用switchTab跳转客户经理首页成功:', homePage)
        },
        fail: (error) => {
          console.error('switchTab跳转失败，尝试reLaunch:', error)
          wx.reLaunch({
            url: homePage,
            success: () => {
              console.log('使用reLaunch跳转客户经理首页成功:', homePage)
            },
            fail: (reLaunchError) => {
              console.error('reLaunch也失败:', reLaunchError)
              wx.showToast({
                title: '页面跳转失败',
                icon: 'none'
              })
            }
          })
        }
      })
    } else {
      // 普通客户首页也在tabbar中，使用switchTab
      wx.switchTab({
        url: homePage,
        success: () => {
          console.log('使用switchTab跳转客户首页成功:', homePage)
        },
        fail: (error) => {
          console.error('switchTab跳转失败，尝试reLaunch:', error)
          wx.reLaunch({
            url: homePage,
            success: () => {
              console.log('使用reLaunch跳转客户首页成功:', homePage)
            },
            fail: (reLaunchError) => {
              console.error('所有跳转方式都失败:', reLaunchError)
              wx.showToast({
                title: '页面跳转失败',
                icon: 'none'
              })
            }
          })
        }
      })
    }
  }

  /**
   * 清除用户信息
   */
  clearUserInfo() {
    this.currentUserType = null
    this.currentUserInfo = null
    wx.removeStorageSync('userType')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('token')
    
    console.log('清除用户信息')
  }

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    const userType = this.getCurrentUserType()
    const userInfo = this.getCurrentUserInfo()
    
    return !!(token && userType && userInfo)
  }

  /**
   * 获取用户显示名称
   */
  getUserDisplayName() {
    const userInfo = this.getCurrentUserInfo()
    if (!userInfo) return '未知用户'
    
    if (this.isManager()) {
      return userInfo.name || userInfo.employeeName || '客户经理'
    } else {
      return userInfo.name || userInfo.realName || '客户'
    }
  }

  /**
   * 获取用户权限标识
   */
  getUserRole() {
    const userInfo = this.getCurrentUserInfo()
    if (!userInfo) return ''
    
    if (this.isManager()) {
      return userInfo.role || 'customer_manager'
    } else {
      return 'customer'
    }
  }
}

// 创建全局实例
const roleManager = new RoleManager()

module.exports = {
  USER_TYPES,
  ROLE_PERMISSIONS,
  roleManager,
  RoleManager
} 