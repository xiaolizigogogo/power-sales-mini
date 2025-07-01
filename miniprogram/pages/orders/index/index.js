const app = getApp();
const auth = require('../../../utils/auth');
const { formatDate, formatMoney } = require('../../../utils/common');
const { checkRoleAccess } = require('../../../utils/auth');
const { request } = require('../../../utils/api');

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
    isManager: false, // 是否为客户经理
    
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
    
    // 检查权限
    if (!this.checkPermissions()) {
      return
    }
    
    // 从参数获取状态筛选
    if (options.status) {
      this.setData({ activeTab: options.status });
    }
    
    this.checkUserRole();
    this.initPage();
  },

  // 检查权限
  checkPermissions() {
    if (!auth.checkLogin()) {
      return false
    }
    
    if (!auth.hasPermission(auth.PERMISSIONS.ORDER_VIEW)) {
      wx.showModal({
        title: '权限不足',
        content: '您没有权限查看订单信息',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
      return false
    }
    
    return true
  },

  onShow() {
    // 每次显示时刷新数据
    this.refreshOrderList();
  },

  onPullDownRefresh() {
    this.loadOrders(true);
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    this.loadOrders();
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
      const response = await app.request({
        url: '/orders/stats',
        method: 'GET'
      });

      if (response.data) {
        const stats = response.data;
        const tabList = this.data.tabList.map(tab => ({
          ...tab,
          count: stats[tab.key] || 0
        }));
        
        this.setData({ tabList });
      }
    } catch (error) {
      console.error('加载订单统计失败:', error);
      // 使用模拟统计数据
      this.loadMockStats();
    }
  },

  // 加载模拟统计数据
  loadMockStats() {
    const mockStats = {
      all: 8,
      pending: 2,
      confirmed: 1,
      contract: 1,
      active: 2,
      completed: 1,
      cancelled: 1
    };

    const tabList = this.data.tabList.map(tab => ({
      ...tab,
      count: mockStats[tab.key] || 0
    }));
    
    console.log('设置模拟统计数据:', tabList);
    this.setData({ tabList });
  },

  // 加载订单列表
  async loadOrders(refresh = false) {
    if (refresh) {
      this.setData({
        page: 1,
        orders: [],
        hasMore: true
      });
    }

    if (!this.data.hasMore || this.data.loading) return;

    this.setData({ loading: true });

    try {
      const { searchValue, page, pageSize, statusMap, activeTab } = this.data;
      const params = {
        page,
        pageSize,
        keyword: searchValue,
        status: statusMap[activeTab].value
      };

      const res = await request('GET', '/api/orders', params);
      
      const { list, total } = res.data;
      const processedOrders = list.map(order => ({
        ...order,
        statusText: this.getStatusText(order.status),
        createTime: this.formatTime(order.createTime)
      }));

      const hasMore = page * pageSize < total;
      
      this.setData({
        orders: [...this.data.orders, ...processedOrders],
        page: hasMore ? page + 1 : page,
        hasMore,
        loading: false
      });
    } catch (error) {
      console.error('加载订单列表失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 搜索相关
  onSearchChange(e) {
    this.setData({
      searchValue: e.detail
    });
  },

  onSearch() {
    this.loadOrders(true);
  },

  // 标签页切换
  onTabChange(e) {
    this.setData({
      activeTab: e.detail.index
    });
    this.loadOrders(true);
  },

  // 订单操作
  async payOrder(e) {
    const { id } = e.currentTarget.dataset;
    // 调用支付接口
    try {
      const res = await request('POST', `/api/orders/${id}/pay`);
      wx.requestPayment({
        ...res.data,
        success: () => {
          wx.showToast({
            title: '支付成功'
          });
          this.loadOrders(true);
        },
        fail: () => {
          wx.showToast({
            title: '支付失败',
            icon: 'none'
          });
        }
      });
    } catch (error) {
      console.error('发起支付失败:', error);
      wx.showToast({
        title: '发起支付失败',
        icon: 'none'
      });
    }
  },

  async cancelOrder(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '取消订单',
      content: '确定要取消该订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request('POST', `/api/orders/${id}/cancel`);
            wx.showToast({
              title: '订单已取消'
            });
            this.loadOrders(true);
          } catch (error) {
            console.error('取消订单失败:', error);
            wx.showToast({
              title: '取消失败，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  contactService() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail() {
        wx.showToast({
          title: '拨打失败，请稍后重试',
          icon: 'none'
        });
      }
    });
  },

  renewOrder(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/orders/renew/renew?orderId=${id}`
    });
  },

  viewContract(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/contracts/detail/detail?orderId=${id}`
    });
  },

  viewDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/orders/detail/detail?id=${id}`
    });
  },

  // 工具方法
  getStatusText(status) {
    const statusTextMap = {
      'pending': '待付款',
      'processing': '处理中',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusTextMap[status] || status;
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  // 刷新订单列表
  refreshOrderList() {
    this.setData({ page: 1 });
    this.loadOrders(true);
  },

  // 加载更多订单
  loadMoreOrders() {
    if (this.data.loadingMore || !this.data.hasMore) return;
    
    this.setData({ loadingMore: true });
    this.loadOrders();
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
    this.loadOrders(true);
  },

  // 创建新订单
  onCreateOrder() {
    wx.navigateTo({
      url: '/pages/products/index/index'
    });
  },

  // 去购物
  onGoShopping() {
    wx.switchTab({
      url: '/pages/products/list/list'
    });
  },

  // 订单项点击
  onOrderItemTap(e) {
    const { order } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/orders/detail/detail?id=${order.id}`
    });
  },

  // 拨打服务电话
  onCallService(e) {
    const { phone } = e.currentTarget.dataset;
    wx.makePhoneCall({
      phoneNumber: phone
    });
  },

  // 取消订单按钮
  onCancelOrder(e) {
    const { orderId } = e.currentTarget.dataset;
    const order = this.data.orderList.find(item => item.id === orderId);
    if (order) {
      this.cancelOrder(order);
    }
  },

  // 修改订单
  onModifyOrder(e) {
    const { orderId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/orders/create/create?mode=edit&id=${orderId}`
    });
  },

  // 支付订单按钮
  onPayOrder(e) {
    const { orderId } = e.currentTarget.dataset;
    const order = this.data.orderList.find(item => item.id === orderId);
    if (order) {
      this.payOrder(order);
    }
  },

  // 查看合同按钮
  onViewContract(e) {
    const { orderId } = e.currentTarget.dataset;
    const order = this.data.orderList.find(item => item.id === orderId);
    if (order) {
      this.viewContract(order);
    }
  },

  // 确认订单
  onConfirmOrder(e) {
    const { orderId } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认收货',
      content: '确认已收到服务并满意吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '确认成功',
            icon: 'success'
          });
          this.refreshOrderList();
        }
      }
    });
  },

  // 关闭筛选弹窗
  onCloseFilter() {
    this.setData({ showFilter: false });
  },

  // 筛选选项点击
  onFilterOptionTap(e) {
    // 这里可以实现筛选选项的选择逻辑
    console.log('筛选选项点击:', e.currentTarget.dataset);
  },

  // 确认筛选
  onConfirmFilter() {
    this.setData({ showFilter: false });
    this.refreshOrderList();
  },

  // 确认操作
  onConfirmAction() {
    // 处理确认操作
  },

  // 取消操作
  onCancelAction() {
    // 处理取消操作
  },

  // 联系方式选择
  onContactSelect() {
    // 处理联系方式选择
  },

  // 关闭联系方式弹窗
  onCloseContactSheet() {
    this.setData({ showContactSheet: false });
  },

  // 检查用户角色
  async checkUserRole() {
    try {
      const res = await app.request({
        url: '/user/role'
      })
      
      if (res.data) {
        this.setData({
          isManager: res.data.role === 'manager'
        })
      }
    } catch (error) {
      console.error('检查用户角色失败:', error)
    }
  },

  // 查看订单详情
  viewOrderDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/orders/detail/detail?id=${id}`
    })
  },
}); 