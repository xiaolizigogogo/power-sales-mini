// pages/manager/customers/detail.js
const app = getApp();
const apiService = require('../../../utils/api').apiService;
const { formatTime } = require('../../../utils/date');

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
    activities: [],
    loading: true,
    loadingFollows: false,
    loadingOrders: false,
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
    tabIndex: 0, // 0: 跟进记录, 1: 订单记录, 2: 活动记录
    refreshing: false
  },

  onLoad: function (options) {
    this.setData({
      customerId: options.id || ''
    });
    this.loadCustomerInfo();
    this.loadFollowRecords();
    this.loadOrders();
    this.loadActivities();
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
      this.loadActivities()
    ]).finally(() => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    });
  },

  // 加载客户信息
  async loadCustomerInfo() {
    try {
      this.setData({ loading: true });
      
      // 模拟API调用
      const customerInfo = {
        id: this.data.customerId,
        name: '张三',
        company: '北京科技有限公司',
        position: '采购经理',
        phone: '13812345678',
        email: 'zhangsan@example.com',
        wechat: 'zhangsan_wechat',
        address: '北京市朝阳区建国门外大街1号',
        industry: '制造业',
        scale: '中型企业',
        status: 'interested',
        source: '网络推广',
        createTime: '2024-01-15 10:30:00',
        lastFollowTime: '2024-07-01 14:20:00',
        totalOrders: 5,
        totalAmount: 128600,
        tags: ['VIP客户', '重点关注', '决策快'],
        manager: '李经理',
        remark: '该客户对我们的产品很感兴趣，已经进行了多次沟通，预计本月可以签约。'
      };
      
      this.setData({
        customerInfo,
        loading: false
      });
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
      
      const employeeId = wx.getStorageSync('userInfo').data.id;
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
          // 保留原始状态，不做映射转换
          const status = order.status || 'pending';
          return {
            ...order,
            statusText: this.getOrderStatusText(status),
            statusDesc: this.getOrderStatusDesc(status),
            statusColor: this.getOrderStatusColor(status),
            createTime: formatDateTime(order.createTime),
            deliveryTime: formatDateTime(order.deliveryTime),
            // 计算单价
            unitPrice: order.quantity > 0 ? (order.totalAmount / order.quantity).toFixed(2) : '0.00',
            // 格式化金额
            totalAmount: order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'
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

  // 加载活动记录
  async loadActivities() {
    try {
      // 模拟API调用
      const activities = [
        {
          id: 1,
          type: 'follow',
          title: '添加了跟进记录',
          content: '电话沟通产品需求',
          createTime: '2024-07-01 14:20:00',
          user: '李经理'
        },
        {
          id: 2,
          type: 'order',
          title: '创建了新订单',
          content: '订单号：ORD202407001',
          createTime: '2024-06-15 10:00:00',
          user: '李经理'
        },
        {
          id: 3,
          type: 'status',
          title: '更新了客户状态',
          content: '从"已联系"更新为"有意向"',
          createTime: '2024-06-10 16:00:00',
          user: '李经理'
        }
      ];
      
      this.setData({ activities });
    } catch (error) {
      console.error('加载活动记录失败:', error);
    }
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
      this.loadActivities();
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
  }
}); 