// pages/manager/customers/detail.js
const app = getApp();
const apiService = require('../../../utils/api').apiService;
const { formatTime } = require('../../../utils/date');
const { api } = require('../../../utils/api');

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

Page({
  data: {
    customerId: '',
    customerInfo: {},
    followRecords: [],
    orders: [],
    contracts: [], // 改为合同列表
    loading: true,
    loadingFollows: false,
    loadingOrders: false,
    loadingContracts: false, // 添加合同加载状态
    showMoreMenu: false,
    showStatusModal: false,
    showFollowModal: false,
    newFollowContent: '',
    newFollowType: 'phone',
    newFollowPriority: 'medium',
    newFollowDate: '',
    newFollowTime: '',
    followTypes: [
      { value: 'phone', label: '电话跟进', icon: '📞' },
      { value: 'visit', label: '实地拜访', icon: '🏢' },
      { value: 'wechat', label: '微信沟通', icon: '💬' },
      { value: 'email', label: '邮件联系', icon: '📧' }
    ],
    priorities: [
      { value: 'high', label: '高优先级', color: '#ff4d4f' },
      { value: 'medium', label: '中优先级', color: '#faad14' },
      { value: 'low', label: '低优先级', color: '#52c41a' }
    ],
    statusOptions: [
      { value: 'potential', label: '潜在客户', color: '#d9d9d9' },
      { value: 'contacted', label: '已联系', color: '#1890ff' },
      { value: 'interested', label: '有意向', color: '#faad14' },
      { value: 'signed', label: '已签约', color: '#52c41a' },
      { value: 'lost', label: '已流失', color: '#ff4d4f' }
    ],
    // 合同状态配置
    contractStatusConfig: {
      'pending': { text: '待签署', color: '#faad14' },
      'signed': { text: '已签署', color: '#52c41a' },
      'completed': { text: '已完成', color: '#52c41a' },
      'expired': { text: '已过期', color: '#ff4d4f' },
      'cancelled': { text: '已取消', color: '#ff4d4f' }
    },
    tabIndex: 0, // 0: 跟进记录, 1: 订单记录, 2: 合同记录
    refreshing: false
  },

  onLoad: function (options) {
    this.setData({
      customerId: options.id || ''
    });
    this.loadCustomerInfo();
    this.loadFollowRecords();
    this.loadOrders();
    this.loadContracts(); // 改为加载合同
  },

  onShow: function () {
    // 从跟进页面返回时刷新数据
    if (this.data.customerId) {
      this.loadFollowRecords();
    }
  },

  onPullDownRefresh: function () {
    this.setData({ refreshing: true });
    Promise.all([
      this.loadCustomerInfo(),
      this.loadFollowRecords(),
      this.loadOrders(),
      this.loadContracts() // 改为加载合同
    ]).finally(() => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  // 加载客户信息
  async loadCustomerInfo() {
    try {
      this.setData({ loading: true });
      // 调用后端接口获取客户详情
      const res = await api.getManagerCustomerDetail(this.data.customerId);
      if (res.code === 200 && res.data) {
        const customerInfo = res.data;
        // 添加nameFirstChar属性
        if (customerInfo.name) {
          customerInfo.nameFirstChar = customerInfo.name.charAt(0);
        }
        this.setData({
          customerInfo,
          loading: false
        });
      } else {
        throw new Error(res.message || '获取客户信息失败');
      }
    } catch (error) {
      console.error('加载客户信息失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载客户信息失败',
        icon: 'none'
      });
    }
  },

  // 加载跟进记录
  async loadFollowRecords() {
    try {
      this.setData({ loadingFollows: true });
      
      // 安全获取用户信息
      const userInfo = wx.getStorageSync('userInfo');
      const employeeId = userInfo && userInfo.id ? userInfo.id : 
                        (userInfo && userInfo.data && userInfo.data.id ? userInfo.data.id : null);
      
      if (!employeeId) {
        console.warn('无法获取员工ID，跳过加载跟进记录');
        this.setData({ 
          followRecords: [],
          loadingFollows: false 
        });
        return;
      }
      
      const res = await apiService.get(`/customers/${this.data.customerId}/follows`, {
        page: 1,
        pageSize: 50
      });
      
      if (res.code === 200) {
        const records = res.data.records.map(record => ({
          ...record,
          createdAt: formatDateTime(record.createdAt),
          nextFollowDate: formatDateTime(record.nextFollowDate)
        }));
        
        this.setData({
          followRecords: records,
          loadingFollows: false
        });
      }
    } catch (error) {
      console.error('加载跟进记录失败:', error);
      this.setData({ loadingFollows: false });
      wx.showToast({
        title: '加载跟进记录失败',
        icon: 'none'
      });
    }
  },

  // 加载订单记录
  async loadOrders() {
    try {
      this.setData({ loadingOrders: true });
      
      const res = await apiService.get(`/customers/${this.data.customerId}/orders`, {
        page: 1,
        pageSize: 50
      });
      
      if (res.code === 200) {
        const orders = res.data.records.map(order => {
          const status = order.status || 'pending';
          return {
            ...order,
            // 字段映射，保证前端展示字段有值
            serviceAddress: order.serviceAddress || '',
            servicePeriod: order.servicePeriod || '',
            unitPrice: order.amount ? order.amount.toFixed(2) : '0.00',
            totalAmount: order.amount ? order.amount.toFixed(2) : '0.00',
            monthlyUsage: order.specialRequirements || '0', // 每月用电量，暂时用 specialRequirements 字段
            createTime: formatDateTime(order.createdAt),
            statusText: this.getOrderStatusText(status),
            statusDesc: this.getOrderStatusDesc(status),
            statusColor: this.getOrderStatusColor(status),
            // 不再映射 productName，不展示交付时间
          };
        });
        this.setData({
          orders,
          loadingOrders: false
        });
        console.log('订单数据:', orders);
      }
    } catch (error) {
      console.error('加载订单记录失败:', error);
      this.setData({ loadingOrders: false });
      wx.showToast({
        title: '加载订单记录失败',
        icon: 'none'
      });
    }
  },

  // 获取订单状态文本
  getOrderStatusText(status) {
    const statusMap = {
      'pending': '待处理',
      'negotiating': '商务洽谈中',
      'confirmed': '已确认',
      'paid': '已支付',
      'service': '服务中',
      'completed': '已完成',
      'cancelled': '已取消',
      'rejected': '已拒绝',
      'contract': '待签约',
      'active': '服务中'
    };
    // 如果状态不在映射中，直接显示原始状态
    return statusMap[status] || status;
  },

  // 获取订单状态说明
  getOrderStatusDesc(status) {
    const statusDescMap = {
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
    };
    // 如果状态不在映射中，返回空字符串
    return statusDescMap[status] || '';
  },

  // 获取订单状态颜色
  getOrderStatusColor(status) {
    const statusColorMap = {
      'pending': '#fa8c16',
      'negotiating': '#1890ff',
      'confirmed': '#52c41a',
      'paid': '#2b85e4',
      'service': '#1890ff',
      'completed': '#52c41a',
      'cancelled': '#ff4d4f',
      'rejected': '#ff4d4f',
      'contract': '#1890ff',
      'active': '#1890ff'
    };
    // 如果状态不在映射中，返回默认颜色
    return statusColorMap[status] || '#999999';
  },

  // 加载合同记录
  async loadContracts() {
    try {
      this.setData({ loadingContracts: true });
      // 获取当前登录人id
      const userInfo = wx.getStorageSync('userInfo');
      const managerId = userInfo && userInfo.id ? userInfo.id : (userInfo && userInfo.data && userInfo.data.id ? userInfo.data.id : null);
      // 调用合同API - 更新为经理端接口
      const res = await apiService.get(`/manager/customers/${this.data.customerId}/contracts`, {
        page: 1,
        pageSize: 50,
        managerId // 新增managerId参数
      });
      
      if (res.code === 200) {
        const contracts = res.data.records.map(contract => {
          const status = contract.status || 'pending';
          return {
            ...contract,
            // 根据PostgreSQL表结构映射字段
            contractNo: contract.contract_no,
            orderNo: contract.order_no,
            orderId: contract.order_id,
            customerId: contract.customer_id,
            customerName: contract.customer_name,
            productName: contract.product_name,
            servicePeriod: contract.service_period,
            amount: contract.amount,
            status: status,
            serviceAddress: contract.service_address,
            contractUrl: contract.contract_url,
            signedFileUrl: contract.signed_file_url,
            signedFileName: contract.signed_file_name,
            remarks: contract.remarks,
            signedAt: contract.signed_at,
            signedBy: contract.signed_by,
            completedAt: contract.completed_at,
            completedBy: contract.completed_by,
            expireAt: contract.expire_at,
            createdAt: contract.created_at,
            updatedAt: contract.updated_at,
            // 格式化显示字段
            createTime: formatDateTime(contract.created_at),
            signTime: formatDateTime(contract.signed_at),
            completeTime: formatDateTime(contract.completed_at),
            expireTime: formatDateTime(contract.expire_at),
            statusText: this.getContractStatusText(status),
            statusColor: this.getContractStatusColor(status),
            amountText: this.formatMoney(contract.amount || 0)
          };
        });
        
        this.setData({
          contracts,
          loadingContracts: false
        });
      }
    } catch (error) {
      console.error('加载合同记录失败:', error);
      this.setData({ loadingContracts: false });
      
      // 使用模拟数据，基于PostgreSQL表结构
      const mockContracts = [
        {
          id: 1,
          contractNo: 'CONTRACT_2025001',
          orderNo: 'ORDER_2025001',
          orderId: 1,
          customerId: this.data.customerId,
          customerName: this.data.customerInfo.name || '测试企业',
          productName: '企业电力优化服务',
          servicePeriod: 12,
          amount: 50000.00,
          status: 'pending',
          statusText: '待签署',
          statusColor: '#faad14',
          amountText: '¥50,000.00',
          serviceAddress: '北京市朝阳区测试地址',
          contractUrl: 'https://example.com/contracts/CONTRACT_2025001.pdf',
          remarks: '测试合同',
          createTime: '2025-01-15 10:30:00',
          signTime: '',
          completeTime: '',
          expireTime: '2026-01-15 10:30:00'
        },
        {
          id: 2,
          contractNo: 'CONTRACT_2025002',
          orderNo: 'ORDER_2025002',
          orderId: 2,
          customerId: this.data.customerId,
          customerName: this.data.customerInfo.name || '测试企业',
          productName: '工业用电优化方案',
          servicePeriod: 24,
          amount: 120000.00,
          status: 'signed',
          statusText: '已签署',
          statusColor: '#52c41a',
          amountText: '¥120,000.00',
          serviceAddress: '上海市浦东新区测试地址',
          contractUrl: 'https://example.com/contracts/CONTRACT_2025002.pdf',
          signedFileUrl: 'https://example.com/signed/CONTRACT_2025002_signed.pdf',
          signedFileName: 'CONTRACT_2025002_signed.pdf',
          remarks: '已签署的测试合同',
          createTime: '2025-01-10 09:15:00',
          signTime: '2025-01-12 14:20:00',
          completeTime: '',
          expireTime: '2027-01-10 09:15:00'
        },
        {
          id: 3,
          contractNo: 'CONTRACT_2025003',
          orderNo: 'ORDER_2025003',
          orderId: 3,
          customerId: this.data.customerId,
          customerName: this.data.customerInfo.name || '测试企业',
          productName: '商业用电管理服务',
          servicePeriod: 6,
          amount: 30000.00,
          status: 'completed',
          statusText: '已完成',
          statusColor: '#52c41a',
          amountText: '¥30,000.00',
          serviceAddress: '广州市天河区测试地址',
          contractUrl: 'https://example.com/contracts/CONTRACT_2025003.pdf',
          signedFileUrl: 'https://example.com/signed/CONTRACT_2025003_signed.pdf',
          signedFileName: 'CONTRACT_2025003_signed.pdf',
          remarks: '已完成的测试合同',
          createTime: '2024-12-20 16:30:00',
          signTime: '2024-12-25 10:15:00',
          completeTime: '2025-06-20 16:30:00',
          expireTime: '2025-06-20 16:30:00'
        }
      ];
      
      this.setData({
        contracts: mockContracts,
        loadingContracts: false
      });
    }
  },

  // 获取合同状态文本
  getContractStatusText(status) {
    const statusMap = {
      'pending': '待签署',
      'signed': '已签署',
      'completed': '已完成',
      'expired': '已过期',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  },

  // 获取合同状态颜色
  getContractStatusColor(status) {
    const statusColorMap = {
      'pending': '#faad14',
      'signed': '#52c41a',
      'completed': '#52c41a',
      'expired': '#ff4d4f',
      'cancelled': '#ff4d4f'
    };
    return statusColorMap[status] || '#999999';
  },

  // 格式化金额
  formatMoney(amount) {
    if (!amount) return '¥0';
    return '¥' + amount.toLocaleString('zh-CN');
  },

  // Tab切换事件
  onTabChange(e) {
    const index = e.detail.index;
    this.setData({
      tabIndex: index || 0  // 确保有默认值
    });
  },

  // 显示更多菜单
  onShowMoreMenu() {
    this.setData({ showMoreMenu: true });
  },

  // 隐藏更多菜单
  onHideMoreMenu() {
    this.setData({ showMoreMenu: false });
  },

  // 快速联系
  onQuickContact(e) {
    const { type } = e.currentTarget.dataset;
    const { customerInfo } = this.data;
    
    switch (type) {
      case 'phone':
        wx.makePhoneCall({
          phoneNumber: customerInfo.phone
        });
        break;
      case 'sms':
        // 小程序无法直接发送短信，可以复制号码
        wx.setClipboardData({
          data: customerInfo.phone,
          success: () => {
            wx.showToast({
              title: '号码已复制',
              icon: 'success'
            });
          }
        });
        break;
      case 'wechat':
        wx.showToast({
          title: '请手动添加微信',
          icon: 'none'
        });
        break;
      case 'email':
        wx.setClipboardData({
          data: customerInfo.email,
          success: () => {
            wx.showToast({
              title: '邮箱已复制',
              icon: 'success'
            });
          }
        });
        break;
    }
    
    this.setData({ showMoreMenu: false });
  },

  // 显示状态修改弹窗
  onShowStatusModal() {
    this.setData({ 
      showStatusModal: true,
      showMoreMenu: false 
    });
  },

  // 隐藏状态修改弹窗
  onHideStatusModal() {
    this.setData({ showStatusModal: false });
  },

  // 更新客户状态
  async onUpdateStatus(e) {
    const { value } = e.currentTarget.dataset;
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.setData({
        'customerInfo.status': value,
        showStatusModal: false
      });
      
      wx.showToast({
        title: '状态更新成功',
        icon: 'success'
      });
      
      // 刷新活动记录
      // this.loadActivities(); // 移除此行，因为活动记录已改为合同记录
    } catch (error) {
      console.error('更新状态失败:', error);
      wx.showToast({
        title: '更新状态失败',
        icon: 'none'
      });
    }
  },

  // 跳转到添加跟进页面
  onAddFollow() {
    wx.navigateTo({
      url: `/pages/manager/customers/follow-add?id=${this.data.customerId}&name=${this.data.customerInfo.name}`
    });
  },

  // 编辑客户信息
  onEditCustomer() {
    wx.navigateTo({
      url: `/pages/manager/customers/edit?id=${this.data.customerId}`
    });
    this.setData({ showMoreMenu: false });
  },

  // 查看订单详情
  onViewOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/orders/detail/detail?id=${orderId}`
    });
  },

  // 创建新订单
  onCreateOrder() {
    wx.navigateTo({
      url: `/pages/orders/create/create?customerId=${this.data.customerId}`
    });
    this.setData({ showMoreMenu: false });
  },

  // 分享客户
  onShareCustomer() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    this.setData({ showMoreMenu: false });
  },

  // 开始商务洽谈
  async onNegotiate(e) {
    const orderId = e.currentTarget.dataset.id;
    
    try {
      wx.showLoading({
        title: '处理中...',
        mask: true
      });
      
      const res = await apiService.put(`/manager/orders/${orderId}/negotiate`, {
        remark: '开始商务洽谈',
        operationType: 'negotiate'
      });
      
      if (res.code === 200) {
        wx.showToast({
          title: '已开始商务洽谈',
          icon: 'success'
        });
        
        // 重新加载订单列表
        await this.loadOrders();
      }
    } catch (error) {
      console.error('商务洽谈失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 获取状态显示信息
  getStatusInfo(status) {
    const statusInfo = this.data.statusOptions.find(item => item.value === status);
    return statusInfo || { label: '未知', color: '#d9d9d9' };
  },

  // 格式化金额
  formatAmount(amount) {
    return (amount / 10000).toFixed(2) + '万';
  },

  // 格式化时间
  formatTime(time) {
    if (!time) return '';
    const date = new Date(time);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${month}-${day} ${hours}:${minutes}`;
  },

  // 格式化时间
  formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return ''
    const date = new Date(dateTimeStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 查看合同详情
  onViewContract(e) {
    const contractId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/manager/contracts/detail?id=${contractId}`
    });
  },

  // 创建新合同
  onCreateContract() {
    wx.navigateTo({
      url: `/pages/manager/contracts/create?customerId=${this.data.customerId}&customerName=${this.data.customerInfo.name}`
    });
  },

  // 查看全部合同
  onViewAllContracts() {
    wx.navigateTo({
      url: `/pages/manager/customers/contracts?customerId=${this.data.customerId}&customerName=${this.data.customerInfo.name}`
    });
  },

  // 下载合同文件
  onDownloadContract(e) {
    const contractId = e.currentTarget.dataset.id;
    const contractNo = e.currentTarget.dataset.contractNo;
    
    wx.showLoading({
      title: '下载中...',
      mask: true
    });
    
    // 模拟下载过程
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '下载成功',
        icon: 'success'
      });
    }, 2000);
  },

  // 签署合同
  onSignContract(e) {
    const contractId = e.currentTarget.dataset.id;
    const contractNo = e.currentTarget.dataset.contractNo;
    
    wx.showModal({
      title: '确认签署',
      content: `确定要签署合同 ${contractNo} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.signContract(contractId);
        }
      }
    });
  },

  // 签署合同API调用
  async signContract(contractId) {
    try {
      wx.showLoading({
        title: '签署中...',
        mask: true
      });
      
      // 获取当前用户信息
      const userInfo = wx.getStorageSync('userInfo');
      const signedBy = userInfo && userInfo.id ? userInfo.id : 
                      (userInfo && userInfo.data && userInfo.data.id ? userInfo.data.id : null);
      
      const res = await apiService.put(`/manager/contracts/${contractId}/sign`, {
        signed_at: new Date().toISOString(),
        signed_by: signedBy
      });
      
      if (res.code === 200) {
        wx.showToast({
          title: '签署成功',
          icon: 'success'
        });
        
        // 重新加载合同列表
        await this.loadContracts();
      }
    } catch (error) {
      console.error('签署合同失败:', error);
      wx.showToast({
        title: '签署失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 查看全部跟进记录
  onViewAllFollows() {
    console.log('点击了 查看全部跟进记录', this.data.customerId, this.data.customerInfo.name);
    wx.setStorageSync('followListFilter', {
      customerId: this.data.customerId,
      customerName: this.data.customerInfo.name
    });
    wx.switchTab({
      url: '/pages/manager/follow/list'
    });
  },

  // 查看全部订单
  onViewAllOrders() {
    console.log('点击了 查看全部订单', this.data.customerId, this.data.customerInfo.name);
    wx.setStorageSync('orderListFilter', {
      customerId: this.data.customerId,
      customerName: this.data.customerInfo.name
    });
    wx.switchTab({
      url: '/pages/orders/index/index'
    });
  }
}); 