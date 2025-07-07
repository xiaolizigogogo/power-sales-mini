// pages/manager/customers/list.js
const roleManager = require('../../../utils/role-manager');
const { showToast, showLoading, hideLoading } = require('../../../utils/common');

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
    weekContactCount: 0
  },

  onLoad() {
    this.checkUserPermission();
    this.initData();
  },

  onShow() {
    this.checkUserPermission();
    this.loadCustomerList();
    this.loadStatistics();
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
      
      // TODO: 替换为实际的API调用
      const response = await this.mockCustomerList(params);
      
      const newList = this.data.page === 1 ? response.data.list : [...this.data.customerList, ...response.data.list];
      
      this.setData({
        customerList: newList,
        hasMore: response.data.hasMore,
        totalCount: response.data.total
      });
      
      this.updateStatusCounts(response.data.statusCounts);
      
    } catch (error) {
      console.error('加载客户列表失败:', error);
      showToast('加载客户列表失败', 'error');
    } finally {
      this.setData({ loading: false });
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
      // TODO: 替换为实际的API调用
      const response = await this.mockStatistics();
      this.setData({
        todayAddCount: response.data.todayAddCount,
        weekContactCount: response.data.weekContactCount
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  /**
   * 更新状态统计
   */
  updateStatusCounts(statusCounts) {
    const statusOptions = this.data.statusOptions.map(option => ({
      ...option,
      count: statusCounts[option.value] || 0
    }));
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
   * 快速联系
   */
  onQuickContact(e) {
    e.stopPropagation();
    const { id, phone } = e.currentTarget.dataset;
    
    wx.showActionSheet({
      itemList: ['拨打电话', '发送短信', '微信联系'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.makePhoneCall(phone);
            break;
          case 1:
            this.sendSMS(phone);
            break;
          case 2:
            this.contactWeChat(id);
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
        potential: Math.floor(Math.random() * 100000) + 10000
      });
    }
    
    return {
      list: customers,
      total: 125
    };
  },

  mockStatistics() {
    return Promise.resolve({
      data: {
        todayAddCount: 3,
        weekContactCount: 25
      }
    });
  }
}); 