// pages/manager/customers/add.js
const app = getApp();
const API = require('../../../utils/api');

Page({
  data: {
    customerForm: {
      name: '',
      company: '',
      position: '',
      phone: '',
      email: '',
      wechat: '',
      industry: '',
      scale: '',
      source: '',
      address: '',
      remark: '',
      tags: [],
      priority: 'medium',
      status: 'potential'
    },
    industries: [
      '制造业', '科技互联网', '金融保险', '房地产', '医疗健康',
      '教育培训', '零售商贸', '物流运输', '餐饮酒店', '建筑工程',
      '农业', '能源化工', '文化娱乐', '政府机关', '其他'
    ],
    scales: [
      '初创企业（1-20人）', '小型企业（21-100人）', '中型企业（101-500人）',
      '大型企业（501-1000人）', '超大型企业（1000人以上）'
    ],
    sources: [
      '网络推广', '电话营销', '朋友推荐', '展会活动', '客户转介绍',
      '线下拜访', '社交媒体', '合作伙伴', '老客户续约', '其他渠道'
    ],
    priorities: [
      { value: 'high', label: '高优先级', color: '#ff4d4f' },
      { value: 'medium', label: '中优先级', color: '#faad14' },
      { value: 'low', label: '低优先级', color: '#52c41a' }
    ],
    statusOptions: [
      { value: 'potential', label: '潜在客户', color: '#d9d9d9' },
      { value: 'contacted', label: '已联系', color: '#1890ff' },
      { value: 'interested', label: '有意向', color: '#faad14' },
      { value: 'signed', label: '已签约', color: '#52c41a' },
      { value: 'lost', label: '已流失', color: '#ff4d4f' }
    ],
    commonTags: [
      'VIP客户', '重点关注', '决策快', '价格敏感', '品质要求高',
      '长期合作', '新客户', '老客户', '政府采购', '大订单潜力'
    ],
    newTag: '',
    showTagInput: false,
    submitting: false,
    showIndustryPicker: false,
    showScalePicker: false,
    showSourcePicker: false,
    selectedIndustryIndex: -1,
    selectedScaleIndex: -1,
    selectedSourceIndex: -1
  },

  onLoad: function (options) {
    this.initForm();
    this.loadDraftIfExists();
  },

  // 初始化表单
  initForm() {
    // 设置默认值
    this.setData({
      'customerForm.priority': 'medium',
      'customerForm.status': 'potential'
    });
  },

  // 加载草稿（如果存在）
  loadDraftIfExists() {
    try {
      const draft = wx.getStorageSync('customerDraft');
      if (draft && Object.keys(draft).length > 0) {
        wx.showModal({
          title: '发现草稿',
          content: '检测到未完成的客户信息，是否继续编辑？',
          success: (res) => {
            if (res.confirm) {
              this.setData({
                customerForm: { ...this.data.customerForm, ...draft }
              });
              // 更新选择器索引
              this.updatePickerIndexes();
            }
          }
        });
      }
    } catch (error) {
      console.error('加载草稿失败:', error);
    }
  },

  // 更新选择器索引
  updatePickerIndexes() {
    const { customerForm, industries, scales, sources } = this.data;
    
    this.setData({
      selectedIndustryIndex: industries.indexOf(customerForm.industry),
      selectedScaleIndex: scales.indexOf(customerForm.scale),
      selectedSourceIndex: sources.indexOf(customerForm.source)
    });
  },

  // 输入处理
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`customerForm.${field}`]: value
    });
    
    // 自动保存草稿
    this.autoSaveDraft();
  },

  // 选择优先级
  onSelectPriority(e) {
    const { value } = e.currentTarget.dataset;
    this.setData({
      'customerForm.priority': value
    });
    this.autoSaveDraft();
  },

  // 选择状态
  onSelectStatus(e) {
    const { value } = e.currentTarget.dataset;
    this.setData({
      'customerForm.status': value
    });
    this.autoSaveDraft();
  },

  // 显示行业选择器
  onShowIndustryPicker() {
    this.setData({ showIndustryPicker: true });
  },

  // 行业选择确认
  onIndustryConfirm(e) {
    const index = e.detail.value;
    this.setData({
      'customerForm.industry': this.data.industries[index],
      selectedIndustryIndex: index,
      showIndustryPicker: false
    });
    this.autoSaveDraft();
  },

  // 显示规模选择器
  onShowScalePicker() {
    this.setData({ showScalePicker: true });
  },

  // 规模选择确认
  onScaleConfirm(e) {
    const index = e.detail.value;
    this.setData({
      'customerForm.scale': this.data.scales[index],
      selectedScaleIndex: index,
      showScalePicker: false
    });
    this.autoSaveDraft();
  },

  // 显示来源选择器
  onShowSourcePicker() {
    this.setData({ showSourcePicker: true });
  },

  // 来源选择确认
  onSourceConfirm(e) {
    const index = e.detail.value;
    this.setData({
      'customerForm.source': this.data.sources[index],
      selectedSourceIndex: index,
      showSourcePicker: false
    });
    this.autoSaveDraft();
  },

  // 添加标签
  onAddTag(e) {
    const { tag } = e.currentTarget.dataset;
    const { customerForm } = this.data;
    
    if (customerForm.tags.includes(tag)) {
      // 移除标签
      const newTags = customerForm.tags.filter(t => t !== tag);
      this.setData({
        'customerForm.tags': newTags
      });
    } else {
      // 添加标签
      this.setData({
        'customerForm.tags': [...customerForm.tags, tag]
      });
    }
    this.autoSaveDraft();
  },

  // 显示自定义标签输入
  onShowTagInput() {
    this.setData({
      showTagInput: true
    });
  },

  // 隐藏自定义标签输入
  onHideTagInput() {
    this.setData({
      showTagInput: false,
      newTag: ''
    });
  },

  // 输入自定义标签
  onNewTagInput(e) {
    this.setData({
      newTag: e.detail.value
    });
  },

  // 添加自定义标签
  onAddNewTag() {
    const { newTag, customerForm } = this.data;
    
    if (!newTag.trim()) {
      wx.showToast({
        title: '请输入标签内容',
        icon: 'none'
      });
      return;
    }
    
    if (customerForm.tags.includes(newTag)) {
      wx.showToast({
        title: '标签已存在',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      'customerForm.tags': [...customerForm.tags, newTag],
      showTagInput: false,
      newTag: ''
    });
    this.autoSaveDraft();
  },

  // 移除标签
  onRemoveTag(e) {
    const { index } = e.currentTarget.dataset;
    const { customerForm } = this.data;
    const newTags = customerForm.tags.filter((_, i) => i !== index);
    
    this.setData({
      'customerForm.tags': newTags
    });
    this.autoSaveDraft();
  },

  // 自动保存草稿
  autoSaveDraft() {
    try {
      wx.setStorageSync('customerDraft', this.data.customerForm);
    } catch (error) {
      console.error('自动保存草稿失败:', error);
    }
  },

  // 手动保存草稿
  onSaveDraft() {
    try {
      wx.setStorageSync('customerDraft', this.data.customerForm);
      wx.showToast({
        title: '草稿已保存',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存草稿失败:', error);
      wx.showToast({
        title: '保存草稿失败',
        icon: 'none'
      });
    }
  },

  // 清空表单
  onClearForm() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有已填写的信息吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            customerForm: {
              name: '',
              company: '',
              position: '',
              phone: '',
              email: '',
              wechat: '',
              industry: '',
              scale: '',
              source: '',
              address: '',
              remark: '',
              tags: [],
              priority: 'medium',
              status: 'potential'
            },
            selectedIndustryIndex: -1,
            selectedScaleIndex: -1,
            selectedSourceIndex: -1
          });
          
          // 清除草稿
          wx.removeStorageSync('customerDraft');
          
          wx.showToast({
            title: '表单已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  // 使用模板快速填充
  onUseTemplate(e) {
    const { type } = e.currentTarget.dataset;
    const templates = {
      manufacturing: {
        industry: '制造业',
        scale: '中型企业（101-500人）',
        source: '网络推广',
        tags: ['重点关注', '品质要求高'],
        priority: 'high'
      },
      tech: {
        industry: '科技互联网',
        scale: '小型企业（21-100人）',
        source: '朋友推荐',
        tags: ['新客户', '决策快'],
        priority: 'medium'
      },
      government: {
        industry: '政府机关',
        scale: '大型企业（501-1000人）',
        source: '展会活动',
        tags: ['政府采购', '大订单潜力'],
        priority: 'high'
      }
    };
    
    const template = templates[type];
    if (template) {
      this.setData({
        'customerForm.industry': template.industry,
        'customerForm.scale': template.scale,
        'customerForm.source': template.source,
        'customerForm.tags': template.tags,
        'customerForm.priority': template.priority
      });
      this.updatePickerIndexes();
      this.autoSaveDraft();
    }
  },

  // 验证表单
  validateForm() {
    const { customerForm } = this.data;
    
    if (!customerForm.name.trim()) {
      wx.showToast({
        title: '请输入客户姓名',
        icon: 'none'
      });
      return false;
    }
    
    if (!customerForm.company.trim()) {
      wx.showToast({
        title: '请输入公司名称',
        icon: 'none'
      });
      return false;
    }
    
    if (!customerForm.phone.trim()) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      });
      return false;
    }
    
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(customerForm.phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return false;
    }
    
    // 验证邮箱格式（如果填写了邮箱）
    if (customerForm.email && customerForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerForm.email)) {
        wx.showToast({
          title: '请输入正确的邮箱地址',
          icon: 'none'
        });
        return false;
      }
    }
    
    return true;
  },

  // 提交表单
  async onSubmit() {
    if (!this.validateForm()) return;
    
    try {
      this.setData({ submitting: true });
      
      const { customerForm } = this.data;
      
      // 构造提交数据
      const submitData = {
        ...customerForm,
        createTime: new Date().toISOString()
      };
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      wx.showToast({
        title: '客户添加成功',
        icon: 'success'
      });
      
      // 清除草稿
      wx.removeStorageSync('customerDraft');
      
      // 返回客户列表
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
      
    } catch (error) {
      console.error('提交失败:', error);
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 提交并继续添加
  async onSubmitAndContinue() {
    if (!this.validateForm()) return;
    
    try {
      this.setData({ submitting: true });
      
      const { customerForm } = this.data;
      
      // 构造提交数据
      const submitData = {
        ...customerForm,
        createTime: new Date().toISOString()
      };
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      wx.showToast({
        title: '客户添加成功',
        icon: 'success'
      });
      
      // 清空表单继续添加
      this.setData({
        customerForm: {
          name: '',
          company: '',
          position: '',
          phone: '',
          email: '',
          wechat: '',
          industry: customerForm.industry, // 保留行业
          scale: customerForm.scale, // 保留规模
          source: customerForm.source, // 保留来源
          address: '',
          remark: '',
          tags: [],
          priority: 'medium',
          status: 'potential'
        }
      });
      
      // 清除草稿
      wx.removeStorageSync('customerDraft');
      
    } catch (error) {
      console.error('提交失败:', error);
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 获取优先级信息
  getPriorityInfo(priority) {
    return this.data.priorities.find(p => p.value === priority) || this.data.priorities[1];
  },

  // 获取状态信息
  getStatusInfo(status) {
    return this.data.statusOptions.find(s => s.value === status) || this.data.statusOptions[0];
  }
}); 