/**
 * 格式化时间
 * @param {number|string|Date} time 时间戳、日期字符串或Date对象
 * @param {string} format 格式化模板，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = (time, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!time) return '';
  
  let date;
  if (time instanceof Date) {
    date = time;
  } else if (typeof time === 'string') {
    // 尝试将字符串转换为时间戳
    const timestamp = Date.parse(time);
    if (isNaN(timestamp)) {
      return time; // 如果转换失败，返回原字符串
    }
    date = new Date(timestamp);
  } else {
    date = new Date(time);
  }

  if (isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 获取相对时间描述
 * @param {number|string|Date} time 时间戳、日期字符串或Date对象
 * @returns {string} 相对时间描述
 */
const getRelativeTime = (time) => {
  if (!time) return '';

  const date = new Date(time);
  const now = new Date();
  const diff = now - date;

  if (diff < 0) {
    return formatTime(time, 'YYYY-MM-DD HH:mm');
  }

  if (diff < 60000) { // 1分钟内
    return '刚刚';
  } else if (diff < 3600000) { // 1小时内
    return Math.floor(diff / 60000) + '分钟前';
  } else if (diff < 86400000) { // 1天内
    return Math.floor(diff / 3600000) + '小时前';
  } else if (diff < 2592000000) { // 30天内
    return Math.floor(diff / 86400000) + '天前';
  } else if (date.getFullYear() === now.getFullYear()) { // 同年
    return formatTime(time, 'MM-DD HH:mm');
  } else {
    return formatTime(time, 'YYYY-MM-DD');
  }
};

/**
 * 格式化日期范围
 * @param {number|string|Date} startTime 开始时间
 * @param {number|string|Date} endTime 结束时间
 * @returns {string} 格式化后的日期范围字符串
 */
const formatDateRange = (startTime, endTime) => {
  if (!startTime || !endTime) return '';

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return '';
  }

  // 如果是同一天
  if (start.toDateString() === end.toDateString()) {
    return `${formatTime(start, 'MM-DD HH:mm')} - ${formatTime(end, 'HH:mm')}`;
  }

  // 如果是同一年
  if (start.getFullYear() === end.getFullYear()) {
    return `${formatTime(start, 'MM-DD')} - ${formatTime(end, 'MM-DD')}`;
  }

  // 不同年
  return `${formatTime(start, 'YYYY-MM-DD')} - ${formatTime(end, 'YYYY-MM-DD')}`;
};

module.exports = {
  formatTime,
  getRelativeTime,
  formatDateRange
}; 