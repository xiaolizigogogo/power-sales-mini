// 用户体验增强工具类

// 引导教程管理器
class TutorialManager {
  constructor() {
    this.tutorials = new Map();
    this.currentTutorial = null;
    this.currentStep = 0;
    this.storageKey = 'tutorial_progress';
  }

  // 注册教程
  registerTutorial(name, steps) {
    this.tutorials.set(name, {
      name,
      steps,
      completed: this.getTutorialProgress(name)
    });
  }

  // 开始教程
  startTutorial(name, options = {}) {
    const tutorial = this.tutorials.get(name);
    if (!tutorial) {
      console.error(`教程 ${name} 不存在`);
      return;
    }

    if (tutorial.completed && !options.force) {
      console.log(`教程 ${name} 已完成`);
      return;
    }

    this.currentTutorial = name;
    this.currentStep = 0;
    this.showStep(tutorial.steps[0]);
  }

  // 显示教程步骤
  showStep(step) {
    const modal = {
      title: step.title || '操作提示',
      content: step.content,
      showCancel: true,
      cancelText: '跳过',
      confirmText: step.confirmText || '下一步',
      success: (res) => {
        if (res.confirm) {
          this.nextStep();
        } else {
          this.skipTutorial();
        }
      }
    };

    if (step.target) {
      // 高亮目标元素
      this.highlightElement(step.target);
    }

    wx.showModal(modal);
  }

  // 下一步
  nextStep() {
    const tutorial = this.tutorials.get(this.currentTutorial);
    if (!tutorial) return;

    this.currentStep++;
    
    if (this.currentStep < tutorial.steps.length) {
      this.showStep(tutorial.steps[this.currentStep]);
    } else {
      this.completeTutorial();
    }
  }

  // 完成教程
  completeTutorial() {
    if (this.currentTutorial) {
      this.setTutorialProgress(this.currentTutorial, true);
      const tutorial = this.tutorials.get(this.currentTutorial);
      tutorial.completed = true;
      
      wx.showToast({
        title: '教程完成',
        icon: 'success'
      });
      
      this.currentTutorial = null;
      this.currentStep = 0;
      this.clearHighlight();
    }
  }

  // 跳过教程
  skipTutorial() {
    if (this.currentTutorial) {
      wx.showModal({
        title: '确认跳过',
        content: '是否跳过当前教程？下次可以在设置中重新开启',
        success: (res) => {
          if (res.confirm) {
            this.setTutorialProgress(this.currentTutorial, true);
            this.currentTutorial = null;
            this.currentStep = 0;
            this.clearHighlight();
          }
        }
      });
    }
  }

  // 高亮元素
  highlightElement(selector) {
    // 这里可以添加高亮效果的实现
    console.log(`高亮元素: ${selector}`);
  }

  // 清除高亮
  clearHighlight() {
    // 清除高亮效果
    console.log('清除高亮');
  }

  // 获取教程进度
  getTutorialProgress(name) {
    try {
      const progress = wx.getStorageSync(this.storageKey) || {};
      return progress[name] || false;
    } catch (error) {
      return false;
    }
  }

  // 设置教程进度
  setTutorialProgress(name, completed) {
    try {
      const progress = wx.getStorageSync(this.storageKey) || {};
      progress[name] = completed;
      wx.setStorageSync(this.storageKey, progress);
    } catch (error) {
      console.error('保存教程进度失败:', error);
    }
  }

  // 重置教程
  resetTutorial(name) {
    this.setTutorialProgress(name, false);
    const tutorial = this.tutorials.get(name);
    if (tutorial) {
      tutorial.completed = false;
    }
  }
}

// 消息提示管理器
class MessageManager {
  constructor() {
    this.messageQueue = [];
    this.showing = false;
    this.defaultDuration = 2000;
  }

  // 显示成功消息
  success(message, duration = this.defaultDuration) {
    this.show({
      title: message,
      icon: 'success',
      duration
    });
  }

  // 显示错误消息
  error(message, duration = this.defaultDuration) {
    this.show({
      title: message,
      icon: 'error',
      duration
    });
  }

  // 显示警告消息
  warning(message, duration = this.defaultDuration) {
    this.show({
      title: message,
      icon: 'none',
      duration
    });
  }

  // 显示加载消息
  loading(message = '加载中...') {
    wx.showLoading({
      title: message,
      mask: true
    });
  }

  // 隐藏加载消息
  hideLoading() {
    wx.hideLoading();
  }

