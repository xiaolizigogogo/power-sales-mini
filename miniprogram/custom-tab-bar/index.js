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
      if (!roleManager.checkPagePermission(url)) {
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
      const userType = roleManager.getCurrentUserType();
      let tabbarConfig = [];

      if (userType === USER_TYPES.MANAGER) {
        // 客户经理tabbar
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
      
      const active = this.data.list.findIndex(item => {
        // 精确匹配或者路径包含匹配
        return item.url === route || route.includes(item.url.replace('/index', ''));
      });
      
      this.setData({ 
        active: active !== -1 ? active : 0 
      });
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
    },

    pageShow() {
      this.init();
    }
  }
}) 