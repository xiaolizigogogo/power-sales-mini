// pages/manager/orders/list.js
const { formatDate, formatMoney } = require('../../../utils/common');
const { api } = require('../../../utils/api');

Page({
  data: {
    loading: true,
    refreshing: false,
    loadingMore: false,
    hasMore: true,
    isEmpty: false,
    customerId: '',
    customerName: '',
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
    orderList: [],
    page: 1,
    pageSize: 10,
    total: 0,
    searchKeyword: '',
    showFilter: false,
    filterData: {
      status: '',
      amountRange: '',
      dateRange: ''
    },
    statusOptions: [
      { text: '全部', value: '' },
      { text: '待确认', value: 'pending' },
      { text: '已确认', value: 'confirmed' },
      { text: '待签约', value: 'contract' },
      { text: '服务中', value: 'active' },
      { text: '已完成', value: 'completed' },
      { text: '已取消', value: 'cancelled' }
    ],
    statusMap: {
      'pending': { text: '待处理', color: '#fa8c16' },
      'negotiating': { text: '商务洽谈中', color: '#1890ff' },
      'confirmed': { text: '已确认', color: '#52c41a' },
      'paid': { text: '已支付', color: '#2b85e4' },
      'service': { text: '服务中', color: '#1890ff' },
      'completed': { text: '已完成', color: '#52c41a' },
      'cancelled': { text: '已取消', color: '#ff4d4f' },
      'rejected': { text: '已拒绝', color: '#ff4d4f' },
      'contract': { text: '待签约', color: '#1890ff' },
      'active': { text: '服务中', color: '#1890ff' }
    }
  },

  onLoad(options) {
    if (options.customerId) {
      this.setData({
        customerId: options.customerId,
        customerName: options.customerName || ''
      });
      if (options.customerName) {
        wx.setNavigationBarTitle({
          title: `${options.customerName}的订单`
        });
      }
    }
    this.initPage();
  },

  onShow() {
    // 支持tabBar跳转参数
    const filter = wx.getStorageSync('managerOrderListFilter');
    if (filter && filter.customerId) {
      this.setData({
        customerId: filter.customerId,
        customerName: filter.customerName || ''
      });
      if (filter.customerName) {
        wx.setNavigationBarTitle({
          title: `${filter.customerName}的订单`
        });
      }
      wx.removeStorageSync('managerOrderListFilter');
    }
    this.refreshOrderList();
  },

  async initPage() {
    await this.loadOrderList();
    await this.loadOrderStats();
  },

  async loadOrderList(refresh = false) {
    if (refresh) {
      this.setData({
        page: 1,
        orderList: [],
        hasMore: true,
        loading: false,
        loadingMore: false
      });
    }
    this.setData({ loading: true });
    try {
      const params = {
        page: this.data.page,
        pageSize: this.data.pageSize,
        status: this.data.tabList[this.data.activeTab].key === 'all' ? '' : this.data.tabList[this.data.activeTab].key,
        keyword: this.data.searchKeyword,
        ...this.data.filterData
      };
      if (this.data.customerId) {
        params.customerId = this.data.customerId;
      }
      // 客户经理专用API
      const response = await api.getManagerOrderList(params);
      const { list = [], total = 0 } = response.data || {};
      const newList = this.data.page === 1 ? list : [...this.data.orderList, ...list];
      this.setData({
        orderList: newList,
        total,
        hasMore: list.length >= this.data.pageSize,
        isEmpty: newList.length === 0
      });
    } catch (error) {
      console.error('加载订单列表失败:', error);
      this.setData({ isEmpty: true });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadOrderStats() {
    // 可扩展：加载订单统计
  },

  async refreshOrderList() {
    this.setData({ page: 1 });
    await this.loadOrderList(true);
  },

  async loadMoreOrders() {
    if (!this.data.hasMore || this.data.loadingMore) return;
    this.setData({
      page: this.data.page + 1,
      loadingMore: true
    });
    await this.loadOrderList();
    this.setData({ loadingMore: false });
  },

  onTabChange(e) {
    const { index } = e.detail;
    if (index === this.data.activeTab) return;
    this.setData({
      activeTab: index,
      page: 1,
      orderList: [],
      hasMore: true
    });
    this.loadOrderList(true);
  },

  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({ searchKeyword: keyword });
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.setData({
        page: 1,
        orderList: [],
        hasMore: true
      });
      this.loadOrderList(true);
    }, 500);
  },

  onClearSearch() {
    this.setData({
      searchKeyword: '',
      page: 1,
      orderList: [],
      hasMore: true
    });
    this.loadOrderList(true);
  },

  viewOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/orders/detail/detail?id=${orderId}`
    });
  }
}); 