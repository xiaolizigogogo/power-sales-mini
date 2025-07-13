const app = getApp();
const { apiService } = require('../../../utils/api');

Page({
  data: {
    contractId: null,
    loading: true,
    submitting: false,
    
    // 合同信息
    contractInfo: null,
    
    // 签署信息
    signInfo: {
      signedFile: null,
      signedFileName: '',
      signedFileSize: 0,
      remarks: ''
    },
    
    // 文件大小显示文本
    fileSizeText: '0.00',
    
    // 文件上传
    uploadProgress: 0,
    uploading: false,
    
    // 表单验证
    formValid: false,
    
    // 签署说明
    signInstructions: [
      '请仔细阅读合同条款，确认无误后再签署',
      '签署后的合同文件请扫描或拍照上传',
      '支持PDF、JPG、PNG格式，文件大小不超过10MB',
      '上传后请等待企业方确认签署',
      '如有疑问请联系客户经理'
    ]
  },

  onLoad(options) {
    console.log('合同签署页面参数:', options);
    this.setData({
      contractId: options.id || options.contractId
    });
    
    this.loadContractInfo();
  },

  onShow() {
    // 页面显示时的逻辑
  },

  // 加载合同信息
  async loadContractInfo() {
    if (!this.data.contractId) {
      wx.showToast({
        title: '合同ID不能为空',
        icon: 'none'
      });
      return;
    }

    try {
      this.setData({ loading: true });
      
      // 获取合同信息
      const res = await apiService.get(`/customer/contracts/${this.data.contractId}`);
      
      if (res.code === 200 && res.data) {
        this.setData({
          contractInfo: res.data
        });
      } else {
        throw new Error(res.message || '获取合同信息失败');
      }
    } catch (error) {
      console.error('加载合同信息失败:', error);
      
      // 使用模拟数据
      this.loadMockContractInfo();
      
      wx.showToast({
        title: '已使用离线数据',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载模拟合同信息
  loadMockContractInfo() {
    const mockContractInfo = {
      id: this.data.contractId,
      contractNo: 'CONTRACT_2025001',
      orderNo: 'ORDER_2025001',
      productName: '企业电力优化服务',
      servicePeriod: 12,
      amount: '50000.00',
      status: 'pending',
      createTime: '2025-01-15 10:30:00',
      expireTime: '2025-02-15 10:30:00',
      customerName: '测试企业',
      serviceAddress: '北京市朝阳区测试地址',
      contractUrl: 'https://example.com/contract.pdf',
      terms: [
        '甲方应当按照约定支付服务费用',
        '乙方应当按照约定提供电力服务',
        '双方应当遵守相关法律法规',
        '合同期内不得无故终止服务',
        '如有争议，双方应当友好协商解决'
      ]
    };

    this.setData({
      contractInfo: mockContractInfo
    });
  },

  // 选择签署文件
  chooseSignedFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf', 'jpg', 'jpeg', 'png'],
      success: (res) => {
        const file = res.tempFiles[0];
        
        // 检查文件大小（10MB限制）
        if (file.size > 10 * 1024 * 1024) {
          wx.showToast({
            title: '文件大小不能超过10MB',
            icon: 'none'
          });
          return;
        }

        // 计算文件大小显示文本
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        
        this.setData({
          'signInfo.signedFile': file.path,
          'signInfo.signedFileName': file.name,
          'signInfo.signedFileSize': file.size,
          fileSizeText: fileSizeMB
        });

        this.validateForm();
      },
      fail: (error) => {
        console.error('选择文件失败:', error);
        wx.showToast({
          title: '选择文件失败',
          icon: 'none'
        });
      }
    });
  },

  // 预览签署文件
  previewSignedFile() {
    const { signedFile } = this.data.signInfo;
    if (!signedFile) {
      wx.showToast({
        title: '请先选择签署文件',
        icon: 'none'
      });
      return;
    }

    wx.previewImage({
      urls: [signedFile],
      current: signedFile,
      fail: () => {
        // 如果不是图片，尝试打开文档
        wx.openDocument({
          filePath: signedFile,
          success() {
            console.log('打开文档成功');
          },
          fail(error) {
            console.error('打开文档失败:', error);
            wx.showToast({
              title: '无法预览此文件',
              icon: 'none'
            });
          }
        });
      }
    });
  },

  // 删除签署文件
  deleteSignedFile() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除已选择的签署文件吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'signInfo.signedFile': null,
            'signInfo.signedFileName': '',
            'signInfo.signedFileSize': 0,
            fileSizeText: '0.00'
          });
          this.validateForm();
        }
      }
    });
  },

  // 备注输入
  onRemarksInput(e) {
    this.setData({
      'signInfo.remarks': e.detail.value
    });
    this.validateForm();
  },

  // 表单验证
  validateForm() {
    const { signedFile } = this.data.signInfo;
    const formValid = !!signedFile;
    
    this.setData({ formValid });
  },

  // 提交签署
  async submitSign() {
    if (!this.data.formValid) {
      wx.showToast({
        title: '请先选择签署文件',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认签署',
      content: '确认要提交签署文件吗？提交后将无法修改。',
      success: async (res) => {
        if (res.confirm) {
          await this.uploadSignedFile();
        }
      }
    });
  },

  // 上传签署文件
  async uploadSignedFile() {
    const { signedFile, remarks } = this.data.signInfo;
    
    try {
      this.setData({ 
        submitting: true,
        uploading: true,
        uploadProgress: 0
      });

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        this.setData({
          uploadProgress: Math.min(this.data.uploadProgress + 10, 90)
        });
      }, 200);

      // 上传文件
      const uploadRes = await this.uploadFile(signedFile);
      clearInterval(progressInterval);

      if (!uploadRes.success) {
        throw new Error(uploadRes.message || '文件上传失败');
      }

      this.setData({ uploadProgress: 100 });

      // 提交签署信息
      const signData = {
        contractId: this.data.contractId,
        signedFileUrl: uploadRes.fileUrl,
        signedFileName: this.data.signInfo.signedFileName,
        remarks: remarks
      };

      const res = await apiService.post('/customer/contracts/sign', signData);
      
      if (res.code === 200) {
        wx.showToast({
          title: '签署提交成功',
          icon: 'success'
        });
        
        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        throw new Error(res.message || '签署提交失败');
      }
    } catch (error) {
      console.error('签署提交失败:', error);
      wx.showToast({
        title: error.message || '签署失败',
        icon: 'none'
      });
    } finally {
      this.setData({ 
        submitting: false,
        uploading: false
      });
    }
  },

  // 上传文件
  uploadFile(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${app.globalData.baseUrl}/api/file/upload`,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${app.globalData.token}`
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.code === 200) {
              resolve({
                success: true,
                fileUrl: data.data.url
              });
            } else {
              resolve({
                success: false,
                message: data.message || '上传失败'
              });
            }
          } catch (error) {
            resolve({
              success: false,
              message: '响应解析失败'
            });
          }
        },
        fail: (error) => {
          console.error('文件上传失败:', error);
          resolve({
            success: false,
            message: '网络错误'
          });
        }
      });
    });
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

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
}); 