  // 显示消息
  show(options) {
    if (this.showing) {
      this.messageQueue.push(options);
      return;
    }

    this.showing = true;
    wx.showToast({
      ...options,
      complete: () => {
        setTimeout(() => {
          this.showing = false;
          this.processQueue();
        }, options.duration || this.defaultDuration);
      }
    });
  }

  // 处理消息队列
  processQueue() {
    if (this.messageQueue.length > 0) {
      const next = this.messageQueue.shift();
      this.show(next);
    }
  }

  // 确认对话框
  confirm(options) {
    return new Promise((resolve) => {
      wx.showModal({
        title: options.title || '确认',
        content: options.content || '确定要执行此操作吗？',
        showCancel: true,
        cancelText: options.cancelText || '取消',
        confirmText: options.confirmText || '确定',
        success: (res) => {
          resolve(res.confirm);
        },
        fail: () => {
          resolve(false);
        }
      });
    });
  }

  // 输入对话框
  prompt(options) {
    return new Promise((resolve) => {
      wx.showModal({
        title: options.title || '输入',
        content: options.content || '请输入内容',
        editable: true,
        placeholderText: options.placeholder || '',
        success: (res) => {
          if (res.confirm) {
            resolve(res.content);
          } else {
            resolve(null);
          }
        },
        fail: () => {
          resolve(null);
        }
      });
    });
  }
}

// 动画效果管理器
class AnimationManager {
  constructor() {
    this.animations = new Map();
  }

  // 创建动画
  createAnimation(options = {}) {
    const animation = wx.createAnimation({
      duration: options.duration || 300,
      timingFunction: options.timingFunction || 'ease',
      delay: options.delay || 0,
      transformOrigin: options.transformOrigin || '50% 50% 0'
    });

    return animation;
  }

  // 淡入动画
  fadeIn(selector, options = {}) {
    const animation = this.createAnimation(options);
    animation.opacity(1).step();
    
    return {
      animation: animation.export(),
      selector
    };
  }

  // 淡出动画
  fadeOut(selector, options = {}) {
    const animation = this.createAnimation(options);
    animation.opacity(0).step();
    
    return {
      animation: animation.export(),
      selector
    };
  }

  // 缩放动画
  scale(selector, scale = 1, options = {}) {
    const animation = this.createAnimation(options);
    animation.scale(scale).step();
    
    return {
      animation: animation.export(),
      selector
    };
  }

  // 旋转动画
  rotate(selector, angle = 360, options = {}) {
    const animation = this.createAnimation(options);
    animation.rotate(angle).step();
    
    return {
      animation: animation.export(),
      selector
    };
  }

  // 滑动动画
  slide(selector, x = 0, y = 0, options = {}) {
    const animation = this.createAnimation(options);
    animation.translate(x, y).step();
    
    return {
      animation: animation.export(),
      selector
    };
  }

  // 弹跳动画
  bounce(selector, options = {}) {
    const animation = this.createAnimation({ ...options, duration: 600 });
    animation.scale(1.2).step({ duration: 200 })
             .scale(1).step({ duration: 200 })
             .scale(1.1).step({ duration: 100 })
             .scale(1).step({ duration: 100 });
    
    return {
      animation: animation.export(),
      selector
    };
  }

  // 摇摆动画
  shake(selector, options = {}) {
    const animation = this.createAnimation({ ...options, duration: 600 });
    animation.translate(-10, 0).step({ duration: 100 })
             .translate(10, 0).step({ duration: 100 })
             .translate(-10, 0).step({ duration: 100 })
             .translate(10, 0).step({ duration: 100 })
             .translate(-5, 0).step({ duration: 100 })
             .translate(0, 0).step({ duration: 100 });
    
    return {
      animation: animation.export(),
      selector
    };
  }

  // 心跳动画
  heartbeat(selector, options = {}) {
    const animation = this.createAnimation({ ...options, duration: 1000 });
    animation.scale(1.1).step({ duration: 200 })
             .scale(1).step({ duration: 200 })
             .scale(1.1).step({ duration: 200 })
             .scale(1).step({ duration: 400 });
    
    return {
      animation: animation.export(),
      selector
    };
  }
}

// 用户反馈管理器
class FeedbackManager {
  constructor() {
    this.feedbackTypes = {
      bug: '错误反馈',
      suggestion: '建议反馈',
      compliment: '表扬反馈',
      other: '其他反馈'
    };
  }

  // 显示反馈表单
  showFeedbackForm(options = {}) {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    // 这里可以导航到反馈页面或显示反馈模态框
    wx.navigateTo({
      url: '/pages/feedback/feedback',
      success: () => {
        // 传递反馈上下文
        if (options.context) {
          wx.setStorageSync('feedback_context', options.context);
        }
      }
    });
  }

