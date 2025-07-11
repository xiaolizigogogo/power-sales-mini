// pages/manager/customers/list.js
const { roleManager } = require('../../../utils/role-manager');
const { showToast, showLoading, hideLoading } = require('../../../utils/common');
const { customerAPI } = require('../../../utils/api');

Page({
  data: {
    // 筛选条件
    activeTab: 'all', // all, potential, contacted, interested, signed, lost
    searchKeyword: '',
    showFilterModal: false,
    filterConditions: {
      status: '',
      industry: '',
      region: '',
      createTimeRange: '',
      lastContactRange: ''
    },
    
    // 客户状态选项
    statusOptions: [
      { value: 'all', label: '全部', count: 0 },
      { value: 'pending_orders', label: '待处理订单', count: 0 },
      { value: 'potential', label: '潜在客户', count: 0 },
      { value: 'contacted', label: '已联系', count: 0 },
      { value: 'interested', label: '有意向', count: 0 },
      { value: 'signed', label: '已签约', count: 0 },
      { value: 'lost', label: '已流失', count: 0 }
    ],
    
    // 客户列表数据
    customerList: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    pageSize: 20,
    
    // 排序方式
    sortBy: 'createTime', // createTime, lastContact, followUp
    sortOrder: 'desc', // desc, asc
    
    // 快速操作
    showQuickActions: false,
    selectedCustomerId: null,
    
    // 统计数据
    totalCount: 0,
    todayAddCount: 0,
    weekContactCount: 0,

    // 订单状态更新相关
    showOrderStatusModal: false,
    selectedOrder: null,
    selectedOrderStatus: '',
    orderStatusRemark: '',
    orderStatusOptions: [
      { value: 'pending', label: '待付款' },
      { value: 'confirmed', label: '已付款' },
      { value: 'negotiating', label: '商务洽谈' },
      { value: 'signed', label: '已完成' },
      { value: 'cancelled', label: '已取消' }
    ]
  },

  onLoad() {
    this.checkUserPermission();
    this.initData();
  },

  onShow() {
    this.checkUserPermission();
    
    // 先更新TabBar
    this.updateTabBar();
    
    // 加载数据
    Promise.all([
      this.loadCustomerList(),
      this.loadStatistics()
    ]).then(() => {
      // 数据加载完成后再次更新TabBar
      this.updateTabBar();
    }).catch(error => {
      console.error('加载数据失败:', error);
    });
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.refreshData().finally(() => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreCustomers();
    }
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
   * 更新自定义tabBar
   */
  updateTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabbar = this.getTabBar();
      const userType = roleManager.getCurrentUserType();
      
      if (userType === 'manager') {
        // 调用自定义tabBar组件的updateTabBar方法
        if (typeof tabbar.updateTabBar === 'function') {
          tabbar.updateTabBar();
        }
        
        // 设置当前选中的tab（我的客户是第2个，索引为1）
        if (typeof tabbar.setActiveTab === 'function') {
          tabbar.setActiveTab(1);
        } else {
          tabbar.setData({
            active: 1
          });
        }
      }
    }
  },

  /**
   * 初始化数据
   */
  initData() {
    // 初始化页面数据
  },

  /**
   * 刷新数据
   */
  async refreshData() {
    this.setData({
      page: 1,
      customerList: [],
      hasMore: true
    });
    await Promise.all([
      this.loadCustomerList(),
      this.loadStatistics()
    ]);
  },

  /**
   * 加载客户列表
   */
  async loadCustomerList() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    try {
      const params = {
        page: this.data.page,
        pageSize: this.data.pageSize,
        status: this.data.activeTab === 'all' ? '' : this.data.activeTab,
        keyword: this.data.searchKeyword,
        sortBy: this.data.sortBy,
        sortOrder: this.data.sortOrder,
        ...this.data.filterConditions
      };
      
      // 如果是待处理订单筛选，需要特殊处理
      if (this.data.activeTab === 'pending_orders') {
        params.status = ''; // 清空状态筛选
        params.hasPendingOrders = true; // 添加待处理订单标识
      }
      
      console.log('开始加载客户列表，参数:', params);
      const response = await customerAPI.getMyCustomers(params);
      console.log('客户列表API响应:', response);
      
      // 确保response.data包含所需字段，否则使用默认值
      const responseData = response.data || {};
      console.log('处理后的响应数据:', responseData);
      console.log('responseData.records:', responseData.records);
      console.log('responseData.list:', responseData.list);
      
      // API返回的数据结构：优先使用records，如果没有则使用list
      const list = Array.isArray(responseData.records) ? responseData.records : 
                   Array.isArray(responseData.list) ? responseData.list : [];
      const total = parseInt(responseData.total) || 0;
      const hasMore = list.length >= this.data.pageSize;
      const statusCounts = responseData.statusCounts || {};
      
      console.log('解析后的数据:', {
        listLength: list.length,
        total,
        hasMore,
        firstItem: list[0],
        lastItem: list[list.length - 1],
        statusCounts
      });
      
      // 合并列表数据
      const newList = this.data.page === 1 ? list : [...this.data.customerList, ...list];
      console.log('最终的客户列表:', newList);
      
      // 数据预处理：确保每个客户对象都有必要的字段
      const processedList = newList.map((customer, index) => {
        try {
          console.log(`处理第${index + 1}个客户数据:`, customer);
          
          const processed = {
            id: customer.id,
            name: customer.name || customer.contactPerson || '未知客户',
            company: customer.companyName || customer.company || '未知公司',
            avatar: customer.avatar || '',
            status: customer.status || 'potential',
            statusText: this.getStatusText(customer.status),
            industry: customer.industry || '未知行业',
            region: customer.region || customer.province || '未知地区',
            followUpCount: customer.followUpCount || customer.contactCount || 0,
            lastContactTime: customer.lastContactTime || customer.lastContactAt || '',
            createTime: this.formatDate(customer.createTime || customer.createdAt),
            lastContact: customer.lastContactTime || customer.lastContactAt ? this.formatDate(customer.lastContactTime || customer.lastContactAt) : '',
            nextFollowUp: customer.nextFollowUpTime ? this.formatDate(customer.nextFollowUpTime) : '',
            phone: customer.phone || customer.contactPhone || '',
            email: customer.email || '',
            address: customer.address || '',
            remark: customer.remark || '',
            customerManagerName: customer.customerManagerName || '',
            tags: customer.tags || [],
            potential: this.formatMoney(customer.potentialValue || 0),
            // 添加订单摘要信息 - 暂时使用模拟数据
            orderSummary: this.processOrderSummary(customer.orderSummary || customer.orders || this.generateMockOrderSummary(customer.id))
          };
          
          console.log(`处理完成第${index + 1}个客户数据:`, processed);
          return processed;
        } catch (error) {
          console.error(`处理第${index + 1}个客户数据时出错:`, error, customer);
          // 返回基本的客户数据
          return {
            id: customer.id,
            name: customer.name || '未知客户',
            company: customer.companyName || '未知公司',
            status: 'potential',
            statusText: '潜在客户',
            phone: customer.phone || '',
            createTime: '',
            industry: '未知行业',
            region: '未知地区',
            followUpCount: 0,
            tags: [],
            potential: '0.00',
            orderSummary: null
          };
        }
      });
      
      console.log('处理后的客户列表:', processedList);
      
      // 如果是待处理订单筛选，需要过滤出有待处理订单的客户
      let filteredList = processedList;
      if (this.data.activeTab === 'pending_orders') {
        filteredList = processedList.filter(customer => {
          return customer.orderSummary && 
                 customer.orderSummary.latestOrder && 
                 (customer.orderSummary.latestOrder.status === 'pending' || 
                  customer.orderSummary.latestOrder.status === 'negotiating');
        });
        console.log('待处理订单筛选后的客户列表:', filteredList);
      }
      
      // 更新页面数据
      console.log('开始更新页面数据...');
      this.setData({
        customerList: filteredList, // 使用过滤后的列表
        totalCount: total,
        hasMore: hasMore,
        loading: false
      }, () => {
        console.log('页面数据更新完成，当前customerList长度:', this.data.customerList.length);
        console.log('页面数据更新完成，当前customerList:', this.data.customerList);
      });
      
      // 更新状态统计
      if (statusCounts && Object.keys(statusCounts).length > 0) {
        this.updateStatusCounts(statusCounts);
      }
      
    } catch (error) {
      console.error('加载客户列表失败:', error);
      this.setData({ loading: false });
      if (error.message !== '未登录') {
        showToast('加载失败，请重试', 'error');
      }
    }
  },

  /**
   * 加载更多客户
   */
  async loadMoreCustomers() {
    this.setData({
      page: this.data.page + 1
    });
    await this.loadCustomerList();
  },

  /**
   * 加载统计数据
   */
  async loadStatistics() {
    try {
      console.log('开始加载统计数据');
      const response = await customerAPI.getMyCustomerStatistics();
      console.log('统计数据API响应:', response);
      
      const data = response.data || {};
      console.log('处理后的统计数据:', data);
      
      // 更新统计数据
      this.setData({
        todayAddCount: parseInt(data.todayAddCount) || 0,
        weekContactCount: parseInt(data.weekContactCount) || 0
      });
      
      // 更新状态统计
      if (data.statusCounts && Object.keys(data.statusCounts).length > 0) {
        this.updateStatusCounts(data.statusCounts);
      }
      
    } catch (error) {
      console.error('加载统计数据失败:', error);
      if (error.message !== '未登录') {
        showToast('加载统计数据失败', 'error');
      }
    }
  },

  /**
   * 更新状态统计数据
   */
  updateStatusCounts(statusCounts) {
    console.log('更新状态统计数据:', statusCounts);
    
    // 计算待处理订单数量
    const pendingOrdersCount = this.data.customerList.filter(customer => {
      return customer.orderSummary && 
             customer.orderSummary.latestOrder && 
             (customer.orderSummary.latestOrder.status === 'pending' || 
              customer.orderSummary.latestOrder.status === 'negotiating');
    }).length;
    
    // 更新状态选项的数量
    const statusOptions = this.data.statusOptions.map(option => ({
      ...option,
      count: option.value === 'all' 
        ? Object.values(statusCounts).reduce((sum, count) => sum + (parseInt(count) || 0), 0)
        : option.value === 'pending_orders'
        ? pendingOrdersCount
        : parseInt(statusCounts[option.value]) || 0
    }));
    
    console.log('更新后的状态选项:', statusOptions);
    this.setData({ statusOptions });
  },

  /**
   * 切换状态标签
   */
  onTabChange(e) {
    const { tab } = e.currentTarget.dataset;
    if (tab === this.data.activeTab) return;
    
    this.setData({
      activeTab: tab,
      page: 1,
      customerList: [],
      hasMore: true
    });
    this.loadCustomerList();
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({ searchKeyword: keyword });
    
    // 防抖搜索
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.setData({
        page: 1,
        customerList: [],
        hasMore: true
      });
      this.loadCustomerList();
    }, 500);
  },

  /**
   * 清空搜索
   */
  onClearSearch() {
    this.setData({
      searchKeyword: '',
      page: 1,
      customerList: [],
      hasMore: true
    });
    this.loadCustomerList();
  },

  /**
   * 显示筛选面板
   */
  onShowFilter() {
    this.setData({ showFilterModal: true });
  },

  /**
   * 隐藏筛选面板
   */
  onHideFilter() {
    this.setData({ showFilterModal: false });
  },

  /**
   * 应用筛选条件
   */
  onApplyFilter(e) {
    const { filters } = e.detail;
    this.setData({
      filterConditions: filters,
      showFilterModal: false,
      page: 1,
      customerList: [],
      hasMore: true
    });
    this.loadCustomerList();
  },

  /**
   * 清空筛选条件
   */
  onClearFilter() {
    this.setData({
      filterConditions: {
        status: '',
        industry: '',
        region: '',
        createTimeRange: '',
        lastContactRange: ''
      },
      showFilterModal: false,
      page: 1,
      customerList: [],
      hasMore: true
    });
    this.loadCustomerList();
  },

  /**
   * 改变排序方式
   */
  onSortChange(e) {
    const { sort } = e.currentTarget.dataset;
    let sortOrder = 'desc';
    
    if (sort === this.data.sortBy) {
      sortOrder = this.data.sortOrder === 'desc' ? 'asc' : 'desc';
    }
    
    this.setData({
      sortBy: sort,
      sortOrder,
      page: 1,
      customerList: [],
      hasMore: true
    });
    this.loadCustomerList();
  },

  /**
   * 客户项点击
   */
  onCustomerTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/manager/customers/detail?id=${id}`
    });
  },

  /**
   * 查看客户详情
   */
  onViewDetail(e) {
    // 阻止事件冒泡
    if (e && e.detail && typeof e.detail.x !== 'undefined') {
      return;
    }
    
    const customerId = e.currentTarget.dataset.id;
    if (!customerId) {
      showToast('客户ID不能为空', 'error');
      return;
    }
    
    // 跳转到客户详情页面
    wx.navigateTo({
      url: `/pages/manager/customers/detail?id=${customerId}`
    });
  },

  /**
   * 查看客户订单
   */
  onViewOrders(e) {
    // 阻止事件冒泡
    if (e && e.detail && typeof e.detail.x !== 'undefined') {
      return;
    }
    
    const customerId = e.currentTarget.dataset.id;
    if (!customerId) {
      showToast('客户ID不能为空', 'error');
      return;
    }
    
    // 跳转到订单列表页面
    wx.navigateTo({
      url: `/pages/orders/index/index?customerId=${customerId}`
    });
  },

  /**
   * 快速联系客户
   */
  onQuickContact(e) {
    // 阻止事件冒泡
    if (e && e.detail && typeof e.detail.x !== 'undefined') {
      return;
    }
    
    const { id: customerId, phone } = e.currentTarget.dataset;
    if (!customerId) {
      showToast('客户ID不能为空', 'error');
      return;
    }

    // 显示联系方式选择
    wx.showActionSheet({
      itemList: ['拨打电话', '发送短信', '复制手机号'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.makePhoneCall(phone);
            break;
          case 1:
            this.sendSMS(phone);
            break;
          case 2:
            wx.setClipboardData({
              data: phone,
              success: () => {
                showToast('手机号已复制', 'success');
              }
            });
            break;
        }
      }
    });
  },

  /**
   * 拨打电话
   */
  makePhoneCall(phone) {
    wx.makePhoneCall({
      phoneNumber: phone,
      success: () => {
        // 记录通话记录
        this.recordContact('phone', phone);
      },
      fail: (err) => {
        console.error('拨打电话失败:', err);
        showToast('拨打电话失败', 'error');
      }
    });
  },

  /**
   * 发送短信
   */
  sendSMS(phone) {
    // 调用系统短信功能
    showToast('即将跳转到短信应用', 'none');
    // 这里可以实现跳转到短信应用的逻辑
  },

  /**
   * 微信联系
   */
  contactWeChat(customerId) {
    // 实现微信联系逻辑
    showToast('微信联系功能开发中', 'none');
  },

  /**
   * 添加跟进记录
   */
  addFollowRecord(customerId) {
    wx.navigateTo({
      url: `/pages/manager/follow/add?customerId=${customerId}`
    });
  },

  /**
   * 记录联系记录
   */
  async recordContact(type, contact) {
    try {
      // TODO: 调用API记录联系记录
      console.log('记录联系记录:', { type, contact });
    } catch (error) {
      console.error('记录联系记录失败:', error);
    }
  },

  /**
   * 添加客户
   */
  onAddCustomer() {
    wx.navigateTo({
      url: '/pages/manager/customers/add'
    });
  },

  /**
   * 批量操作
   */
  onBatchOperation() {
    showToast('批量操作功能开发中', 'none');
  },

  /**
   * 导出客户列表
   */
  onExportCustomers() {
    showToast('导出功能开发中', 'none');
  },

  /**
   * 显示订单状态更新弹窗
   */
  showOrderStatusModal(order, customerName) {
    this.setData({
      showOrderStatusModal: true,
      selectedOrder: {
        ...order,
        customerName: customerName
      },
      selectedOrderStatus: order.status,
      orderStatusRemark: ''
    });
  },

  /**
   * 隐藏订单状态更新弹窗
   */
  onHideOrderStatusModal() {
    this.setData({
      showOrderStatusModal: false,
      selectedOrder: null,
      selectedOrderStatus: '',
      orderStatusRemark: ''
    });
  },

  /**
   * 选择订单状态
   */
  onSelectOrderStatus(e) {
    const { status } = e.currentTarget.dataset;
    this.setData({
      selectedOrderStatus: status
    });
  },

  /**
   * 输入订单状态备注
   */
  onOrderStatusRemarkInput(e) {
    this.setData({
      orderStatusRemark: e.detail.value
    });
  },

  /**
   * 确认更新订单状态
   */
  async onConfirmUpdateOrderStatus() {
    if (!this.data.selectedOrderStatus) {
      showToast('请选择订单状态', 'error');
      return;
    }

    try {
      showLoading('更新中...');
      
      // 这里调用API更新订单状态
      const result = await this.updateOrderStatus(
        this.data.selectedOrder.id,
        this.data.selectedOrderStatus,
        this.data.orderStatusRemark
      );

      hideLoading();
      showToast('订单状态更新成功', 'success');
      
      // 关闭弹窗
      this.onHideOrderStatusModal();
      
      // 刷新客户列表
      this.refreshData();
      
    } catch (error) {
      hideLoading();
      console.error('更新订单状态失败:', error);
      showToast('更新失败，请重试', 'error');
    }
  },

  /**
   * 更新订单状态API调用
   */
  async updateOrderStatus(orderId, status, remark) {
    // 这里应该调用真实的API
    // 暂时返回模拟数据
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  },

  // 模拟数据方法
  mockCustomerList(params) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = this.generateMockCustomers(params);
        resolve({
          data: {
            list: mockData.list,
            total: mockData.total,
            hasMore: params.page * params.pageSize < mockData.total,
            statusCounts: {
              all: 125,
              potential: 45,
              contacted: 32,
              interested: 28,
              signed: 15,
              lost: 5
            }
          }
        });
      }, 800);
    });
  },

  generateMockCustomers(params) {
    const customers = [];
    const startIndex = (params.page - 1) * params.pageSize;
    
    for (let i = 0; i < params.pageSize; i++) {
      const id = startIndex + i + 1;
      customers.push({
        id,
        name: `客户${id}`,
        company: `企业${id}有限公司`,
        phone: `138${String(1000 + id).padStart(4, '0')}${String(1234 + id).padStart(4, '0')}`,
        industry: ['制造业', '服务业', '零售业', '科技业'][id % 4],
        region: ['北京', '上海', '广州', '深圳'][id % 4],
        status: ['potential', 'contacted', 'interested', 'signed', 'lost'][id % 5],
        statusText: ['潜在客户', '已联系', '有意向', '已签约', '已流失'][id % 5],
        createTime: `2024-0${(id % 9) + 1}-${String((id % 28) + 1).padStart(2, '0')}`,
        lastContact: `2024-0${(id % 9) + 1}-${String((id % 28) + 1).padStart(2, '0')}`,
        followUpCount: id % 10,
        nextFollowUp: id % 3 === 0 ? `2024-0${(id % 9) + 1}-${String(((id % 28) + 1) + 1).padStart(2, '0')}` : '',
        tags: ['重点客户', '大客户', '老客户'].slice(0, id % 3 + 1),
        avatar: '/assets/images/default-avatar.png',
        potential: Math.floor(Math.random() * 100000) + 10000,
        orders: this.generateMockOrderSummary(id) // 添加订单数据
      });
    }
    
    return {
      list: customers,
      total: 125
    };
  },

  generateMockOrderSummary(customerId) {
    // 为了测试，暂时让所有客户都有订单数据
    // if (Math.random() < 0.5) {
    //   return null;
    // }
    
    const orders = [];
    const orderCount = Math.floor(Math.random() * 3) + 1; // 随机生成1-3个订单
    const statusOptions = ['待付款', '已付款', '商务洽谈', '已完成', '已取消'];
    
    for (let i = 0; i < orderCount; i++) {
      const orderId = `ORD${String(customerId).padStart(4, '0')}${String(100 + i).padStart(3, '0')}`;
      const orderDate = `2024-0${(Math.floor(Math.random() * 9) + 1)}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
      const orderAmount = Math.floor(Math.random() * 100000) + 10000; // 随机生成10000-110000
      const orderStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      orders.push({
        id: orderId,
        date: orderDate,
        amount: orderAmount,
        total: orderAmount,
        status: orderStatus,
        statusText: orderStatus,
        productName: `产品${i + 1}`,
        quantity: Math.floor(Math.random() * 10) + 1,
        unitPrice: Math.floor(orderAmount / (Math.floor(Math.random() * 10) + 10))
      });
    }
    return orders;
  },

  mockStatistics() {
    return Promise.resolve({
      data: {
        todayAddCount: 3,
        weekContactCount: 25
      }
    });
  },

  /**
   * 获取状态文本
   */
  getStatusText(status) {
    const statusMap = {
      potential: '潜在客户',
      contacted: '已联系',
      interested: '有意向',
      signed: '已签约',
      lost: '已流失'
    };
    return statusMap[status] || '未知状态';
  },

  /**
   * 格式化日期
   */
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  /**
   * 格式化金额
   */
  formatMoney(amount) {
    return Number(amount || 0).toFixed(2);
  },

  /**
   * 处理订单摘要信息
   */
  processOrderSummary(orders) {
    console.log('处理订单摘要信息，输入数据:', orders);
    
    if (!orders || orders.length === 0) {
      console.log('没有订单数据，返回null');
      return null;
    }

    const totalOrders = orders.length;
    const latestOrder = orders[orders.length - 1];
    
    const result = {
      totalOrders: totalOrders,
      latestOrder: latestOrder ? {
        id: latestOrder.id,
        date: this.formatDate(latestOrder.date),
        amount: this.formatMoney(latestOrder.amount || latestOrder.total),
        status: this.getOrderStatusKey(latestOrder.status),
        statusText: latestOrder.statusText || latestOrder.status
      } : null
    };
    
    console.log('处理后的订单摘要:', result);
    return result;
  },

  /**
   * 获取订单状态键值
   */
  getOrderStatusKey(statusText) {
    const statusMap = {
      '待付款': 'pending',
      '已付款': 'confirmed', 
      '商务洽谈': 'negotiating',
      '已完成': 'signed',
      '已取消': 'cancelled'
    };
    return statusMap[statusText] || 'pending';
  }
});