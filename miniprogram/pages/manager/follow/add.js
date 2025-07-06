// pages/manager/follow/add.js
const app = getApp();
const API = require('../../../utils/api');

Page({
  data: {
    customerId: '',
    customerInfo: {},
    followForm: {
      type: 'phone',
      title: '',
      content: '',
      priority: 'medium',
      nextFollowDate: '',
      nextFollowTime: '',
      tags: [],
      attachments: []
    },
    followTypes: [
      { value: 'phone', label: '电话跟进', icon: '📞', color: '#1890ff' },
      { value: 'visit', label: '实地拜访', icon: '🏢', color: '#52c41a' },
      { value: 'wechat', label: '微信沟通', icon: '💬', color: '#13c2c2' },
      { value: 'email', label: '邮件联系', icon: '📧', color: '#fa8c16' },
      { value: 'meeting', label: '会议讨论', icon: '🤝', color: '#722ed1' },
      { value: 'other', label: '其他方式', icon: '📝', color: '#666' }
    ],
    priorities: [
      { value: 'high', label: '高优先级', color: '#ff4d4f' },
      { value: 'medium', label: '中优先级', color: '#faad14' },
      { value: 'low', label: '低优先级', color: '#52c41a' }
    ],
    commonTags: [
      '产品咨询', '价格议价', '技术支持', '售后服务', '合同签订',
      '需求确认', '方案讨论', '竞品分析', '客户拜访', '关系维护'
    ],
    newTag: '',
    showTagInput: false,
    submitting: false,
    showDatePicker: false,
    showTimePicker: false,
    tempDate: '',
    tempTime: ''
  },

  onLoad: function (options) {
    this.setData({
      customerId: options.customerId || ''
    });
    this.initForm();
    this.loadCustomerInfo();
  },

  // 初始化表单
  initForm() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    
    this.setData({
      'followForm.nextFollowDate': tomorrow.toISOString().split('T')[0],
      'followForm.nextFollowTime': nextHour.toTimeString().split(' ')[0].slice(0, 5)
    });
  },

  // 加载客户信息
  async loadCustomerInfo() {
    try {
      // 模拟API调用
      const customerInfo = {
        id: this.data.customerId,
        name: '张三',
        company: '北京科技有限公司',
        position: '采购经理',
        phone: '13812345678',
        status: 'interested'
      };
      
      this.setData({ customerInfo });
    } catch (error) {
      console.error('加载客户信息失败:', error);
      wx.showToast({
        title: '加载客户信息失败',
        icon: 'none'
      });
    }
  },

  // 选择跟进类型
  onSelectType(e) {
    const { value } = e.currentTarget.dataset;
    this.setData({
      'followForm.type': value
    });
  },

  // 输入标题
  onTitleInput(e) {
    this.setData({
      'followForm.title': e.detail.value
    });
  },

  // 输入内容
  onContentInput(e) {
    this.setData({
      'followForm.content': e.detail.value
    });
  },

  // 选择优先级
  onSelectPriority(e) {
    const { value } = e.currentTarget.dataset;
    this.setData({
      'followForm.priority': value
    });
  },

  // 显示日期选择器
  onShowDatePicker() {
    this.setData({
      showDatePicker: true,
      tempDate: this.data.followForm.nextFollowDate
    });
  },

  // 日期选择确认
  onDateConfirm(e) {
    this.setData({
      'followForm.nextFollowDate': e.detail.value,
      showDatePicker: false
    });
  },

  // 显示时间选择器
  onShowTimePicker() {
    this.setData({
      showTimePicker: true,
      tempTime: this.data.followForm.nextFollowTime
    });
  },

  // 时间选择确认
  onTimeConfirm(e) {
    this.setData({
      'followForm.nextFollowTime': e.detail.value,
      showTimePicker: false
    });
  },

  // 日期选择取消
  onDateCancel() {
    this.setData({
      showDatePicker: false
    });
  },

  // 时间选择取消
  onTimeCancel() {
    this.setData({
      showTimePicker: false
    });
  },

  // 添加标签
  onAddTag(e) {
    const { tag } = e.currentTarget.dataset;
    const { followForm } = this.data;
    
    if (followForm.tags.includes(tag)) {
      // 移除标签
      const newTags = followForm.tags.filter(t => t !== tag);
      this.setData({
        'followForm.tags': newTags
      });
    } else {
      // 添加标签
      this.setData({
        'followForm.tags': [...followForm.tags, tag]
      });
    }
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
    const { newTag, followForm } = this.data;
    
    if (!newTag.trim()) {
      wx.showToast({
        title: '请输入标签内容',
        icon: 'none'
      });
      return;
    }
    
    if (followForm.tags.includes(newTag)) {
      wx.showToast({
        title: '标签已存在',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      'followForm.tags': [...followForm.tags, newTag],
      showTagInput: false,
      newTag: ''
    });
  },

  // 移除标签
  onRemoveTag(e) {
    const { index } = e.currentTarget.dataset;
    const { followForm } = this.data;
    const newTags = followForm.tags.filter((_, i) => i !== index);
    
    this.setData({
      'followForm.tags': newTags
    });
  },

  // 添加附件
  onAddAttachment() {
    const self = this;
    
    wx.chooseMessageFile({
      count: 3,
      type: 'all',
      success: function(res) {
        const { followForm } = self.data;
        const newAttachments = res.tempFiles.map(file => ({
          name: file.name,
          path: file.path,
          size: file.size,
          type: file.type || 'unknown'
        }));
        
        self.setData({
          'followForm.attachments': [...followForm.attachments, ...newAttachments]
        });
      }
    });
  },

  // 移除附件
  onRemoveAttachment(e) {
    const { index } = e.currentTarget.dataset;
    const { followForm } = this.data;
    const newAttachments = followForm.attachments.filter((_, i) => i !== index);
    
    this.setData({
      'followForm.attachments': newAttachments
    });
  },

  // 预览附件
  onPreviewAttachment(e) {
    const { index } = e.currentTarget.dataset;
    const { followForm } = this.data;
    const attachment = followForm.attachments[index];
    
    if (attachment.type.startsWith('image/')) {
      wx.previewImage({
        current: attachment.path,
        urls: followForm.attachments
          .filter(att => att.type.startsWith('image/'))
          .map(att => att.path)
      });
    } else {
      wx.showToast({
        title: '暂不支持预览此类型文件',
        icon: 'none'
      });
    }
  },

  // 验证表单
  validateForm() {
    const { followForm } = this.data;
    
    if (!followForm.title.trim()) {
      wx.showToast({
        title: '请输入跟进标题',
        icon: 'none'
      });
      return false;
    }
    
    if (!followForm.content.trim()) {
      wx.showToast({
        title: '请输入跟进内容',
        icon: 'none'
      });
      return false;
    }
    
    if (!followForm.nextFollowDate) {
      wx.showToast({
        title: '请选择下次跟进日期',
        icon: 'none'
      });
      return false;
    }
    
    if (!followForm.nextFollowTime) {
      wx.showToast({
        title: '请选择下次跟进时间',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },

  // 提交表单
  async onSubmit() {
    if (!this.validateForm()) return;
    
    try {
      this.setData({ submitting: true });
      
      const { followForm, customerId } = this.data;
      
      // 构造提交数据
      const submitData = {
        customerId,
        ...followForm,
        nextFollowTime: `${followForm.nextFollowDate} ${followForm.nextFollowTime}:00`
      };
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      wx.showToast({
        title: '跟进记录添加成功',
        icon: 'success'
      });
      
      // 返回上一页
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

  // 保存草稿
  onSaveDraft() {
    const { followForm } = this.data;
    
    try {
      wx.setStorageSync('followDraft', followForm);
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

  // 加载草稿
  onLoadDraft() {
    try {
      const draft = wx.getStorageSync('followDraft');
      if (draft) {
        this.setData({
          followForm: draft
        });
        wx.showToast({
          title: '草稿已加载',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '暂无草稿',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载草稿失败:', error);
      wx.showToast({
        title: '加载草稿失败',
        icon: 'none'
      });
    }
  },

  // 快速填充模板
  onUseTemplate(e) {
    const { type } = e.currentTarget.dataset;
    const templates = {
      phone: {
        title: '电话沟通客户需求',
        content: '通过电话与客户沟通，了解其具体需求和预算情况。客户表示...',
        tags: ['产品咨询', '需求确认']
      },
      visit: {
        title: '实地拜访客户',
        content: '前往客户公司进行实地拜访，详细了解其业务情况和具体需求。参观了...',
        tags: ['客户拜访', '需求确认']
      },
      wechat: {
        title: '微信沟通跟进',
        content: '通过微信与客户保持沟通，发送相关产品资料和案例。客户反馈...',
        tags: ['关系维护', '资料提供']
      },
      email: {
        title: '邮件发送方案',
        content: '向客户发送详细的产品方案和报价单，等待客户反馈。已发送...',
        tags: ['方案讨论', '价格议价']
      }
    };
    
    const template = templates[type];
    if (template) {
      this.setData({
        'followForm.title': template.title,
        'followForm.content': template.content,
        'followForm.tags': template.tags
      });
    }
  },

  // 获取跟进类型信息
  getTypeInfo(type) {
    return this.data.followTypes.find(t => t.value === type) || this.data.followTypes[0];
  },

  // 获取优先级信息
  getPriorityInfo(priority) {
    return this.data.priorities.find(p => p.value === priority) || this.data.priorities[1];
  },

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}); 