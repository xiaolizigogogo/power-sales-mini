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
      'pending': { text: '待确认', color: '#fa8c16' },
      'confirmed': { text: '已确认', color: '#52c41a' },
      'contract': { text: '待签约', color: '#1890ff' },
      'active': { text: '服务中', color: '#1890ff' },
      'completed': { text: '已完成', color: '#52c41a' },
      'cancelled': { text: '已取消', color: '#ff4d4f' }
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
    console.log('👁️ onShow 方法被调用');
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
    const app = getApp();
    const token = wx.getStorageSync('token');
    
    if (!app.globalData.isLoggedIn || !token) {
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

  // 加载订单列表
  async loadOrderList(refresh = false) {
    console.log('🔍 loadOrderList 方法被调用，参数:', { refresh });
    console.log('📊 当前页面状态:', {
      loading: this.data.loading,
      loadingMore: this.data.loadingMore,
      page: this.data.page,
      orderListLength: this.data.orderList.length
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

    // 修正逻辑：先确定页面信息，再检查和设置状态
    const isFirstPage = this.data.page === 1;
    console.log('📄 页面信息:', { isFirstPage, currentPage: this.data.page });

    // 检查是否正在加载（排除刷新情况）
    if (!refresh && (this.data.loading || this.data.loadingMore)) {
      console.log('⏸️ 方法提前返回：loading=' + this.data.loading + ', loadingMore=' + this.data.loadingMore);
      return;
    }

    console.log('⏳ 设置加载状态...');
    this.setData({
      loading: isFirstPage,
      loadingMore: !isFirstPage
    });

    try {
      const params = {
        page: this.data.page - 1,
        size: this.data.pageSize,
        status: this.data.tabList[this.data.activeTab].key === 'all' ? '' : this.data.tabList[this.data.activeTab].key,
        keyword: this.data.searchKeyword
      };

      // 添加筛选参数
      if (this.data.filterData.status) {
        params.status = this.data.filterData.status;
      }
      if (this.data.filterData.amountRange) {
        const [minAmount, maxAmount] = this.data.filterData.amountRange.split('-');
        params.minAmount = minAmount;
        params.maxAmount = maxAmount;
      }

      console.log('📋 请求订单列表参数:', params);
      console.log('🔑 当前token:', wx.getStorageSync('token') ? '已设置' : '未设置');

      console.log('🌐 开始调用API...');
      const response = await orderAPI.getMyOrders(params);
      console.log('✅ 订单列表响应:', response);

      if (response && response.code === 200) {
        let content = [];
        let totalElements = 0;

        // 处理后端返回的真实数据结构
        if (response.data && Array.isArray(response.data.records)) {
          content = response.data.records;
          totalElements = response.data.total || content.length;
          console.log('📦 数据结构：分页对象(records)，内容长度:', content.length, '总数:', totalElements);
        } else if (response.data && Array.isArray(response.data.content)) {
          content = response.data.content;
          totalElements = response.data.totalElements || content.length;
          console.log('📦 数据结构：分页对象(content)，内容长度:', content.length, '总数:', totalElements);
        } else if (response.data && Array.isArray(response.data)) {
          content = response.data;
          totalElements = response.data.length;
          console.log('📦 数据结构：直接数组，长度:', content.length);
        }

        // 格式化订单数据
        console.log('🔧 开始格式化订单数据...');
        const formattedOrders = content.map(order => this.formatOrderData(order));

        console.log('✨ 格式化后的订单列表:', formattedOrders);
        
        const newOrderList = refresh ? formattedOrders : [...this.data.orderList, ...formattedOrders];
        console.log('📝 更新页面数据:', {
          新订单列表长度: newOrderList.length,
          总数: totalElements,
          是否还有更多: content.length === this.data.pageSize,
          是否为空: isFirstPage && content.length === 0,
          下一页页码: this.data.page + 1
        });

        this.setData({
          orderList: newOrderList,
          total: totalElements,
          hasMore: content.length === this.data.pageSize,
          isEmpty: isFirstPage && content.length === 0,
          loading: false,
          loadingMore: false,
          page: this.data.page + 1
        });
        
        console.log('✅ 订单列表数据更新完成');
      } else {
        throw new Error(response?.message || '获取订单列表失败');
      }
    } catch (error) {
      console.error('❌ 加载订单列表失败:', error);
      console.error('❌ 错误详情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      this.setData({
        loading: false,
        loadingMore: false,
        isEmpty: this.data.orderList.length === 0
      });
      
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
        duration: 3000
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
      console.log('📊 开始加载我的订单统计数据');
      
      const response = await orderAPI.getMyOrderStats();
      console.log('✅ 我的订单统计响应:', response);

      if (response && response.code === 200 && response.data) {
        const stats = response.data;
        const updatedTabList = this.data.tabList.map(tab => ({
          ...tab,
          count: stats[tab.key] || 0
        }));
        
        console.log('📊 更新标签统计:', updatedTabList);
        this.setData({ tabList: updatedTabList });
      } else {
        throw new Error(response?.message || '获取统计数据失败');
      }
    } catch (error) {
      console.error('❌ 加载我的订单统计失败:', error);
      
      // 设置默认统计值
      const defaultTabList = this.data.tabList.map(tab => ({
        ...tab,
        count: 0
      }));
      
      this.setData({ tabList: defaultTabList });
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
    // 映射后端状态到前端状态
    const statusMapping = {
      'completed': 'completed',
      'activated': 'active', 
      'negotiating': 'confirmed',
      'pending': 'pending',
      'cancelled': 'cancelled'
    };

    const mappedStatus = statusMapping[order.status] || order.status;

    return {
      ...order,
      // 字段名映射
      orderNumber: order.orderNo || order.orderNumber,
      createTime: formatDate(order.createdAt || order.createTime),
      amount: formatMoney(order.amount || 0),
      status: mappedStatus,
      statusText: this.data.statusMap[mappedStatus]?.text || order.statusDesc || '未知状态',
      statusClass: mappedStatus || 'pending',
      
      // 员工信息重构
      assignedEmployee: order.employeeName ? {
        name: order.employeeName,
        phone: order.employeePhone,
        department: order.employeeDepartment,
        avatar: '/assets/images/default-avatar.png' // 默认头像
      } : order.assignedEmployee,
      
      // 设置操作权限
      canCancel: ['pending', 'confirmed'].includes(mappedStatus),
      canPay: mappedStatus === 'confirmed',
      canViewContract: ['contract', 'active', 'completed'].includes(mappedStatus),
      canConfirm: mappedStatus === 'active',
      
      // 设置进度信息
      showProgress: ['confirmed', 'contract', 'active', 'completed'].includes(mappedStatus),
      progressSteps: ['下单', '确认', '签约', '服务中', '完成'],
      currentStep: this.getProgressStep(mappedStatus),
      progressPercent: this.getProgressPercent(mappedStatus),
      
      // 产品信息处理
      productName: order.productName || '节电产品',
      productDesc: order.productDescription || order.productDesc || '高效节能设备',
      capacity: order.capacity || '待确定',
      servicePeriod: order.servicePeriod || this.calculateServicePeriod(order.serviceStartDate, order.serviceEndDate),
      
      // 其他字段保持不变或设置默认值
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      companyName: order.companyName,
      remark: order.remark
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