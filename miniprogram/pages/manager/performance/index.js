// pages/manager/performance/index.js
const roleManager = require('../../../utils/role-manager');
const { showToast, showLoading, hideLoading } = require('../../../utils/common');

Page({
  data: {
    // 当前选中的时间范围
    selectedPeriod: 'month', // month, quarter, year
    periodOptions: [
      { value: 'month', label: '本月' },
      { value: 'quarter', label: '本季度' },
      { value: 'year', label: '本年度' }
    ],
    
    // 个人业绩数据
    personalPerformance: {
      currentAmount: 0,
      targetAmount: 0,
      completionRate: 0,
      ranking: 0,
      totalEmployees: 0,
      growth: 0, // 增长率
      lastMonthAmount: 0
    },
    
    // 月度目标进度
    monthlyTarget: {
      target: 0,
      current: 0,
      remaining: 0,
      daysLeft: 0,
      dailyRequired: 0,
      onTrack: true
    },
    
    // 业绩分解数据
    performanceBreakdown: {
      newCustomers: 0,
      renewalCustomers: 0,
      newCustomerAmount: 0,
      renewalAmount: 0,
      averageOrderValue: 0,
      conversionRate: 0
    },
    
    // 历史趋势数据（最近6个月）
    trendData: [],
    
    // 团队排行榜
    teamRanking: [],
    
    // 业绩分析
    performanceAnalysis: {
      bestPerformingMonth: '',
      topCategory: '',
      improvementAreas: []
    },
    
    // 加载状态
    loading: false,
    refreshing: false,
    
    // 图表显示类型
    chartType: 'trend', // trend, breakdown, comparison
    
    // 统计周期
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1
  },

  onLoad() {
    this.checkUserPermission();
    this.initData();
  },

  onShow() {
    this.checkUserPermission();
    this.loadPerformanceData();
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.loadPerformanceData().finally(() => {
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
      wx.navigateBack();
      return;
    }
  },

  /**
   * 初始化数据
   */
  initData() {
    const currentUser = roleManager.getCurrentUser();
    console.log('当前用户:', currentUser);
  },

  /**
   * 加载业绩数据
   */
  async loadPerformanceData() {
    this.setData({ loading: true });
    try {
      await Promise.all([
        this.loadPersonalPerformance(),
        this.loadMonthlyTarget(),
        this.loadPerformanceBreakdown(),
        this.loadTrendData(),
        this.loadTeamRanking(),
        this.loadPerformanceAnalysis()
      ]);
    } catch (error) {
      console.error('加载业绩数据失败:', error);
      showToast('加载数据失败', 'error');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 加载个人业绩数据
   */
  async loadPersonalPerformance() {
    try {
      // TODO: 替换为实际的API调用
      const response = await this.mockPersonalPerformance();
      this.setData({
        personalPerformance: response.data
      });
    } catch (error) {
      console.error('加载个人业绩失败:', error);
    }
  },

  /**
   * 加载月度目标数据
   */
  async loadMonthlyTarget() {
    try {
      // TODO: 替换为实际的API调用
      const response = await this.mockMonthlyTarget();
      this.setData({
        monthlyTarget: response.data
      });
    } catch (error) {
      console.error('加载月度目标失败:', error);
    }
  },

  /**
   * 加载业绩分解数据
   */
  async loadPerformanceBreakdown() {
    try {
      // TODO: 替换为实际的API调用
      const response = await this.mockPerformanceBreakdown();
      this.setData({
        performanceBreakdown: response.data
      });
    } catch (error) {
      console.error('加载业绩分解失败:', error);
    }
  },

  /**
   * 加载趋势数据
   */
  async loadTrendData() {
    try {
      // TODO: 替换为实际的API调用
      const response = await this.mockTrendData();
      this.setData({
        trendData: response.data
      });
    } catch (error) {
      console.error('加载趋势数据失败:', error);
    }
  },

  /**
   * 加载团队排行榜
   */
  async loadTeamRanking() {
    try {
      // TODO: 替换为实际的API调用
      const response = await this.mockTeamRanking();
      this.setData({
        teamRanking: response.data
      });
    } catch (error) {
      console.error('加载团队排行榜失败:', error);
    }
  },

  /**
   * 加载业绩分析
   */
  async loadPerformanceAnalysis() {
    try {
      // TODO: 替换为实际的API调用
      const response = await this.mockPerformanceAnalysis();
      this.setData({
        performanceAnalysis: response.data
      });
    } catch (error) {
      console.error('加载业绩分析失败:', error);
    }
  },

  /**
   * 切换时间周期
   */
  onPeriodChange(e) {
    const { period } = e.currentTarget.dataset;
    if (period === this.data.selectedPeriod) return;
    
    this.setData({
      selectedPeriod: period
    });
    this.loadPerformanceData();
  },

  /**
   * 切换图表类型
   */
  onChartTypeChange(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({
      chartType: type
    });
  },

  /**
   * 查看详细报告
   */
  onViewDetailReport() {
    wx.navigateTo({
      url: '/pages/manager/performance/detail'
    });
  },

  /**
   * 查看历史记录
   */
  onViewHistory() {
    wx.navigateTo({
      url: '/pages/manager/performance/history'
    });
  },

  /**
   * 设置目标
   */
  onSetTarget() {
    wx.navigateTo({
      url: '/pages/manager/performance/target'
    });
  },

  /**
   * 查看团队详情
   */
  onViewTeamDetail() {
    wx.navigateTo({
      url: '/pages/manager/performance/team'
    });
  },

  /**
   * 导出报告
   */
  onExportReport() {
    showToast('导出功能开发中', 'none');
  },

  /**
   * 分享业绩
   */
  onSharePerformance() {
    wx.showActionSheet({
      itemList: ['生成业绩海报', '分享到微信群', '发送给好友'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.generatePoster();
            break;
          case 1:
            this.shareToGroup();
            break;
          case 2:
            this.shareToFriend();
            break;
        }
      }
    });
  },

  /**
   * 生成海报
   */
  generatePoster() {
    showToast('生成海报功能开发中', 'none');
  },

  /**
   * 分享到群
   */
  shareToGroup() {
    showToast('分享到群功能开发中', 'none');
  },

  /**
   * 分享给好友
   */
  shareToFriend() {
    showToast('分享给好友功能开发中', 'none');
  },

  // 模拟数据方法
  mockPersonalPerformance() {
    return Promise.resolve({
      data: {
        currentAmount: 125800,
        targetAmount: 150000,
        completionRate: 83.9,
        ranking: 3,
        totalEmployees: 15,
        growth: 15.8,
        lastMonthAmount: 108500
      }
    });
  },

  mockMonthlyTarget() {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysLeft = lastDayOfMonth - today.getDate();
    const target = 150000;
    const current = 125800;
    const remaining = target - current;
    
    return Promise.resolve({
      data: {
        target,
        current,
        remaining,
        daysLeft,
        dailyRequired: Math.ceil(remaining / daysLeft),
        onTrack: current / today.getDate() * lastDayOfMonth >= target * 0.9
      }
    });
  },

  mockPerformanceBreakdown() {
    return Promise.resolve({
      data: {
        newCustomers: 18,
        renewalCustomers: 12,
        newCustomerAmount: 78500,
        renewalAmount: 47300,
        averageOrderValue: 4193,
        conversionRate: 24.6
      }
    });
  },

  mockTrendData() {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
    const data = months.map((month, index) => ({
      month,
      amount: Math.floor(Math.random() * 50000) + 80000,
      target: 150000,
      customers: Math.floor(Math.random() * 20) + 10
    }));
    
    return Promise.resolve({
      data
    });
  },

  mockTeamRanking() {
    const teammates = [
      { name: '张三', amount: 178500, rank: 1, growth: 25.3 },
      { name: '李四', amount: 165200, rank: 2, growth: 18.7 },
      { name: '我', amount: 125800, rank: 3, growth: 15.8, isMe: true },
      { name: '王五', amount: 118900, rank: 4, growth: 12.1 },
      { name: '赵六', amount: 102300, rank: 5, growth: 8.9 },
      { name: '钱七', amount: 95600, rank: 6, growth: 5.2 },
      { name: '孙八', amount: 87400, rank: 7, growth: 2.1 }
    ];
    
    return Promise.resolve({
      data: teammates
    });
  },

  mockPerformanceAnalysis() {
    return Promise.resolve({
      data: {
        bestPerformingMonth: '5月',
        topCategory: '新客户开发',
        improvementAreas: ['客户转化率', '平均订单金额', '客户续约率']
      }
    });
  }
}); 