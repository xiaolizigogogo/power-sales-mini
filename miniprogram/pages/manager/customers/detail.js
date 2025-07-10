// pages/manager/customers/detail.js
const { customer } = require('../../../utils/api');
const { formatTime, getRelativeTime } = require('../../../utils/date');

Page({
  data: {
    customerId: '',
    customerInfo: null,
    followRecords: [],
    orders: [],
    activities: [],
    activeTab: 0,
    loading: {
      info: true,
      follows: true,
      orders: true,
      activities: true
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({
        customerId: options.id
      });
      this.loadCustomerInfo();
      this.loadFollowRecords();
      this.loadOrders();
      this.loadActivities();
    }
  },

  // 加载客户信息
  async loadCustomerInfo() {
    try {
      const response = await customer.getCustomerInfo(this.data.customerId);
      this.setData({
        customerInfo: response.data,
        'loading.info': false
      });
    } catch (error) {
      console.error('加载客户信息失败:', error);
      wx.showToast({
        title: '加载客户信息失败',
        icon: 'none'
      });
      this.setData({
        'loading.info': false
      });
    }
  },

  // 加载跟进记录
  async loadFollowRecords() {
    try {
      const response = await customer.getFollowRecords(this.data.customerId);
      const followRecords = response.data.map(record => ({
        ...record,
        createTime: formatTime(record.createTime),
        nextFollowTime: record.nextFollowTime ? formatTime(record.nextFollowTime) : null
      }));
      
      this.setData({
        followRecords,
        'loading.follows': false
      });
    } catch (error) {
      console.error('加载跟进记录失败:', error);
      wx.showToast({
        title: '加载跟进记录失败',
        icon: 'none'
      });
      this.setData({
        'loading.follows': false
      });
    }
  },

  // 加载订单列表
  async loadOrders() {
    try {
      const response = await customer.getOrders(this.data.customerId);
      const orders = response.data.map(order => ({
        ...order,
        createTime: formatTime(order.createTime)
      }));
      
      this.setData({
        orders,
        'loading.orders': false
      });
    } catch (error) {
      console.error('加载订单列表失败:', error);
      wx.showToast({
        title: '加载订单列表失败',
        icon: 'none'
      });
      this.setData({
        'loading.orders': false
      });
    }
  },

  // 加载活动记录
  async loadActivities() {
    try {
      const response = await customer.getActivities(this.data.customerId);
      const activities = response.data.map(activity => ({
        ...activity,
        createTime: getRelativeTime(activity.createTime)
      }));
      
      this.setData({
        activities,
        'loading.activities': false
      });
    } catch (error) {
      console.error('加载活动记录失败:', error);
      wx.showToast({
        title: '加载活动记录失败',
        icon: 'none'
      });
      this.setData({
        'loading.activities': false
      });
    }
  },

  // 切换标签页
  onTabChange(event) {
    this.setData({
      activeTab: event.detail.index
    });
  },

  // 添加跟进记录
  onAddFollow() {
    wx.navigateTo({
      url: `/pages/manager/follow/add?customerId=${this.data.customerId}`
    });
  },

  // 查看订单详情
  onViewOrder(event) {
    const { orderId } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/orders/detail/detail?id=${orderId}`
    });
  },

  // 刷新数据
  onPullDownRefresh() {
    Promise.all([
      this.loadCustomerInfo(),
      this.loadFollowRecords(),
      this.loadOrders(),
      this.loadActivities()
    ]).finally(() => {
      wx.stopPullDownRefresh();
    });
  }
}); 