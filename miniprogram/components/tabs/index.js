// 小程序标签页组件
Component({
  properties: {
    // 标签页数据
    tabs: {
      type: Array,
      value: []
    },
    // 当前选中的标签索引
    current: {
      type: Number,
      value: 0
    },
    // 标签页类型
    type: {
      type: String,
      value: 'line' // line, card, button
    },
    // 是否可滚动
    scrollable: {
      type: Boolean,
      value: false
    },
    // 标签页颜色
    color: {
      type: String,
      value: '#333'
    },
    // 激活颜色
    activeColor: {
      type: String,
      value: '#007aff'
    },
    // 背景颜色
    backgroundColor: {
      type: String,
      value: '#fff'
    },
    // 是否显示徽章
    showBadge: {
      type: Boolean,
      value: false
    },
    // 自定义样式类
    customClass: {
      type: String,
      value: ''
    }
  },

  data: {
    // 滑块样式
    lineStyle: '',
    // 滚动视图位置
    scrollLeft: 0
  },

  lifetimes: {
    attached() {
      this.updateLinePosition();
    }
  },

  observers: {
    'current, tabs'() {
      this.updateLinePosition();
      this.updateScrollPosition();
    }
  },

  methods: {
    // 更新滑块位置
    updateLinePosition() {
      if (this.data.type !== 'line') return;
      
      const { current, tabs } = this.data;
      if (!tabs.length) return;

      // 使用节点查询API获取标签宽度和位置
      const query = this.createSelectorQuery();
      query.selectAll('.tab-item').boundingClientRect((rects) => {
        if (rects && rects[current]) {
          const rect = rects[current];
          const lineStyle = `
            width: ${rect.width * 0.6}px;
            transform: translateX(${rect.left - rects[0].left + rect.width * 0.2}px);
          `;
          this.setData({ lineStyle });
        }
      }).exec();
    },

    // 更新滚动位置
    updateScrollPosition() {
      if (!this.data.scrollable) return;
      
      const { current, tabs } = this.data;
      if (!tabs.length) return;

      // 计算滚动位置，让当前标签居中
      const query = this.createSelectorQuery();
      query.select('.tabs-scroll').boundingClientRect((scrollRect) => {
        query.selectAll('.tab-item').boundingClientRect((rects) => {
          if (rects && rects[current] && scrollRect) {
            const currentRect = rects[current];
            const scrollLeft = currentRect.left - scrollRect.left - scrollRect.width / 2 + currentRect.width / 2;
            this.setData({ scrollLeft: Math.max(0, scrollLeft) });
          }
        }).exec();
      }).exec();
    },

    // 点击标签
    onTabTap(e) {
      const { index } = e.currentTarget.dataset;
      const { current } = this.data;
      
      if (index !== current) {
        this.triggerEvent('change', {
          index,
          tab: this.data.tabs[index]
        });
      }
    },

    // 获取标签样式
    getTabStyle(index) {
      const { current, color, activeColor } = this.data;
      const isActive = index === current;
      
      return `color: ${isActive ? activeColor : color};`;
    },

    // 获取徽章数量
    getBadgeCount(tab) {
      return tab.badge || tab.count || 0;
    }
  }
}); 