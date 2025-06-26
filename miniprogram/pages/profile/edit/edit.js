// pages/profile/edit/edit.js
const api = require('../../../utils/api');
const auth = require('../../../utils/auth');
const utils = require('../../../utils/utils');

Page({
  data: {
    loading: false,
    submitting: false,
    userInfo: null,
    
    // 表单数据
    formData: {
      name: '',
      phone: '',
      email: '',
      company_name: '',
      industry_type: '',
      registered_address: '',
      contact_person: '',
      contact_phone: ''
    },
    
    // 表单验证错误
    errors: {},
    
    // 行业类型选项
    industryOptions: [
      { value: 'manufacturing', label: '制造业' },
      { value: 'commerce', label: '商业贸易' },
      { value: 'service', label: '服务业' },
      { value: 'real_estate', label: '房地产' },
      { value: 'logistics', label: '物流运输' },
      { value: 'finance', label: '金融业' },
      { value: 'education', label: '教育培训' },
      { value: 'healthcare', label: '医疗健康' },
      { value: 'technology', label: '科技互联网' },
      { value: 'agriculture', label: '农林牧渔' },
      { value: 'mining', label: '采矿业' },
      { value: 'construction', label: '建筑业' },
      { value: 'other', label: '其他' }
    ],
    
    // 选择器相关
    industryIndex: -1,
    showIndustryPicker: false,
    
    // 企业搜索相关
    companySearchResults: [],
    showCompanySearch: false,
    companySearchKeyword: '',
    companySearchTimer: null
  },

  onLoad(options) {
    this.loadUserInfo();
  },

  onShow() {
    // 每次显示页面时检查登录状态
    if (!auth.isLoggedIn()) {
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
      return;
    }
  },

  onPullDownRefresh() {
    this.loadUserInfo().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载用户信息
  async loadUserInfo() {
    if (!auth.isLoggedIn()) {
      wx.redirectTo({
        url: '/pages/auth/login/login'
      });
      return;
    }

    try {
      this.setData({ loading: true });
      
      const userInfo = await api.getUserInfo();
      console.log('用户信息:', userInfo);
      
      // 初始化表单数据
      const formData = {
        name: userInfo.name || '',
        phone: userInfo.phone || '',
        email: userInfo.email || '',
        company_name: userInfo.company_name || '',
        industry_type: userInfo.industry_type || '',
        registered_address: userInfo.registered_address || '',
        contact_person: userInfo.contact_person || '',
        contact_phone: userInfo.contact_phone || ''
      };
      
      // 设置行业类型选择器索引
      const industryIndex = this.data.industryOptions.findIndex(
        option => option.value === userInfo.industry_type
      );
      
      this.setData({
        userInfo,
        formData,
        industryIndex: industryIndex >= 0 ? industryIndex : -1,
        errors: {}
      });
      
    } catch (error) {
      console.error('加载用户信息失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 表单输入处理
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value,
      [`errors.${field}`]: '' // 清除错误信息
    });
    
    // 企业名称搜索
    if (field === 'company_name') {
      this.handleCompanySearch(value);
    }
  },

  // 企业名称搜索
  handleCompanySearch(keyword) {
    // 清除之前的定时器
    if (this.data.companySearchTimer) {
      clearTimeout(this.data.companySearchTimer);
    }
    
    // 设置搜索关键词
    this.setData({
      companySearchKeyword: keyword,
      showCompanySearch: keyword.length >= 2
    });
    
    // 如果关键词长度不够，直接返回
    if (keyword.length < 2) {
      this.setData({
        companySearchResults: [],
        showCompanySearch: false
      });
      return;
    }
    
    // 设置新的定时器，防抖搜索
    const timer = setTimeout(() => {
      this.searchCompanies(keyword);
    }, 300);
    
    this.setData({
      companySearchTimer: timer
    });
  },

  // 搜索企业
  async searchCompanies(keyword) {
    try {
      const results = await api.searchCompanies(keyword);
      console.log('企业搜索结果:', results);
      
      this.setData({
        companySearchResults: results || []
      });
    } catch (error) {
      console.error('企业搜索失败:', error);
      this.setData({
        companySearchResults: []
      });
    }
  },

  // 选择企业
  onCompanySelect(e) {
    const { company } = e.currentTarget.dataset;
    console.log('选择企业:', company);
    
    // 自动填充企业相关信息
    const updates = {
      'formData.company_name': company.company_name,
      'formData.registered_address': company.registered_address || '',
      showCompanySearch: false,
      companySearchResults: [],
      'errors.company_name': ''
    };
    
    // 如果有行业信息，也自动填充
    if (company.industry_type) {
      const industryIndex = this.data.industryOptions.findIndex(
        option => option.value === company.industry_type
      );
      
      if (industryIndex >= 0) {
        updates['industryIndex'] = industryIndex;
        updates['formData.industry_type'] = company.industry_type;
      }
    }
    
    this.setData(updates);
  },

  // 隐藏企业搜索结果
  onHideCompanySearch() {
    this.setData({
      showCompanySearch: false,
      companySearchResults: []
    });
  },

  // 行业类型选择器
  onIndustryChange(e) {
    const index = e.detail.value;
    const selectedOption = this.data.industryOptions[index];
    
    this.setData({
      industryIndex: index,
      'formData.industry_type': selectedOption.value,
      'errors.industry_type': ''
    });
  },

  // 显示行业选择器
  onShowIndustryPicker() {
    this.setData({
      showIndustryPicker: true
    });
  },

  // 隐藏行业选择器
  onHideIndustryPicker() {
    this.setData({
      showIndustryPicker: false
    });
  },

  // 表单验证
  validateForm() {
    const { formData } = this.data;
    const errors = {};
    let isValid = true;

    // 姓名验证
    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = '请输入姓名';
      isValid = false;
    } else if (formData.name.length > 20) {
      errors.name = '姓名长度不能超过20个字符';
      isValid = false;
    }

    // 手机号验证
    if (!formData.phone || formData.phone.trim().length === 0) {
      errors.phone = '请输入手机号';
      isValid = false;
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      errors.phone = '请输入正确的手机号';
      isValid = false;
    }

    // 邮箱验证（可选）
    if (formData.email && formData.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = '请输入正确的邮箱地址';
        isValid = false;
      }
    }

    // 企业名称验证
    if (!formData.company_name || formData.company_name.trim().length === 0) {
      errors.company_name = '请输入企业名称';
      isValid = false;
    } else if (formData.company_name.length > 100) {
      errors.company_name = '企业名称长度不能超过100个字符';
      isValid = false;
    }

    // 行业类型验证
    if (!formData.industry_type || formData.industry_type.trim().length === 0) {
      errors.industry_type = '请选择行业类型';
      isValid = false;
    }

    // 注册地址验证
    if (!formData.registered_address || formData.registered_address.trim().length === 0) {
      errors.registered_address = '请输入注册地址';
      isValid = false;
    } else if (formData.registered_address.length > 200) {
      errors.registered_address = '注册地址长度不能超过200个字符';
      isValid = false;
    }

    // 联系人验证
    if (!formData.contact_person || formData.contact_person.trim().length === 0) {
      errors.contact_person = '请输入联系人姓名';
      isValid = false;
    } else if (formData.contact_person.length > 20) {
      errors.contact_person = '联系人姓名长度不能超过20个字符';
      isValid = false;
    }

    // 联系电话验证
    if (!formData.contact_phone || formData.contact_phone.trim().length === 0) {
      errors.contact_phone = '请输入联系电话';
      isValid = false;
    } else if (!/^1[3-9]\d{9}$/.test(formData.contact_phone)) {
      errors.contact_phone = '请输入正确的联系电话';
      isValid = false;
    }

    this.setData({ errors });
    return isValid;
  },

  // 提交表单
  async onSubmit() {
    if (this.data.submitting) {
      return;
    }

    // 表单验证
    if (!this.validateForm()) {
      wx.showToast({
        title: '请检查输入信息',
        icon: 'error'
      });
      return;
    }

    try {
      this.setData({ submitting: true });

      const updateData = { ...this.data.formData };
      
      // 去除前后空格
      Object.keys(updateData).forEach(key => {
        if (typeof updateData[key] === 'string') {
          updateData[key] = updateData[key].trim();
        }
      });

      console.log('提交更新数据:', updateData);
      
      const result = await api.updateUserInfo(updateData);
      console.log('更新成功:', result);

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      // 更新本地用户信息
      this.setData({
        userInfo: { ...this.data.userInfo, ...updateData }
      });

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (error) {
      console.error('更新用户信息失败:', error);
      
      let errorMessage = '保存失败';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.data && error.data.message) {
        errorMessage = error.data.message;
      }

      wx.showToast({
        title: errorMessage,
        icon: 'error',
        duration: 2000
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 重置表单
  onReset() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置表单吗？所有修改将被清除',
      success: (res) => {
        if (res.confirm) {
          this.loadUserInfo();
          wx.showToast({
            title: '已重置',
            icon: 'success'
          });
        }
      }
    });
  },

  // 页面卸载时清理定时器
  onUnload() {
    if (this.data.companySearchTimer) {
      clearTimeout(this.data.companySearchTimer);
    }
  },

  // 页面隐藏时隐藏弹框
  onHide() {
    this.setData({
      showCompanySearch: false,
      showIndustryPicker: false
    });
  }
}); 