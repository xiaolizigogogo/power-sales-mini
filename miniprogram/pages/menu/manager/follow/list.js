// pages/menu/manager/follow/list.js
const { roleManager } = require('../../../../utils/role-manager');
const { showToast, showLoading, hideLoading } = require('../../../../utils/common');
const { api } = require('../../../../utils/api');

Page({
  data: {
    // 筛选条件
    activeTab: 'all', // all, today, week, month, overdue
    searchKeyword: '',
    showFilterModal: false,
    
    // 跟进状态选项
    tabOptions: [
      { value: 'all', label: '全部跟进', count: 0 }
      // { value: 'today', label: '今日跟进', count: 0 },
      // { value: 'week', label: '本周跟进', count: 0 },
      // { value: 'month', label: '本月跟进', count: 0 },
      // { value: 'overdue', label: '逾期提醒', count: 0 }
    ],
    
    // 跟进列表数据
    followList: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    pageSize: 20,
    
    // 排序方式
    sortBy: 'followTime', // followTime, createTime, nextTime
    sortOrder: 'desc', // desc, asc
    
    // 统计数据
    totalCount: 0,
    todayCount: 0,
    weekCount: 0,
    overdueCount: 0,
    
    // 快速操作
    showQuickActions: false,
    selectedFollowId: null,
    
    // 筛选条件
    filterConditions: {
      followType: '', // phone, visit, wechat, email
      status: '', // pending, completed, cancelled
      priority: '', // high, medium, low
      dateRange: ''
    },
    customerId: '',
    customerName: '',
  },

  onLoad(options) {
    console.log('进入跟进列表页面', options);
    // 接收客户参数
    if (options.customerId) {
      this.setData({
        customerId: options.customerId,
        customerName: options.customerName || ''
      });
      if (options.customerName) {
        wx.setNavigationBarTitle({
          title: `${options.customerName}的跟进记录`
        });
      }
    }
    this.checkUserPermission();
    this.initData();
  },

  onShow() {
    // tabBar页面：优先从Storage读取筛选参数
    const filter = wx.getStorageSync('followListFilter');
    if (filter && filter.customerId) {
      this.setData({
        customerId: filter.customerId,
        customerName: filter.customerName || ''
      });
      if (filter.customerName) {
        wx.setNavigationBarTitle({
          title: `${filter.customerName}的跟进记录`
        });
      }
      wx.removeStorageSync('followListFilter');
    }
    this.checkUserPermission();
    this.loadFollowList();
    this.loadStatistics();
    this.updateTabBar();
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
      this.loadMoreFollows();
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
        
        // 设置当前选中的tab（跟进管理是第3个，索引为2）
        if (typeof tabbar.setActiveTab === 'function') {
          tabbar.setActiveTab(2);
        } else {
          tabbar.setData({
            active: 2
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
      followList: [],
      hasMore: true
    });
    await Promise.all([
      this.loadFollowList(),
      this.loadStatistics()
    ]);
  },

  /**
   * 加载跟进列表
   */
  async loadFollowList() {
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
      // 如果有customerId，带上
      if (this.data.customerId) {
        params.customerId = this.data.customerId;
      }
      const response = await api.getFollowupList(params);
      const newList = this.data.page === 1 ? response.data.list : [...this.data.followList, ...response.data.list];
      this.setData({
        followList: newList,
        hasMore: (response.data.list && response.data.list.length >= this.data.pageSize),
        totalCount: response.data.total
      });
      // 可选：更新tab统计
      // this.updateTabCounts(response.data.tabCounts);
    } catch (error) {
      console.error('加载跟进列表失败:', error);
      showToast('加载跟进列表失败', 'error');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 加载更多跟进记录
   */
  async loadMoreFollows() {
    this.setData({
      page: this.data.page + 1
    });
    await this.loadFollowList();
  },

  /**
   * 加载统计数据
   */
  async loadStatistics() {
    try {
      const response = await api.getFollowupStatistics();
      this.setData({
        todayCount: response.data.todayFollow,
        weekCount: response.data.weekFollow,
        overdueCount: response.data.overdueFollow
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  /**
   * 更新标签统计
   */
  updateTabCounts(tabCounts) {
    const tabOptions = this.data.tabOptions.map(option => ({
      ...option,
      count: tabCounts[option.value] || 0
    }));
    this.setData({ tabOptions });
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
      followList: [],
      hasMore: true
    });
    this.loadFollowList();
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
        followList: [],
        hasMore: true
      });
      this.loadFollowList();
    }, 500);
  },

  /**
   * 清空搜索
   */
  onClearSearch() {
    this.setData({
      searchKeyword: '',
      page: 1,
      followList: [],
      hasMore: true
    });
    this.loadFollowList();
  },

  /**
   * 跟进记录点击
   */
  onFollowTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/manager/follow/detail?id=${id}`
    });
  },

  /**
   * 完成跟进
   */
  async onCompleteFollow(e) {
    e.stopPropagation();
    const { id } = e.currentTarget.dataset;
    
    try {
      showLoading('处理中...');
      // TODO: 调用完成跟进API
      await this.mockCompleteFollow(id);
      showToast('跟进完成', 'success');
      this.refreshData();
    } catch (error) {
      console.error('完成跟进失败:', error);
      showToast('操作失败', 'error');
    } finally {
      hideLoading();
    }
  },

  /**
   * 延期跟进
   */
  onDelayFollow(e) {
    e.stopPropagation();
    const { id } = e.currentTarget.dataset;
    
    wx.showActionSheet({
      itemList: ['延期1天', '延期3天', '延期1周', '自定义时间'],
      success: async (res) => {
        const delays = [1, 3, 7, 0];
        const delayDays = delays[res.tapIndex];
        
        if (delayDays === 0) {
          // 自定义时间
          this.showCustomDelayPicker(id);
        } else {
          await this.delayFollow(id, delayDays);
        }
      }
    });
  },

  /**
   * 显示自定义延期选择器
   */
  showCustomDelayPicker(id) {
    wx.showModal({
      title: '延期跟进',
      content: '请选择延期天数',
      editable: true,
      placeholderText: '请输入天数',
      success: async (res) => {
        if (res.confirm) {
          const days = parseInt(res.content);
          if (days > 0) {
            await this.delayFollow(id, days);
          }
        }
      }
    });
  },

  /**
   * 延期跟进
   */
  async delayFollow(id, days) {
    try {
      showLoading('处理中...');
      // TODO: 调用延期跟进API
      await this.mockDelayFollow(id, days);
      showToast(`已延期${days}天`, 'success');
      this.refreshData();
    } catch (error) {
      console.error('延期跟进失败:', error);
      showToast('操作失败', 'error');
    } finally {
      hideLoading();
    }
  },

  /**
   * 快速联系
   */
  onQuickContact(e) {
    e.stopPropagation();
    const { phone, wechat } = e.currentTarget.dataset;
    
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
            this.contactWeChat(wechat);
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
    showToast('即将跳转到短信应用', 'none');
  },

  /**
   * 微信联系
   */
  contactWeChat(wechat) {
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
   * 添加跟进记录
   */
  onAddFollow() {
    wx.navigateTo({
      url: '/pages/manager/follow/add'
    });
  },

  /**
   * 批量操作
   */
  onBatchOperation() {
    showToast('批量操作功能开发中', 'none');
  },

  /**
   * 筛选操作
   */
  onShowFilter() {
    this.setData({ showFilterModal: true });
  },

  onHideFilter() {
    this.setData({ showFilterModal: false });
  },

  // 模拟数据方法
  mockFollowList(params) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = this.generateMockFollows(params);
        resolve({
          data: {
            list: mockData.list,
            total: mockData.total,
            hasMore: params.page * params.pageSize < mockData.total,
            tabCounts: {
              all: 86,
              today: 12,
              week: 35,
              month: 68,
              overdue: 8
            }
          }
        });
      }, 600);
    });
  },

  generateMockFollows(params) {
    const follows = [];
    const startIndex = (params.page - 1) * params.pageSize;
    
    for (let i = 0; i < params.pageSize; i++) {
      const id = startIndex + i + 1;
      const followTypes = ['phone', 'visit', 'wechat', 'email'];
      const followType = followTypes[id % 4];
      const statusTypes = ['pending', 'completed', 'cancelled'];
      const status = statusTypes[id % 3];
      const priorities = ['high', 'medium', 'low'];
      const priority = priorities[id % 3];
      
      follows.push({
        id,
        customerId: id,
        customerName: `客户${id}`,
        customerPhone: `138${String(1000 + id).padStart(4, '0')}${String(1234 + id).padStart(4, '0')}`,
        customerCompany: `企业${id}有限公司`,
        followType,
        followTypeName: {
          'phone': '电话跟进',
          'visit': '实地拜访',
          'wechat': '微信沟通',
          'email': '邮件联系'
        }[followType],
        title: `跟进${id} - ${followTypes[id % 4]}`,
        content: `这是跟进记录${id}的详细内容，记录了与客户的沟通情况和后续计划。`,
        status,
        statusName: {
          'pending': '待跟进',
          'completed': '已完成',
          'cancelled': '已取消'
        }[status],
        priority,
        priorityName: {
          'high': '高',
          'medium': '中',
          'low': '低'
        }[priority],
        followTime: `2024-0${(id % 9) + 1}-${String((id % 28) + 1).padStart(2, '0')}`,
        nextFollowTime: status === 'pending' ? `2024-0${(id % 9) + 1}-${String(((id % 28) + 1) + 3).padStart(2, '0')}` : '',
        createTime: `2024-0${(id % 9) + 1}-${String((id % 28) + 1).padStart(2, '0')}`,
        attachments: id % 3 === 0 ? ['image1.jpg', 'document.pdf'] : [],
        tags: ['重要', '紧急', '待确认'].slice(0, id % 3 + 1),
        isOverdue: status === 'pending' && id % 8 === 0
      });
    }
    
    return {
      list: follows,
      total: 86
    };
  },

  mockStatistics() {
    return Promise.resolve({
      data: {
        todayCount: 12,
        weekCount: 35,
        overdueCount: 8
      }
    });
  },

  mockCompleteFollow(id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 800);
    });
  },

  mockDelayFollow(id, days) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 800);
    });
  }
}); 