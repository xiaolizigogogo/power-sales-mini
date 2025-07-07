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
            url: '/pages/manager/workplace/workplace'
          },
          {
            icon: 'friends-o',
            text: '我的客户',
            url: '/pages/manager/customers/list'
          },
          {
            icon: 'edit',
            text: '跟进管理',
            url: '/pages/manager/follow/list'
          },
          {
            icon: 'chart-trending-o',
            text: '业绩查看',
            url: '/pages/manager/performance/index'
          },
          {
            icon: 'user-o',
            text: '我的',
            url: '/pages/manager/profile/index'
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
            url: '/pages/products/index/index'
          },
          {
            icon: 'orders-o',
            text: '订单',
            url: '/pages/orders/index/index'
          },
          {
            icon: 'user-o',
            text: '我的',
            url: '/pages/profile/index/index'
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
      const page = getCurrentPages().pop();
      const route = page ? `/${page.route}` : '';
      console.log('updateActiveTab - 当前页面路径:', route);
      console.log('updateActiveTab - tabbar列表 (长度=' + this.data.list.length + '):', this.data.list);
      
      let active = -1;
      
      for (let i = 0; i < this.data.list.length; i++) {
        const item = this.data.list[i];
        console.log('updateActiveTab - 检查索引', i, ':', item.url, 'vs', route);
        
        // 精确匹配
        if (item.url === route) {
          console.log('精确匹配 - 索引', i, ':', item.url, '===', route);
          active = i;
          break;
        }
        
        // 针对不同页面的特殊匹配规则
        if (this.matchesPage(route, item.url)) {
          console.log('页面匹配 - 索引', i, ':', item.url, 'matches', route);
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
    matchesPage(currentRoute, tabUrl) {
      // 标准化路径：移除开头的斜杠
      const normalizeRoute = (path) => path.startsWith('/') ? path.substring(1) : path;
      const normalizedCurrent = normalizeRoute(currentRoute);
      const normalizedTab = normalizeRoute(tabUrl);
      
      console.log('matchesPage - 检查:', normalizedCurrent, 'vs', normalizedTab);
      
      // 1. 首页匹配
      if (normalizedTab === 'pages/index/index' && normalizedCurrent === 'pages/index/index') {
        return true;
      }
      
      // 2. 产品页面匹配
      if (normalizedTab === 'pages/products/index/index') {
        return normalizedCurrent.startsWith('pages/products/');
      }
      
      // 3. 订单页面匹配
      if (normalizedTab === 'pages/orders/index/index') {
        return normalizedCurrent.startsWith('pages/orders/');
      }
      
      // 4. 客户个人资料页面匹配
      if (normalizedTab === 'pages/profile/index/index') {
        return normalizedCurrent.startsWith('pages/profile/');
      }
      
      // 5. 客户经理页面匹配
      if (normalizedTab.startsWith('pages/manager/')) {
        // 工作台
        if (normalizedTab === 'pages/manager/workplace/workplace') {
          return normalizedCurrent === 'pages/manager/workplace/workplace';
        }
        // 客户管理
        if (normalizedTab === 'pages/manager/customers/list') {
          return normalizedCurrent.startsWith('pages/manager/customers/');
        }
        // 跟进管理  
        if (normalizedTab === 'pages/manager/follow/list') {
          return normalizedCurrent.startsWith('pages/manager/follow/');
        }
        // 业绩查看
        if (normalizedTab === 'pages/manager/performance/index') {
          return normalizedCurrent.startsWith('pages/manager/performance/');
        }
        // 客户经理个人资料
        if (normalizedTab === 'pages/manager/profile/index') {
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