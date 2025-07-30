const app = getApp();
const { apiService } = require('../../../utils/api');

Page({
  data: {
    loading: true,
    refreshing: false,
    loadingMore: false,
    hasMore: true,
    ordersWithContracts:[],
    // 筛选状态
    activeTab: 'all',
    tabs: [
      { key: 'all', name: '全部', count: 0 },
      { key: 'pending', name: '待确认', count: 0 },
      { key: 'contract', name: '合同签署', count: 0 },
      { key: 'signed', name: '已签约', count: 0 },
      { key: 'active', name: '服务中', count: 0 },
      { key: 'completed', name: '已完成', count: 0 },
    ],
    
    // 合同数据
    contracts: [],
    page: 1,
    pageSize: 10,
    
    // 搜索
    searchKeyword: '',
    showSearchBar: false,
    
    // 状态映射 - 根据rules.yaml标准定义（订单和合同统一状态）
    statusMap: {
      'pending': { text: '待确认', color: '#FFA500' },
      'negotiating': { text: '商务洽谈', color: '#1890FF' },
      'confirmed': { text: '已确认', color: '#722ED1' },
      'contract': { text: '合同签署', color: '#13C2C2' },
      'signed': { text: '已签约', color: '#52C41A' },
      'active': { text: '服务中', color: '#52C41A' },
      'completed': { text: '已完成', color: '#8C8C8C' },
      'cancelled': { text: '已取消', color: '#FF4D4F' },
      'rejected': { text: '已拒绝', color: '#FF4D4F' },
      'expired': { text: '已过期', color: '#ff4d4f' }
    },
    
    // 状态说明
    statusDescMap: {
      'pending': '订单已提交，等待客户经理确认',
      'negotiating': '客户经理正在与您洽谈需求',
      'confirmed': '订单已确认，准备进入合同签署流程',
      'contract': '进入合同签署阶段，请及时签署合同',
      'signed': '合同已签署，服务即将开通',
      'active': '服务已开通，正在为您提供服务',
      'completed': '服务已完成，感谢您的使用',
      'cancelled': '订单已取消',
      'rejected': '订单被拒绝，请联系客户经理',
      'expired': '订单已过期，需要重新处理'
    }
  },

  onLoad(options) {
   
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadContracts(true);
  },

  onPullDownRefresh() {
    this.loadContracts(true);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMoreContracts();
    }
  },

 async loadContracts(refresh = false) {
    if (refresh) {
      this.setData({
        page: 1,
        hasMore: true,
        contracts: []
      });
    }

    if (!this.data.hasMore) return;

    try {
      this.setData({ 
        loading: refresh,
        loadingMore: !refresh 
      });

      const { page, pageSize, activeTab, searchKeyword } = this.data;
      const params = {
        page,
        pageSize,
        status: activeTab === 'all' ? '' : activeTab,
        keyword: searchKeyword
      };
      const customerId = wx.getStorageSync('userInfo').id;
      const res = await apiService.get(`/manager/customers/${customerId}/orders-contracts`, params);
      // 适配新接口数据结构
      if (res.code === 200 && Array.isArray(res.data)) {
        // 订单+合同图片结构
        const ordersWithContracts = res.data.map(orderObj => {
          const order = orderObj.order || {};
          const contracts = Array.isArray(orderObj.contracts) ? orderObj.contracts.map(contractFile => ({
            id: contractFile.id,
            fileUrl: contractFile.fileUrl,
            fileType: contractFile.fileType,
            uploadedAt: contractFile.uploadedAt
          })) : [];
          const contractImgUrls = contracts.filter(c => c.fileType === 'image').map(c => c.fileUrl);
          
          // 调试：打印每个订单的状态
          console.log('订单状态:', order.orderNo, order.status);
          
          return {
            order,
            contracts,
            contractImgUrls
          };
        });
        const hasMore = false;
        this.setData({
          ordersWithContracts: refresh ? ordersWithContracts : this.data.ordersWithContracts.concat(ordersWithContracts),
          hasMore,
          page: hasMore ? page + 1 : page,
          loading: false,
          loadingMore: false
        });
        console.log('ordersWithContracts', this.data.ordersWithContracts);
      } else {
        throw new Error(res.message || '获取合同列表失败');
      }
    } catch (error) {
      console.error('加载合同列表失败:', error);
      // 使用模拟数据
      this.loadMockContracts();
      this.setData({ 
        loading: false,
        loadingMore: false 
      });
      wx.showToast({
        title: '已使用离线数据',
        icon: 'none'
      });
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  onPreviewContractImg(e) {
    const url = e.currentTarget.dataset.url;
    console.log('url', e.currentTarget.dataset);
    if (!url) {
      wx.showToast({ title: '没有可预览的图片', icon: 'none' });
      return;
    }
    wx.previewImage({
      urls: [url],
      current: url
    });
  },

  // 加载更多合同
  async loadMoreContracts() {
    await this.loadContracts(false);
  },

  // 加载模拟合同数据
  loadMockContracts() {
    const mockOrdersWithContracts = [
      {
        order: {
          id: 1,
          orderNo: 'ORDER_2025001',
          productName: '工商业用电套餐A',
          servicePeriod: 12,
          amount: '120000.00',
          status: 'pending',
          createTime: '2025-01-15 10:30:00',
          expireTime: '2025-02-15 10:30:00',
          customerName: '测试企业',
          serviceAddress: '北京市朝阳区测试地址'
        },
        contracts: [],
        contractImgUrls: []
      },
      {
        order: {
          id: 2,
          orderNo: 'ORDER_2025002',
          productName: '工业用电优化方案',
          servicePeriod: 24,
          amount: '50000.00',
          status: 'signed',
          createTime: '2025-01-10 14:20:00',
          signedTime: '2025-01-12 09:15:00',
          customerName: '测试企业',
          serviceAddress: '上海市浦东新区测试地址'
        },
        contracts: [
          {
            id: 1,
            fileUrl: 'https://example.com/contract1.jpg',
            fileType: 'image',
            uploadedAt: '2025-01-12 09:15:00'
          }
        ],
        contractImgUrls: ['https://example.com/contract1.jpg']
      },
      {
        order: {
          id: 3,
          orderNo: 'ORDER_2025003',
          productName: '商业用电管理服务',
          servicePeriod: 6,
          amount: '30000.00',
          status: 'completed',
          createTime: '2024-12-20 16:45:00',
          signedTime: '2024-12-25 11:30:00',
          completedTime: '2024-12-26 10:00:00',
          customerName: '测试企业',
          serviceAddress: '广州市天河区测试地址'
        },
        contracts: [
          {
            id: 2,
            fileUrl: 'https://example.com/contract2.jpg',
            fileType: 'image',
            uploadedAt: '2024-12-25 11:30:00'
          },
          {
            id: 3,
            fileUrl: 'https://example.com/contract3.jpg',
            fileType: 'image',
            uploadedAt: '2024-12-25 11:30:00'
          }
        ],
        contractImgUrls: ['https://example.com/contract2.jpg', 'https://example.com/contract3.jpg']
      }
    ];

    this.setData({
      ordersWithContracts: mockOrdersWithContracts,
      hasMore: false
    });

    this.updateTabCounts();
  },

  // 更新标签页计数
  updateTabCounts() {
    const { ordersWithContracts } = this.data;
    const tabs = this.data.tabs.map(tab => {
      let count = 0;
      if (tab.key === 'all') {
        count = ordersWithContracts.length;
      } else {
        count = ordersWithContracts.filter(item => item.order.status === tab.key).length;
      }
      return { ...tab, count };
    });

    this.setData({ tabs });
  },

  // 标签页切换
  onTabChange(e) {
    const activeTab = e.detail.name;
    this.setData({ activeTab });
    this.loadContracts(true);
  },

  // 显示搜索栏
  showSearch() {
    this.setData({ showSearchBar: !this.data.showSearchBar });
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 搜索确认
  onSearchConfirm() {
    this.loadContracts(true);
  },

  // 清空搜索
  onSearchClear() {
    this.setData({ searchKeyword: '' });
    this.loadContracts(true);
  },

  // 查看合同详情
  viewContractDetail(e) {
    const orderData = e.currentTarget.dataset.order;
    console.log('点击查看详情，数据：', orderData);
    
    if (!orderData) {
      wx.showToast({ title: '数据错误', icon: 'none' });
      return;
    }
    
    // 将数据存储到本地，供详情页使用
    wx.setStorageSync('contractDetailData', orderData);
    
    wx.navigateTo({
      url: `/pages/customer/contracts/detail?id=${orderData.order.id}`,
      success: () => {
        console.log('跳转到详情页面成功');
      },
      fail: (error) => {
        console.error('跳转到详情页面失败：', error);
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 签署合同
  signContract(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/customer/contracts/sign?id=${id}`
    });
  },



  // 刷新数据
  refreshData() {
    this.loadContracts(true);
  }
}); 