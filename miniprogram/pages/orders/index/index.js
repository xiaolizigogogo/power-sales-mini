const app = getApp();
const { formatDate, formatMoney } = require('../../../utils/common');
const { orderAPI } = require('../../../utils/api');
const { customerAPI } = require('../../../utils/api'); // Added customerAPI

Page({
  data: {
    // 页面状态
    loading: true,
    refreshing: false,
    loadingMore: false,
    hasMore: true,
    isEmpty: false,
    
    // 客户信息
    customerId: null,
    customerName: '',
    
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
    
    // 筛选弹窗
    showFilter: false,
    filterData: {
      status: '',
      amountRange: '',
      dateRange: ''
    },
    
    // 筛选选项
    statusOptions: [
      { text: '全部', value: '' },
      { text: '待确认', value: 'pending' },
      { text: '已确认', value: 'confirmed' },
      { text: '待签约', value: 'contract' },
      { text: '服务中', value: 'active' },
      { text: '已完成', value: 'completed' },
      { text: '已取消', value: 'cancelled' }
    ],
    
    amountRangeOptions: [
      { text: '不限', value: '' },
      { text: '5万以下', value: '0-50000' },
      { text: '5-10万', value: '50000-100000' },
      { text: '10-20万', value: '100000-200000' },
      { text: '20万以上', value: '200000-999999' }
    ],
    
    // 操作菜单
    showActionSheet: false,
    actionSheetActions: [],
    selectedOrder: null,
    
    // 状态映射
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
    },

    // 状态说明
    statusDescMap: {
      'pending': '订单待处理，等待客户经理确认',
      'negotiating': '正在进行商务洽谈，请等待',
      'confirmed': '订单已确认，等待支付',
      'paid': '订单已支付，等待开通服务',
      'service': '服务已开通，正常使用中',
      'completed': '服务已完成',
      'cancelled': '订单已取消',
      'rejected': '订单已被拒绝',
      'contract': '等待签署合同',
      'active': '服务正常使用中'
    }
  },

  onLoad(options) {
    console.log('🚀 onLoad 方法被调用，参数:', options);
    
    // 检查登录状态
    if (!this.checkLoginStatus()) {
      console.log('❌ onLoad: 登录状态检查失败');
      return;
    }
    
    console.log('✅ onLoad: 登录状态检查通过');
    
    // 保存客户ID和客户名
    if (options.customerId) {
      this.setData({ 
        customerId: options.customerId,
        customerName: options.customerName || ''
      });
      // 如果有客户名，直接设置标题
      if (options.customerName) {
        wx.setNavigationBarTitle({
          title: `${options.customerName}的订单`
        });
      } else {
        // 获取客户信息
        this.loadCustomerInfo(options.customerId);
      }
    }
    
    // 从参数获取状态筛选
    if (options.status) {
      const tabIndex = this.data.tabList.findIndex(tab => tab.key === options.status);
      if (tabIndex !== -1) {
        console.log('📋 从参数设置活动标签:', options.status, '索引:', tabIndex);
        this.setData({ activeTab: tabIndex });
      }
    }
    
    console.log('🔧 开始初始化页面...');
    this.initPage();
  },

  onShow() {
    // 调试：打印 userInfo 和 token
    console.log('订单页 onShow userInfo:', wx.getStorageSync('userInfo'));
    console.log('订单页 onShow token:', wx.getStorageSync('token'));
    // 登录校验：userInfo 必须存在且有 id
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.id) {
      wx.reLaunch({ url: '/pages/auth/login/login' });
      return;
    }
    // tabBar页面：优先从Storage读取筛选参数
    const filter = wx.getStorageSync('orderListFilter');
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
      wx.removeStorageSync('orderListFilter');
    }
    // 检查登录状态
    if (!this.checkLoginStatus()) {
      console.log('❌ 登录状态检查失败，跳转登录页');
      return;
    }
    console.log('✅ 登录状态检查通过，开始刷新订单列表');
    // 每次显示时刷新订单列表
    this.refreshOrderList();
  },

  onPullDownRefresh() {
    this.refreshOrderList().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMoreOrders();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
      return false;
    }
    return true;
  },

  // 初始化页面
  async initPage() {
    console.log('🚀 开始初始化订单列表页面');
    console.log('🔧 环境信息:', {
      开发模式: this.isDevelopmentMode(),
      当前token: wx.getStorageSync('token') ? '已设置' : '未设置',
      用户信息: wx.getStorageSync('userInfo') ? '已设置' : '未设置'
    });

    // 独立调用两个接口，避免一个失败影响另一个
    try {
      console.log('📋 开始加载订单列表...');
      await this.loadOrderList();
      console.log('✅ 订单列表加载完成');
    } catch (error) {
      console.error('❌ 订单列表加载失败:', error);
    }

    try {
      console.log('📊 开始加载订单统计...');
      await this.loadOrderStats();
      console.log('✅ 订单统计加载完成');
    } catch (error) {
      console.error('❌ 加载订单统计失败:', error);
      
      // 设置默认统计值
      const defaultTabList = this.data.tabList.map(tab => ({
        ...tab,
        count: 0
      }));
      
      this.setData({ tabList: defaultTabList });
    }

    console.log('✅ 页面初始化完成');
  },

  // 加载客户信息
  async loadCustomerInfo(customerId) {
    try {
      const response = await customerAPI.getCustomerInfo(customerId);
      if (response && response.data) {
        this.setData({
          customerName: response.data.name || '未知客户'
        });
        
        // 更新导航栏标题
        wx.setNavigationBarTitle({
          title: `${this.data.customerName}的订单`
        });
      }
    } catch (error) {
      console.error('获取客户信息失败:', error);
    }
  },

  // 加载订单列表
  async loadOrderList(refresh = false) {
    console.log('🔍 loadOrderList 方法被调用，参数:', { refresh });
    console.log('📊 当前页面状态:', {
      loading: this.data.loading,
      loadingMore: this.data.loadingMore,
      page: this.data.page,
      orderListLength: this.data.orderList.length,
      customerId: this.data.customerId
    });

    if (refresh) {
      console.log('🔄 刷新模式：重置页面状态');
      this.setData({ 
        page: 1,
        orderList: [],
        hasMore: true,
        loading: false,
        loadingMore: false
      });
    }

    try {
      // 查询参数
      const params = {
        page: this.data.page,
        pageSize: this.data.pageSize,
        status: this.data.tabList[this.data.activeTab].key === 'all' ? '' : this.data.tabList[this.data.activeTab].key,
        keyword: this.data.searchKeyword,
        ...this.data.filterData
      };
      // 如果有customerId，带上
      if (this.data.customerId) {
        params.customerId = this.data.customerId;
      }

      // 订单接口调用时传递params
      const response = await orderAPI.getOrderList(params);
      const { list = [], total = 0 } = response.data || {};
      
      // 格式化订单数据
      const formattedList = list.map(order => this.formatOrderData(order));
      
      this.setData({
        orderList: refresh ? formattedList : [...this.data.orderList, ...formattedList],
        total,
        hasMore: formattedList.length === this.data.pageSize,
        isEmpty: refresh && formattedList.length === 0,
        loading: false,
        loadingMore: false
      });

      console.log('✅ 订单列表加载完成:', {
        总数: total,
        当前页数据: formattedList.length,
        是否还有更多: this.data.hasMore
      });

      // 加载完成后更新状态统计
      this.loadOrderStats();
    } catch (error) {
      console.error('❌ 加载订单列表失败:', error);
      this.setData({
        loading: false,
        loadingMore: false,
        hasMore: false
      });
    }
  },

  // 判断是否为开发模式
  isDevelopmentMode() {
    // 禁用开发模式，使用真实数据
    return false;
  },

  // 获取模拟订单数据
  getMockOrderData() {
    return [
      {
        id: 1,
        orderNumber: 'PO202501001',
        productName: '智能节电设备',
        productDesc: '工业级智能节电控制器',
        amount: 156000,
        status: 'pending',
        capacity: '500KW',
        servicePeriod: '3年',
        createTime: '2025-01-15 10:30:00',
        assignedEmployee: {
          name: '张工程师',
          phone: '13800138001',
          avatar: '/assets/images/default-avatar.png'
        }
      },
      {
        id: 2,
        orderNumber: 'PO202501002', 
        productName: '节能监控系统',
        productDesc: '智能用电监控分析系统',
        amount: 89000,
        status: 'confirmed',
        capacity: '1000KW',
        servicePeriod: '5年',
        createTime: '2025-01-14 14:20:00',
        assignedEmployee: {
          name: '李经理',
          phone: '13800138002',
          avatar: '/assets/images/default-avatar.png'
        }
      },
      {
        id: 3,
        orderNumber: 'PO202501003',
        productName: '电力优化方案',
        productDesc: '企业电力系统整体优化',
        amount: 230000,
        status: 'active',
        capacity: '2000KW',
        servicePeriod: '10年',
        createTime: '2025-01-13 09:15:00',
        assignedEmployee: {
          name: '王技师',
          phone: '13800138003',
          avatar: '/assets/images/default-avatar.png'
        }
      },
      {
        id: 4,
        orderNumber: 'PO202501004',
        productName: '节电改造服务',
        productDesc: '厂房照明系统节电改造',
        amount: 45000,
        status: 'completed',
        capacity: '200KW',
        servicePeriod: '2年',
        createTime: '2025-01-12 16:45:00'
      },
      {
        id: 5,
        orderNumber: 'PO202501005',
        productName: '能耗分析报告',
        productDesc: '详细的能耗分析与优化建议',
        amount: 8000,
        status: 'cancelled',
        capacity: '100KW',
        servicePeriod: '1年',
        createTime: '2025-01-11 11:30:00'
      }
    ];
  },

  // 加载订单统计
  async loadOrderStats() {
    try {
      const response = await orderAPI.getOrderStats();
      const stats = response.data || {};
      
      // 更新tab计数
      const updatedTabList = this.data.tabList.map(tab => ({
        ...tab,
        count: stats[`${tab.key}Count`] || 0
      }));
      
      this.setData({ tabList: updatedTabList });
    } catch (error) {
      console.error('加载订单统计失败:', error);
    }
  },

  // 获取模拟统计数据
  getMockStatsData() {
    return {
      all: 5,
      pending: 1,
      confirmed: 1,
      contract: 0,
      active: 1,
      completed: 1,
      cancelled: 1
    };
  },

  // 格式化订单数据
  formatOrderData(order) {
    if (!order) return null;

    // 格式化日期
    const createTime = order.createTime || order.createdAt;
    const formattedCreateTime = createTime ? formatDate(new Date(createTime), 'YYYY-MM-DD HH:mm') : '';

    // 处理金额显示
    const amount = order.amount || 0;
    const formattedAmount = formatMoney(amount);

    // 获取状态信息
    const status = order.status || 'pending';
    const statusInfo = this.data.statusMap[status] || { text: '待处理', color: '#fa8c16' };

    return {
      ...order,
      createTime: formattedCreateTime,
      amount: formattedAmount,
      status: status,
      statusText: statusInfo.text,
      statusColor: statusInfo.color,
      
      // 订单操作权限
      canCancel: ['pending', 'confirmed'].includes(status),
      canPay: status === 'confirmed' && !order.isPaid,
      canViewContract: ['service', 'completed'].includes(status),
      canConfirm: status === 'paid',
      
      // 显示进度
      showProgress: !['cancelled', 'rejected'].includes(status),
      progressSteps: this.getProgressStep(status),
      progressPercent: this.getProgressPercent(status),
      currentStep: this.getProgressStep(status).findIndex(step => step === statusInfo.text)
    };
  },

  // 计算服务期限
  calculateServicePeriod(startDate, endDate) {
    if (!startDate || !endDate) return '1年';
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffYears = Math.round(diffDays / 365);
      
      if (diffYears >= 1) {
        return `${diffYears}年`;
      } else {
        const diffMonths = Math.round(diffDays / 30);
        return `${diffMonths}个月`;
      }
    } catch (error) {
      console.warn('计算服务期限失败:', error);
      return '1年';
    }
  },

  // 获取进度步骤
  getProgressStep(status) {
    const stepMap = {
      'pending': 0,
      'confirmed': 1,
      'contract': 2,
      'active': 3,
      'completed': 4
    };
    return stepMap[status] || 0;
  },

  // 获取进度百分比
  getProgressPercent(status) {
    const progressMap = {
      'pending': 20,
      'confirmed': 40,
      'contract': 60,
      'active': 80,
      'completed': 100
    };
    return progressMap[status] || 0;
  },

  // 刷新订单列表
  async refreshOrderList() {
    console.log('🔄 refreshOrderList 被调用');
    await this.loadOrderList(true);
  },

  // 加载更多订单
  async loadMoreOrders() {
    await this.loadOrderList(false);
  },

  // 标签切换
  onTabChange(e) {
    const index = e.currentTarget.dataset.index;
    if (index === this.data.activeTab) return;
    
    this.setData({ activeTab: index });
    this.refreshOrderList();
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  // 搜索确认
  onSearchConfirm() {
    this.refreshOrderList();
  },

  // 清除搜索
  onClearSearch() {
    this.setData({ searchKeyword: '' });
    this.refreshOrderList();
  },

  // 显示筛选弹窗
  showFilterPopup() {
    this.setData({ showFilter: true });
  },

  // 关闭筛选弹窗
  closeFilterPopup() {
    this.setData({ showFilter: false });
  },

  // 筛选状态改变
  onFilterStatusChange(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      'filterData.status': value
    });
  },

  // 筛选金额改变
  onFilterAmountChange(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      'filterData.amountRange': value
    });
  },

  // 重置筛选
  resetFilter() {
    this.setData({
      filterData: {
        status: '',
        amountRange: '',
        dateRange: ''
      }
    });
  },

  // 应用筛选
  applyFilter() {
    this.closeFilterPopup();
    this.refreshOrderList();
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  // 查看订单详情
  viewOrderDetail(e) {
    const order = e.currentTarget.dataset.order;
    wx.navigateTo({
      url: `/pages/orders/detail/detail?id=${order.id}`
    });
  },

  // 显示订单操作菜单
  showOrderActions(e) {
    const order = e.currentTarget.dataset.order;
    const actions = this.getOrderActions(order);
    
    this.setData({
      selectedOrder: order,
      actionSheetActions: actions,
      showActionSheet: true
    });
  },

  // 关闭操作菜单
  closeActionSheet() {
    this.setData({
      showActionSheet: false,
      selectedOrder: null,
      actionSheetActions: []
    });
  },

  // 获取订单操作
  getOrderActions(order) {
    const actions = [];
    
    if (order.canCancel) {
      actions.push({ action: 'cancel', text: '取消订单' });
    }
    if (order.canViewContract) {
      actions.push({ action: 'contract', text: '查看合同' });
    }
    if (order.canPay) {
      actions.push({ action: 'pay', text: '立即支付' });
    }
    if (order.canConfirm) {
      actions.push({ action: 'confirm', text: '确认收货' });
    }
    
    actions.push({ action: 'detail', text: '查看详情' });
    
    return actions;
  },

  // 操作选择
  onActionSelect(e) {
    const action = e.currentTarget.dataset.action;
    const order = this.data.selectedOrder;
    
    this.closeActionSheet();
    
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
      case 'confirm':
        this.confirmOrder(order);
        break;
      case 'detail':
        this.viewOrderDetail({ currentTarget: { dataset: { order } } });
        break;
    }
  },

  // 取消订单
  async cancelOrder(order) {
    try {
      const result = await this.showCancelDialog();
      if (result.confirm) {
        await orderAPI.cancelOrder(order.id, result.reason);
        wx.showToast({
          title: '订单已取消',
          icon: 'success'
        });
        this.refreshOrderList();
      }
    } catch (error) {
      console.error('取消订单失败:', error);
      wx.showToast({
        title: error.message || '取消失败',
        icon: 'none'
      });
    }
  },

  // 显示取消对话框
  showCancelDialog() {
    return new Promise((resolve) => {
      wx.showModal({
        title: '取消订单',
        content: '确定要取消这个订单吗？',
        success: (res) => {
          resolve({
            confirm: res.confirm,
            reason: res.confirm ? '用户主动取消' : null
          });
        }
      });
    });
  },

  // 确认收货
  async confirmOrder(order) {
    try {
      const result = await this.showConfirmDialog();
      if (result.confirm) {
        await orderAPI.confirmOrder(order.id);
        wx.showToast({
          title: '确认收货成功',
          icon: 'success'
        });
        this.refreshOrderList();
      }
    } catch (error) {
      console.error('确认收货失败:', error);
      wx.showToast({
        title: error.message || '确认失败',
        icon: 'none'
      });
    }
  },

  // 显示确认对话框
  showConfirmDialog() {
    return new Promise((resolve) => {
      wx.showModal({
        title: '确认收货',
        content: '确定已收到服务并满意吗？',
        success: (res) => {
          resolve({ confirm: res.confirm });
        }
      });
    });
  },

  // 支付订单
  payOrder(order) {
    wx.navigateTo({
      url: `/pages/payment/index?orderId=${order.id}&amount=${order.amount}`
    });
  },

  // 查看合同
  viewContract(order) {
    wx.navigateTo({
      url: `/pages/contract/detail?orderId=${order.id}`
    });
  },

  // 联系服务
  onCallService(e) {
    const phone = e.currentTarget.dataset.phone;
    if (phone) {
      wx.makePhoneCall({
        phoneNumber: phone
      });
    }
  },

  // 去购物
  onGoShopping() {
    wx.switchTab({
      url: '/pages/products/index/index'
    });
  },

  // 图片加载错误处理
  onImageError(e) {
    console.warn('产品图片加载失败:', e);
    // 可以在这里设置默认图片或者隐藏图片
  },

  // 头像加载错误处理
  onAvatarError(e) {
    console.warn('头像加载失败:', e);
    // 可以在这里设置默认头像或者隐藏头像
  }
}); 