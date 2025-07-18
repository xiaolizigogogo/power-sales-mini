const fs = require('fs');
const path = require('path');

// 要删除的文件和目录列表
const filesToDelete = [
  // 未使用的页面
  'miniprogram/pages/user',
  'miniprogram/pages/complaint',
  
  // 未使用的组件
  'miniprogram/components/global-config',
  'miniprogram/components/image-preview',
  'miniprogram/components/search',
  
  // 未使用的工具文件
  'miniprogram/utils/request.js',
  'miniprogram/utils/offline-support.js',
  'miniprogram/utils/performance.js',
  'miniprogram/utils/icons.js',
];

// 删除函数
function deleteFileOrDir(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    if (fs.lstatSync(fullPath).isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ 删除目录: ${filePath}`);
    } else {
      fs.unlinkSync(fullPath);
      console.log(`✅ 删除文件: ${filePath}`);
    }
  } else {
    console.log(`⚠️  文件不存在: ${filePath}`);
  }
}

// 执行清理
console.log('🧹 开始清理无用文件...\n');

filesToDelete.forEach(file => {
  deleteFileOrDir(file);
});

console.log('\n🎉 清理完成！');
console.log('\n📝 建议手动检查以下内容：');
console.log('1. 检查 assets/images/icons/ 目录下未使用的图标');
console.log('2. 检查 miniprogram_npm/ 目录下未使用的依赖');
console.log('3. 检查 styles/ 目录下未使用的样式文件');
console.log('4. 检查 package.json 中未使用的依赖'); 