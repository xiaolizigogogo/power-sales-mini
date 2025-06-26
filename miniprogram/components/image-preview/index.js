Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 图片列表
    images: {
      type: Array,
      value: []
    },
    // 当前显示的图片索引
    current: {
      type: Number,
      value: 0
    },
    // 是否显示预览
    show: {
      type: Boolean,
      value: false
    },
    // 是否显示删除按钮
    showDelete: {
      type: Boolean,
      value: false
    },
    // 是否显示下载按钮
    showDownload: {
      type: Boolean,
      value: true
    },
    // 是否显示分享按钮
    showShare: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    currentIndex: 0,
    swiperCurrent: 0,
    imageLoaded: {},
    imageError: {}
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 监听属性变化
     */
    observers: {
      'show, current'(show, current) {
        if (show) {
          this.setData({
            currentIndex: current,
            swiperCurrent: current
          });
        }
      }
    },

    /**
     * 关闭预览
     */
    onClose() {
      this.triggerEvent('close');
    },

    /**
     * 阻止事件冒泡
     */
    onStopPropagation() {
      // 阻止点击事件冒泡到背景层
    },

    /**
     * Swiper切换事件
     */
    onSwiperChange(e) {
      const current = e.detail.current;
      this.setData({
        currentIndex: current,
        swiperCurrent: current
      });
      
      // 触发切换事件
      this.triggerEvent('change', {
        current: current,
        image: this.data.images[current]
      });
    },

    /**
     * 图片加载成功
     */
    onImageLoad(e) {
      const index = e.currentTarget.dataset.index;
      this.setData({
        [`imageLoaded.${index}`]: true
      });
    },

    /**
     * 图片加载失败
     */
    onImageError(e) {
      const index = e.currentTarget.dataset.index;
      this.setData({
        [`imageError.${index}`]: true
      });
      
      // 触发加载失败事件
      this.triggerEvent('error', {
        index: index,
        image: this.data.images[index]
      });
    },

    /**
     * 删除图片
     */
    onDelete() {
      const currentIndex = this.data.currentIndex;
      const currentImage = this.data.images[currentIndex];
      
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这张图片吗？',
        success: (res) => {
          if (res.confirm) {
            this.triggerEvent('delete', {
              index: currentIndex,
              image: currentImage
            });
          }
        }
      });
    },

    /**
     * 下载图片
     */
    onDownload() {
      const currentImage = this.data.images[this.data.currentIndex];
      if (!currentImage) return;

      wx.showLoading({
        title: '保存中...'
      });

      // 如果是网络图片，先下载
      if (currentImage.startsWith('http')) {
        wx.downloadFile({
          url: currentImage,
          success: (res) => {
            if (res.statusCode === 200) {
              this.saveImageToAlbum(res.tempFilePath);
            } else {
              this.showDownloadError();
            }
          },
          fail: () => {
            this.showDownloadError();
          }
        });
      } else {
        // 本地图片直接保存
        this.saveImageToAlbum(currentImage);
      }
    },

    /**
     * 保存图片到相册
     */
    saveImageToAlbum(filePath) {
      wx.saveImageToPhotosAlbum({
        filePath: filePath,
        success: () => {
          wx.hideLoading();
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          this.triggerEvent('download', {
            index: this.data.currentIndex,
            image: this.data.images[this.data.currentIndex],
            filePath: filePath
          });
        },
        fail: (err) => {
          wx.hideLoading();
          if (err.errMsg.includes('auth deny')) {
            wx.showModal({
              title: '提示',
              content: '需要您授权保存图片到相册',
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) {
                  wx.openSetting();
                }
              }
            });
          } else {
            this.showDownloadError();
          }
        }
      });
    },

    /**
     * 显示下载错误提示
     */
    showDownloadError() {
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    },

    /**
     * 分享图片
     */
    onShare() {
      const currentImage = this.data.images[this.data.currentIndex];
      this.triggerEvent('share', {
        index: this.data.currentIndex,
        image: currentImage
      });
    },

    /**
     * 双击放大/缩小
     */
    onDoubleTap() {
      // 可以在这里实现双击放大缩小功能
      this.triggerEvent('doubletap', {
        index: this.data.currentIndex,
        image: this.data.images[this.data.currentIndex]
      });
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件实例进入页面节点树时执行
    },
    
    detached() {
      // 组件实例被从页面节点树移除时执行
    }
  },

  /**
   * 组件所在页面的生命周期
   */
  pageLifetimes: {
    show() {
      // 组件所在的页面被展示时执行
    },
    
    hide() {
      // 组件所在的页面被隐藏时执行
    }
  }
}); 