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
    
    // 身份认证文件（本地路径，用于显示）
    authFiles: {
      businessLicense: '', // 营业执照
      idCardFront: '',     // 身份证正面
      idCardBack: ''       // 身份证反面
    },
    
    // 身份认证文件服务器路径（用于提交）
    authFilesServer: {
      businessLicense: '', // 营业执照服务器路径
      idCardFront: '',     // 身份证正面服务器路径
      idCardBack: ''       // 身份证反面服务器路径
    },
    
    // OCR识别结果
    ocrResults: {
      businessLicense: null,
      idCard: null
    },
    
    loading: false,
    submitting: false
  },

  async onLoad(options) {
    console.log('认证页面加载，参数:', options);
    
    if (options.status) {
      // 格式化认证状态
      const formattedStatus = this.formatAuthStatus(options.status);
      this.setData({
        authStatus: formattedStatus,
        // 如果是认证中状态，默认显示第二步（上传文件页面）
        currentStep: formattedStatus === 'pending' ? 2 : 1
      });
    }
    
    this.loadUserInfo();
    // 优先用auth/status接口回显图片
    try {
      console.log('开始加载认证图片...');
      const res = await authAPI.getAuthStatus();
      if (res && res.data) {
        // 优先用authFiles
        if (res.data.authFiles) {
          // 检查图片URL有效性并设置
          const authFiles = {};
          const fileTypes = ['businessLicense', 'idCardFront', 'idCardBack'];
          
          fileTypes.forEach(type => {
            const url = res.data.authFiles[type];
            if (url && url.trim()) {
              // 检查URL是否包含签名参数，如果没有则可能是过期
              if (url.includes('?Expires=') && url.includes('&Signature=')) {
                // 检查URL是否过期
                const expiresMatch = url.match(/[?&]Expires=(\d+)/);
                if (expiresMatch) {
                  const expiresTime = parseInt(expiresMatch[1]);
                  const currentTime = Math.floor(Date.now() / 1000);
                  
                  if (expiresTime > currentTime) {
                    // URL未过期
                    authFiles[type] = url;
                    console.log(`图片URL有效: ${type}`, url);
                  } else {
                    console.warn(`图片URL已过期: ${type}`, url);
                    // URL已过期，不设置到authFiles中，让图片加载失败时自动重试
                  }
                } else {
                  authFiles[type] = url;
                }
                              } else {
                  console.warn(`图片URL缺少签名参数: ${type}`, url);
                  // URL格式不正确，不设置到authFiles中，让图片加载失败时自动重试
                }
            }
          });
          
          console.log('设置认证图片:', authFiles);
          this.setData({
            'authFiles.businessLicense': authFiles.businessLicense || '',
            'authFiles.idCardFront': authFiles.idCardFront || '',
            'authFiles.idCardBack': authFiles.idCardBack || '',
            // 同时设置服务器路径，用于提交验证
            'authFilesServer.businessLicense': authFiles.businessLicense || '',
            'authFilesServer.idCardFront': authFiles.idCardFront || '',
            'authFilesServer.idCardBack': authFiles.idCardBack || ''
          });
        }
        // 兼容直接返回的url字段
        if (res.data.businessLicenseUrl || res.data.idCardFrontUrl || res.data.idCardBackUrl) {
          this.setData({
            'authFiles.businessLicense': res.data.businessLicenseUrl || this.data.authFiles.businessLicense,
            'authFiles.idCardFront': res.data.idCardFrontUrl || this.data.authFiles.idCardFront,
            'authFiles.idCardBack': res.data.idCardBackUrl || this.data.authFiles.idCardBack,
            // 同时设置服务器路径，用于提交验证
            'authFilesServer.businessLicense': res.data.businessLicenseUrl || this.data.authFilesServer.businessLicense,
            'authFilesServer.idCardFront': res.data.idCardFrontUrl || this.data.authFilesServer.idCardFront,
            'authFilesServer.idCardBack': res.data.idCardBackUrl || this.data.authFilesServer.idCardBack
          });
        }
      } else {
        // 降级用profile接口
        const profileRes = await app.request({ url: '/mini/user/profile' });
        if (profileRes && profileRes.data) {
          this.setData({
            'authFiles.businessLicense': profileRes.data.businessLicenseUrl || '',
            'authFiles.idCardFront': profileRes.data.idCardFrontUrl || '',
            'authFiles.idCardBack': profileRes.data.idCardBackUrl || '',
            // 同时设置服务器路径，用于提交验证
            'authFilesServer.businessLicense': profileRes.data.businessLicenseUrl || '',
            'authFilesServer.idCardFront': profileRes.data.idCardFrontUrl || '',
            'authFilesServer.idCardBack': profileRes.data.idCardBackUrl || ''
          });
        }
      }
    } catch (e) {
      console.error('加载认证图片失败', e);
    }
    this.loadCurrentAuthStatus();
    
    // 如果是认证中状态，加载已提交的认证数据
    if (this.data.authStatus === 'pending') {
      // 延迟加载认证数据，确保onLoad中的图片设置不被覆盖
      setTimeout(() => {
        this.loadAuthData();
      }, 100);
    }
  },

  // 格式化认证状态
  formatAuthStatus(status) {
    console.log('格式化认证状态:', status);
    
    // 如果没有状态，默认为未认证
    if (!status) {
      return 'unverified';
    }
    
    // 标准化状态值
    const statusStr = String(status).toLowerCase();
    
    // 认证状态映射
    const statusMap = {
      // 已认证状态
      'verified': 'verified',
      'approved': 'verified',
      'passed': 'verified',
      'success': 'verified',
      '1': 'verified',
      'true': 'verified',
      
      // 认证中状态
      'pending': 'pending',
      'reviewing': 'pending',
      'auditing': 'pending',
      'processing': 'pending',
      'in_progress': 'pending',
      'submitted': 'pending',
      '2': 'pending',
      
      // 未认证状态
      'unverified': 'unverified',
      'not_verified': 'unverified',
      'rejected': 'unverified',
      'failed': 'unverified',
      'cancelled': 'unverified',
      '0': 'unverified',
      'false': 'unverified',
      'null': 'unverified',
      'undefined': 'unverified'
    };
    
    const result = statusMap[statusStr] || 'unverified';
    console.log('认证状态映射结果:', status, '->', result);
    
    return result;
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

  // 加载当前认证状态
  async loadCurrentAuthStatus() {
    try {
      console.log('开始加载当前认证状态');
      
      // 从服务器获取最新的认证状态
      const response = await authAPI.getAuthStatus();
      if (response && response.data) {
        const serverAuthStatus = response.data.companyAuthStatus || response.data.authStatus || 'unverified';
        console.log('从服务器获取的最新认证状态:', serverAuthStatus);
        
        // 更新页面状态
        const formattedStatus = this.formatAuthStatus(serverAuthStatus);
        this.setData({
          authStatus: formattedStatus,
          // 如果是认证中状态，默认显示第二步
          currentStep: formattedStatus === 'pending' ? 2 : this.data.currentStep
        });
        
        // 更新本地存储
        const userInfo = wx.getStorageSync('userInfo') || {};
        userInfo.companyAuthStatus = serverAuthStatus;
        userInfo.authStatus = serverAuthStatus;
        wx.setStorageSync('userInfo', userInfo);
        
        // 如果是认证中状态，加载认证数据
        if (formattedStatus === 'pending') {
          this.loadAuthData();
        }
      }
    } catch (error) {
      console.error('加载当前认证状态失败:', error);
      // 如果服务器请求失败，尝试从本地存储获取
      const userInfo = wx.getStorageSync('userInfo') || {};
      const localAuthStatus = userInfo.companyAuthStatus || userInfo.authStatus || 'unverified';
      const formattedStatus = this.formatAuthStatus(localAuthStatus);
      this.setData({
        authStatus: formattedStatus,
        currentStep: formattedStatus === 'pending' ? 2 : this.data.currentStep
      });
    }
  },

  // 加载已提交的认证数据
  async loadAuthData() {
    try {
      console.log('开始加载认证数据');
      
      // 首先尝试从服务器获取最新的认证数据
      try {
        wx.showLoading({
          title: '加载中...',
          mask: true
        });
        
        // 获取当前用户ID
        const userInfo = wx.getStorageSync('userInfo') || {};
        const userId = userInfo.id;
        
        if (!userId) {
          throw new Error('用户ID不存在');
        }
        
        const response = await authAPI.getAuthStatus();
        wx.hideLoading();
        
        if (response && response.data) {
          const authData = response.data;
          console.log('从服务器获取到的认证数据:', authData);
          
          // 处理数据映射，支持多种数据结构
          const updateData = this.mapAuthDataFromServer(authData);
          
          if (Object.keys(updateData).length > 0) {
            // 合并数据而不是覆盖，确保已设置的图片不被清除
            const currentData = this.data;
            const mergedData = {};
            
            Object.keys(updateData).forEach(key => {
              if (key === 'authFiles' || key === 'authFilesServer') {
                // 对于图片数据，只设置空值，不覆盖已有值
                const currentFiles = currentData[key] || {};
                const newFiles = updateData[key] || {};
                mergedData[key] = { ...currentFiles };
                
                Object.keys(newFiles).forEach(fileKey => {
                  if (newFiles[fileKey] && !currentFiles[fileKey]) {
                    mergedData[key][fileKey] = newFiles[fileKey];
                  }
                });
              } else {
                mergedData[key] = updateData[key];
              }
            });
            
            this.setData(mergedData);
          }
          
          // 保存到本地缓存
          wx.setStorageSync('authData', {
            basicInfo: updateData.basicInfo || this.data.basicInfo,
            authFiles: updateData.authFiles || this.data.authFiles,
            ocrResults: updateData.ocrResults || this.data.ocrResults,
            authStatus: updateData.authStatus || this.data.authStatus
          });
          
          console.log('服务器认证数据加载完成');
          return;
        }
      } catch (serverError) {
        wx.hideLoading();
        console.warn('从服务器获取认证数据失败，尝试使用本地缓存:', serverError);
        
        // 如果是认证中状态但获取数据失败，提示用户
        if (this.data.authStatus === 'pending') {
          wx.showToast({
            title: '认证数据获取失败，显示本地缓存',
            icon: 'none',
            duration: 2000
          });
        }
      }
      
      // 从本地缓存获取认证数据
      const cachedAuthData = wx.getStorageSync('authData');
      if (cachedAuthData) {
        console.log('使用缓存的认证数据:', cachedAuthData);
        
        // 安全地合并数据，避免null或undefined导致的错误
        const updateData = {};
        
        if (cachedAuthData.basicInfo && typeof cachedAuthData.basicInfo === 'object') {
          updateData.basicInfo = { ...this.data.basicInfo, ...cachedAuthData.basicInfo };
        }
        
        if (cachedAuthData.authFiles && typeof cachedAuthData.authFiles === 'object') {
          updateData.authFiles = { ...this.data.authFiles, ...cachedAuthData.authFiles };
          // 如果没有authFilesServer，使用authFiles作为服务器路径
          if (!cachedAuthData.authFilesServer) {
            updateData.authFilesServer = { ...this.data.authFilesServer, ...cachedAuthData.authFiles };
          }
        }
        
        if (cachedAuthData.authFilesServer && typeof cachedAuthData.authFilesServer === 'object') {
          updateData.authFilesServer = { ...this.data.authFilesServer, ...cachedAuthData.authFilesServer };
        }
        
        if (cachedAuthData.ocrResults && typeof cachedAuthData.ocrResults === 'object') {
          updateData.ocrResults = { ...this.data.ocrResults, ...cachedAuthData.ocrResults };
        }
        
        if (Object.keys(updateData).length > 0) {
          // 合并数据而不是覆盖，确保已设置的图片不被清除
          const currentData = this.data;
          const mergedData = {};
          
          Object.keys(updateData).forEach(key => {
            if (key === 'authFiles' || key === 'authFilesServer') {
              // 对于图片数据，只设置空值，不覆盖已有值
              const currentFiles = currentData[key] || {};
              const newFiles = updateData[key] || {};
              mergedData[key] = { ...currentFiles };
              
              Object.keys(newFiles).forEach(fileKey => {
                if (newFiles[fileKey] && !currentFiles[fileKey]) {
                  mergedData[key][fileKey] = newFiles[fileKey];
                }
              });
            } else {
              mergedData[key] = updateData[key];
            }
          });
          
          this.setData(mergedData);
        }
        
        console.log('缓存认证数据加载完成');
      } else {
        console.log('未找到认证数据');
        
        // 如果是认证中状态但没有缓存数据，尝试从用户信息中获取基本信息
        if (this.data.authStatus === 'pending') {
          this.fillBasicInfoFromUserData();
          wx.showToast({
            title: '认证数据加载中，显示基本信息',
            icon: 'none',
            duration: 2000
          });
        } else {
          wx.showToast({
            title: '暂无认证数据',
            icon: 'none',
            duration: 2000
          });
        }
      }
    } catch (error) {
      console.error('加载认证数据失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 映射服务器认证数据到页面格式
  mapAuthDataFromServer(serverData) {
    console.log('开始映射服务器数据:', serverData);
    
    const updateData = {};
    
    // 映射基本信息
    const basicInfo = {};
    
    // 支持多种字段名映射
    const basicInfoMapping = {
      realName: ['realName', 'name', 'userName', 'fullName'],
      companyName: ['companyName', 'company', 'companyTitle', 'enterpriseName'],
      phone: ['phone', 'phoneNumber', 'mobile', 'contactPhone'],
      position: ['position', 'job', 'jobTitle', 'role'],
      powerCapacity: ['powerCapacity', 'capacity', 'electricCapacity'],
      monthlyUsage: ['monthlyUsage', 'monthlyConsumption', 'usage'],
      currentPrice: ['currentPrice', 'price', 'electricPrice']
    };
    
    // 从多个可能的数据源映射基本信息
    Object.keys(basicInfoMapping).forEach(key => {
      const possibleFields = basicInfoMapping[key];
      for (const field of possibleFields) {
        if (serverData[field] || 
            (serverData.basicInfo && serverData.basicInfo[field]) ||
            (serverData.userInfo && serverData.userInfo[field]) ||
            (serverData.profile && serverData.profile[field])) {
          
          basicInfo[key] = serverData[field] || 
                          serverData.basicInfo?.[field] || 
                          serverData.userInfo?.[field] || 
                          serverData.profile?.[field];
          break;
        }
      }
    });
    
    if (Object.keys(basicInfo).length > 0) {
      updateData.basicInfo = { ...this.data.basicInfo, ...basicInfo };
    }
    
    // 映射认证文件
    const authFiles = {};
    const fileMapping = {
      businessLicense: ['businessLicense', 'businessLicenseUrl', 'licenseFile'],
      idCardFront: ['idCardFront', 'idCardFrontUrl', 'idFrontFile'],
      idCardBack: ['idCardBack', 'idCardBackUrl', 'idBackFile']
    };
    
    Object.keys(fileMapping).forEach(key => {
      const possibleFields = fileMapping[key];
      for (const field of possibleFields) {
        if (serverData[field] || 
            (serverData.authFiles && serverData.authFiles[field]) ||
            (serverData.files && serverData.files[field])) {
          
          authFiles[key] = serverData[field] || 
                          serverData.authFiles?.[field] || 
                          serverData.files?.[field];
          break;
        }
      }
    });
    
    if (Object.keys(authFiles).length > 0) {
      updateData.authFiles = { ...this.data.authFiles, ...authFiles };
      // 同时设置服务器路径，用于提交验证
      updateData.authFilesServer = { ...this.data.authFilesServer, ...authFiles };
    }
    
    // 映射OCR结果
    if (serverData.ocrResults || serverData.ocrData) {
      updateData.ocrResults = { 
        ...this.data.ocrResults, 
        ...(serverData.ocrResults || serverData.ocrData) 
      };
    }
    
    // 映射认证状态（优先使用企业认证状态）
    const statusMapping = ['companyAuthStatus', 'authStatus', 'status', 'verifyStatus', 'certificationStatus'];
    for (const field of statusMapping) {
      if (serverData[field]) {
        updateData.authStatus = this.formatAuthStatus(serverData[field]);
        break;
      }
    }
    
    console.log('映射后的数据:', updateData);
    return updateData;
  },

  // 从用户数据中填充基本信息（降级方案）
  fillBasicInfoFromUserData() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      console.log('使用用户信息填充基本信息:', userInfo);
      
      const basicInfo = {
        realName: userInfo.realName || userInfo.name || userInfo.nickName || '',
        companyName: userInfo.companyName || '',
        phone: userInfo.phone || '',
        position: userInfo.position || '',
        powerCapacity: '',
        monthlyUsage: '',
        currentPrice: ''
      };
      
      // 只更新有值的字段
      const filteredBasicInfo = {};
      Object.keys(basicInfo).forEach(key => {
        if (basicInfo[key]) {
          filteredBasicInfo[key] = basicInfo[key];
        }
      });
      
      if (Object.keys(filteredBasicInfo).length > 0) {
        this.setData({
          basicInfo: { ...this.data.basicInfo, ...filteredBasicInfo }
        });
        console.log('已从用户信息填充基本信息:', filteredBasicInfo);
      }
    } catch (error) {
      console.error('从用户信息填充基本信息失败:', error);
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
      
      if (response && response.data && response.data.companies && Array.isArray(response.data.companies)) {
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
      
      // 出错时使用本地模拟数据，确保始终是数组
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
    if (company) {
      this.setData({
        'basicInfo.companyName': company,
        showCompanySuggestions: false
      });
    }
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
        // 更新文件路径：保存服务器URL用于提交，预览URL用于显示
        this.setData({
          [`authFiles.${type}`]: uploadResult.previewUrl,  // 用预览URL回显
          [`authFilesServer.${type}`]: uploadResult.storageUrl  // 用storageUrl提交
        });
        
        // 暂时去掉OCR识别功能
        // if (type === 'businessLicense' || type.includes('idCard')) {
        //   await this.performOCR(uploadResult.url, type);
        // }
        
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
            if (data.code === 0 || data.code === 200) { // 兼容0和200
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
        authFiles: this.data.authFilesServer,  // 使用服务器路径提交
        ocrResults: this.data.ocrResults
      };
      
      console.log('提交认证数据:', authData);
      
      const result = await authAPI.submitAuth(authData);
      
      wx.hideLoading();
      
      if (result && (result.success || result.code === 200)) {
        // 缓存认证数据（保存本地路径用于显示）
        const authData = {
          basicInfo: this.data.basicInfo,
          authFiles: this.data.authFiles,  // 保存本地路径用于重新进入时显示
          authFilesServer: this.data.authFilesServer,  // 保存服务器路径
          ocrResults: this.data.ocrResults
        };
        wx.setStorageSync('authData', authData);
        
        // 更新用户信息中的认证状态
        const userInfo = wx.getStorageSync('userInfo') || {};
        userInfo.authStatus = 'pending';
        wx.setStorageSync('userInfo', userInfo);
        
        // 标记需要刷新我的页面
        wx.setStorageSync('needRefreshProfile', true);
        
        wx.showModal({
          title: '提交成功',
          content: '您的认证申请已提交，我们将在1-3个工作日内完成审核，请耐心等待。',
          showCancel: false,
          success: () => {
            // 通知上一页刷新数据
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            if (prevPage && prevPage.route === 'pages/menu/user/profile/index/index') {
              // 如果上一页是我的页面，调用其刷新方法
              if (typeof prevPage.refreshUserInfo === 'function') {
                prevPage.refreshUserInfo();
              }
            }
            
            wx.navigateBack({
              success: () => {
                console.log('认证提交成功，已返回我的页面');
              }
            });
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
    const { authFilesServer, authFiles } = this.data;
    
    console.log('验证认证文件 - authFilesServer:', authFilesServer);
    console.log('验证认证文件 - authFiles:', authFiles);
    
    if (!authFilesServer.businessLicense) {
      console.log('营业执照验证失败 - authFilesServer.businessLicense:', authFilesServer.businessLicense);
      wx.showToast({
        title: '请上传营业执照',
        icon: 'none'
      });
      return false;
    }
    
    if (!authFilesServer.idCardFront) {
      console.log('身份证正面验证失败 - authFilesServer.idCardFront:', authFilesServer.idCardFront);
      wx.showToast({
        title: '请上传身份证正面',
        icon: 'none'
      });
      return false;
    }
    
    if (!authFilesServer.idCardBack) {
      console.log('身份证反面验证失败 - authFilesServer.idCardBack:', authFilesServer.idCardBack);
      wx.showToast({
        title: '请上传身份证反面',
        icon: 'none'
      });
      return false;
    }
    
    console.log('认证文件验证通过');
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
          // 清除本地路径和服务器路径
          this.setData({
            [`authFiles.${type}`]: '',
            [`authFilesServer.${type}`]: ''
          });
          
          // 清除OCR结果（暂时保留，虽然OCR功能已去掉）
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
  },

  // 图片加载成功
  onImageLoad(e) {
    const { type } = e.currentTarget.dataset;
    console.log(`图片加载成功: ${type}`);
  },

  // 图片加载失败
  onImageError(e) {
    const { type } = e.currentTarget.dataset;
    console.error(`图片加载失败: ${type}`, e);
    
    // 检查错误类型
    const errorDetail = e.detail;
    if (errorDetail && errorDetail.errMsg) {
      console.log(`图片加载错误详情: ${errorDetail.errMsg}`);
    }
    
    // 统一使用retryLoadImage方法重新获取图片
    this.retryLoadImage(type);
  },

  // 重试加载图片
  async retryLoadImage(type) {
    try {
      wx.showLoading({ title: '重新加载图片...' });
      
      // 重新获取认证状态，获取最新的签名URL
      const res = await authAPI.getAuthStatus();
      if (res && res.data && res.data.authFiles) {
        const newUrl = res.data.authFiles[type];
        if (newUrl) {
          console.log(`重新获取到图片URL: ${type}`, newUrl);
          this.setData({
            [`authFiles.${type}`]: newUrl,
            [`authFilesServer.${type}`]: newUrl  // 同时更新服务器路径
          });
          
          wx.showToast({
            title: '图片重新加载成功',
            icon: 'success'
          });
        } else {
          throw new Error('未找到图片URL');
        }
      } else {
        throw new Error('获取认证状态失败');
      }
    } catch (error) {
      console.error('重试加载图片失败:', error);
      wx.showToast({
        title: '图片加载失败，请检查网络',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },



  // 取消认证
  cancelAuth() {
    wx.showModal({
      title: '取消认证',
      content: '确定要取消当前认证申请吗？取消后可以重新提交认证申请。',
      confirmText: '确定取消',
      cancelText: '继续认证',
      success: (res) => {
        if (res.confirm) {
          this.performCancelAuth();
        }
      }
    });
  },

  // 执行取消认证
  async performCancelAuth() {
    try {
      wx.showLoading({
        title: '取消中...',
        mask: true
      });

      // 调用取消认证API
      const result = await authAPI.cancelAuth();
      
      wx.hideLoading();
      
      if (result && (result.success || result.code === 200)) {
        // 更新认证状态
        this.setData({
          authStatus: 'unverified'
        });
        
        // 更新本地存储的用户信息
        const userInfo = wx.getStorageSync('userInfo') || {};
        userInfo.authStatus = 'unverified';
        wx.setStorageSync('userInfo', userInfo);
        
        // 清除认证数据缓存
        wx.removeStorageSync('authData');
        
        // 标记需要刷新我的页面
        wx.setStorageSync('needRefreshProfile', true);
        
        // 通知上一页刷新数据
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        if (prevPage && prevPage.route === 'pages/menu/user/profile/index/index') {
          // 如果上一页是我的页面，调用其刷新方法
          if (typeof prevPage.refreshUserInfo === 'function') {
            prevPage.refreshUserInfo();
          }
        }
        
        wx.showToast({
          title: '已取消认证',
          icon: 'success'
        });
        
        console.log('认证已取消，重新启用编辑模式');
      } else {
        throw new Error(result.message || '取消认证失败');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('取消认证失败:', error);
      wx.showToast({
        title: error.message || '取消认证失败，请重试',
        icon: 'none'
      });
    }
  }
}) 