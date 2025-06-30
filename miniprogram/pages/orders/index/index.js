const app = getApp();
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
    selectedOrder: null,
    statusMap: {
      'pending': '待确认',
      'negotiating': '商务洽谈',
      'confirmed': '已确认',
      'rejected': '已拒绝',
      'cancelled': '已取消'
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
    ]
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
  async loadOrderList(reset = false) {
    if (this.data.loading && !reset) return;

    const page = reset ? 1 : this.data.page;
    
    this.setData({
      loading: reset || this.data.orderList.length === 0,
      refreshing: reset
    });

    try {
      const params = {
        page: page - 1,
        size: this.data.pageSize,
        status: this.data.activeTab === 'all' ? '' : this.data.activeTab,
        keyword: this.data.searchKeyword
      };

      console.log('加载订单列表，参数:', params);

      const response = await app.request({
        url: '/user/orders',
        method: 'GET',
        data: params
      });

      console.log('订单列表响应:', response);

      if (response.data) {
        let items = [];
        let hasMore = false;
        let totalElements = 0;
        
        // 解析后端返回的数据结构
        if (Array.isArray(response.data)) {
          // 直接返回数组
          items = response.data;
          hasMore = items.length >= this.data.pageSize;
        } else if (response.data.content) {
          // 标准分页响应
          items = response.data.content;
          hasMore = !response.data.last;
          totalElements = response.data.totalElements || 0;
        } else if (response.data.list) {
          // 自定义list字段
          items = response.data.list;
          hasMore = response.data.hasMore || false;
          totalElements = response.data.total || 0;
        }
        
        console.log('解析到的订单数据:', items.length, '条');
        console.log('是否有更多数据:', hasMore);
        console.log('总数据量:', totalElements);
        
        // 处理订单数据
        const processedOrders = items.map(order => this.processOrderData(order));
        
        this.setData({
          orderList: reset ? processedOrders : this.data.orderList.concat(processedOrders),
          hasMore: hasMore,
          page: page + 1,
          total: totalElements,
          isEmpty: reset && processedOrders.length === 0
        });
        
        console.log('订单列表更新完成，当前订单数:', this.data.orderList.length);
      }
    } catch (error) {
      console.error('加载订单列表失败:', error);
      // 使用模拟数据
      if (reset || this.data.orderList.length === 0) {
        this.loadMockOrders();
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
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

  // 加载模拟订单数据
  loadMockOrders() {
    const mockOrders = [
      {
        id: 1,
        orderNo: 'PO202412270001',
        productName: '工商业基础用电套餐',
        productPrice: '0.65',
        amount: 12500.00,
        status: 'pending',
        customerName: '张三',
        companyName: '北京科技有限公司',
        created_at: '2024-12-27 10:30:00',
        updated_at: '2024-12-27 10:30:00',
        serviceStartDate: '2025-01-01',
        serviceEndDate: '2025-12-31'
      },
      {
        id: 2,
        orderNo: 'PO202412270002',
        productName: '工商业标准用电套餐',
        productPrice: '0.62',
        amount: 25800.00,
        status: 'confirmed',
        customerName: '李四',
        companyName: '上海制造有限公司',
        created_at: '2024-12-26 14:20:00',
        updated_at: '2024-12-27 09:15:00',
        serviceStartDate: '2025-01-01',
        serviceEndDate: '2025-12-31'
      },
      {
        id: 3,
        orderNo: 'PO202412270003',
        productName: '居民生活用电套餐',
        productPrice: '0.56',
        amount: 3600.00,
        status: 'active',
        customerName: '王五',
        companyName: '广州贸易有限公司',
        created_at: '2024-12-25 16:45:00',
        updated_at: '2024-12-26 11:30:00',
        serviceStartDate: '2024-12-26',
        serviceEndDate: '2025-12-25'
      },
      {
        id: 4,
        orderNo: 'PO202412270004',
        productName: '农业生产用电套餐',
        productPrice: '0.45',
        amount: 8900.00,
        status: 'completed',
        customerName: '赵六',
        companyName: '农业合作社',
        created_at: '2024-12-20 09:00:00',
        updated_at: '2024-12-25 17:00:00',
        serviceStartDate: '2024-12-21',
        serviceEndDate: '2025-12-20'
      }
    ];

    // 根据当前标签筛选
    let filteredOrders = mockOrders;
    if (this.data.activeTab !== 'all') {
      filteredOrders = mockOrders.filter(order => order.status === this.data.activeTab);
    }

    // 根据搜索关键词筛选
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.orderNo.toLowerCase().includes(keyword) ||
        order.productName.toLowerCase().includes(keyword) ||
        order.customerName.toLowerCase().includes(keyword) ||
        order.companyName.toLowerCase().includes(keyword)
      );
    }

    // 处理订单数据
    const processedOrders = filteredOrders.map(order => this.processOrderData(order));

    this.setData({
      orderList: processedOrders,
      hasMore: false,
      isEmpty: processedOrders.length === 0
    });
  },

  // 处理订单数据
  processOrderData(order) {
    console.log('处理订单数据:', order);
    
    return {
      ...order,
      // 基本信息
      orderNumber: order.orderNo || order.order_no || `PO${order.id}`,
      createdAt: formatDate(order.createdAt || order.created_at, 'MM-DD HH:mm'),
      updatedAt: formatDate(order.updatedAt || order.updated_at, 'MM-DD HH:mm'),
      
      // 状态相关
      statusText: order.statusText || this.getStatusText(order.status),
      statusClass: this.getStatusClass(order.status),
      
      // 产品信息
      productImage: order.productImage || '/assets/images/default-product.png',
      productDesc: order.productName ? `产品：${order.productName}` : `单价：¥${order.productPrice || '0.60'}/度`,
      capacity: order.capacity || '标准容量',
      servicePeriod: this.getServicePeriod(order),
      amount: formatMoney(order.amount),
      
      // 服务信息
      assignedEmployee: order.assignedEmployee || null,
      
      // 进度信息
      showProgress: ['confirmed', 'contract', 'active'].includes(order.status),
      currentStep: this.getCurrentStep(order.status),
      progressSteps: this.getProgressSteps(),
      progressPercent: this.getProgressPercent(order.status),
      
      // 操作权限（后端可能已经返回了这些字段）
      canCancel: order.canCancel !== undefined ? order.canCancel : ['pending'].includes(order.status),
      canModify: order.canModify !== undefined ? order.canModify : ['pending'].includes(order.status),
      canPay: order.canPay !== undefined ? order.canPay : order.status === 'confirmed',
      canViewContract: order.canViewContract !== undefined ? order.canViewContract : ['contract', 'active', 'completed'].includes(order.status),
      canConfirm: order.canConfirm !== undefined ? order.canConfirm : order.status === 'active'
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

  // 获取状态样式类
  getStatusClass(status) {
    const classMap = {
      pending: 'status-warning',
      confirmed: 'status-info',
      contract: 'status-primary',
      active: 'status-success',
      completed: 'status-success',
      cancelled: 'status-error'
    };
    return classMap[status] || 'status-default';
  },

  // 获取服务期限描述
  getServicePeriod(order) {
    if (order.serviceStartDate && order.serviceEndDate) {
      const start = formatDate(order.serviceStartDate, 'YYYY-MM-DD');
      const end = formatDate(order.serviceEndDate, 'YYYY-MM-DD');
      return `${start} 至 ${end}`;
    }
    return '1年';
  },

  // 获取当前步骤
  getCurrentStep(status) {
    const stepMap = {
      pending: 0,
      confirmed: 1,
      contract: 2,
      active: 3,
      completed: 4,
      cancelled: 0
    };
    return stepMap[status] || 0;
  },

  // 获取进度步骤
  getProgressSteps() {
    return [
      { id: 0, name: '待确认' },
      { id: 1, name: '已确认' },
      { id: 2, name: '签约中' },
      { id: 3, name: '服务中' },
      { id: 4, name: '已完成' }
    ];
  },

  // 获取进度百分比
  getProgressPercent(status) {
    const percentMap = {
      pending: 20,
      confirmed: 40,
      contract: 60,
      active: 80,
      completed: 100,
      cancelled: 0
    };
    return percentMap[status] || 0;
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
            
            const response = await app.request({
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

  // 加载订单列表
  async loadOrders(refresh = false) {
    if (refresh) {
      this.setData({
        pageNum: 1,
        hasMore: true,
        orderList: []
      })
    }

    if (!this.data.hasMore) return

    try {
      this.setData({ loading: true })

      const { pageNum, pageSize, activeTab } = this.data
      const params = {
        pageNum,
        pageSize,
        status: activeTab === 'all' ? '' : activeTab
      }

      const res = await app.request({
        url: '/orders',
        data: params
      })

      const { list = [], total = 0 } = res.data || {}
      const hasMore = pageNum * pageSize < total

      this.setData({
        orderList: refresh ? list : this.data.orderList.concat(list),
        hasMore,
        pageNum: hasMore ? pageNum + 1 : pageNum,
        loading: false
      })

    } catch (error) {
      console.error('加载订单列表失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 查看订单详情
  viewOrderDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/orders/detail/detail?id=${id}`
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadOrders(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.loading && this.data.hasMore) {
      this.loadOrders()
    }
  }
}); 