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
      '/pages/manager/customers/customers',
      '/pages/manager/customers/detail/detail',
      '/pages/manager/customer-add/customer-add',
      '/pages/manager/follow/follow',
      '/pages/manager/service/service',
      '/pages/manager/performance/performance',
      '/pages/manager/maintenance/maintenance',
      '/pages/manager/renewal/renewal',
      '/pages/products/index/index',
      '/pages/products/detail/detail',
      '/pages/products/calculator/calculator',
      '/pages/orders/index/index',
      '/pages/orders/create/create',
      '/pages/orders/detail/detail',
      '/pages/profile/index/index'
    ],
    tabbar: [
      {
        pagePath: "pages/manager/index/index",
        iconPath: "assets/images/icons/dashboard.png",
        selectedIconPath: "assets/images/icons/dashboard-active.png",
        text: "工作台"
      },
      {
        pagePath: "pages/manager/customers/customers",
        iconPath: "assets/images/icons/customers.png",
        selectedIconPath: "assets/images/icons/customers-active.png",
        text: "客户"
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
  }
}

class RoleManager {
  constructor() {
    this.currentUserType = null
    this.currentUserInfo = null
  }

  /**
   * 设置当前用户类型和信息
   * @param {string} userType - 用户类型
   * @param {object} userInfo - 用户信息
   */
  setCurrentUser(userType, userInfo) {
    this.currentUserType = userType
    this.currentUserInfo = userInfo
    
    // 存储到本地
    wx.setStorageSync('userType', userType)
    wx.setStorageSync('userInfo', userInfo)
    
    // 更新自定义tabbar
    this.updateTabBar()
    
    console.log('设置当前用户:', { userType, userInfo })
  }

  /**
   * 获取当前用户类型
   */
  getCurrentUserType() {
    if (!this.currentUserType) {
      this.currentUserType = wx.getStorageSync('userType')
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
    if (!userType) {
      return false
    }
    
    const permissions = ROLE_PERMISSIONS[userType]
    if (!permissions) {
      return false
    }
    
    return permissions.pages.includes(pagePath)
  }

  /**
   * 获取当前用户类型的tabbar配置
   */
  getTabBarConfig() {
    const userType = this.getCurrentUserType()
    if (!userType) {
      return ROLE_PERMISSIONS[USER_TYPES.CUSTOMER].tabbar // 默认返回客户tabbar
    }
    
    return ROLE_PERMISSIONS[userType].tabbar
  }

  /**
   * 更新自定义tabbar
   */
  updateTabBar() {
    try {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      
      if (currentPage && typeof currentPage.getTabBar === 'function' && currentPage.getTabBar()) {
        const tabbar = currentPage.getTabBar()
        const config = this.getTabBarConfig()
        
        tabbar.setData({
          list: config
        })
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
    if (userType === USER_TYPES.MANAGER) {
      return '/pages/manager/index/index'
    } else {
      return '/pages/index/index'
    }
  }

  /**
   * 根据用户类型跳转到对应首页
   */
  navigateToHomePage() {
    const homePage = this.getHomePage()
    wx.switchTab({
      url: homePage
    })
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