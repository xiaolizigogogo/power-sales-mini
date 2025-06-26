const api = require('../../../utils/api');
const auth = require('../../../utils/auth');
const { formatDate, formatMoney } = require('../../../utils/common');

Page({
  data: {
    // 页面状态
    loading: true,
    refreshing: false,
    loadingMore: false,
    hasMore: true,
    isEmpty: false,
    
    // 筛选状态
    activeTab: 'all',
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
    selectedOrder: null
  },

  onLoad(options) {
    console.log('订单列表页面加载', options);
    
    // 从参数获取状态筛选
    if (options.status) {
      this.setData({ activeTab: options.status });
    }
    
    this.initPage();
  },

  onShow() {
    // 每次显示时刷新数据
    this.refreshOrderList();
  },

  onPullDownRefresh() {
    this.refreshOrderList();
  },

  onReachBottom() {
    this.loadMoreOrders();
  },

  onShareAppMessage() {
    return {
      title: '我的订单',
      path: '/pages/orders/index/index'
    };
  },

  // 页面初始化
  async initPage() {
    try {
      await this.loadOrderStats();
      await this.loadOrderList();
    } catch (error) {
      console.error('页面初始化失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  // 加载订单统计
  async loadOrderStats() {
    try {
      const response = await api.request({
        url: '/orders/stats',
        method: 'GET'
      });

      if (response.success) {
        const stats = response.data;
        const tabList = this.data.tabList.map(tab => ({
          ...tab,
          count: stats[tab.key] || 0
        }));
        
        this.setData({ tabList });
      }
    } catch (error) {
      console.error('加载订单统计失败:', error);
    }
  },

  // 加载订单列表
  async loadOrderList(reset = false) {
    if (this.data.loading && !reset) return;

    const page = reset ? 1 : this.data.page;
    
    this.setData({
      loading: reset,
      refreshing: reset
    });

    try {
      const params = {
        page,
        page_size: this.data.pageSize,
        status: this.data.activeTab === 'all' ? '' : this.data.activeTab,
        keyword: this.data.searchKeyword,
        ...this.data.filterData
      };

      const response = await api.request({
        url: '/orders',
        method: 'GET',
        data: params
      });

      if (response.success) {
        const { items, total, has_more } = response.data;
        
        // 处理订单数据
        const processedOrders = items.map(order => this.processOrderData(order));
        
        this.setData({
          orderList: reset ? processedOrders : this.data.orderList.concat(processedOrders),
          total,
          hasMore: has_more,
          page: page + 1,
          isEmpty: reset && processedOrders.length === 0
        });
      }
    } catch (error) {
      console.error('加载订单列表失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({
        loading: false,
        refreshing: false,
        loadingMore: false
      });
      
      if (this.data.refreshing) {
        wx.stopPullDownRefresh();
      }
    }
  },

  // 处理订单数据
  processOrderData(order) {
    return {
      ...order,
      formattedAmount: formatMoney(order.amount),
      formattedCreateTime: formatDate(order.created_at, 'MM-DD HH:mm'),
      formattedUpdateTime: formatDate(order.updated_at, 'MM-DD HH:mm'),
      statusText: this.getStatusText(order.status),
      statusColor: this.getStatusColor(order.status),
      canCancel: ['pending', 'confirmed'].includes(order.status),
      canPay: order.status === 'confirmed',
      canViewContract: ['contract', 'active', 'completed'].includes(order.status),
      progress: this.getOrderProgress(order.status)
    };
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      pending: '待确认',
      confirmed: '已确认',
      contract: '待签约',
      active: '服务中',
      completed: '已完成',
      cancelled: '已取消'
    };
    return statusMap[status] || '未知状态';
  },

  // 获取状态颜色
  getStatusColor(status) {
    const colorMap = {
      pending: '#ff9500',
      confirmed: '#007aff',
      contract: '#5856d6',
      active: '#34c759',
      completed: '#8e8e93',
      cancelled: '#ff3b30'
    };
    return colorMap[status] || '#8e8e93';
  },

  // 获取订单进度
  getOrderProgress(status) {
    const progressMap = {
      pending: 20,
      confirmed: 40,
      contract: 60,
      active: 80,
      completed: 100,
      cancelled: 0
    };
    return progressMap[status] || 0;
  },

  // 刷新订单列表
  refreshOrderList() {
    this.setData({ page: 1 });
    this.loadOrderList(true);
  },

  // 加载更多订单
  loadMoreOrders() {
    if (this.data.loadingMore || !this.data.hasMore) return;
    
    this.setData({ loadingMore: true });
    this.loadOrderList();
  },

  // 切换标签
  onTabChange(e) {
    const { key } = e.currentTarget.dataset;
    if (key === this.data.activeTab) return;

    this.setData({
      activeTab: key,
      page: 1
    });
    
    this.loadOrderList(true);
  },

  // 搜索功能
  onSearchFocus() {
    this.setData({ showSearch: true });
  },

  onSearchBlur() {
    setTimeout(() => {
      this.setData({ showSearch: false });
    }, 200);
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearchConfirm() {
    this.refreshOrderList();
    this.setData({ showSearch: false });
  },

  onClearSearch() {
    this.setData({ searchKeyword: '' });
    this.refreshOrderList();
  },

  // 筛选功能
  onShowFilter() {
    this.setData({ showFilter: true });
  },

  onHideFilter() {
    this.setData({ showFilter: false });
  },

  onFilterChange(e) {
    const { field, value } = e.currentTarget.dataset;
    this.setData({
      [`filterData.${field}`]: value
    });
  },

  onApplyFilter() {
    this.setData({ showFilter: false });
    this.refreshOrderList();
  },

  onResetFilter() {
    this.setData({
      filterData: {
        dateRange: '',
        amountRange: '',
        productType: ''
      }
    });
  },

  // 订单操作
  onOrderTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/orders/detail/detail?id=${id}`
    });
  },

  onOrderAction(e) {
    const { action, order } = e.currentTarget.dataset;
    
    switch (action) {
      case 'cancel':
        this.cancelOrder(order);
        break;
      case 'pay':
        this.payOrder(order);
        break;
      case 'contract':
        this.viewContract(order);
        break;
      case 'more':
        this.showMoreActions(order);
        break;
      default:
        break;
    }
  },

  // 取消订单
  cancelOrder(order) {
    wx.showModal({
      title: '取消订单',
      content: '确认要取消这个订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '处理中...' });
            
            const response = await api.request({
              url: `/orders/${order.id}/cancel`,
              method: 'POST'
            });

            if (response.success) {
              wx.showToast({
                title: '订单已取消',
                icon: 'success'
              });
              this.refreshOrderList();
            } else {
              throw new Error(response.message);
            }
          } catch (error) {
            console.error('取消订单失败:', error);
            wx.showToast({
              title: error.message || '取消失败',
              icon: 'none'
            });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  // 支付订单
  payOrder(order) {
    wx.navigateTo({
      url: `/pages/orders/pay/pay?id=${order.id}`
    });
  },

  // 查看合同
  viewContract(order) {
    wx.navigateTo({
      url: `/pages/contract/detail/detail?orderId=${order.id}`
    });
  },

  // 显示更多操作
  showMoreActions(order) {
    const actions = [];
    
    if (order.canCancel) {
      actions.push({ name: '取消订单', action: 'cancel', color: '#ff3b30' });
    }
    
    actions.push(
      { name: '联系客服', action: 'contact' },
      { name: '分享订单', action: 'share' }
    );

    this.setData({
      showActionSheet: true,
      actionSheetActions: actions,
      selectedOrder: order
    });
  },

  // 操作面板选择
  onActionSelect(e) {
    const { action } = e.detail;
    const order = this.data.selectedOrder;
    
    this.setData({ showActionSheet: false });
    
    switch (action) {
      case 'cancel':
        this.cancelOrder(order);
        break;
      case 'contact':
        this.contactService(order);
        break;
      case 'share':
        this.shareOrder(order);
        break;
      default:
        break;
    }
  },

  // 联系客服
  contactService(order) {
    wx.makePhoneCall({
      phoneNumber: '400-888-8888',
      fail: () => {
        wx.showToast({
          title: '拨号失败',
          icon: 'none'
        });
      }
    });
  },

  // 分享订单
  shareOrder(order) {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 重试加载
  onRetryLoad() {
    this.setData({
      loading: true,
      isEmpty: false
    });
    this.loadOrderList(true);
  },

  // 创建新订单
  onCreateOrder() {
    wx.navigateTo({
      url: '/pages/products/index/index'
    });
  }
}); 