  // 快速反馈
  quickFeedback(type, content, contact = '') {
    const pages = getCurrentPages();
    const currentPage = pages.length > 0 ? pages[pages.length - 1] : null;
    const pagePath = currentPage ? (currentPage.route || currentPage.__route__ || 'unknown') : 'unknown';
    
    const feedback = {
      type,
      content,
      contact,
      timestamp: Date.now(),
      page: pagePath,
      version: this.getAppVersion()
    };

    // 这里可以调用API提交反馈
    console.log('提交反馈:', feedback);
    
    wx.showToast({
      title: '反馈提交成功',
      icon: 'success'
    });
  }

  // 获取应用版本
  getAppVersion() {
    const accountInfo = wx.getAccountInfoSync();
    return accountInfo.miniProgram.version;
  }

  // 震动反馈
  vibrate(type = 'light') {
    switch (type) {
      case 'light':
        wx.vibrateShort({ type: 'light' });
        break;
      case 'medium':
        wx.vibrateShort({ type: 'medium' });
        break;
      case 'heavy':
        wx.vibrateShort({ type: 'heavy' });
        break;
      case 'long':
        wx.vibrateLong();
        break;
    }
  }
}

// 用户行为分析器
class UserBehaviorAnalyzer {
  constructor() {
    this.behaviors = [];
    this.sessionId = Date.now();
    this.maxBehaviors = 100;
  }

  // 记录用户行为
  recordBehavior(action, data = {}) {
    const pages = getCurrentPages();
    const currentPage = pages.length > 0 ? pages[pages.length - 1] : null;
    const pagePath = currentPage ? (currentPage.route || currentPage.__route__ || 'unknown') : 'unknown';
    
    const behavior = {
      action,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      page: pagePath
    };

    this.behaviors.push(behavior);
    
    // 保持行为记录数量在限制内
    if (this.behaviors.length > this.maxBehaviors) {
      this.behaviors = this.behaviors.slice(-this.maxBehaviors);
    }

    // 可以在这里上报行为数据
    this.uploadBehavior(behavior);
  }

  // 上报行为数据
  uploadBehavior(behavior) {
    // 这里可以调用API上报行为数据
    console.log('用户行为:', behavior);
  }

  // 获取行为统计
  getBehaviorStats() {
    const stats = {
      total: this.behaviors.length,
      actions: {},
      pages: {},
      timeSpent: 0
    };

    this.behaviors.forEach((behavior, index) => {
      // 统计行为类型
      stats.actions[behavior.action] = (stats.actions[behavior.action] || 0) + 1;
      
      // 统计页面访问
      stats.pages[behavior.page] = (stats.pages[behavior.page] || 0) + 1;
      
      // 计算时间花费
      if (index > 0) {
        const timeDiff = behavior.timestamp - this.behaviors[index - 1].timestamp;
        stats.timeSpent += timeDiff;
      }
    });

    return stats;
  }
}

// 智能提示管理器
class SmartTipManager {
  constructor() {
    this.tips = new Map();
    this.userPreferences = this.loadUserPreferences();
    this.tipHistory = [];
  }

  // 注册提示
  registerTip(id, tip) {
    this.tips.set(id, {
      id,
      ...tip,
      shown: false,
      dismissed: false
    });
  }

  // 显示智能提示
  showTip(id, context = {}) {
    const tip = this.tips.get(id);
    if (!tip) return;

    // 检查是否应该显示提示
    if (!this.shouldShowTip(tip, context)) {
      return;
    }

    // 显示提示
    this.displayTip(tip, context);
    
    // 记录提示历史
    this.tipHistory.push({
      id,
      timestamp: Date.now(),
      context
    });
  }

  // 判断是否应该显示提示
  shouldShowTip(tip, context) {
    // 如果用户已经关闭了提示
    if (this.userPreferences.disabledTips.includes(tip.id)) {
      return false;
    }

    // 如果已经显示过且设置为只显示一次
    if (tip.shown && tip.showOnce) {
      return false;
    }

    // 检查条件
    if (tip.condition && !tip.condition(context)) {
      return false;
    }

    return true;
  }

  // 显示提示
  displayTip(tip, context) {
    wx.showModal({
      title: tip.title,
      content: tip.content,
      showCancel: true,
      cancelText: '不再提示',
      confirmText: tip.confirmText || '知道了',
      success: (res) => {
        if (res.confirm) {
          if (tip.onConfirm) {
            tip.onConfirm(context);
          }
        } else {
          // 用户选择不再提示
          this.disableTip(tip.id);
        }
        
        tip.shown = true;
      }
    });
  }

