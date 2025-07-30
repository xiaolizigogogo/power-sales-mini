const app = getApp();
const { apiService } = require('../../../utils/api');

Page({
  data: {
    loading: true,
    orderData: null,
    contractId: '',
    
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
    
    // 直接设置测试数据
    const testData = {
      order: {
        id: id,
        orderNo: '020250718150647494442',
        productName: '高级电力套餐',
        servicePeriod: 12,
        amount: 74.88,
        actualAmount: 71.14,
        status: 'active',
        createdAt: '2025-07-18T15:06:46.717716',
        serviceStartDate: '2025-07-18T15:06:46.717716',
        serviceEndDate: '2026-07-18T15:06:46.717716',
        serviceAddress: '12',
        quantity: 1
      },
      contracts: [
        {
          id: 1,
          fileUrl: 'https://power-sales-bucket.oss-cn-beijing.aliyuncs.com/2fae4a69-d989-4937-a6a0-c94b7724d611.jpg?Expires=1753848130&OSSAccessKeyId=LTAIhx4zWpfqAaBC&Signature=A78RE5mJzCUWbvHisreOFmMNWvQ%3D',
          fileType: 'image',
          uploadedAt: '2025-07-16T14:48:06.388872'
        },
        {
          id: 2,
          fileUrl: 'https://power-sales-bucket.oss-cn-beijing.aliyuncs.com/f75b0da6-24f7-42ad-9062-48f5a7348438.jpg?Expires=1753848130&OSSAccessKeyId=LTAIhx4zWpfqAaBC&Signature=7pGY03uLPyL7NvOBJNvUWDk0PeA%3D',
          fileType: 'image',
          uploadedAt: '2025-07-16T14:48:06.396873'
        }
      ],
      contractImgUrls: [
        'https://power-sales-bucket.oss-cn-beijing.aliyuncs.com/2fae4a69-d989-4937-a6a0-c94b7724d611.jpg?Expires=1753848130&OSSAccessKeyId=LTAIhx4zWpfqAaBC&Signature=A78RE5mJzCUWbvHisreOFmMNWvQ%3D',
        'https://power-sales-bucket.oss-cn-beijing.aliyuncs.com/f75b0da6-24f7-42ad-9062-48f5a7348438.jpg?Expires=1753848130&OSSAccessKeyId=LTAIhx4zWpfqAaBC&Signature=7pGY03uLPyL7NvOBJNvUWDk0PeA%3D'
      ]
    };
    
    console.log('设置测试数据：', testData);
    console.log('合同图片数量：', testData.contractImgUrls.length);
    this.setData({
      orderData: testData,
      loading: false
    });
    console.log('设置完成后的orderData：', this.data.orderData);
    
    // this.loadContractDetail();
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

      // 强制使用模拟数据进行测试
      console.log('强制使用模拟数据');
      this.loadMockContract();
      this.setData({ loading: false });
      
      // 注释掉原来的逻辑，暂时使用模拟数据
      /*
      // 从本地存储获取数据
      const orderData = wx.getStorageSync('contractDetailData');
      console.log('从本地存储获取的数据：', orderData);
      
      if (orderData && orderData.order && orderData.order.id == this.data.contractId) {
        this.setData({
          orderData: orderData,
          loading: false
        });
        console.log('设置详情数据成功：', orderData);
      } else {
        // 如果没有本地数据，尝试从API获取
        console.log('本地无数据，尝试从API获取');
        await this.loadFromAPI();
      }
      */
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
        // API返回的数据需要重新组织结构
        const apiData = res.data;
        const orderData = {
          order: {
            id: apiData.id,
            orderNo: apiData.orderNo,
            productName: apiData.productName,
            servicePeriod: apiData.servicePeriod,
            amount: apiData.amount,
            actualAmount: apiData.actualAmount,
            status: apiData.status,
            createdAt: apiData.createdAt,
            serviceStartDate: apiData.serviceStartDate,
            serviceEndDate: apiData.serviceEndDate,
            serviceAddress: apiData.serviceAddress,
            remark: apiData.remark,
            quantity: apiData.quantity
          },
          contracts: apiData.contracts || [],
          contractImgUrls: apiData.contracts ? apiData.contracts.map(contract => contract.fileUrl) : []
        };
        
        this.setData({
          orderData: orderData,
          loading: false
        });
        console.log('API数据转换后：', orderData);
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
        orderNo: '020250718150647494442',
        productName: '高级电力套餐',
        servicePeriod: 12,
        amount: 74.88,
        actualAmount: 71.14,
        status: 'active',
        createdAt: '2025-07-18T15:06:46.717716',
        serviceStartDate: '2025-07-18T15:06:46.717716',
        serviceEndDate: '2026-07-18T15:06:46.717716',
        serviceAddress: '12',
        quantity: 1,
        remark: ''
      },
      contracts: [
        {
          id: 1,
          fileUrl: 'https://power-sales-bucket.oss-cn-beijing.aliyuncs.com/2fae4a69-d989-4937-a6a0-c94b7724d611.jpg?Expires=1753848130&OSSAccessKeyId=LTAIhx4zWpfqAaBC&Signature=A78RE5mJzCUWbvHisreOFmMNWvQ%3D',
          fileType: 'image',
          uploadedAt: '2025-07-16T14:48:06.388872'
        },
        {
          id: 2,
          fileUrl: 'https://power-sales-bucket.oss-cn-beijing.aliyuncs.com/f75b0da6-24f7-42ad-9062-48f5a7348438.jpg?Expires=1753848130&OSSAccessKeyId=LTAIhx4zWpfqAaBC&Signature=7pGY03uLPyL7NvOBJNvUWDk0PeA%3D',
          fileType: 'image',
          uploadedAt: '2025-07-16T14:48:06.396873'
        }
      ],
      contractImgUrls: [
        'https://power-sales-bucket.oss-cn-beijing.aliyuncs.com/2fae4a69-d989-4937-a6a0-c94b7724d611.jpg?Expires=1753848130&OSSAccessKeyId=LTAIhx4zWpfqAaBC&Signature=A78RE5mJzCUWbvHisreOFmMNWvQ%3D',
        'https://power-sales-bucket.oss-cn-beijing.aliyuncs.com/f75b0da6-24f7-42ad-9062-48f5a7348438.jpg?Expires=1753848130&OSSAccessKeyId=LTAIhx4zWpfqAaBC&Signature=7pGY03uLPyL7NvOBJNvUWDk0PeA%3D'
      ]
    };

    console.log('模拟数据：', mockOrderData);
    this.setData({
      orderData: mockOrderData,
      loading: false
    });
    console.log('数据设置完成，当前orderData：', this.data.orderData);
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
    console.log('formatAmount输入:', amount, '类型:', typeof amount);
    if (!amount && amount !== 0) {
      console.log('金额为空，返回0');
      return '0.00';
    }
    // 确保是数字类型
    const num = parseFloat(amount);
    console.log('解析后的数字:', num);
    if (isNaN(num)) {
      console.log('解析失败，返回0');
      return '0.00';
    }
    // 格式化为两位小数
    const result = num.toFixed(2);
    console.log('格式化结果:', result);
    return result;
  },

  // 格式化时间
  formatTime(timeStr) {
    console.log('formatTime输入:', timeStr, '类型:', typeof timeStr);
    if (!timeStr) {
      console.log('时间为空，返回空字符串');
      return '';
    }
    try {
      const date = new Date(timeStr);
      console.log('解析后的日期:', date);
      if (isNaN(date.getTime())) {
        console.log('日期无效，返回空字符串');
        return '';
      }
      const result = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      console.log('格式化结果:', result);
      return result;
    } catch (error) {
      console.error('时间格式化错误:', error);
      return '';
    }
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