// pages/manager/customers/contracts.js
const { roleManager } = require('../../../utils/role-manager');
const { showToast, showLoading, hideLoading } = require('../../../utils/common');
const { customerAPI } = require('../../../utils/api');

Page({
  data: {
    customerId: null,
    customerName: '',
    
    // 筛选条件
    searchKeyword: '',
    statusFilter: 'all',
    statusOptions: [
      { value: 'all', label: '全部状态' },
      { value: 'pending', label: '待签署' },
      { value: 'signed', label: '已签署' },
      { value: 'completed', label: '已完成' },
      { value: 'expired', label: '已过期' },
      { value: 'cancelled', label: '已取消' }
    ],
    
    // 合同列表数据
    contractList: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    pageSize: 20,
    
    // 统计数据
    totalCount: 0,
    statusCounts: {}
  },

  onLoad(options) {
    this.checkUserPermission();
    
    if (options.customerId) {
      this.setData({
        customerId: options.customerId,
        customerName: options.customerName || '客户'
      });
      this.loadContractList();
    } else {
      showToast('客户ID不能为空', 'error');
      wx.navigateBack();
    }
  },

  onShow() {
    this.checkUserPermission();
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
      this.loadMoreContracts();
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
   * 刷新数据
   */
  async refreshData() {
    this.setData({
      page: 1,
      contractList: [],
      hasMore: true
    });
    await this.loadContractList();
  },

  /**
   * 加载合同列表
   */
  async loadContractList() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    try {
      // 获取当前登录人id
      const userInfo = wx.getStorageSync('userInfo');
      const managerId = userInfo && userInfo.id ? userInfo.id : (userInfo && userInfo.data && userInfo.data.id ? userInfo.data.id : null);
      const params = {
        page: this.data.page,
        pageSize: this.data.pageSize,
        status: this.data.statusFilter === 'all' ? '' : this.data.statusFilter,
        keyword: this.data.searchKeyword,
        managerId // 新增managerId参数
      };
      
      console.log('开始加载合同列表，参数:', params);
      const response = await customerAPI.getUserContracts(this.data.customerId, params);
      console.log('合同列表API响应:', response);
      
      const responseData = response.data || {};
      const list = Array.isArray(responseData.records) ? responseData.records : [];
      const total = parseInt(responseData.total) || 0;
      const hasMore = list.length >= this.data.pageSize;
      
      console.log('解析后的数据:', {
        listLength: list.length,
        total,
        hasMore,
        firstItem: list[0]
      });
      
      // 合并列表数据
      const newList = this.data.page === 1 ? list : [...this.data.contractList, ...list];
      
      // 数据预处理
      const processedList = newList.map((contract, index) => {
        return {
          id: contract.id,
          contractNo: contract.contractNo || '未知编号',
          orderNo: contract.orderNo || '未知订单',
          productName: contract.productName || '未知产品',
          amount: this.formatMoney(contract.amount || 0),
          status: contract.status || 'unknown',
          statusText: this.getStatusText(contract.status),
          statusClass: this.getStatusClass(contract.status),
          serviceAddress: contract.serviceAddress || '未知地址',
          servicePeriod: contract.servicePeriod || 0,
          signedAt: contract.signedAt ? this.formatDate(contract.signedAt) : '未签署',
          expireAt: contract.expireAt ? this.formatDate(contract.expireAt) : '无',
          createTime: this.formatDate(contract.createTime),
          updateTime: this.formatDate(contract.updateTime)
        };
      });
      
      console.log('处理后的合同列表:', processedList);
      
      // 更新页面数据
      this.setData({
        contractList: processedList,
        totalCount: total,
        hasMore: hasMore,
        loading: false
      });
      
    } catch (error) {
      console.error('加载合同列表失败:', error);
      this.setData({ loading: false });
      if (error.message !== '未登录') {
        showToast('加载失败，请重试', 'error');
      }
    }
  },

  /**
   * 加载更多合同
   */
  async loadMoreContracts() {
    this.setData({
      page: this.data.page + 1
    });
    await this.loadContractList();
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  /**
   * 清除搜索
   */
  onClearSearch() {
    this.setData({
      searchKeyword: ''
    });
    this.refreshData();
  },

  /**
   * 状态筛选变化
   */
  onStatusChange(e) {
    this.setData({
      statusFilter: e.detail.value
    });
    this.refreshData();
  },

  /**
   * 搜索
   */
  onSearch() {
    this.refreshData();
  },

  /**
   * 点击合同项
   */
  onContractTap(e) {
    const contractId = e.currentTarget.dataset.id;
    const contract = this.data.contractList.find(item => item.id === contractId);
    
    if (contract) {
      wx.navigateTo({
        url: `/pages/manager/contracts/detail?contractId=${contractId}&contractNo=${contract.contractNo}`
      });
    }
  },

  /**
   * 添加合同
   */
  onAddContract() {
    wx.navigateTo({
      url: `/pages/manager/contracts/add?customerId=${this.data.customerId}&customerName=${this.data.customerName}`
    });
  },

  /**
   * 获取状态文本
   */
  getStatusText(status) {
    switch (status) {
      case 'pending': return '待签署';
      case 'signed': return '已签署';
      case 'completed': return '已完成';
      case 'expired': return '已过期';
      case 'cancelled': return '已取消';
      default: return '未知状态';
    }
  },

  /**
   * 获取状态样式类
   */
  getStatusClass(status) {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'signed': return 'status-signed';
      case 'completed': return 'status-completed';
      case 'expired': return 'status-expired';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-unknown';
    }
  },

  /**
   * 格式化日期
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN');
    } catch (error) {
      return dateStr;
    }
  },

  /**
   * 格式化金额
   */
  formatMoney(amount) {
    if (!amount) return '0.00';
    return parseFloat(amount).toFixed(2);
  }
}); 