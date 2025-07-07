// pages/manager/profile/change-password.js
const app = getApp();
const { roleManager } = require('../../../utils/role-manager');
const { userExperienceMixin } = require('../../../utils/user-experience');

Page({
  data: {
    passwordForm: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    showOldPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
    passwordStrength: 0,
    hasNumber: false,
    hasLetter: false,
    hasSpecialChar: false,
    errors: {},
    submitting: false
  },

  onLoad: function (options) {
    // 页面加载时的初始化
  },

  // 当前密码输入
  onOldPasswordInput(e) {
    this.setData({
      'passwordForm.oldPassword': e.detail.value,
      'errors.oldPassword': ''
    });
  },

  // 新密码输入
  onNewPasswordInput(e) {
    const password = e.detail.value;
    this.setData({
      'passwordForm.newPassword': password,
      'errors.newPassword': ''
    });
    
    // 检查密码强度
    this.checkPasswordStrength(password);
  },

  // 确认密码输入
  onConfirmPasswordInput(e) {
    this.setData({
      'passwordForm.confirmPassword': e.detail.value,
      'errors.confirmPassword': ''
    });
  },

  // 切换密码显示状态
  onToggleOldPassword() {
    this.setData({
      showOldPassword: !this.data.showOldPassword
    });
  },

  onToggleNewPassword() {
    this.setData({
      showNewPassword: !this.data.showNewPassword
    });
  },

  onToggleConfirmPassword() {
    this.setData({
      showConfirmPassword: !this.data.showConfirmPassword
    });
  },

  // 检查密码强度
  checkPasswordStrength(password) {
    let strength = 0;
    let hasNumber = /\d/.test(password);
    let hasLetter = /[a-zA-Z]/.test(password);
    let hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    // 基本长度要求
    if (password.length >= 6) {
      strength += 1;
    }

    // 包含数字和字母
    if (hasNumber && hasLetter) {
      strength += 1;
    }

    // 包含特殊字符
    if (hasSpecialChar) {
      strength += 1;
    }

    // 长度超过8位
    if (password.length >= 8) {
      strength = Math.min(strength + 1, 3);
    }

    this.setData({
      passwordStrength: Math.min(strength, 3),
      hasNumber,
      hasLetter,
      hasSpecialChar
    });
  },

  // 验证表单
  validateForm() {
    const { passwordForm } = this.data;
    const errors = {};
    let isValid = true;

    // 验证当前密码
    if (!passwordForm.oldPassword.trim()) {
      errors.oldPassword = '请输入当前密码';
      isValid = false;
    }

    // 验证新密码
    if (!passwordForm.newPassword.trim()) {
      errors.newPassword = '请输入新密码';
      isValid = false;
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = '密码长度至少6位';
      isValid = false;
    } else if (passwordForm.newPassword.length > 20) {
      errors.newPassword = '密码长度不能超过20位';
      isValid = false;
    } else if (passwordForm.oldPassword === passwordForm.newPassword) {
      errors.newPassword = '新密码不能与当前密码相同';
      isValid = false;
    }

    // 验证确认密码
    if (!passwordForm.confirmPassword.trim()) {
      errors.confirmPassword = '请确认新密码';
      isValid = false;
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
      isValid = false;
    }

    this.setData({ errors });
    return isValid;
  },

  // 确认修改
  async onConfirm() {
    if (!this.validateForm()) {
      return;
    }

    this.setData({ submitting: true });

    try {
      // 调用修改密码API
      const result = await this.callChangePasswordAPI(this.data.passwordForm);
      
      if (result.success) {
        this.showSuccess('密码修改成功');
        
        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        this.showError(result.message || '密码修改失败');
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      this.showError('密码修改失败，请重试');
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 调用修改密码API
  async callChangePasswordAPI(passwordForm) {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟验证当前密码
        if (passwordForm.oldPassword === '123456') {
          resolve({
            success: true,
            message: '密码修改成功'
          });
        } else {
          resolve({
            success: false,
            message: '当前密码错误'
          });
        }
      }, 1000);
    });
  },

  // 取消修改
  onCancel() {
    // 检查是否有未保存的更改
    const { passwordForm } = this.data;
    const hasChanges = passwordForm.oldPassword || passwordForm.newPassword || passwordForm.confirmPassword;
    
    if (hasChanges) {
      wx.showModal({
        title: '确认取消',
        content: '您有未保存的更改，确定要取消吗？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      });
    } else {
      wx.navigateBack();
    }
  },

  // 页面返回按钮处理
  onUnload() {
    // 清除敏感数据
    this.setData({
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    });
  }
});

// 混入用户体验功能
Object.assign(Page.prototype, userExperienceMixin.methods); 