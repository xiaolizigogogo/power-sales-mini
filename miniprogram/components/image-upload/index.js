const app = getApp();
const api = require('../../utils/api');
const common = require('../../utils/common');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 最大上传数量
    maxCount: {
      type: Number,
      value: 9
    },
    // 已上传的图片列表
    fileList: {
      type: Array,
      value: [],
      observer: function(newVal) {
        this.setData({
          imageList: newVal || []
        });
      }
    },
    // 是否显示上传按钮
    showUploadBtn: {
      type: Boolean,
      value: true
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    // 上传按钮文字
    uploadText: {
      type: String,
      value: '上传图片'
    },
    // 图片大小限制（MB）
    maxSize: {
      type: Number,
      value: 5
    },
    // 图片质量 0-1
    quality: {
      type: Number,
      value: 0.8
    },
    // 是否压缩图片
    compress: {
      type: Boolean,
      value: true
    },
    // 上传接口地址
    uploadUrl: {
      type: String,
      value: '/upload/image'
    },
    // 预览模式
    previewMode: {
      type: String,
      value: 'default' // default, grid, list
    },
    // 是否显示删除按钮
    showDelete: {
      type: Boolean,
      value: true
    },
    // 是否显示进度条
    showProgress: {
      type: Boolean,
      value: true
    },
    // 自定义样式类
    customClass: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    imageList: [],
    uploading: false,
    uploadProgress: 0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 选择图片
     */
    chooseImage() {
      if (this.data.disabled) {
        return;
      }

      const remainCount = this.properties.maxCount - this.data.imageList.length;
      if (remainCount <= 0) {
        wx.showToast({
          title: `最多只能上传${this.properties.maxCount}张图片`,
          icon: 'none'
        });
        return;
      }

      wx.chooseMedia({
        count: remainCount,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        maxDuration: 30,
        camera: 'back',
        success: (res) => {
          this.handleImageSelect(res.tempFiles);
        },
        fail: (err) => {
          console.error('选择图片失败:', err);
          wx.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
        }
      });
    },

    /**
     * 处理图片选择结果
     */
    handleImageSelect(tempFiles) {
      const validFiles = [];
      
      // 验证文件
      for (let file of tempFiles) {
        // 检查文件大小
        if (file.size > this.properties.maxSize * 1024 * 1024) {
          wx.showToast({
            title: `图片大小不能超过${this.properties.maxSize}MB`,
            icon: 'none'
          });
          continue;
        }
        
        // 检查文件类型
        if (!file.tempFilePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          wx.showToast({
            title: '只支持图片格式',
            icon: 'none'
          });
          continue;
        }
        
        validFiles.push(file);
      }
      
      if (validFiles.length === 0) {
        return;
      }
      
      // 如果需要压缩图片
      if (this.properties.compress) {
        this.compressImages(validFiles);
      } else {
        this.uploadImages(validFiles);
      }
    },

    /**
     * 压缩图片
     */
    compressImages(files) {
      const compressedFiles = [];
      let processedCount = 0;
      
      wx.showLoading({
        title: '处理图片中...'
      });
      
      files.forEach((file, index) => {
        wx.compressImage({
          src: file.tempFilePath,
          quality: Math.floor(this.properties.quality * 100),
          success: (res) => {
            compressedFiles[index] = {
              ...file,
              tempFilePath: res.tempFilePath
            };
          },
          fail: (err) => {
            console.error('压缩图片失败:', err);
            compressedFiles[index] = file;
          },
          complete: () => {
            processedCount++;
            if (processedCount === files.length) {
              wx.hideLoading();
              this.uploadImages(compressedFiles);
            }
          }
        });
      });
    },

    /**
     * 上传图片
     */
    uploadImages(files) {
      this.setData({
        uploading: true,
        uploadProgress: 0
      });
      
      const uploadPromises = files.map((file, index) => {
        return this.uploadSingleImage(file, index, files.length);
      });
      
      Promise.all(uploadPromises).then((results) => {
        const successResults = results.filter(item => item.success);
        const failCount = results.length - successResults.length;
        
        if (successResults.length > 0) {
          const newImageList = [...this.data.imageList];
          successResults.forEach(result => {
            newImageList.push({
              url: result.url,
              thumbUrl: result.thumbUrl || result.url,
              originalUrl: result.originalUrl || result.url,
              id: result.id || common.generateId(),
              uploadTime: new Date().toISOString()
            });
          });
          
          this.setData({
            imageList: newImageList
          });
          
          // 触发变更事件
          this.triggerEvent('change', {
            fileList: newImageList,
            file: successResults[successResults.length - 1]
          });
        }
        
        this.setData({
          uploading: false,
          uploadProgress: 0
        });
        
        // 显示结果提示
        if (failCount > 0) {
          wx.showToast({
            title: `${successResults.length}张上传成功，${failCount}张失败`,
            icon: 'none'
          });
        } else if (successResults.length > 0) {
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
        }
      }).catch((error) => {
        console.error('上传图片失败:', error);
        this.setData({
          uploading: false,
          uploadProgress: 0
        });
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
      });
    },

    /**
     * 上传单个图片
     */
    uploadSingleImage(file, index, total) {
      return new Promise((resolve) => {
        const uploadTask = wx.uploadFile({
          url: api.getFullUrl(this.properties.uploadUrl),
          filePath: file.tempFilePath,
          name: 'file',
          header: {
            'Authorization': `Bearer ${app.globalData.token}`
          },
          formData: {
            type: 'image',
            quality: this.properties.quality
          },
          success: (res) => {
            try {
              const data = JSON.parse(res.data);
              if (data.success) {
                resolve({
                  success: true,
                  url: data.data.url,
                  thumbUrl: data.data.thumbUrl,
                  originalUrl: data.data.originalUrl,
                  id: data.data.id
                });
              } else {
                console.error('上传失败:', data.message);
                resolve({ success: false, error: data.message });
              }
            } catch (err) {
              console.error('解析上传结果失败:', err);
              resolve({ success: false, error: '解析响应失败' });
            }
          },
          fail: (err) => {
            console.error('上传请求失败:', err);
            resolve({ success: false, error: err.errMsg });
          }
        });
        
        // 监听上传进度
        if (this.properties.showProgress) {
          uploadTask.onProgressUpdate((res) => {
            const progress = Math.floor((index + res.progress / 100) / total * 100);
            this.setData({
              uploadProgress: progress
            });
          });
        }
      });
    },

    /**
     * 预览图片
     */
    previewImage(e) {
      const index = e.currentTarget.dataset.index;
      const urls = this.data.imageList.map(item => item.originalUrl || item.url);
      
      wx.previewImage({
        current: urls[index],
        urls: urls,
        fail: (err) => {
          console.error('预览图片失败:', err);
        }
      });
      
      // 触发预览事件
      this.triggerEvent('preview', {
        index: index,
        url: urls[index],
        fileList: this.data.imageList
      });
    },

    /**
     * 删除图片
     */
    deleteImage(e) {
      if (this.data.disabled) {
        return;
      }
      
      const index = e.currentTarget.dataset.index;
      const imageItem = this.data.imageList[index];
      
      wx.showModal({
        title: '提示',
        content: '确定要删除这张图片吗？',
        success: (res) => {
          if (res.confirm) {
            const newImageList = [...this.data.imageList];
            newImageList.splice(index, 1);
            
            this.setData({
              imageList: newImageList
            });
            
            // 触发删除事件
            this.triggerEvent('delete', {
              index: index,
              file: imageItem,
              fileList: newImageList
            });
            
            // 触发变更事件
            this.triggerEvent('change', {
              fileList: newImageList
            });
          }
        }
      });
    },

    /**
     * 重新上传
     */
    retryUpload(e) {
      const index = e.currentTarget.dataset.index;
      // 这里可以实现重新上传逻辑
      console.log('重新上传图片:', index);
    },

    /**
     * 清空所有图片
     */
    clearAll() {
      if (this.data.disabled || this.data.imageList.length === 0) {
        return;
      }
      
      wx.showModal({
        title: '提示',
        content: '确定要清空所有图片吗？',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              imageList: []
            });
            
            // 触发清空事件
            this.triggerEvent('clear');
            
            // 触发变更事件
            this.triggerEvent('change', {
              fileList: []
            });
          }
        }
      });
    },

    /**
     * 获取文件列表
     */
    getFileList() {
      return this.data.imageList;
    },

    /**
     * 设置文件列表
     */
    setFileList(fileList) {
      this.setData({
        imageList: fileList || []
      });
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件加载时初始化
      this.setData({
        imageList: this.properties.fileList || []
      });
    }
  }
}); 