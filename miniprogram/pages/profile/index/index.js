const app = getApp()
const { authAPI, orderAPI } = require('../../../utils/api')
const auth = require('../../../utils/auth')
const { checkRoleAccess } = require('../../../utils/auth')

Page({
  data: {
    isLoggedIn: false,
    userInfo: {},
    stats: {
      orderCount: 0,
      contractCount: 0,
      powerPoints: 0
    },
    powerData: {
      monthlyConsumption: 0,
      monthlyBill: 0,
      savingRate: 0
    },
    menuItems: [
      {
        id: 'orders',
        icon: 'icon-order',
        title: '我的订单',
        subtitle: '查看订单状态',
        url: '/pages/orders/index/index',
        badge: 0
      },
      {
        id: 'contracts',
        icon: 'icon-contract',
        title: '我的合同',
        subtitle: '合同管理',
        url: '/pages/profile/contracts/contracts',
        badge: 0
      },
      {
        id: 'renewal-notice',
        icon: 'icon-time',
        title: '续约提醒',
        subtitle: '合同续约管理',
        url: '/pages/profile/renewal-notice/renewal-notice',
        badge: 0
      },
      {
        id: 'consumption',
        icon: 'icon-chart',
        title: '用电数据',
        subtitle: '用电统计分析',
        url: '/pages/profile/consumption/consumption'
      },
      {
        id: 'savings',
        icon: 'icon-money',
        title: '节费记录',
        subtitle: '查看节省费用',
        url: '/pages/profile/savings/savings'
      },
      {
        id: 'notifications',
        icon: 'icon-message',
        title: '消息通知',
        subtitle: '系统通知消息',
        url: '/pages/profile/notifications/notifications',
        badge: 0
      },
      {
        id: 'settings',
        icon: 'icon-setting',
        title: '设置',
        subtitle: '个人设置',
        url: '/pages/profile/settings/settings'
      }
    ],
    quickActions: [
      {
        id: 'contact-manager',
        icon: 'icon-phone',
        title: '联系客户经理',
        color: '#1890FF'
      },
      {
        id: 'online-service',
        icon: 'icon-service',
        title: '在线客服',
        color: '#52C41A'
      },
      {
        id: 'feedback',
        icon: 'icon-feedback',
        title: '意见反馈',
        color: '#FAAD14'
      },
      {
        id: 'help',
        icon: 'icon-help',
        title: '帮助中心',
        color: '#722ED1'
      }
    ],
    showAuthDialog: false,
    loading: true,
    refreshing: false
  },

  onLoad() {
    this.initPage();
  },

  onShow() {
    this.initPage();
  },

  // 初始化页面
  async initPage() {
    console.log('初始化个人中心页面');
    const isLoggedIn = app.globalData.isLoggedIn;
    
    this.setData({ 
      isLoggedIn,
      loading: true 
    });

    if (!isLoggedIn) {
      console.log('用户未登录，跳转到登录页面');
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
      return;
    }

    try {
      // 获取最新的用户信息
      await this.refreshUserInfo();
      
      // 加载其他数据
      if (this.data.isLoggedIn) {
        await this.loadUserData();
      }
    } catch (error) {
      console.error('初始化页面失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 刷新用户信息
  async refreshUserInfo() {
    try {
      console.log('开始获取最新用户信息');
      const userInfo = await authAPI.getUserInfo();
      
      if (!userInfo) {
        throw new Error('获取用户信息失败');
      }

      console.log('获取到的用户信息:', userInfo);
      
      // 更新本地存储和页面数据
      wx.setStorageSync('userInfo', userInfo);
      app.globalData.userInfo = userInfo;
      
      this.setData({
        userInfo,
        isLoggedIn: true
      });
    } catch (error) {
      console.error('获取用户信息失败:', error);
      // 如果是401错误，可能是token过期
      if (error.statusCode === 401) {
        // 尝试刷新token
        try {
          await app.refreshToken();
          // 刷新成功后重新获取用户信息
          return this.refreshUserInfo();
        } catch (refreshError) {
          console.error('刷新token失败:', refreshError);
          this.setData({ isLoggedIn: false });
          wx.redirectTo({
            url: '/pages/auth/login/login'
          });
        }
      } else {
        throw error;
      }
    }
  },

  // 加载用户数据
  async loadUserData() {
    if (!this.data.isLoggedIn) return;

    wx.showLoading({
      title: '加载中...'
    });

    try {
      // 并行加载统计数据和用电数据
      await Promise.all([
        this.loadUserStats(),
        this.loadPowerData(),
        this.loadNotificationCount()
      ]);
    } catch (error) {
      console.error('加载数据失败:', error);
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
      this.setData({ refreshing: false });
    }
  },

  // 加载用户统计数据
  async loadUserStats() {
    try {
      // 获取用户统计数据
      const stats = await authAPI.getUserStats();
      
      // 获取订单统计
      const orderStats = await orderAPI.getOrderStats();
      
      this.setData({
        stats: {
          orderCount: orderStats.totalCount || 0,
          contractCount: stats.contractCount || 0,
          powerPoints: stats.powerPointsCount || 0
        }
      });
    } catch (error) {
      console.error('获取用户统计数据失败:', error);
      throw error;
    }
  },

  // 加载用电数据
  async loadPowerData() {
    try {
      const powerInfo = await authAPI.getUserPowerInfo();
      
      this.setData({
        powerData: {
          monthlyConsumption: powerInfo.monthlyConsumption || 0,
          monthlyBill: powerInfo.monthlyBill || 0,
          savingRate: powerInfo.savingRate || 0
        }
      });
    } catch (error) {
      console.error('获取用电数据失败:', error);
      throw error;
    }
  },

  // 加载未读通知数量
  async loadNotificationCount() {
    try {
      const result = await authAPI.getUnreadNotificationCount();
      
      // 更新消息通知菜单的badge
      const menuItems = this.data.menuItems.map(item => {
        if (item.id === 'notifications') {
          return {
            ...item,
            badge: result.count || 0
          };
        }
        return item;
      });
      
      this.setData({ menuItems });
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    this.setData({ refreshing: true });
    try {
      await this.initPage();
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  // 处理登出
  async handleLogout() {
    try {
      wx.showLoading({
        title: '正在退出...',
        mask: true
      });
      
      await app.logout();
      
      wx.showToast({
        title: '已退出登录',
        icon: 'success'
      });
    } catch (error) {
      console.error('退出登录失败:', error);
      wx.showToast({
        title: '退出失败，请重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 页面跳转
  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    
    wx.navigateTo({ url });
  },

  // 联系客服
  contactService() {
    // 实现联系客服逻辑
  },

  // 查看用电数据
  viewPowerData() {
    wx.navigateTo({
      url: '/pages/profile/consumption/consumption'
    });
  },

  // 点击头像
  onAvatarTap() {
    wx.navigateTo({
      url: '/pages/profile/info/info'
    });
  },

  // 菜单点击
  onMenuTap(e) {
    const { id, url } = e.currentTarget.dataset;
    if (!url) return;

    // 检查是否需要登录
    if (!this.data.isLoggedIn) {
      this.setData({
        showAuthDialog: true
      });
      return;
    }

    wx.navigateTo({ url });
  },

  // 快捷操作点击
  onQuickActionTap(e) {
    const { id } = e.currentTarget.dataset;
    
    // 检查是否需要登录
    if (!this.data.isLoggedIn) {
      this.setData({
        showAuthDialog: true
      });
      return;
    }

    switch (id) {
      case 'contact-manager':
        this.contactManager();
        break;
      case 'online-service':
        this.openOnlineService();
        break;
      case 'feedback':
        this.openFeedback();
        break;
      case 'help':
        this.openHelp();
        break;
    }
  },

  // 联系客户经理
  async contactManager() {
    try {
      const managerInfo = await authAPI.getCustomerManager();
      
      if (!managerInfo || !managerInfo.phone) {
        wx.showToast({
          title: '暂无客户经理信息',
          icon: 'none'
        });
        return;
      }

      wx.makePhoneCall({
        phoneNumber: managerInfo.phone,
        fail: () => {
          wx.showToast({
            title: '拨打电话失败',
            icon: 'none'
          });
        }
      });
    } catch (error) {
      console.error('获取客户经理信息失败:', error);
      wx.showToast({
        title: '获取联系方式失败',
        icon: 'none'
      });
    }
  },

  // 打开在线客服
  openOnlineService() {
    wx.navigateTo({
      url: '/pages/profile/service/service'
    });
  },

  // 打开意见反馈
  openFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/submit/submit'
    });
  },

  // 打开帮助中心
  openHelp() {
    wx.navigateTo({
      url: '/pages/help/index'
    });
  },

  // 授权确认
  onAuthConfirm() {
    this.setData({
      showAuthDialog: false
    });
    wx.navigateTo({
      url: '/pages/auth/login/login'
    });
  },

  // 授权取消
  onAuthCancel() {
    this.setData({
      showAuthDialog: false
    });
  },

  // 统计数据点击
  onStatsTap(e) {
    const { type } = e.currentTarget.dataset;
    
    if (!this.data.isLoggedIn) {
      this.setData({
        showAuthDialog: true
      });
      return;
    }

    switch (type) {
      case 'orders':
        wx.navigateTo({
          url: '/pages/orders/index/index'
        });
        break;
      case 'contracts':
        wx.navigateTo({
          url: '/pages/profile/contracts/contracts'
        });
        break;
      case 'power-points':
        wx.navigateTo({
          url: '/pages/profile/power-points/power-points'
        });
        break;
    }
  },

  // 格式化金额
  formatAmount(amount) {
    if (!amount) return '0.00';
    return amount.toFixed(2);
  },

  // 格式化数字
  formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '电力销售服务平台',
      path: '/pages/index/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '电力销售服务平台'
    };
  }
}) 