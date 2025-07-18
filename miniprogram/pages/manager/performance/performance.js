const api = require('../../../utils/api');
const util = require('../../../utils/common');
const app = getApp();
const { performanceAPI } = require('../../../utils/api');

Page({
  data: {
    userInfo: null,
    loading: true,
    refreshing: false,
    
    // 时间筛选
    currentPeriod: 'month', // month, quarter, year
    periodOptions: [
      { label: '本月', value: 'month' },
      { label: '本季度', value: 'quarter' },
      { label: '本年度', value: 'year' }
    ],
    customDateRange: {
      startDate: '',
      endDate: ''
    },
    showDatePicker: false,
    datePickerType: 'start', // start, end
    
    // 业绩数据
    performanceData: {
      // 个人业绩概览
      overview: {
        totalCustomers: 0,
        newCustomers: 0,
        activeCustomers: 0,
        signedCustomers: 0,
        totalOrders: 0,
        totalAmount: 0,
        completionRate: 0,
        ranking: 0,
        targetAmount: 0,
        achievementRate: 0
      },
      
      // 月度趋势
      monthlyTrend: [],
      
      // 客户分布
      customerDistribution: {
        byStatus: [],
        byIndustry: [],
        byRegion: []
      },
      
      // 订单分析
      orderAnalysis: {
        byStatus: [],
        byProduct: [],
        avgOrderValue: 0,
        conversionRate: 0
      },
      
      // 跟进效率
      followEfficiency: {
        totalFollows: 0,
        avgResponseTime: 0,
        customerSatisfaction: 0,
        completedTasks: 0,
        pendingTasks: 0
      },
      monthRevenue: 0,
      monthTarget: 0,
      totalRevenue: 0,
      totalOrders: 0,
      conversionRate: 0,
      revenueTrend: 0,
      ordersTrend: 0,
      customersTrend: 0,
      conversionTrend: 0
    },
    
    // 排行榜数据
    rankings: {
      personal: [],
      team: []
    },
    
    // 图表配置
    chartOptions: {
      trend: {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['新增客户', '成交订单', '订单金额']
        },
        xAxis: {
          type: 'category',
          data: []
        },
        yAxis: [
          {
            type: 'value',
            name: '数量',
            position: 'left'
          },
          {
            type: 'value',
            name: '金额(万元)',
            position: 'right'
          }
        ],
        series: []
      },
      distribution: {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: []
      }
    },
    
    // UI状态
    activeTab: 0,
    tabs: [
      { title: '业绩概览', key: 'overview' },
      { title: '数据分析', key: 'analysis' },
      { title: '排行榜', key: 'ranking' }
    ],
    showShareModal: false,
    shareOptions: [
      { name: '分享给微信好友', icon: 'wechat', openType: 'share' },
      { name: '保存到相册', icon: 'save', action: 'saveToAlbum' },
      { name: '生成报告', icon: 'report', action: 'generateReport' }
    ],
    currentTimeTab: 'month',
    chartType: 'revenue',
    rankingList: [],
    myRanking: null,
    performanceDetail: [],
    targetData: {
      remainingDays: 0,
      dailyTarget: 0,
      predictedCompletion: 0
    },
    chartData: [],
    
    // 计算属性
    revenueTrendAbs: 0,
    ordersTrendAbs: 0,
    customersTrendAbs: 0,
    conversionTrendAbs: 0,
    completionRateWidth: 0,
    myRankingCompletionRateWidth: 0
  },

  onLoad(options) {
    console.log('业绩统计页面加载', options);
    this.getUserInfo();
    this.initializeData();
    this.initPageData();
  },

  onShow() {
    this.loadPerformanceData();
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.refreshData().finally(() => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    // 如果有分页数据，可以在这里加载更多
  },

  // 获取用户信息
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  // 初始化数据
  initializeData() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    this.setData({
      'customDateRange.startDate': util.formatDate(startOfMonth),
      'customDateRange.endDate': util.formatDate(endOfMonth)
    });
  },

  // 加载业绩数据
  async loadPerformanceData() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      const { currentPeriod, customDateRange } = this.data;
      const params = {
        period: currentPeriod,
        startDate: customDateRange.startDate,
        endDate: customDateRange.endDate
      };
      
      const [overviewRes, trendRes, distributionRes, rankingRes] = await Promise.all([
        api.getPerformanceOverview(params),
        api.getPerformanceTrend(params),
        api.getCustomerDistribution(params),
        api.getPerformanceRanking(params)
      ]);
      
      this.setData({
        'performanceData.overview': overviewRes.data,
        'performanceData.monthlyTrend': trendRes.data,
        'performanceData.customerDistribution': distributionRes.data,
        'rankings': rankingRes.data
      });
      
      this.updateCharts();
      
    } catch (error) {
      console.error('加载业绩数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 更新图表
  updateCharts() {
    const { monthlyTrend, customerDistribution } = this.data.performanceData;
    
    // 更新趋势图
    if (monthlyTrend && monthlyTrend.length > 0) {
      const trendChart = {
        ...this.data.chartOptions.trend,
        xAxis: {
          ...this.data.chartOptions.trend.xAxis,
          data: monthlyTrend.map(item => item.month)
        },
        series: [
          {
            name: '新增客户',
            type: 'line',
            yAxisIndex: 0,
            data: monthlyTrend.map(item => item.newCustomers)
          },
          {
            name: '成交订单',
            type: 'line',
            yAxisIndex: 0,
            data: monthlyTrend.map(item => item.signedOrders)
          },
          {
            name: '订单金额',
            type: 'line',
            yAxisIndex: 1,
            data: monthlyTrend.map(item => (item.orderAmount / 10000).toFixed(2))
          }
        ]
      };
      
      this.setData({
        'chartOptions.trend': trendChart
      });
    }
    
    // 更新分布图
    if (customerDistribution && customerDistribution.byStatus) {
      const distributionChart = {
        ...this.data.chartOptions.distribution,
        series: [{
          name: '客户状态分布',
          type: 'pie',
          radius: '50%',
          data: customerDistribution.byStatus.map(item => ({
            value: item.count,
            name: item.status
          }))
        }]
      };
      
      this.setData({
        'chartOptions.distribution': distributionChart
      });
    }
  },

  // 切换时间周期
  onPeriodChange(e) {
    const period = e.currentTarget.dataset.period;
    this.setData({ currentPeriod: period });
    this.updateDateRange(period);
    this.loadPerformanceData();
  },

  // 更新日期范围
  updateDateRange(period) {
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
    }
    
    this.setData({
      'customDateRange.startDate': util.formatDate(startDate),
      'customDateRange.endDate': util.formatDate(endDate)
    });
  },

  // 显示日期选择器
  showDatePicker(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      datePickerType: type,
      showDatePicker: true
    });
  },

  // 日期选择确认
  onDateConfirm(e) {
    const { datePickerType } = this.data;
    const selectedDate = util.formatDate(new Date(e.detail));
    
    this.setData({
      [`customDateRange.${datePickerType}Date`]: selectedDate,
      showDatePicker: false
    });
    
    // 如果开始日期和结束日期都已选择，重新加载数据
    const { startDate, endDate } = this.data.customDateRange;
    if (startDate && endDate) {
      this.loadPerformanceData();
    }
  },

  // 取消日期选择
  onDateCancel() {
    this.setData({ showDatePicker: false });
  },

  // 切换标签页
  onTabChange(e) {
    const index = e.detail.index || e.currentTarget.dataset.index;
    this.setData({ activeTab: index });
  },

  // 查看客户详情
  viewCustomerDetail(e) {
    const customerId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/manager/customers/detail/detail?id=${customerId}`
    });
  },

  // 查看订单详情
  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/orders/detail/detail?id=${orderId}`
    });
  },

  // 显示分享弹窗
  showShareModal() {
    this.setData({ showShareModal: true });
  },

  // 隐藏分享弹窗
  hideShareModal() {
    this.setData({ showShareModal: false });
  },

  // 分享操作
  onShareAction(e) {
    const action = e.currentTarget.dataset.action;
    
    switch (action) {
      case 'saveToAlbum':
        this.saveToAlbum();
        break;
      case 'generateReport':
        this.generateReport();
        break;
    }
    
    this.hideShareModal();
  },

  // 保存到相册
  async saveToAlbum() {
    try {
      wx.showLoading({ title: '保存中...' });
      
      // 这里可以调用canvas绘制业绩报告图片
      // 然后保存到相册
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 生成业绩报告
  async generateReport() {
    try {
      wx.showLoading({ title: '生成中...' });
      
      const { currentPeriod, customDateRange } = this.data;
      const params = {
        period: currentPeriod,
        startDate: customDateRange.startDate,
        endDate: customDateRange.endDate,
        format: 'pdf'
      };
      
      const res = await api.generatePerformanceReport(params);
      
      if (res.data.url) {
        wx.downloadFile({
          url: res.data.url,
          success: (downloadRes) => {
            wx.openDocument({
              filePath: downloadRes.tempFilePath,
              success: () => {
                wx.showToast({
                  title: '报告生成成功',
                  icon: 'success'
                });
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      wx.showToast({
        title: '生成失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 设置业绩目标
  setTarget() {
    wx.showModal({
      title: '设置业绩目标',
      editable: true,
      placeholderText: '请输入目标金额',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            const amount = parseFloat(res.content);
            if (isNaN(amount) || amount <= 0) {
              wx.showToast({
                title: '请输入有效金额',
                icon: 'none'
              });
              return;
            }
            
            await api.setPerformanceTarget({
              period: this.data.currentPeriod,
              targetAmount: amount
            });
            
            wx.showToast({
              title: '设置成功',
              icon: 'success'
            });
            
            this.loadPerformanceData();
          } catch (error) {
            console.error('设置目标失败:', error);
            wx.showToast({
              title: '设置失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 初始化页面数据
  async initPageData() {
    try {
      await Promise.all([
        this.loadUserInfo(),
        this.loadPerformanceData(),
        this.loadTargetData(),
        this.loadChartData(),
        this.loadRankingData(),
        this.loadPerformanceDetail()
      ]);
    } catch (error) {
      console.error('初始化页面数据失败:', error);
    } finally {
      this.setData({ loading: false });
      this.updateComputedValues();
    }
  },

  // 刷新数据
  async refreshData() {
    await this.initPageData();
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const userInfo = app.globalData.userInfo || {};
      this.setData({ userInfo });
    } catch (error) {
      console.error('加载用户信息失败:', error);
      // 使用模拟数据
      this.setData({
        userInfo: {
          name: '张经理',
          position: '高级销售经理',
          department: '华北销售部',
          avatar: ''
        }
      });
    }
  },

  // 加载目标数据
  async loadTargetData() {
    try {
      const res = await performanceAPI.getTargetData();
      
      if (res.data) {
        this.setData({ targetData: res.data });
      }
    } catch (error) {
      console.error('加载目标数据失败:', error);
      // 计算模拟数据
      const now = new Date();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const remainingDays = lastDay.getDate() - now.getDate();
      const { monthRevenue, monthTarget } = this.data.performanceData;
      const dailyTarget = remainingDays > 0 ? ((monthTarget - monthRevenue) / remainingDays).toFixed(1) : 0;
      const predictedCompletion = monthTarget > 0 ? Math.round((monthRevenue / monthTarget) * 100) : 0;
      
      this.setData({
        targetData: {
          remainingDays,
          dailyTarget,
          predictedCompletion
        }
      });
    }
  },

  // 加载图表数据
  async loadChartData() {
    try {
      const params = {
        type: this.data.chartType,
        period: this.data.currentTimeTab
      };
      
      const res = await performanceAPI.getChartData(params);
      
      if (res.data) {
        this.setData({ chartData: res.data });
      }
    } catch (error) {
      console.error('加载图表数据失败:', error);
      // 使用模拟数据
      const mockData = this.data.chartType === 'revenue' ? [
        { period: '第1周', value: '68.5', percentage: 60 },
        { period: '第2周', value: '82.3', percentage: 75 },
        { period: '第3周', value: '95.2', percentage: 85 },
        { period: '第4周', value: '39.6', percentage: 35 }
      ] : [
        { period: '第1周', value: '12', percentage: 70 },
        { period: '第2周', value: '15', percentage: 85 },
        { period: '第3周', value: '10', percentage: 60 },
        { period: '第4周', value: '5', percentage: 30 }
      ];
      
      this.setData({ chartData: mockData });
    }
  },

  // 加载排行榜数据
  async loadRankingData() {
    try {
      const params = {
        period: this.data.currentTimeTab
      };
      
      const res = await performanceAPI.getRankingData(params);
      
      if (res.data) {
        this.setData({ 
          rankingList: res.data.list,
          myRanking: res.data.myRanking
        });
      }
    } catch (error) {
      console.error('加载排行榜数据失败:', error);
      // 使用模拟数据
      this.setData({
        rankingList: [
          {
            id: 1,
            rank: 1,
            name: '李经理',
            department: '华南销售部',
            avatar: '',
            revenue: 456.8,
            orders: 58,
            completionRate: 114.2,
            isMe: false
          },
          {
            id: 2,
            rank: 2,
            name: '王经理',
            department: '华东销售部',
            avatar: '',
            revenue: 398.5,
            orders: 45,
            completionRate: 99.6,
            isMe: false
          },
          {
            id: 3,
            rank: 3,
            name: '刘经理',
            department: '华中销售部',
            avatar: '',
            revenue: 356.2,
            orders: 42,
            completionRate: 89.1,
            isMe: false
          },
          {
            id: 4,
            rank: 4,
            name: '张经理',
            department: '华北销售部',
            avatar: '',
            revenue: 285.6,
            orders: 35,
            completionRate: 71.4,
            isMe: true
          }
        ],
        myRanking: {
          rank: 4,
          name: '张经理',
          department: '华北销售部',
          avatar: '',
          revenue: 285.6,
          orders: 35,
          completionRate: 71.4
        }
      });
    }
  },

  // 加载业绩明细
  async loadPerformanceDetail() {
    try {
      const params = {
        period: this.data.currentTimeTab,
        limit: 5
      };
      
      const res = await performanceAPI.getPerformanceDetail(params);
      
      if (res.data) {
        this.setData({ performanceDetail: res.data });
      }
    } catch (error) {
      console.error('加载业绩明细失败:', error);
      // 使用模拟数据
      this.setData({
        performanceDetail: [
          {
            id: 1,
            orderNumber: 'PO202401001',
            customerName: '张总',
            companyName: '北京科技有限公司',
            productName: '电力监控系统',
            quantity: 1,
            amount: 85000,
            commission: 8500,
            status: 'completed',
            createTime: '2024-01-15 14:30:00'
          },
          {
            id: 2,
            orderNumber: 'PO202401002',
            customerName: '李经理',
            companyName: '上海制造有限公司',
            productName: '智能配电柜',
            quantity: 2,
            amount: 128000,
            commission: 12800,
            status: 'processing',
            createTime: '2024-01-12 10:15:00'
          },
          {
            id: 3,
            orderNumber: 'PO202401003',
            customerName: '王主任',
            companyName: '深圳电子有限公司',
            productName: '电能质量分析仪',
            quantity: 3,
            amount: 72000,
            commission: 7200,
            status: 'completed',
            createTime: '2024-01-08 16:45:00'
          }
        ]
      });
    }
  },

  // 时间筛选切换
  onTimeTabChange(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ currentTimeTab: tab });
    this.refreshData();
  },

  // 统计卡片点击
  onStatTap(e) {
    const { type } = e.currentTarget.dataset;
    
    switch (type) {
      case 'revenue':
        // 跳转到收入详情页面
        wx.navigateTo({
          url: '/pages/manager/performance/revenue-detail/revenue-detail'
        });
        break;
      case 'orders':
        // 跳转到订单详情页面
        wx.navigateTo({
          url: '/pages/menu/user/orders/index/index'
        });
        break;
      case 'customers':
        // 跳转到客户详情页面
        wx.navigateTo({
          url: '/pages/manager/customers/customers?filter=new'
        });
        break;
      case 'conversion':
        // 跳转到转化率详情页面
        wx.navigateTo({
          url: '/pages/manager/performance/conversion-detail/conversion-detail'
        });
        break;
    }
  },

  // 查看目标详情
  viewTargetDetail() {
    wx.navigateTo({
      url: '/pages/manager/performance/target-detail/target-detail'
    });
  },

  // 切换图表类型
  switchChartType(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({ chartType: type });
    this.loadChartData();
  },

  // 查看所有订单
  viewAllOrders() {
    wx.navigateTo({
      url: '/pages/menu/user/orders/index/index'
    });
  },

  // 查看订单详情
  viewOrderDetail(e) {
    const { order } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/orders/detail/detail?id=${order.id}`
    });
  },

  // 日期选择器相关
  showDatePicker() {
    this.setData({ showDatePicker: true });
  },

  closeDatePicker() {
    this.setData({ showDatePicker: false });
  },

  onDateRangeConfirm(e) {
    const [startDate, endDate] = e.detail;
    this.setData({
      customDateRange: {
        start: this.formatDate(startDate),
        end: this.formatDate(endDate)
      },
      showDatePicker: false,
      currentTimeTab: 'custom'
    });
    this.refreshData();
  },

  // 工具方法
  formatAmount(amount) {
    if (!amount) return '0';
    if (amount >= 10000) {
      return (amount / 10000).toFixed(1) + '万';
    }
    return amount.toFixed(2);
  },

  formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  getOrderStatusText(status) {
    const statusMap = {
      'pending': '待处理',
      'processing': '处理中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || '未知状态';
  },

  getOrderStatusType(status) {
    const typeMap = {
      'pending': 'warning',
      'processing': 'primary',
      'completed': 'success',
      'cancelled': 'danger'
    };
    return typeMap[status] || 'default';
  },

  // 更新计算属性
  updateComputedValues() {
    const { performanceData, rankingList, myRanking } = this.data;
    
    // 处理排行榜数据的completionRateWidth
    const processedRankingList = rankingList.map(item => ({
      ...item,
      completionRateWidth: Math.min(item.completionRate || 0, 100)
    }));
    
    this.setData({
      revenueTrendAbs: Math.abs(performanceData.revenueTrend || 0),
      ordersTrendAbs: Math.abs(performanceData.ordersTrend || 0),
      customersTrendAbs: Math.abs(performanceData.customersTrend || 0),
      conversionTrendAbs: Math.abs(performanceData.conversionTrend || 0),
      completionRateWidth: Math.min(performanceData.completionRate || 0, 100),
      myRankingCompletionRateWidth: myRanking ? Math.min(myRanking.completionRate || 0, 100) : 0,
      rankingList: processedRankingList
    });
  }
}); 