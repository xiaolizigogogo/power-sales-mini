const api = require('../../../utils/api');
const util = require('../../../utils/util');

Page({
  data: {
    userInfo: null,
    loading: false,
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
      }
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
    ]
  },

  onLoad(options) {
    console.log('业绩统计页面加载', options);
    this.getUserInfo();
    this.initializeData();
  },

  onShow() {
    this.loadPerformanceData();
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.loadPerformanceData().finally(() => {
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
  }
}); 