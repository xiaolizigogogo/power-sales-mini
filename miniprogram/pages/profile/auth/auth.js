const app = getApp()
const { authAPI } = require('../../../utils/api')
const { getUploadBaseURL } = require('../../../utils/env')
const config = require('../../../utils/config')

Page({
  data: {
    currentStep: 1, // 当前步骤：1-基本信息，2-身份认证
    authStatus: 'unverified', // 认证状态
    
    // 基本信息
    basicInfo: {
      realName: '',
      companyName: '',
      phone: '',
      position: '',
      powerCapacity: '',
      monthlyUsage: '',
      currentPrice: ''
    },
    
    // 企业名称候选列表
    companySuggestions: [],
    showCompanySuggestions: false,
    
    // 身份认证
    authFiles: {
      businessLicense: '', // 营业执照
      idCardFront: '',     // 身份证正面
      idCardBack: ''       // 身份证反面
    },
    
    // OCR识别结果
    ocrResults: {
      businessLicense: null,
      idCard: null
    },
    
    loading: false,
    submitting: false
  },

  onLoad(options) {
    console.log('认证页面加载，参数:', options);
    
    if (options.status) {
      this.setData({
        authStatus: options.status
      });
    }
    
    this.loadUserInfo();
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      console.log('加载用户信息:', userInfo);
      
      this.setData({
        'basicInfo.realName': userInfo.realName || userInfo.name || '',
        'basicInfo.companyName': userInfo.companyName || '',
        'basicInfo.phone': userInfo.phone || ''
      });
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  // 基本信息输入处理
  onBasicInfoInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`basicInfo.${field}`]: value
    });
    
    // 企业名称智能匹配
    if (field === 'companyName' && value.length > 1) {
      this.searchCompanies(value);
    } else if (field === 'companyName') {
      this.setData({
        showCompanySuggestions: false
      });
    }
  },

  // 搜索企业名称
  async searchCompanies(keyword) {
    try {
      console.log('搜索企业名称:', keyword);
      
      // 调用后端API搜索企业名称
      const response = await authAPI.searchCompanies(keyword);
      
      if (response && response.data && response.data.companies) {
        this.setData({
          companySuggestions: response.data.companies,
          showCompanySuggestions: true
        });
      } else {
        // 如果API失败，使用本地模拟数据
        const suggestions = [
          `${keyword}科技有限公司`,
          `${keyword}实业有限公司`,
          `${keyword}电力有限公司`,
          `${keyword}集团有限公司`,
          `${keyword}新能源有限公司`
        ];
        
        this.setData({
          companySuggestions: suggestions,
          showCompanySuggestions: true
        });
      }
    } catch (error) {
      console.error('搜索企业名称失败:', error);
      
      // 出错时使用本地模拟数据
      const suggestions = [
        `${keyword}科技有限公司`,
        `${keyword}实业有限公司`,
        `${keyword}电力有限公司`,
        `${keyword}集团有限公司`,
        `${keyword}新能源有限公司`
      ];
      
      this.setData({
        companySuggestions: suggestions,
        showCompanySuggestions: true
      });
    }
  },

  // 选择企业名称
  selectCompany(e) {
    const { company } = e.currentTarget.dataset;
    this.setData({
      'basicInfo.companyName': company,
      showCompanySuggestions: false
    });
  },

  // 隐藏企业名称建议
  hideCompanySuggestions() {
    this.setData({
      showCompanySuggestions: false
    });
  },

  // 下一步
  async nextStep() {
    if (!this.validateBasicInfo()) {
      return;
    }
    
    this.setData({
      currentStep: 2
    });
  },

  // 上一步
  prevStep() {
    this.setData({
      currentStep: 1
    });
  },

  // 验证基本信息
  validateBasicInfo() {
    const { basicInfo } = this.data;
    
    if (!basicInfo.realName.trim()) {
      wx.showToast({
        title: '请填写真实姓名',
        icon: 'none'
      });
      return false;
    }
    
    if (!basicInfo.companyName.trim()) {
      wx.showToast({
        title: '请填写企业名称',
        icon: 'none'
      });
      return false;
    }
    
    if (!basicInfo.phone.trim()) {
      wx.showToast({
        title: '请填写联系方式',
        icon: 'none'
      });
      return false;
    }
    
    if (!/^1[3-9]\d{9}$/.test(basicInfo.phone)) {
      wx.showToast({
        title: '请填写正确的手机号',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },

  // 选择并上传文件
  async uploadFile(e) {
    const { type } = e.currentTarget.dataset;
    
    try {
      const res = await this.chooseImage();
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        const tempFilePath = res.tempFilePaths[0];
        
        wx.showLoading({
          title: '上传中...',
          mask: true
        });
        
        // 上传文件
        const uploadResult = await this.uploadToServer(tempFilePath, type);
        
        // 更新文件路径
        this.setData({
          [`authFiles.${type}`]: uploadResult.url
        });
        
        // OCR识别
        if (type === 'businessLicense' || type.includes('idCard')) {
          await this.performOCR(uploadResult.url, type);
        }
        
        wx.hideLoading();
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('上传文件失败:', error);
      wx.showToast({
        title: '上传失败，请重试',
        icon: 'none'
      });
    }
  },

  // 选择图片
  chooseImage() {
    return new Promise((resolve, reject) => {
      wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: resolve,
        fail: reject
      });
    });
  },

  // 上传到服务器
  async uploadToServer(filePath, type) {
    const uploadUrl = `${getUploadBaseURL()}/api/v1/upload/auth/${type}`;
    console.log('上传文件到:', uploadUrl);
    
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: uploadUrl,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        success: (res) => {
          console.log('上传响应:', res);
          try {
            const data = JSON.parse(res.data);
            if (data.code === 200) {
              resolve(data.data);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch (error) {
            console.error('解析上传响应失败:', error);
            reject(error);
          }
        },
        fail: (error) => {
          console.error('上传请求失败:', error);
          reject(error);
        }
      });
    });
  },

  // OCR识别
  async performOCR(imageUrl, type) {
    try {
      console.log('开始OCR识别:', type, imageUrl);
      
      // 调用OCR识别API
      const ocrResult = await authAPI.performOCR({
        imageUrl: imageUrl,
        type: type
      });
      
      console.log('OCR识别结果:', ocrResult);
      
      if (ocrResult && ocrResult.data) {
        if (type === 'businessLicense') {
          this.setData({
            'ocrResults.businessLicense': ocrResult.data,
            'basicInfo.companyName': ocrResult.data.companyName || this.data.basicInfo.companyName
          });
        } else if (type === 'idCardFront') {
          this.setData({
            'ocrResults.idCard': ocrResult.data,
            'basicInfo.realName': ocrResult.data.name || this.data.basicInfo.realName
          });
        }
        
        wx.showToast({
          title: 'OCR识别成功',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('OCR识别失败:', error);
      wx.showToast({
        title: 'OCR识别失败',
        icon: 'none'
      });
    }
  },

  // 提交认证申请
  async submitAuth() {
    if (!this.validateAuthFiles()) {
      return;
    }
    
    try {
      this.setData({ submitting: true });
      
      wx.showLoading({
        title: '提交中...',
        mask: true
      });
      
      const authData = {
        basicInfo: this.data.basicInfo,
        authFiles: this.data.authFiles,
        ocrResults: this.data.ocrResults
      };
      
      console.log('提交认证数据:', authData);
      
      const result = await authAPI.submitAuth(authData);
      
      wx.hideLoading();
      
      if (result && (result.success || result.code === 200)) {
        wx.showModal({
          title: '提交成功',
          content: '您的认证申请已提交，我们将在1-3个工作日内完成审核，请耐心等待。',
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
      } else {
        throw new Error(result.message || '提交失败');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('提交认证失败:', error);
      wx.showToast({
        title: error.message || '提交失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 验证认证文件
  validateAuthFiles() {
    const { authFiles } = this.data;
    
    if (!authFiles.businessLicense) {
      wx.showToast({
        title: '请上传营业执照',
        icon: 'none'
      });
      return false;
    }
    
    if (!authFiles.idCardFront) {
      wx.showToast({
        title: '请上传身份证正面',
        icon: 'none'
      });
      return false;
    }
    
    if (!authFiles.idCardBack) {
      wx.showToast({
        title: '请上传身份证反面',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },

  // 预览图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    if (url) {
      wx.previewImage({
        urls: [url],
        current: url
      });
    }
  },

  // 删除图片
  deleteImage(e) {
    const { type } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            [`authFiles.${type}`]: ''
          });
          
          // 清除OCR结果
          if (type === 'businessLicense') {
            this.setData({
              'ocrResults.businessLicense': null
            });
          } else if (type === 'idCardFront') {
            this.setData({
              'ocrResults.idCard': null
            });
          }
        }
      }
    });
  }
}) 