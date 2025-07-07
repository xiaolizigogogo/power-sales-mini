// pages/manager/customers/detail.js
const app = getApp();
const API = require('../../../utils/api');

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
      
      // 模拟API调用
      const followRecords = [
        {
          id: 1,
          type: 'phone',
          title: '电话沟通产品需求',
          content: '与客户电话沟通了产品需求，客户表示对A型号产品很感兴趣，希望能够提供详细的报价方案。',
          createTime: '2024-07-01 14:20:00',
          nextFollowTime: '2024-07-05 10:00:00',
          status: 'completed',
          priority: 'high',
          result: '积极',
          tags: ['需求确认', '报价']
        },
        {
          id: 2,
          type: 'visit',
          title: '实地拜访客户',
          content: '到客户公司进行实地拜访，参观了生产车间，了解了客户的实际需求。',
          createTime: '2024-06-28 09:00:00',
          nextFollowTime: '2024-07-02 15:00:00',
          status: 'completed',
          priority: 'high',
          result: '积极',
          tags: ['实地调研', '需求分析']
        },
        {
          id: 3,
          type: 'wechat',
          title: '微信发送产品资料',
          content: '通过微信向客户发送了产品手册和案例资料，客户表示会仔细研究。',
          createTime: '2024-06-25 16:30:00',
          nextFollowTime: '2024-06-28 09:00:00',
          status: 'completed',
          priority: 'medium',
          result: '中性',
          tags: ['资料提供']
        }
      ];
      
      this.setData({
        followRecords,
        loadingFollows: false
      });
    } catch (error) {
      console.error('加载跟进记录失败:', error);
      this.setData({ loadingFollows: false });
    }
  },

  // 加载订单记录
  async loadOrders() {
    try {
      this.setData({ loadingOrders: true });
      
      // 模拟API调用
      const orders = [
        {
          id: 'ORD202407001',
          productName: 'A型号产品',
          quantity: 100,
          unitPrice: 1200,
          totalAmount: 120000,
          status: 'completed',
          createTime: '2024-06-15 10:00:00',
          deliveryTime: '2024-06-20 14:00:00'
        },
        {
          id: 'ORD202406001',
          productName: 'B型号产品',
          quantity: 50,
          unitPrice: 800,
          totalAmount: 40000,
          status: 'completed',
          createTime: '2024-05-20 15:30:00',
          deliveryTime: '2024-05-25 09:00:00'
        }
      ];
      
      this.setData({
        orders,
        loadingOrders: false
      });
    } catch (error) {
      console.error('加载订单记录失败:', error);
      this.setData({ loadingOrders: false });
    }
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

  // 切换标签页
  onTabChange(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({ tabIndex: index });
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

  // 显示添加跟进弹窗
  onShowFollowModal() {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].slice(0, 5);
    
    this.setData({ 
      showFollowModal: true,
      showMoreMenu: false,
      newFollowDate: date,
      newFollowTime: time
    });
  },

  // 隐藏添加跟进弹窗
  onHideFollowModal() {
    this.setData({ 
      showFollowModal: false,
      newFollowContent: '',
      newFollowType: 'phone',
      newFollowPriority: 'medium'
    });
  },

  // 跟进表单输入
  onFollowInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`newFollow${field.charAt(0).toUpperCase() + field.slice(1)}`]: value
    });
  },

  // 提交跟进记录
  async onSubmitFollow() {
    const { newFollowContent, newFollowType, newFollowPriority, newFollowDate, newFollowTime } = this.data;
    
    if (!newFollowContent.trim()) {
      wx.showToast({
        title: '请输入跟进内容',
        icon: 'none'
      });
      return;
    }
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newFollow = {
        id: Date.now(),
        type: newFollowType,
        title: newFollowContent.slice(0, 20) + '...',
        content: newFollowContent,
        createTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        nextFollowTime: `${newFollowDate} ${newFollowTime}:00`,
        status: 'pending',
        priority: newFollowPriority,
        result: '待处理',
        tags: ['新增']
      };
      
      this.setData({
        followRecords: [newFollow, ...this.data.followRecords],
        showFollowModal: false,
        newFollowContent: ''
      });
      
      wx.showToast({
        title: '跟进记录添加成功',
        icon: 'success'
      });
      
      // 刷新活动记录
      this.loadActivities();
    } catch (error) {
      console.error('添加跟进记录失败:', error);
      wx.showToast({
        title: '添加跟进记录失败',
        icon: 'none'
      });
    }
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
    const { orderId } = e.currentTarget.dataset;
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
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) { // 1小时内
      return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) { // 1天内
      return Math.floor(diff / 3600000) + '小时前';
    } else if (diff < 2592000000) { // 30天内
      return Math.floor(diff / 86400000) + '天前';
    } else {
      return date.toLocaleDateString();
    }
  }
}); 