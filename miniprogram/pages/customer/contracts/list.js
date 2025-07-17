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
      { key: 'signed', name: '进行中', count: 0 },
      { key: 'completed', name: '已完成', count: 0 },
    ],
    
    // 合同数据
    contracts: [],
    page: 1,
    pageSize: 10,
    
    // 搜索
    searchKeyword: '',
    
    // 状态映射
    statusMap: {
      'signed': { text: '进行中', color: '#07c160' },
      'completed': { text: '已完成', color: '#52c41a' },
      'cancelled': { text: '已取消', color: '#969799' }
    },
    
    // 状态说明
    statusDescMap: {
      'pending': '合同已生成，等待您签署',
      'signed': '您已签署，等待企业方确认',
      'completed': '合同签署完成，服务已生效',
      'expired': '合同已过期，需要重新签署',
      'cancelled': '合同已取消'
    }
  },

  onLoad(options) {
   
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadContracts(true);
  },

  onPullDownRefresh() {
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
    const mockContracts = [
      {
        id: 1,
        contractNo: 'CONTRACT_2025001',
        orderNo: 'ORDER_2025001',
        productName: '企业电力优化服务',
        servicePeriod: 12,
        amount: '50000.00',
        status: 'pending',
        createTime: '2025-01-15 10:30:00',
        expireTime: '2025-02-15 10:30:00',
        customerName: '测试企业',
        serviceAddress: '北京市朝阳区测试地址'
      },
      {
        id: 2,
        contractNo: 'CONTRACT_2025002',
        orderNo: 'ORDER_2025002',
        productName: '工业用电优化方案',
        servicePeriod: 24,
        amount: '120000.00',
        status: 'signed',
        createTime: '2025-01-10 14:20:00',
        signedTime: '2025-01-12 09:15:00',
        customerName: '测试企业',
        serviceAddress: '上海市浦东新区测试地址'
      },
      {
        id: 3,
        contractNo: 'CONTRACT_2025003',
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
      }
    ];

    this.setData({
      contracts: mockContracts,
      hasMore: false
    });

    this.updateTabCounts();
  },

  // 更新标签页计数
  updateTabCounts() {
    const { contracts } = this.data;
    const tabs = this.data.tabs.map(tab => {
      let count = 0;
      if (tab.key === 'all') {
        count = contracts.length;
      } else {
        count = contracts.filter(contract => contract.status === tab.key).length;
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
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/customer/contracts/detail?id=${id}`
    });
  },

  // 签署合同
  signContract(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/customer/contracts/sign?id=${id}`
    });
  },

  // 下载合同
  downloadContract(e) {
    const { id } = e.currentTarget.dataset;
    const contract = this.data.contracts.find(c => c.id === id);
    
    if (!contract || !contract.contractUrl) {
      wx.showToast({
        title: '合同文件不存在',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '下载中...' });
    
    wx.downloadFile({
      url: contract.contractUrl,
      success(res) {
        wx.hideLoading();
        wx.saveFile({
          tempFilePath: res.tempFilePath,
          success() {
            wx.showToast({
              title: '合同已保存到本地',
              icon: 'success'
            });
          },
          fail() {
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            });
          }
        });
      },
      fail(error) {
        wx.hideLoading();
        console.error('下载合同失败:', error);
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        });
      }
    });
  },

  // 刷新数据
  refreshData() {
    this.loadContracts(true);
  }
}); 