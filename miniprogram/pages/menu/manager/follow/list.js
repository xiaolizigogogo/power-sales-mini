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
    
    // 弹框相关
    showCompleteDialog: false,
    showCancelDialog: false,
    completeForm: {
      id: null,
      result: '',
      nextFollowDate: ''
    },
    cancelForm: {
      id: null,
      reason: ''
    },
    
    // 时间选择器相关 - 确保初始状态为隐藏
    showDatePicker: false,
    currentDate: new Date().getTime(),
    minDate: new Date().getTime(),
    maxDate: new Date().getTime() + 365 * 24 * 60 * 60 * 1000 // 一年后
  },

  onLoad(options) {
    console.log('进入跟进列表页面', options);
    
    // 确保弹框和日期选择器状态正确
    this.setData({
      showDatePicker: false,
      showCompleteDialog: false,
      showCancelDialog: false
    });
    
    console.log('onLoad: 设置showDatePicker为false');
    
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
    // 加载初始数据
    this.loadFollowList();
    this.loadStatistics();
    
    // 强制隐藏日期选择器
    this.hideDatePicker();
    
    // 延迟再次隐藏，确保页面完全加载后隐藏
    setTimeout(() => {
      this.hideDatePicker();
    }, 100);
    
    // 再次延迟隐藏，确保完全隐藏
    setTimeout(() => {
      this.setData({
        showDatePicker: false,
        showCompleteDialog: false,
        showCancelDialog: false
      });
      console.log('onLoad: 延迟设置showDatePicker为false');
    }, 500);
    
    // 检查最终状态
    setTimeout(() => {
      console.log('onLoad: 最终showDatePicker状态:', this.data.showDatePicker);
    }, 1000);
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
      // 清除Storage中的筛选参数
      wx.removeStorageSync('followListFilter');
    }
    
    // 确保弹框和日期选择器状态正确
    this.setData({
      showDatePicker: false,
      showCompleteDialog: false,
      showCancelDialog: false
    });
    
    this.updateTabBar();
    
    // 强制隐藏日期选择器
    this.hideDatePicker();
    
    // 延迟再次隐藏，确保页面完全显示后隐藏
    setTimeout(() => {
      this.hideDatePicker();
    }, 100);
  },

  /**
   * 页面隐藏时确保弹框和日期选择器隐藏
   */
  onHide() {
    this.setData({
      showDatePicker: false,
      showCompleteDialog: false,
      showCancelDialog: false
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
    // 初始化数据
    this.setData({
      showDatePicker: false, // 确保日期选择器隐藏
      showCompleteDialog: false,
      showCancelDialog: false
    });
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
   * 刷新跟进列表（重置页码并重新加载）
   */
  async refreshFollowList() {
    console.log('刷新跟进列表');
    this.setData({
      page: 1,
      hasMore: true
    });
    await this.loadFollowList();
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
        searchKeyword: this.data.searchKeyword,
        followType: this.data.filterConditions.followType,
        status: this.data.filterConditions.status,
        priority: this.data.filterConditions.priority,
        customerId: this.data.customerId
      };
      
      console.log('加载跟进列表参数:', params);
      
      let response;
      if (this.data.customerId) {
        // 如果是查看特定客户的跟进记录，使用模拟数据
        response = await this.mockFollowList(params);
      } else {
        // 使用真实接口
        response = await api.getFollowupList(params);
      }
      
      console.log('跟进列表接口响应:', response);
      
      if (response.code === 200 && response.data) {
        const { list, total } = response.data;
        
        console.log('原始接口数据:', list);
        
        // 处理接口返回的数据，转换为卡片需要的格式
        const processedList = list.map(item => this.processFollowItem(item));
        
        console.log('处理后的数据:', processedList);
        
        if (this.data.page === 1) {
          this.setData({
            followList: processedList,
            totalCount: total
          });
        } else {
          this.setData({
            followList: [...this.data.followList, ...processedList]
          });
        }
        
        this.setData({
          hasMore: this.data.followList.length < total,
          page: this.data.page + 1
        });
        
        console.log('处理后的跟进列表:', this.data.followList);
      } else {
        console.error('获取跟进列表失败:', response.message);
        showToast(response.message || '获取跟进列表失败', 'error');
      }
    } catch (error) {
      console.error('加载跟进列表异常:', error);
      showToast('网络异常，请稍后重试', 'error');
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
      let response;
      if (this.data.customerId) {
        // 如果是查看特定客户的跟进记录，使用模拟数据
        response = await this.mockStatistics();
      } else {
        // 使用真实接口
        response = await api.getFollowupStatistics();
      }
      
      if (response.code === 200 && response.data) {
        this.setData({
          todayCount: response.data.todayFollow || response.data.todayCount || 0,
          weekCount: response.data.weekFollow || response.data.weekCount || 0,
          overdueCount: response.data.overdueFollow || response.data.overdueCount || 0
        });
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      // 使用默认值
      this.setData({
        todayCount: 0,
        weekCount: 0,
        overdueCount: 0
      });
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
    console.log('点击跟进项:', id);
    
    // 获取跟进项数据
    const followItem = this.data.followList.find(item => item.id === id);
    if (!followItem) {
      console.error('未找到跟进项数据:', id);
      showToast('数据错误', 'error');
      return;
    }
    
    console.log('跟进项数据:', followItem);
    
    // 跳转到客户详情页面
    wx.navigateTo({
      url: `/pages/manager/customers/detail?id=${followItem.customerId}`,
      success: () => {
        console.log('跳转到客户详情页面成功');
      },
      fail: (err) => {
        console.error('跳转到客户详情页面失败:', err);
        showToast('页面跳转失败', 'error');
      }
    });
  },

  /**
   * 完成跟进
   */
  onCompleteFollow(e) {
    const { id, item } = e.currentTarget.dataset;
    console.log('完成跟进:', id, item);
    
    this.setData({
      showCompleteDialog: true,
      completeForm: {
        id: id,
        result: '',
        nextFollowDate: ''
      }
    });
  },

  /**
   * 取消跟进
   */
  onCancelFollow(e) {
    const { id, item } = e.currentTarget.dataset;
    console.log('取消跟进:', id, item);
    
    this.setData({
      showCancelDialog: true,
      cancelForm: {
        id: id,
        reason: ''
      }
    });
  },

  /**
   * 完成跟进结果输入
   */
  onCompleteResultChange(e) {
    this.setData({
      'completeForm.result': e.detail
    });
  },

  /**
   * 完成跟进下次时间输入
   */
  onCompleteNextFollowDateChange(e) {
    this.setData({
      'completeForm.nextFollowDate': e.detail
    });
  },

  /**
   * 选择下次跟进时间
   */
  onSelectNextFollowDate() {
    this.setData({
      showDatePicker: true
    });
  },

  /**
   * 时间选择器确认
   */
  onDateConfirm(e) {
    const date = new Date(e.detail);
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    
    console.log('确认时间选择器，设置时间:', formattedDate);
    this.setData({
      'completeForm.nextFollowDate': formattedDate,
      showDatePicker: false
    });
  },

  /**
   * 时间选择器取消
   */
  onDateCancel() {
    console.log('取消时间选择器，隐藏日期选择器');
    this.setData({
      showDatePicker: false
    });
  },

  /**
   * 强制隐藏日期选择器
   */
  hideDatePicker() {
    console.log('强制隐藏日期选择器');
    this.setData({
      showDatePicker: false
    });
  },

  /**
   * 取消跟进原因输入
   */
  onCancelReasonChange(e) {
    this.setData({
      'cancelForm.reason': e.detail
    });
  },

  /**
   * 确认完成跟进
   */
  confirmComplete() {
    const { id, result, nextFollowDate } = this.data.completeForm;
    
    if (!result.trim()) {
      showToast('请输入跟进结果', 'error');
      return;
    }
    
    this.completeFollowup(id, result, nextFollowDate);
  },

  /**
   * 确认取消跟进
   */
  confirmCancel() {
    const { id, reason } = this.data.cancelForm;
    
    if (!reason.trim()) {
      showToast('请输入取消原因', 'error');
      return;
    }
    
    this.cancelFollowup(id, reason);
  },

  /**
   * 关闭完成弹框
   */
  closeCompleteDialog() {
    this.setData({
      showCompleteDialog: false,
      showDatePicker: false, // 确保日期选择器也隐藏
      completeForm: {
        id: null,
        result: '',
        nextFollowDate: ''
      }
    });
  },

  /**
   * 关闭取消弹框
   */
  closeCancelDialog() {
    this.setData({
      showCancelDialog: false,
      cancelForm: {
        id: null,
        reason: ''
      }
    });
  },

  /**
   * 调用完成跟进接口
   */
  async completeFollowup(id, result, nextFollowDate) {
    try {
      this.setData({ loading: true });
      
      console.log('调用完成跟进接口:', { id, result, nextFollowDate });
      console.log('api对象:', api);
      console.log('api.completeFollowup:', api.completeFollowup);
      
      const response = await api.completeFollowup(id, {
        result: result,
        nextFollowDate: nextFollowDate
      });
      
      console.log('完成跟进接口响应:', response);
      
      if (response.code === 200) {
        showToast('跟进完成成功', 'success');
        this.closeCompleteDialog();
        
        // 强制刷新列表数据
        console.log('跟进完成，开始刷新列表');
        this.setData({
          page: 1,
          hasMore: true,
          followList: [] // 清空当前列表
        });
        
        // 延迟一下再加载，确保状态更新
        setTimeout(() => {
          this.loadFollowList();
        }, 100);
      } else {
        showToast(response.message || '跟进完成失败', 'error');
      }
    } catch (error) {
      console.error('完成跟进失败:', error);
      showToast('网络错误，请重试', 'error');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 调用取消跟进接口
   */
  async cancelFollowup(id, reason) {
    try {
      this.setData({ loading: true });
      
      const response = await api.cancelFollowup(id, {
        reason: reason
      });
      
      if (response.code === 200) {
        showToast('跟进取消成功', 'success');
        this.closeCancelDialog();
        
        // 强制刷新列表数据
        console.log('跟进取消，开始刷新列表');
        this.setData({
          page: 1,
          hasMore: true,
          followList: [] // 清空当前列表
        });
        
        // 延迟一下再加载，确保状态更新
        setTimeout(() => {
          this.loadFollowList();
        }, 100);
      } else {
        showToast(response.message || '跟进取消失败', 'error');
      }
    } catch (error) {
      console.error('取消跟进失败:', error);
      showToast('网络错误，请重试', 'error');
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 快速联系客户
   */
  onQuickContact(e) {
    const { phone, wechat } = e.currentTarget.dataset;
    console.log('快速联系:', { phone, wechat });
    
    wx.showActionSheet({
      itemList: ['拨打电话', '复制微信'],
      success: (res) => {
        if (res.tapIndex === 0 && phone) {
          wx.makePhoneCall({
            phoneNumber: phone,
            fail: () => {
              showToast('拨打电话失败', 'error');
            }
          });
        } else if (res.tapIndex === 1 && wechat) {
          wx.setClipboardData({
            data: wechat,
            success: () => {
              showToast('微信号已复制', 'success');
            }
          });
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

  /**
   * 模拟数据方法
   */
  mockFollowList(params) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = this.generateMockFollows(params);
        resolve({
          code: 200,
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
          },
          message: '获取跟进列表成功'
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
        phone: `138${String(1000 + id).padStart(4, '0')}${String(1234 + id).padStart(4, '0')}`,
        companyName: `企业${id}有限公司`,
        type: followType,
        typeText: followType,
        content: `这是跟进记录${id}的详细内容，记录了与客户的沟通情况和后续计划。`,
        status,
        priority,
        planTime: `2024-0${(id % 9) + 1}-${String((id % 28) + 1).padStart(2, '0')} 10:00`,
        actualTime: status === 'completed' ? `2024-0${(id % 9) + 1}-${String((id % 28) + 1).padStart(2, '0')} 10:30` : '',
        nextFollowDate: status === 'pending' ? `2024-0${(id % 9) + 1}-${String(((id % 28) + 1) + 3).padStart(2, '0')} 14:00` : '',
        createTime: `2024-0${(id % 9) + 1}-${String((id % 28) + 1).padStart(2, '0')} 09:00`,
        result: status === 'completed' ? `跟进完成，客户反馈良好，计划下次跟进` : '',
        attachments: id % 3 === 0 ? ['image1.jpg', 'document.pdf'] : [],
        tags: ['重要', '紧急', '待确认'].slice(0, id % 3 + 1),
        isOverdue: status === 'pending' && id % 8 === 0,
        avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',
        followerName: `销售员${id % 5 + 1}`,
        customerStatus: ['potential', 'contacted', 'interested', 'signed', 'lost'][id % 5]
      });
    }
    
    return {
      list: follows,
      total: 86
    };
  },

  mockStatistics() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 200,
          data: {
            todayFollow: 12,
            weekFollow: 35,
            overdueFollow: 8,
            todayCount: 12,
            weekCount: 35,
            overdueCount: 8
          }
        });
      }, 600);
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
  },

  /**
   * 处理跟进项数据，转换为卡片显示格式
   */
  processFollowItem(item) {
    console.log('处理跟进项数据:', item);
    
    // 跟进类型映射
    const typeMap = {
      'phone': { name: '电话跟进', icon: '📞', color: '#52c41a' },
      'visit': { name: '实地拜访', icon: '🏢', color: '#722ed1' },
      'wechat': { name: '微信沟通', icon: '💬', color: '#13c2c2' },
      'email': { name: '邮件联系', icon: '📧', color: '#fa8c16' }
    };
    
    // 跟进状态映射（参照rules.yaml中的follow_up_status）
    const statusMap = {
      'pending': { name: '待跟进', color: '#faad14' },
      'completed': { name: '已完成', color: '#52c41a' },
      'cancelled': { name: '已取消', color: '#8c8c8c' },
      'overdue': { name: '已逾期', color: '#ff4d4f' }
    };
    
    // 优先级映射（参照rules.yaml中的follow_up_priority）
    const priorityMap = {
      'high': { name: '高', color: '#ff4d4f' },
      'medium': { name: '中', color: '#faad14' },
      'low': { name: '低', color: '#52c41a' }
    };
    
    // 根据接口返回的数据推断状态
    let status = 'pending';
    if (item.status) {
      // 如果接口返回了status字段，直接使用
      status = item.status;
    } else if (item.actualTime && item.actualTime.trim() !== '') {
      // 如果有实际执行时间，认为是已完成
      status = 'completed';
    } else if (item.result && item.result.trim() !== '') {
      // 如果有跟进结果，认为是已完成
      status = 'completed';
    }
    
    // 根据接口返回的数据推断优先级
    let priority = 'medium';
    if (item.priority) {
      // 如果接口返回了priority字段，直接使用
      priority = item.priority;
    } else if (item.isOverdue) {
      // 如果逾期，认为是高优先级
      priority = 'high';
    }
    
    const typeInfo = typeMap[item.type] || typeMap['phone'];
    const statusInfo = statusMap[status] || statusMap['pending'];
    const priorityInfo = priorityMap[priority] || priorityMap['medium'];
    
    // 判断是否为待办任务
    // 如果有下次跟进时间且没有实际执行时间，则为待办任务
    const isTask = item.nextFollowDate && item.nextFollowDate.trim() !== '' && 
                   (!item.actualTime || item.actualTime.trim() === '');
    
    // 计算是否逾期（使用当前时间与下次跟进时间比较）
    const isOverdue = item.nextFollowDate && new Date(item.nextFollowDate) < new Date();
    
    // 生成跟进标题
    const followTitle = item.title || `${typeInfo.name} - ${item.companyName || '客户'}`;
    
    // 生成跟进内容摘要
    const contentSummary = item.content ? 
      (item.content.length > 50 ? item.content.substring(0, 50) + '...' : item.content) : 
      (isTask ? '待执行的跟进任务' : '暂无跟进内容');
    
    // 格式化时间
    const formatTime = (timeStr) => {
      if (!timeStr || timeStr.trim() === '') return '';
      try {
        const date = new Date(timeStr);
        if (isNaN(date.getTime())) return timeStr; // 如果解析失败，直接返回原字符串
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      } catch (error) {
        console.error('时间格式化失败:', timeStr, error);
        return timeStr;
      }
    };
    
    // 从客户ID生成客户姓名（如果没有的话）
    const customerName = item.customerName || `客户${item.customerId}`;
    
    return {
      id: item.id,
      customerId: item.customerId,
      customerName: customerName,
      customerPhone: item.phone || '',
      customerWechat: item.wechat || '',
      customerCompany: item.companyName || '未知企业',
      
      // 跟进信息
      followType: item.type || 'phone',
      followTypeName: typeInfo.name,
      followTypeIcon: typeInfo.icon,
      title: followTitle,
      content: item.content || '',
      contentSummary: contentSummary,
      
      // 状态和优先级
      status: status,
      statusName: statusInfo.name,
      priority: priority,
      priorityName: priorityInfo.name,
      
      // 时间信息
      followTime: formatTime(item.actualTime || item.planTime || item.createTime),
      nextFollowTime: formatTime(item.nextFollowDate),
      createTime: formatTime(item.createTime),
      planTime: formatTime(item.planTime),
      actualTime: formatTime(item.actualTime),
      
      // 跟进结果
      result: item.result || '',
      
      // 附件和标签
      attachments: item.attachments || [],
      tags: item.tags || [],
      
      // 状态标识
      isOverdue: isOverdue,
      isCompleted: status === 'completed',
      isPending: status === 'pending',
      isTask: isTask, // 是否为待办任务
      
      // 跟进人信息（接口没有返回，使用默认值）
      followerName: item.followerName || item.createBy || '当前用户',
      followerId: item.followerId || item.createBy || '',
      
      // 原始数据
      rawData: item
    };
  }
}); 