// pages/manager/workplace/workplace.js
const { roleManager } = require('../../../utils/role-manager');
const { showToast } = require('../../../utils/common');
const { api } = require('../../../utils/api');

Page({
  data: {
    userInfo: {},
    todayStats: {
      newCustomers: 0,
      followUps: 0,
      visits: 0,
      revenue: 0
    },
    weeklyStats: {
      totalCustomers: 0,
      activeCustomers: 0,
      followUpRate: 0,
      conversionRate: 0
    },
    recentFollowUps: [],
    upcomingReminders: [],
    performanceData: {
      monthlyTarget: 0,
      currentProgress: 0,
      progressPercentage: 0
    },
    quickActions: [
      {
        id: 'add-customer',
        name: '添加客户',
        icon: 'plus',
        color: '#1890FF'
      },
      {
        id: 'add-follow',
        name: '添加跟进',
        icon: 'edit',
        color: '#52C41A'
      },
      {
        id: 'customer-list',
        name: '客户列表',
        icon: 'friends-o',
        color: '#FA8C16'
      },
      {
        id: 'performance',
        name: '业绩查看',
        icon: 'chart-trending-o',
        color: '#722ED1'
      }
    ],
    loading: false,
    refreshing: false
  },

  onLoad() {
    this.checkUserPermission();
    this.initData();
    this.updateTabBar();
  },

  onShow() {
    this.checkUserPermission();
    this.loadWorkplaceData();
    this.updateTabBar();
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.loadWorkplaceData().finally(() => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 检查用户权限
   */
  checkUserPermission() {
    const userType = roleManager.getCurrentUserType();
    if (userType !== 'manager') {
      showToast('权限不足', 'error');
      wx.switchTab({
        url: '/pages/index/index'
      });
      return;
    }
  },

  /**
   * 更新自定义tabBar
   */
  updateTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabbar = this.getTabBar();
      const userType = roleManager.getCurrentUserType();
      
      if (userType === 'manager') {
        // 调用自定义tabBar组件的updateTabBar方法
        if (typeof tabbar.updateTabBar === 'function') {
          tabbar.updateTabBar();
        }
        
        // 设置当前选中的tab（工作台是第1个，索引为0）
        if (typeof tabbar.setActiveTab === 'function') {
          tabbar.setActiveTab(0);
        } else {
          tabbar.setData({
            active: 0
          });
        }
      }
    }
  },

  /**
   * 初始化数据
   */
  initData() {
    const userInfo = roleManager.getCurrentUserInfo();
    const today = new Date();
    const todayDate = `${today.getMonth() + 1}月${today.getDate()}日`;
    this.setData({ userInfo, todayDate });
  },

  /**
   * 加载工作台数据
   */
  async loadWorkplaceData() {
    this.setData({ loading: true });
    try {
      await Promise.all([
        this.loadTodayStats(),
        this.loadWeeklyStats(),
        this.loadRecentFollowUps(),
        this.loadUpcomingReminders(),
        this.loadPerformanceData()
      ]);
    } catch (error) {
      console.error('加载工作台数据失败:', error);
      showToast('加载数据失败', 'error');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 加载今日统计数据
   */
  async loadTodayStats() {
    try {
      const response = await api.getManagerTodayStats();
      this.setData({
        todayStats: response.data
      });
    } catch (error) {
      console.error('加载今日统计失败:', error);
    }
  },

  /**
   * 加载本周统计数据
   */
  async loadWeeklyStats() {
    try {
      const response = await api.getManagerWeeklyStats();
      this.setData({
        weeklyStats: response.data
      });
    } catch (error) {
      console.error('加载本周统计失败:', error);
    }
  },

  /**
   * 加载最近跟进记录
   */
  async loadRecentFollowUps() {
    try {
      const response = await api.getManagerRecentFollowUps();
      this.setData({
        recentFollowUps: response.data
      });
    } catch (error) {
      console.error('加载最近跟进记录失败:', error);
    }
  },

  /**
   * 加载即将到期的提醒
   */
  async loadUpcomingReminders() {
    try {
      const response = await api.getManagerUpcomingReminders();
      this.setData({
        upcomingReminders: response.data
      });
    } catch (error) {
      console.error('加载提醒事项失败:', error);
    }
  },

  /**
   * 加载业绩数据
   */
  async loadPerformanceData() {
    try {
      const response = await api.getManagerMonthlyPerformance();
      this.setData({
        performanceData: response.data
      });
    } catch (error) {
      console.error('加载业绩数据失败:', error);
    }
  },

  /**
   * 快速操作点击
   */
  onQuickActionTap(e) {
    const { action } = e.currentTarget.dataset;
    
    switch (action) {
      case 'add-customer':
        wx.navigateTo({
          url: '/pages/manager/customers/add'
        });
        break;
      case 'add-follow':
        wx.navigateTo({
          url: '/pages/manager/follow/add'
        });
        break;
      case 'customer-list':
        wx.navigateTo({
          url: '/pages/manager/customers/list'
        });
        break;
      case 'performance':
        wx.navigateTo({
          url: '/pages/manager/performance/index'
        });
        break;
      default:
        showToast('功能开发中...', 'none');
    }
  },

  /**
   * 查看更多跟进记录
   */
  onViewMoreFollowUps() {
    wx.navigateTo({
      url: '/pages/manager/follow/list'
    });
  },

  /**
   * 查看更多提醒
   */
  onViewMoreReminders() {
    wx.navigateTo({
      url: '/pages/manager/follow/reminders'
    });
  },

  /**
   * 查看客户详情
   */
  onCustomerTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/manager/customers/detail?id=${id}`
    });
  },

  /**
   * 处理提醒事项
   */
  onReminderTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/manager/follow/reminder-detail?id=${id}`
    });
  },

  /**
   * 查看业绩详情
   */
  onPerformanceTap() {
    wx.navigateTo({
      url: '/pages/manager/performance/index'
    });
  },

  // 模拟数据方法 - 后续替换为真实API
  mockTodayStats() {
    return Promise.resolve({
      data: {
        newCustomers: 3,
        followUps: 8,
        visits: 5,
        revenue: 12500
      }
    });
  },

  mockWeeklyStats() {
    return Promise.resolve({
      data: {
        totalCustomers: 45,
        activeCustomers: 32,
        followUpRate: 85.5,
        conversionRate: 12.8
      }
    });
  },

  mockRecentFollowUps() {
    return Promise.resolve({
      data: [
        {
          id: 1,
          customerName: '张三',
          customerPhone: '138****1234',
          content: '客户询问产品详情，已发送资料',
          time: '2小时前',
          type: 'phone'
        },
        {
          id: 2,
          customerName: '李四',
          customerPhone: '139****5678',
          content: '实地拜访，客户意向较强',
          time: '4小时前',
          type: 'visit'
        },
        {
          id: 3,
          customerName: '王五',
          customerPhone: '136****9012',
          content: '微信沟通，约定下次见面时间',
          time: '6小时前',
          type: 'wechat'
        }
      ]
    });
  },

  mockUpcomingReminders() {
    return Promise.resolve({
      data: [
        {
          id: 1,
          title: '回访张三',
          content: '跟进产品使用情况',
          time: '今天 14:30',
          type: 'follow'
        },
        {
          id: 2,
          title: '拜访李四',
          content: '实地考察用电情况',
          time: '明天 09:00',
          type: 'visit'
        },
        {
          id: 3,
          title: '方案演示',
          content: '为王五演示节电方案',
          time: '后天 15:00',
          type: 'demo'
        }
      ]
    });
  },

  mockPerformanceData() {
    return Promise.resolve({
      data: {
        monthlyTarget: 50000,
        currentProgress: 32800,
        progressPercentage: 65.6
      }
    });
  }
}); 