  // 禁用提示
  disableTip(id) {
    this.userPreferences.disabledTips.push(id);
    this.saveUserPreferences();
  }

  // 启用提示
  enableTip(id) {
    const index = this.userPreferences.disabledTips.indexOf(id);
    if (index > -1) {
      this.userPreferences.disabledTips.splice(index, 1);
      this.saveUserPreferences();
    }
  }

  // 加载用户偏好设置
  loadUserPreferences() {
    try {
      const preferences = wx.getStorageSync('smart_tip_preferences');
      return preferences || { disabledTips: [] };
    } catch (error) {
      return { disabledTips: [] };
    }
  }

  // 保存用户偏好设置
  saveUserPreferences() {
    try {
      wx.setStorageSync('smart_tip_preferences', this.userPreferences);
    } catch (error) {
      console.error('保存用户偏好设置失败:', error);
    }
  }
}

// 创建全局实例
const tutorialManager = new TutorialManager();
const messageManager = new MessageManager();
const animationManager = new AnimationManager();
const feedbackManager = new FeedbackManager();
const userBehaviorAnalyzer = new UserBehaviorAnalyzer();
const smartTipManager = new SmartTipManager();

// 用户体验增强混合器
const userExperienceMixin = {
  onLoad() {
    // 记录页面访问
    const pages = getCurrentPages();
    const currentPage = pages.length > 0 ? pages[pages.length - 1] : null;
    const pagePath = this.route || (currentPage ? (currentPage.route || currentPage.__route__ || 'unknown') : 'unknown');
    
    userBehaviorAnalyzer.recordBehavior('page_visit', {
      page: pagePath
    });
  },

  onShow() {
    // 记录页面显示
    const pages = getCurrentPages();
    const currentPage = pages.length > 0 ? pages[pages.length - 1] : null;
    const pagePath = this.route || (currentPage ? (currentPage.route || currentPage.__route__ || 'unknown') : 'unknown');
    
    userBehaviorAnalyzer.recordBehavior('page_show', {
      page: pagePath
    });
  },

  onHide() {
    // 记录页面隐藏
    const pages = getCurrentPages();
    const currentPage = pages.length > 0 ? pages[pages.length - 1] : null;
    const pagePath = this.route || (currentPage ? (currentPage.route || currentPage.__route__ || 'unknown') : 'unknown');
    
    userBehaviorAnalyzer.recordBehavior('page_hide', {
      page: pagePath
    });
  },

  methods: {
    // 显示消息
    showMessage: messageManager.show.bind(messageManager),
    showSuccess: messageManager.success.bind(messageManager),
    showError: messageManager.error.bind(messageManager),
    showWarning: messageManager.warning.bind(messageManager),
    showLoading: messageManager.loading.bind(messageManager),
    hideLoading: messageManager.hideLoading.bind(messageManager),
    showConfirm: messageManager.confirm.bind(messageManager),
    showPrompt: messageManager.prompt.bind(messageManager),
    
    // 动画效果
    createAnimation: animationManager.createAnimation.bind(animationManager),
    fadeIn: animationManager.fadeIn.bind(animationManager),
    fadeOut: animationManager.fadeOut.bind(animationManager),
    scale: animationManager.scale.bind(animationManager),
    rotate: animationManager.rotate.bind(animationManager),
    slide: animationManager.slide.bind(animationManager),
    bounce: animationManager.bounce.bind(animationManager),
    shake: animationManager.shake.bind(animationManager),
    heartbeat: animationManager.heartbeat.bind(animationManager),
    
    // 用户反馈
    showFeedback: feedbackManager.showFeedbackForm.bind(feedbackManager),
    quickFeedback: feedbackManager.quickFeedback.bind(feedbackManager),
    vibrate: feedbackManager.vibrate.bind(feedbackManager),
    
    // 用户行为记录
    recordBehavior: userBehaviorAnalyzer.recordBehavior.bind(userBehaviorAnalyzer),
    
    // 智能提示
    showTip: smartTipManager.showTip.bind(smartTipManager),
    
    // 教程
    startTutorial: tutorialManager.startTutorial.bind(tutorialManager)
  }
};

module.exports = {
  // 类
  TutorialManager,
  MessageManager,
  AnimationManager,
  FeedbackManager,
  UserBehaviorAnalyzer,
  SmartTipManager,
  
  // 全局实例
  tutorialManager,
  messageManager,
  animationManager,
  feedbackManager,
  userBehaviorAnalyzer,
  smartTipManager,
  
  // 混合器
  userExperienceMixin
} 