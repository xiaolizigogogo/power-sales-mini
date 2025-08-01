const { roleManager, USER_TYPES } = require('../utils/role-manager')

Component({
  data: {
    active: 0,
    color: "#999999",
    selectedColor: "#409EFF",
    list: []
  },

  methods: {
    onChange(event) {
      const index = event.detail;
      const item = this.data.list[index];
      
      if (!item) return;
      
      const url = item.url;
      
      // 检查登录状态
      if (!roleManager.checkLoginStatus()) {
        wx.redirectTo({
          url: '/pages/auth/login/login'
        });
        return;
      }

      // 检查页面权限
      if (!url || !roleManager.checkPagePermission(url)) {
        wx.showToast({
          title: '您没有权限访问此页面',
          icon: 'none'
        });
        return;
      }

      // 使用reLaunch而不是switchTab，因为是自定义tabBar
      wx.reLaunch({
        url,
        success: () => {
          this.setData({
            active: index
          });
        }
      });
    },

    /**
     * 初始化tabbar
     */
    init() {
      this.updateTabBar();
      this.updateActiveTab();
    },

    /**
     * 更新tabbar配置
     */
    updateTabBar() {
      // 强制从本地存储重新获取用户类型，避免缓存问题
      const userType = wx.getStorageSync('userType') || roleManager.getCurrentUserType();
      console.log('custom-tab-bar updateTabBar - 当前用户类型:', userType);
      console.log('custom-tab-bar updateTabBar - USER_TYPES.MANAGER:', USER_TYPES.MANAGER);
      console.log('custom-tab-bar updateTabBar - 类型比较:', userType === USER_TYPES.MANAGER);
      
      let tabbarConfig = [];

      if (userType === USER_TYPES.MANAGER || userType === 'manager') {
        // 客户经理tabbar
        console.log('设置客户经理tabbar (5个菜单)');
        tabbarConfig = [
          {
            icon: 'apps-o',
            text: '工作台',
            url: '/pages/menu/manager/workplace/workplace'
          },
          {
            icon: 'friends-o',
            text: '我的客户',
            url: '/pages/menu/manager/customers/list'
          },
          {
            icon: 'edit',
            text: '跟进管理',
            url: '/pages/menu/manager/follow/list'
          },
          // {
          //   icon: 'chart-trending-o',
          //   text: '业绩查看',
          //   url: '/pages/manager/performance/index'
          // },
          {
            icon: 'user-o',
            text: '我的',
            url: '/pages/menu/manager/profile/index'
          }
        ];
      } else {
        // 普通客户tabbar
        console.log('设置普通客户tabbar (4个菜单)');
        tabbarConfig = [
          {
            icon: 'home-o',
            text: '首页',
            url: '/pages/index/index'
          },
          {
            icon: 'shop-o',
            text: '产品',
            url: '/pages/menu/user/products/index/index'
          },
          {
            icon: 'orders-o',
            text: '订单',
            url: '/pages/menu/user/orders/index/index'
          },
          {
            icon: 'user-o',
            text: '我的',
            url: '/pages/menu/user/profile/index/index'
          }
        ];
      }

      console.log('custom-tab-bar updateTabBar - 设置tabbar配置 (长度=' + tabbarConfig.length + '):', tabbarConfig);
      this.setData({
        list: tabbarConfig
      });
    },

    /**
     * 更新当前选中的tab
     */
    updateActiveTab() {
      const pages = getCurrentPages();
      const page = pages.length > 0 ? pages[pages.length - 1] : null;
      let currentPath = page ? `/${page.route}` : '';
      
      console.log('updateActiveTab - 当前页面路径:', currentPath);
      console.log('updateActiveTab - tabbar列表 (长度=' + this.data.list.length + '):', this.data.list);
      
      // 如果页面路径为空，尝试从URL获取
      if (!currentPath && typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const path = url.pathname;
        if (path) {
          currentPath = path;
        }
      }
      
      // 如果还是没有路径，使用默认值
      if (!currentPath) {
        const userType = wx.getStorageSync('userType') || roleManager.getCurrentUserType();
        if (userType === USER_TYPES.MANAGER || userType === 'manager') {
          currentPath = '/pages/menu/manager/workplace/workplace';
        } else {
          currentPath = '/pages/index/index';
        }
      }
      
      let active = -1;
      
      for (let i = 0; i < this.data.list.length; i++) {
        const item = this.data.list[i];
        console.log('updateActiveTab - 检查索引', i, ':', item.url, 'vs', currentPath);
        
        // 精确匹配
        if (item.url === currentPath) {
          console.log('精确匹配 - 索引', i, ':', item.url, '===', currentPath);
          active = i;
          break;
        }
        
        // 针对不同页面的特殊匹配规则
        if (this.matchesPage(currentPath, item.url)) {
          console.log('页面匹配 - 索引', i, ':', item.url, 'matches', currentPath);
          active = i;
          break;
        }
      }
      
      console.log('updateActiveTab - 最终匹配到的索引:', active);
      this.setData({ 
        active: active !== -1 ? active : 0 
      });
    },

    /**
     * 检查页面是否匹配
     */
    matchesPage(currentPath, tabUrl) {
      // 标准化路径：移除开头的斜杠
      const normalizeRoute = (path) => path.startsWith('/') ? path.substring(1) : path;
      const normalizedCurrent = normalizeRoute(currentPath);
      const normalizedTab = normalizeRoute(tabUrl);
      
      console.log('matchesPage - 检查:', normalizedCurrent, 'vs', normalizedTab);
      
      // 1. 首页匹配
      if (normalizedTab === 'pages/index/index' && normalizedCurrent === 'pages/index/index') {
        return true;
      }
      
      // 2. 产品页面匹配
      if (normalizedTab === 'pages/menu/user/products/index/index') {
        return normalizedCurrent.startsWith('pages/products/');
      }
      
      // 3. 订单页面匹配
      if (normalizedTab === 'pages/menu/user/orders/index/index') {
        return normalizedCurrent.startsWith('pages/orders/');
      }
      
      // 4. 客户个人资料页面匹配
      if (normalizedTab === 'pages/menu/user/profile/index/index') {
        return normalizedCurrent.startsWith('pages/profile/');
      }
      
      // 5. 客户经理页面匹配
      if (normalizedTab.startsWith('pages/manager/')) {
        // 工作台
        if (normalizedTab === 'pages/menu/manager/workplace/workplace') {
          return normalizedCurrent === 'pages/menu/manager/workplace/workplace';
        }
        // 客户管理
        if (normalizedTab === 'pages/menu/manager/customers/list') {
          return normalizedCurrent.startsWith('pages/manager/customers/');
        }
        // 跟进管理  
        if (normalizedTab === 'pages/menu/manager/follow/list') {
          return normalizedCurrent.startsWith('pages/manager/follow/');
        }
        // 业绩查看
        if (normalizedTab === 'pages/manager/performance/index') {
          return normalizedCurrent.startsWith('pages/manager/performance/');
        }
        // 客户经理个人资料
        if (normalizedTab === 'pages/menu/manager/profile/index') {
          return normalizedCurrent.startsWith('pages/manager/profile/');
        }
      }
      
      return false;
    },

    /**
     * 手动设置选中项
     */
    setActiveTab(index) {
      this.setData({
        active: index
      });
    }
  },

  lifetimes: {
    attached() {
      this.init();
    }
  },

  pageLifetimes: {
    show() {
      // 检查是否需要更新tabbar配置
      const currentUserType = wx.getStorageSync('userType') || roleManager.getCurrentUserType();
      const expectedLength = currentUserType === 'manager' ? 5 : 4;
      
      console.log('custom-tab-bar pageLifetimes.show - 当前用户类型:', currentUserType);
      console.log('custom-tab-bar pageLifetimes.show - 当前tabbar长度:', this.data.list.length, '期望长度:', expectedLength);
      
      // 只有当tabbar配置不正确时才重新初始化
      if (this.data.list.length !== expectedLength) {
        console.log('custom-tab-bar pageLifetimes.show - tabbar配置不正确，重新初始化');
        this.updateTabBar();
      }
      
      // 始终更新选中状态
      this.updateActiveTab();
    }
  }
}) 