const app = getApp();
const { apiService } = require('../../../utils/api');

Page({
  data: {
    loading: true,
    orderData: null,
    contractId: '',
    
    // 状态映射 - 根据rules.yaml标准定义
    statusMap: {
      'pending': { text: '待签署', color: '#faad14' },
      'signed': { text: '已签署', color: '#52c41a' },
      'completed': { text: '已完成', color: '#52c41a' },
      'expired': { text: '已过期', color: '#ff4d4f' },
      'cancelled': { text: '已取消', color: '#ff4d4f' }
    },
    
    // 状态说明
    statusDescMap: {
      'pending': '合同已生成，等待您签署',
      'signed': '合同已签署，等待服务开通',
      'completed': '合同执行完成，服务已结束',
      'expired': '合同已过期，需要重新签署',
      'cancelled': '合同已取消'
    }
  },

  onLoad(options) {
    const { id } = options;
    console.log('详情页面接收到的ID：', id);
    
    if (!id) {
      wx.showToast({
        title: '合同ID不能为空',
        icon: 'none'
      });
      this.goBack();
      return;
    }
    
    this.setData({ contractId: id });
    this.loadContractDetail();
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.contractId && !this.data.loading) {
      this.loadContractDetail();
    }
  },

  // 加载合同详情
  async loadContractDetail() {
    try {
      this.setData({ loading: true });

      // 从本地存储获取数据
      const orderData = wx.getStorageSync('contractDetailData');
      console.log('从本地存储获取的数据：', orderData);
      
      if (orderData && orderData.order.id == this.data.contractId) {
        this.setData({
          orderData: orderData,
          loading: false
        });
        console.log('设置详情数据成功：', orderData);
      } else {
        // 如果没有本地数据，尝试从API获取
        await this.loadFromAPI();
      }
    } catch (error) {
      console.error('加载合同详情失败:', error);
      this.loadMockContract();
      this.setData({ loading: false });
      wx.showToast({
        title: '使用离线数据',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 从API加载数据
  async loadFromAPI() {
    try {
      const customerId = wx.getStorageSync('userInfo').id;
      const res = await apiService.get(`/manager/customers/${customerId}/orders-contracts/${this.data.contractId}`);
      
      if (res.code === 200 && res.data) {
        this.setData({
          orderData: res.data,
          loading: false
        });
      } else {
        throw new Error(res.message || '获取合同详情失败');
      }
    } catch (error) {
      throw error;
    }
  },

  // 加载模拟合同数据
  loadMockContract() {
    const mockOrderData = {
      order: {
        id: this.data.contractId,
        orderNo: 'ORDER_2025001',
        productName: '工商业用电套餐A',
        servicePeriod: 12,
        amount: '120000.00',
        status: 'completed',
        createTime: '2025-01-15 10:30:00',
        signedTime: '2025-01-16 14:20:00',
        completedTime: '2025-01-17 09:30:00',
        customerName: '测试企业',
        serviceAddress: '北京市朝阳区测试地址',
        contactName: '张经理',
        contactPhone: '138****5678'
      },
      contracts: [
        {
          id: 1,
          fileUrl: 'https://example.com/contract1.jpg',
          fileType: 'image',
          uploadedAt: '2025-01-16 14:20:00'
        },
        {
          id: 2,
          fileUrl: 'https://example.com/contract2.jpg',
          fileType: 'image',
          uploadedAt: '2025-01-16 14:20:00'
        }
      ],
      contractImgUrls: [
        'https://example.com/contract1.jpg',
        'https://example.com/contract2.jpg'
      ]
    };

    this.setData({
      orderData: mockOrderData,
      loading: false
    });
  },

  // 预览合同图片
  onPreviewContractImg(e) {
    const url = e.currentTarget.dataset.url;
    const urls = this.data.orderData.contractImgUrls;
    
    if (!url || !urls.length) {
      wx.showToast({ title: '没有可预览的图片', icon: 'none' });
      return;
    }
    
    wx.previewImage({
      urls: urls,
      current: url
    });
  },

  // 下载合同
  downloadContract() {
    const { orderData } = this.data;
    
    if (!orderData || orderData.contractImgUrls.length === 0) {
      wx.showToast({
        title: '合同文件不存在',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '下载中...' });
    
    // 下载第一张合同图片
    wx.downloadFile({
      url: orderData.contractImgUrls[0],
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

  // 签署合同
  signContract() {
    wx.navigateTo({
      url: `/pages/customer/contracts/sign?id=${this.data.contractId}`
    });
  },

  // 格式化金额
  formatAmount(amount) {
    if (!amount) return '0';
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  // 格式化时间
  formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  // 返回上页
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: `合同${this.data.orderData?.order.orderNo || ''}`,
      path: `/pages/customer/contracts/detail?id=${this.data.contractId}`,
      imageUrl: '/assets/images/share-contract.png'
    };
  }
}); 