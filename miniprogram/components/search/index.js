Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 占位符文本
    placeholder: {
      type: String,
      value: '请输入搜索内容'
    },
    // 搜索值
    value: {
      type: String,
      value: ''
    },
    // 是否显示搜索按钮
    showButton: {
      type: Boolean,
      value: true
    },
    // 搜索按钮文本
    buttonText: {
      type: String,
      value: '搜索'
    },
    // 是否显示清除按钮
    showClear: {
      type: Boolean,
      value: true
    },
    // 是否显示历史记录
    showHistory: {
      type: Boolean,
      value: true
    },
    // 历史记录最大数量
    maxHistory: {
      type: Number,
      value: 10
    },
    // 搜索建议列表
    suggestions: {
      type: Array,
      value: []
    },
    // 是否显示搜索建议
    showSuggestions: {
      type: Boolean,
      value: true
    },
    // 是否自动获取焦点
    autoFocus: {
      type: Boolean,
      value: false
    },
    // 输入框样式
    inputStyle: {
      type: String,
      value: ''
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    inputValue: '',
    isFocused: false,
    showPanel: false,
    searchHistory: []
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.setData({
        inputValue: this.data.value
      });
      this.loadSearchHistory();
    }
  },

  /**
   * 监听属性变化
   */
  observers: {
    'value'(newVal) {
      this.setData({
        inputValue: newVal
      });
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 输入框输入事件
     */
    onInput(e) {
      const value = e.detail.value;
      this.setData({
        inputValue: value
      });
      
      // 触发输入事件
      this.triggerEvent('input', {
        value: value
      });
      
      // 触发搜索建议
      if (value.trim() && this.data.showSuggestions) {
        this.triggerEvent('suggest', {
          value: value
        });
      }
    },

    /**
     * 输入框获取焦点
     */
    onFocus(e) {
      this.setData({
        isFocused: true,
        showPanel: true
      });
      
      this.triggerEvent('focus', {
        value: e.detail.value
      });
    },

    /**
     * 输入框失去焦点
     */
    onBlur(e) {
      // 延迟隐藏面板，防止点击历史记录时面板消失
      setTimeout(() => {
        this.setData({
          isFocused: false,
          showPanel: false
        });
      }, 200);
      
      this.triggerEvent('blur', {
        value: e.detail.value
      });
    },

    /**
     * 确认搜索（回车）
     */
    onConfirm(e) {
      const value = e.detail.value.trim();
      if (value) {
        this.performSearch(value);
      }
    },

    /**
     * 点击搜索按钮
     */
    onSearch() {
      const value = this.data.inputValue.trim();
      if (value) {
        this.performSearch(value);
      }
    },

    /**
     * 执行搜索
     */
    performSearch(value) {
      // 添加到搜索历史
      this.addToHistory(value);
      
      // 隐藏面板
      this.setData({
        showPanel: false,
        isFocused: false
      });
      
      // 触发搜索事件
      this.triggerEvent('search', {
        value: value
      });
    },

    /**
     * 清除输入内容
     */
    onClear() {
      this.setData({
        inputValue: ''
      });
      
      this.triggerEvent('clear');
      this.triggerEvent('input', {
        value: ''
      });
    },

    /**
     * 点击历史记录
     */
    onHistoryClick(e) {
      const value = e.currentTarget.dataset.value;
      this.setData({
        inputValue: value
      });
      this.performSearch(value);
    },

    /**
     * 删除历史记录项
     */
    onDeleteHistory(e) {
      e.stopPropagation();
      const index = e.currentTarget.dataset.index;
      const history = [...this.data.searchHistory];
      history.splice(index, 1);
      
      this.setData({
        searchHistory: history
      });
      
      this.saveSearchHistory(history);
    },

    /**
     * 清空历史记录
     */
    onClearHistory() {
      wx.showModal({
        title: '确认清空',
        content: '确定要清空所有搜索历史吗？',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              searchHistory: []
            });
            this.saveSearchHistory([]);
            
            this.triggerEvent('clearHistory');
          }
        }
      });
    },

    /**
     * 点击搜索建议
     */
    onSuggestionClick(e) {
      const value = e.currentTarget.dataset.value;
      this.setData({
        inputValue: value
      });
      this.performSearch(value);
    },

    /**
     * 添加到搜索历史
     */
    addToHistory(value) {
      if (!this.data.showHistory) return;
      
      let history = [...this.data.searchHistory];
      
      // 如果已存在，先移除
      const existIndex = history.indexOf(value);
      if (existIndex > -1) {
        history.splice(existIndex, 1);
      }
      
      // 添加到开头
      history.unshift(value);
      
      // 限制历史记录数量
      if (history.length > this.data.maxHistory) {
        history = history.slice(0, this.data.maxHistory);
      }
      
      this.setData({
        searchHistory: history
      });
      
      this.saveSearchHistory(history);
    },

    /**
     * 加载搜索历史
     */
    loadSearchHistory() {
      if (!this.data.showHistory) return;
      
      try {
        const history = wx.getStorageSync('search_history') || [];
        this.setData({
          searchHistory: history
        });
      } catch (error) {
        console.error('加载搜索历史失败:', error);
      }
    },

    /**
     * 保存搜索历史
     */
    saveSearchHistory(history) {
      try {
        wx.setStorageSync('search_history', history);
      } catch (error) {
        console.error('保存搜索历史失败:', error);
      }
    },

    /**
     * 获取输入框焦点
     */
    focus() {
      this.setData({
        isFocused: true,
        showPanel: true
      });
    },

    /**
     * 失去输入框焦点
     */
    blur() {
      this.setData({
        isFocused: false,
        showPanel: false
      });
    }
  }
}); 