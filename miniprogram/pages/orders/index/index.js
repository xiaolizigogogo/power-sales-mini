const app = getApp();
const { formatDate, formatMoney } = require('../../../utils/common');
const { orderAPI } = require('../../../utils/api');

Page({
  data: {
    // 页面状态
    loading: true,
    refreshing: false,
    loadingMore: false,
    hasMore: true,
    isEmpty: false,
    
    // 筛选状态
    activeTab: 0,
    tabList: [
      { key: 'all', name: '全部', count: 0 },
      { key: 'pending', name: '待确认', count: 0 },
      { key: 'confirmed', name: '已确认', count: 0 },
      { key: 'contract', name: '待签约', count: 0 },
      { key: 'active', name: '服务中', count: 0 },
      { key: 'completed', name: '已完成', count: 0 },
      { key: 'cancelled', name: '已取消', count: 0 }
    ],
    
    // 订单数据
    orderList: [],
    page: 1,
    pageSize: 10,
    total: 0,
    
    // 搜索
    searchKeyword: '',
    showSearch: false,
    
    // 筛选
    showFilter: false,
    filterData: {
      dateRange: '',
      amountRange: '',
      productType: ''
    },
    
    // 操作
    showActionSheet: false,
    actionSheetActions: [],
    selectedOrder: null,
    statusMap: {
      0: { text: '全部', value: '' },
      1: { text: '待付款', value: 'pending' },
      2: { text: '处理中', value: 'processing' },
      3: { text: '已完成', value: 'completed' },
      4: { text: '已取消', value: 'cancelled' }
    },
    statusColorMap: {
      'pending': '#1989fa',
      'negotiating': '#ff976a',
      'confirmed': '#07c160',
      'rejected': '#ee0a24',
      'cancelled': '#969799'
    },
    
    // 分页相关
    pageNum: 1,
    pageSize: 10,
    hasMore: true,
    
    // 筛选相关
    tabs: [
      { key: 'all', name: '全部' },
      { key: 'pending', name: '待确认' },
      { key: 'negotiating', name: '商务洽谈' },
      { key: 'confirmed', name: '已确认' },
      { key: 'rejected', name: '已拒绝' },
      { key: 'cancelled', name: '已取消' }
    ],
    searchValue: '',
    orders: []
  },

  onLoad(options) {
    console.log('订单列表页面加载', options);
    
    // 检查登录状态
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
      return;
    }

    // 检查token是否存在
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
      return;
    }
    
    // 从参数获取状态筛选
    if (options.status) {
      this.setData({ activeTab: options.status });
    }
    
    this.initPage();
  },

  onShow() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
      return;
    }

    // 检查token是否存在
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
      return;
    }
    
    // 每次显示时只刷新订单列表，不刷新统计
    this.loadOrderList(true);
  },

  // 初始化页面
  async initPage() {
    try {
      await Promise.all([
        this.loadOrderList(),
        this.loadOrderStats()
      ]);
    } catch (error) {
      console.error('初始化页面失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 加载订单列表
  async loadOrderList(refresh = false) {
    if (refresh) {
      this.setData({ page: 1 });
    }

    if (this.data.loading || (this.data.loadingMore && !refresh)) return;

    const isFirstPage = this.data.page === 1;
    this.setData({
      loading: isFirstPage,
      loadingMore: !isFirstPage
    });

    try {
      const params = {
        page: this.data.page - 1,
        size: this.data.pageSize,
        status: this.data.tabList[this.data.activeTab].key === 'all' ? '' : this.data.tabList[this.data.activeTab].key,
        keyword: this.data.searchKeyword,
        ...this.data.filterData
      };

      console.log('请求订单列表参数:', params);
      const response = await orderAPI.getMyOrders(params);
      console.log('订单列表响应:', response);

      if (response && response.code === 200) {
        let content = [];
        let totalElements = 0;

        // 处理不同的响应数据结构
        if (response.data && Array.isArray(response.data)) {
          content = response.data;
          totalElements = response.data.length;
        } else if (response.data && Array.isArray(response.data.content)) {
          content = response.data.content;
          totalElements = response.data.totalElements || content.length;
        }

        const formattedOrders = content.map(order => ({
          ...order,
          createTime: formatDate(order.createTime),
          amount: formatMoney(order.amount)
        }));

        console.log('格式化后的订单列表:', formattedOrders);
        this.setData({
          orderList: refresh ? formattedOrders : [...this.data.orderList, ...formattedOrders],
          total: totalElements,
          hasMore: content.length === this.data.pageSize,
          isEmpty: isFirstPage && content.length === 0,
          loading: false,
          loadingMore: false,
          refreshing: false
        });
      } else {
        console.error('加载订单列表失败: 无效的响应数据', response);
        this.setData({
          orderList: [],
          total: 0,
          hasMore: false,
          isEmpty: true,
          loading: false,
          loadingMore: false,
          refreshing: false
        });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载订单列表失败:', error);
      this.setData({
        orderList: [],
        total: 0,
        hasMore: false,
        isEmpty: true,
        loading: false,
        loadingMore: false,
        refreshing: false
      });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 加载订单统计
  async loadOrderStats() {
    try {
      const response = await orderAPI.getOrderStats();
      console.log('订单统计数据:', response);

      if (response && response.code === 200 && response.data) {
        console.log('原始tabList:', this.data.tabList);
        console.log('统计数据:', response.data);
        
        const newTabList = this.data.tabList.map(tab => {
          const count = response.data[tab.key] || 0;
          console.log(`${tab.key} 状态的订单数:`, count);
          return { ...tab, count };
        });
        
        console.log('更新后的tabList:', newTabList);
        this.setData({ 
          tabList: newTabList 
        }, () => {
          console.log('tabList更新完成，当前数据:', this.data.tabList);
        });
      }
    } catch (error) {
      console.error('加载订单统计失败:', error);
      // 设置默认的统计数据
      const newTabList = this.data.tabList.map(tab => ({
        ...tab,
        count: 0
      }));
      
      this.setData({ 
        tabList: newTabList 
      });
    }
  },

  // 切换标签
  onTabChange(e) {
    const index = e.currentTarget.dataset.index;
    if (this.data.activeTab !== index) {
      this.setData({ 
        activeTab: index,
        page: 1,
        orderList: []
      });
      this.loadOrderList(true);
    }
  },

  // 搜索订单
  onSearch() {
    this.setData({
      orderList: []
    }, () => {
      this.loadOrderList(true);
    });
  },

  // 清除搜索
  onClearSearch() {
    this.setData({
      searchKeyword: '',
      orderList: []
    }, () => {
      this.loadOrderList(true);
    });
  },

  // 显示筛选
  showFilterPopup() {
    this.setData({ showFilter: true });
  },

  // 关闭筛选
  closeFilterPopup() {
    this.setData({ showFilter: false });
  },

  // 应用筛选
  applyFilter(e) {
    const filterData = e.detail;
    this.setData({
      filterData,
      showFilter: false,
      orderList: []
    }, () => {
      this.loadOrderList(true);
    });
  },

  // 重置筛选
  resetFilter() {
    this.setData({
      filterData: {
        dateRange: '',
        amountRange: '',
        productType: ''
      },
      orderList: []
    }, () => {
      this.loadOrderList(true);
    });
  },

  // 刷新订单列表
  async refreshOrderList() {
    this.setData({ refreshing: true });
    try {
      await Promise.all([
        this.loadOrderList(true),
        this.loadOrderStats()
      ]);
    } catch (error) {
      console.error('刷新订单列表失败:', error);
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      });
    } finally {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.refreshOrderList();
  },

  // 上拉加载更多
  async onReachBottom() {
    if (!this.data.hasMore || this.data.loadingMore) return;
    
    this.setData({
      page: this.data.page + 1
    }, () => {
      this.loadOrderList();
    });
  },

  // 查看订单详情
  viewOrderDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/orders/detail/detail?id=${id}`
    });
  },

  // 显示操作菜单
  showOrderActions(e) {
    const { order } = e.currentTarget.dataset;
    const actions = this.getOrderActions(order);
    
    if (actions.length === 0) return;
    
    this.setData({
      showActionSheet: true,
      actionSheetActions: actions,
      selectedOrder: order
    });
  },

  // 获取订单可用操作
  getOrderActions(order) {
    const actions = [];
    
    switch (order.status) {
      case 'pending':
        actions.push(
          { name: '确认订单', color: '#07c160' },
          { name: '取消订单', color: '#ee0a24' }
        );
        break;
      case 'negotiating':
        actions.push(
          { name: '继续洽谈', color: '#1989fa' },
          { name: '确认订单', color: '#07c160' },
          { name: '取消订单', color: '#ee0a24' }
        );
        break;
      case 'confirmed':
        actions.push(
          { name: '查看合同', color: '#1989fa' },
          { name: '取消订单', color: '#ee0a24' }
        );
        break;
      case 'active':
        actions.push(
          { name: '查看合同', color: '#1989fa' },
          { name: '查看进度', color: '#07c160' }
        );
        break;
      case 'completed':
        actions.push(
          { name: '查看合同', color: '#1989fa' },
          { name: '评价服务', color: '#07c160' }
        );
        break;
    }
    
    return actions;
  },

  // 处理操作菜单选择
  onActionSelect(e) {
    const { index } = e.detail;
    const action = this.data.actionSheetActions[index];
    const order = this.data.selectedOrder;
    
    this.setData({ showActionSheet: false });
    
    switch (action.name) {
      case '确认订单':
        this.confirmOrder(order);
        break;
      case '取消订单':
        this.cancelOrder(order);
        break;
      case '继续洽谈':
        this.negotiateOrder(order);
        break;
      case '查看合同':
        this.viewContract(order);
        break;
      case '查看进度':
        this.viewProgress(order);
        break;
      case '评价服务':
        this.reviewService(order);
        break;
    }
  },

  // 确认订单
  async confirmOrder(order) {
    try {
      await orderAPI.confirmOrder(order.id);
      
      wx.showToast({
        title: '确认成功',
        icon: 'success'
      });
      
      this.refreshOrderList();
    } catch (error) {
      console.error('确认订单失败:', error);
      wx.showToast({
        title: '确认失败',
        icon: 'none'
      });
    }
  },

  // 取消订单
  async cancelOrder(order) {
    try {
      await orderAPI.cancelOrder(order.id);
      
      wx.showToast({
        title: '取消成功',
        icon: 'success'
      });
      
      this.refreshOrderList();
    } catch (error) {
      console.error('取消订单失败:', error);
      wx.showToast({
        title: '取消失败',
        icon: 'none'
      });
    }
  },

  // 继续洽谈
  negotiateOrder(order) {
    wx.navigateTo({
      url: `/pages/orders/negotiate/negotiate?id=${order.id}`
    });
  },

  // 查看合同
  viewContract(order) {
    wx.navigateTo({
      url: `/pages/orders/contract/contract?id=${order.id}`
    });
  },

  // 查看进度
  viewProgress(order) {
    wx.navigateTo({
      url: `/pages/orders/progress/progress?id=${order.id}`
    });
  },

  // 评价服务
  reviewService(order) {
    wx.navigateTo({
      url: `/pages/orders/review/review?id=${order.id}`
    });
  },
}); 