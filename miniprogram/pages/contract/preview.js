const app = getApp();
const { apiService } = require('../../utils/api');

Page({
  data: {
    orderId: null,
    contractInfo: null,
    loading: true,
    
    // 合同信息
    contractData: {
      contractNo: '',
      orderNo: '',
      customerName: '',
      serviceAddress: '',
      servicePeriod: '',
      totalAmount: '',
      startDate: '',
      endDate: '',
      terms: []
    }
  },

  onLoad(options) {
    console.log('合同预览页面参数:', options);
    this.setData({
      orderId: options.orderId
    });
    
    this.loadContractInfo();
  },

  onShow() {
    // 页面显示时的逻辑
  },

  onPullDownRefresh() {
    this.loadContractInfo();
  },

  // 加载合同信息
  async loadContractInfo() {
    if (!this.data.orderId) {
      wx.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      });
      return;
    }

    try {
      this.setData({ loading: true });
      
      // 获取合同信息
      const res = await apiService.get(`/manager/orders/${this.data.orderId}/contract`);
      
      if (res.code === 200 && res.data) {
        this.setData({
          contractInfo: res.data,
          contractData: this.formatContractData(res.data)
        });
      } else {
        throw new Error(res.message || '获取合同信息失败');
      }
    } catch (error) {
      console.error('加载合同信息失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  // 格式化合同数据
  formatContractData(contractInfo) {
    return {
      contractNo: contractInfo.contractNo || `CONTRACT_${this.data.orderId}`,
      orderNo: contractInfo.orderNo || '',
      customerName: contractInfo.customerName || '',
      serviceAddress: contractInfo.serviceAddress || '',
      servicePeriod: contractInfo.servicePeriod || '',
      totalAmount: contractInfo.totalAmount || '',
      startDate: contractInfo.startDate || '',
      endDate: contractInfo.endDate || '',
      terms: contractInfo.terms || this.getDefaultTerms()
    };
  },

  // 获取默认合同条款
  getDefaultTerms() {
    return [
      '甲方应当按照约定支付服务费用',
      '乙方应当按照约定提供电力服务',
      '双方应当遵守相关法律法规',
      '合同期内不得无故终止服务',
      '如有争议，双方应当友好协商解决'
    ];
  },

  // 预览合同
  previewContract() {
    const { contractInfo } = this.data;
    if (!contractInfo || !contractInfo.contractUrl) {
      wx.showToast({
        title: '合同文件不存在',
        icon: 'none'
      });
      return;
    }

    wx.downloadFile({
      url: contractInfo.contractUrl,
      success(res) {
        wx.openDocument({
          filePath: res.tempFilePath,
          success() {
            console.log('打开合同文件成功');
          },
          fail(error) {
            console.error('打开合同文件失败:', error);
            wx.showToast({
              title: '打开合同文件失败',
              icon: 'none'
            });
          }
        });
      },
      fail(error) {
        console.error('下载合同文件失败:', error);
        wx.showToast({
          title: '下载合同文件失败',
          icon: 'none'
        });
      }
    });
  },

  // 下载合同
  downloadContract() {
    const { contractInfo } = this.data;
    if (!contractInfo || !contractInfo.contractUrl) {
      wx.showToast({
        title: '合同文件不存在',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '下载中...' });
    
    wx.downloadFile({
      url: contractInfo.contractUrl,
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

  // 分享合同
  shareContract() {
    const { contractInfo } = this.data;
    if (!contractInfo || !contractInfo.contractUrl) {
      wx.showToast({
        title: '合同文件不存在',
        icon: 'none'
      });
      return;
    }

    wx.showActionSheet({
      itemList: ['发送给客户', '发送给同事', '复制链接'],
      success(res) {
        switch (res.tapIndex) {
          case 0:
            wx.showToast({ title: '发送给客户功能开发中', icon: 'none' });
            break;
          case 1:
            wx.showToast({ title: '发送给同事功能开发中', icon: 'none' });
            break;
          case 2:
            wx.setClipboardData({
              data: contractInfo.contractUrl,
              success() {
                wx.showToast({ title: '链接已复制', icon: 'success' });
              }
            });
            break;
        }
      }
    });
  },

  // 返回订单详情
  goBack() {
    wx.navigateBack();
  }
}); 