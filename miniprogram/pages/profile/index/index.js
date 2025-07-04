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
        icon: '📋',
        title: '我的订单',
        subtitle: '查看订单状态',
        badge: 0
      },
      {
        id: 'contracts',
        icon: '📄',
        title: '我的合同',
        subtitle: '合同管理',
        badge: 0
      },
      {
        id: 'renewal-notice',
        icon: '⏰',
        title: '续约提醒',
        subtitle: '合同续约管理',
        badge: 0
      },
      {
        id: 'consumption',
        icon: '📊',
        title: '用电数据',
        subtitle: '用电统计分析'
      },
      {
        id: 'savings',
        icon: '💰',
        title: '节费记录',
        subtitle: '查看节省费用'
      },
      {
        id: 'notifications',
        icon: '🔔',
        title: '消息通知',
        subtitle: '系统通知消息',
        badge: 0
      },
      {
        id: 'settings',
        icon: '⚙️',
        title: '设置',
        subtitle: '个人设置'
      }
    ],
    quickActions: [
      {
        id: 'contact-manager',
        icon: '📞',
        title: '联系客户经理',
        color: '#1890FF'
      },
      {
        id: 'online-service',
        icon: '💬',
        title: '在线客服',
        color: '#52C41A'
      },
      {
        id: 'feedback',
        icon: '💡',
        title: '意见反馈',
        color: '#FAAD14'
      },
      {
        id: 'help',
        icon: '❓',
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
    // 只在未初始化时才调用initPage
    if (!this.data.userInfo || !this.data.userInfo.id) {
      this.initPage();
    }
  },

  // 初始化页面
  async initPage() {
    console.log('初始化个人中心页面');
    
    this.setData({ loading: true });

    try {
      // 检查登录状态
      const token = wx.getStorageSync('token');
      const userInfo = wx.getStorageSync('userInfo');
      
      if (!token) {
        console.log('用户未登录，显示登录按钮');
        this.setData({ 
          isLoggedIn: false,
          loading: false,
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
          }
        });
        return;
      }

      // 设置登录状态和用户信息
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo || {}
      });

      // 获取最新的用户信息
      await this.refreshUserInfo();
      
      // 强制加载其他数据，不检查登录状态
      await this.loadAllData();
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
      const response = await authAPI.getUserInfo();
      console.log('用户信息API响应:', response);
      
      if (!response || (!response.success && response.code !== 200)) {
        throw new Error('获取用户信息失败');
      }

      const rawUserInfo = response.data || response;
      console.log('获取到的原始用户信息:', rawUserInfo);
      
      // 处理字段映射
      const userInfo = {
        id: rawUserInfo.id,
        nickName: rawUserInfo.nickname || rawUserInfo.nickName || rawUserInfo.realName || rawUserInfo.name,
        realName: rawUserInfo.realName || rawUserInfo.name,
        name: rawUserInfo.name || rawUserInfo.nickname || rawUserInfo.nickName,
        phone: rawUserInfo.phone || rawUserInfo.phoneNumber,
        avatar: rawUserInfo.avatar,
        avatarUrl: rawUserInfo.avatarUrl || rawUserInfo.avatar,
        openId: rawUserInfo.openId,
        role: rawUserInfo.role,
        status: rawUserInfo.status,
        authStatus: rawUserInfo.authStatus || rawUserInfo.verifyStatus || 'unverified', // 添加认证状态
        userLevel: rawUserInfo.userLevel || rawUserInfo.level,
        companyName: rawUserInfo.companyName || (rawUserInfo.company ? rawUserInfo.company.name : null),
        companyId: rawUserInfo.companyId || (rawUserInfo.company ? rawUserInfo.company.id : null),
        department: rawUserInfo.department,
        position: rawUserInfo.position,
        createTime: rawUserInfo.createTime || rawUserInfo.createdAt,
        updateTime: rawUserInfo.updateTime || rawUserInfo.updatedAt
      };
      
      console.log('处理后的用户信息:', userInfo);
      
      // 更新本地存储和页面数据
      wx.setStorageSync('userInfo', userInfo);
      app.globalData.userInfo = userInfo;
      
      console.log('设置用户信息到页面:', userInfo);
      this.setData({
        userInfo,
        isLoggedIn: true
      });
      console.log('页面数据更新完成，当前用户信息:', this.data.userInfo);
      console.log('页面数据更新完成，当前登录状态:', this.data.isLoggedIn);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      // 如果是401错误，可能是token过期
      if (error.statusCode === 401) {
        console.log('Token过期，设置为未登录状态');
        this.setData({ 
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
          }
        });
        // 清除过期的token
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
        wx.removeStorageSync('refreshToken');
        wx.removeStorageSync('userRole');
      } else {
        // 使用缓存的用户信息
        const cachedUserInfo = wx.getStorageSync('userInfo');
        console.log('使用缓存的用户信息:', cachedUserInfo);
        if (cachedUserInfo) {
          this.setData({
            userInfo: cachedUserInfo,
            isLoggedIn: true
          });
        }
      }
    }
  },

  // 加载所有数据（不检查登录状态）
  async loadAllData() {
    try {
      console.log('开始加载所有数据');
      // 并行加载所有数据
      await Promise.all([
        this.loadUserStats(),
        this.loadPowerData(),
        this.loadNotificationCount()
      ]);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  },

  // 加载用户数据（保留原方法供其他地方调用）
  async loadUserData() {
    if (!this.data.isLoggedIn) {
      console.log('用户未登录，跳过数据加载');
      return;
    }
    await this.loadAllData();
  },

  // 加载用户统计数据
  async loadUserStats() {
    try {
      console.log('开始加载用户统计数据');
      const response = await orderAPI.getMyOrderStats();
      console.log('订单统计响应:', response);
      
      if (response && (response.success || response.code === 200)) {
        const data = response.data || response;
        console.log('订单统计数据:', data);
        
        // 兼容新旧两种数据格式
        let stats;
        if (data.orderCount !== undefined) {
          // 新格式：直接使用
          stats = {
            orderCount: data.orderCount || 0,
            contractCount: data.contractCount || 0,
            powerPoints: data.powerPoints || 0
          };
        } else {
          // 旧格式：转换字段名
          stats = {
            orderCount: data.all || 0,
            contractCount: data.contract || 0,
            powerPoints: data.active || 0
          };
        }
        
        console.log('设置统计数据:', stats);
        this.setData({ stats });
        console.log('统计数据设置完成，当前页面stats:', this.data.stats);
      } else {
        console.log('订单统计响应失败，设置默认值');
        // 设置默认值
        this.setData({
          stats: {
            orderCount: 0,
            contractCount: 0,
            powerPoints: 0
          }
        });
      }
    } catch (error) {
      console.error('加载用户统计数据失败:', error);
      // 设置默认值
      this.setData({
        stats: {
          orderCount: 0,
          contractCount: 0,
          powerPoints: 0
        }
      });
    }
  },

  // 加载用电数据
  async loadPowerData() {
    try {
      console.log('开始加载用电数据');
      const response = await authAPI.getPowerInfo();
      console.log('用电数据响应:', response);
      
      if (response && (response.success || response.code === 200)) {
        const data = response.data || response;
        console.log('用电数据:', data);
        const powerData = {
          monthlyConsumption: data.monthlyConsumption || 0,
          monthlyBill: data.monthlyBill || 0,
          savingRate: data.savingRate || 0
        };
        console.log('设置用电数据:', powerData);
        this.setData({ powerData });
        console.log('用电数据设置完成，当前页面powerData:', this.data.powerData);
      } else {
        console.log('用电数据响应失败，设置默认值');
        // 设置默认值
        this.setData({
          powerData: {
            monthlyConsumption: 0,
            monthlyBill: 0,
            savingRate: 0
          }
        });
      }
    } catch (error) {
      console.error('加载用电数据失败:', error);
      // 设置默认值
      this.setData({
        powerData: {
          monthlyConsumption: 0,
          monthlyBill: 0,
          savingRate: 0
        }
      });
    }
  },

  // 加载通知数量
  async loadNotificationCount() {
    try {
      console.log('开始加载通知数量');
      // 这里可以添加获取通知数量的API调用
      // const response = await notificationAPI.getUnreadCount();
      
      // 暂时设置为0
      const menuItems = this.data.menuItems.map(item => {
        if (item.id === 'orders') {
          item.badge = 0; // 可以根据实际API返回设置
        } else if (item.id === 'notifications') {
          item.badge = 0; // 可以根据实际API返回设置
        }
        return item;
      });
      
      this.setData({ menuItems });
    } catch (error) {
      console.error('加载通知数量失败:', error);
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

  // 点击头像
  onAvatarTap() {
    wx.navigateTo({
      url: '/pages/profile/info/info'
    });
  },

  // 跳转到认证页面
  goToAuth(e) {
    const { status } = e.currentTarget.dataset;
    console.log('跳转到认证页面，当前状态:', status);
    
    wx.navigateTo({
      url: '/pages/profile/auth/auth?status=' + status,
      fail: (error) => {
        console.error('跳转到认证页面失败:', error);
        wx.showToast({
          title: '认证功能开发中',
          icon: 'none'
        });
      }
    });
  },

  // 菜单点击事件
  onMenuTap(e) {
    const { id, url } = e.currentTarget.dataset;
    
    if (!this.data.isLoggedIn) {
      this.setData({ showAuthDialog: true });
      return;
    }
    
    console.log('菜单点击:', id, url);
    
    // 处理特殊页面跳转
    switch (id) {
      case 'orders':
        // 订单页面是tabbar页面，使用switchTab
        wx.switchTab({
          url: '/pages/orders/index/index',
          fail: (error) => {
            console.error('跳转到订单页面失败:', error);
            wx.showToast({
              title: '页面跳转失败',
              icon: 'none'
            });
          }
        });
        break;
      case 'contracts':
        // 合同页面暂未实现
        wx.showToast({
          title: '合同管理功能开发中',
          icon: 'none'
        });
        break;
      case 'renewal-notice':
        // 续约提醒页面暂未实现
        wx.showToast({
          title: '续约提醒功能开发中',
          icon: 'none'
        });
        break;
      case 'consumption':
        // 用电数据页面暂未实现
        wx.showToast({
          title: '用电数据功能开发中',
          icon: 'none'
        });
        break;
      case 'savings':
        // 节费记录页面暂未实现
        wx.showToast({
          title: '节费记录功能开发中',
          icon: 'none'
        });
        break;
      case 'notifications':
        // 消息通知页面暂未实现
        wx.showToast({
          title: '消息通知功能开发中',
          icon: 'none'
        });
        break;
      case 'settings':
        // 设置页面暂未实现
        wx.showToast({
          title: '设置功能开发中',
          icon: 'none'
        });
        break;
      default:
        if (url) {
          wx.navigateTo({
            url: url,
            fail: (error) => {
              console.error('页面跳转失败:', error);
              wx.showToast({
                title: '页面跳转失败',
                icon: 'none'
              });
            }
          });
        } else {
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          });
        }
    }
  },

  // 快捷操作点击事件
  onQuickActionTap(e) {
    const { id } = e.currentTarget.dataset;
    
    if (!this.data.isLoggedIn) {
      this.setData({ showAuthDialog: true });
      return;
    }
    
    console.log('快捷操作点击:', id);
    
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
      default:
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
    }
  },

  // 联系客户经理
  async contactManager() {
    try {
      const userInfo = this.data.userInfo;
      if (userInfo.managerPhone) {
        wx.makePhoneCall({
          phoneNumber: userInfo.managerPhone,
          fail: (error) => {
            console.error('拨打电话失败:', error);
            wx.showToast({
              title: '拨打电话失败',
              icon: 'none'
            });
          }
        });
      } else {
        wx.showToast({
          title: '暂无客户经理联系方式',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('联系客户经理失败:', error);
      wx.showToast({
        title: '联系客户经理失败',
        icon: 'none'
      });
    }
  },

  // 在线客服
  openOnlineService() {
    wx.showToast({
      title: '在线客服功能开发中',
      icon: 'none'
    });
  },

  // 意见反馈
  openFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/index/index',
      fail: () => {
        wx.showToast({
          title: '意见反馈功能开发中',
          icon: 'none'
        });
      }
    });
  },

  // 帮助中心
  openHelp() {
    wx.navigateTo({
      url: '/pages/help/index/index',
      fail: () => {
        wx.showToast({
          title: '帮助中心功能开发中',
          icon: 'none'
        });
      }
    });
  },

  // 统计数据点击事件
  onStatsTap(e) {
    const { type } = e.currentTarget.dataset;
    
    if (!this.data.isLoggedIn) {
      this.setData({ showAuthDialog: true });
      return;
    }
    
    console.log('统计数据点击:', type);
    
    switch (type) {
      case 'orders':
        // 订单页面是tabbar页面，使用switchTab
        wx.switchTab({
          url: '/pages/orders/index/index'
        });
        break;
      case 'contracts':
        wx.showToast({
          title: '合同管理功能开发中',
          icon: 'none'
        });
        break;
      case 'power-points':
        wx.showToast({
          title: '用电数据功能开发中',
          icon: 'none'
        });
        break;
      default:
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
    }
  },

  // 查看用电数据
  viewPowerData() {
    if (!this.data.isLoggedIn) {
      this.setData({ showAuthDialog: true });
      return;
    }
    
    wx.showToast({
      title: '用电数据详情功能开发中',
      icon: 'none'
    });
  },

  // 登录确认
  onAuthConfirm() {
    this.setData({ showAuthDialog: false });
    wx.navigateTo({
      url: '/pages/auth/login/login'
    });
  },

  // 登录取消
  onAuthCancel() {
    this.setData({ showAuthDialog: false });
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