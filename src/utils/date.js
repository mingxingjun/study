/**
 * 日期处理工具函数
 */

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {Date|string} date - 日期对象或日期字符串
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 获取今日日期字符串
 * @returns {string} 今日日期 YYYY-MM-DD
 */
export const getToday = () => {
  return formatDate(new Date());
};

/**
 * 生成日期范围数组
 * @param {number} days - 天数
 * @param {Date|string} endDate - 结束日期，默认为今天
 * @returns {Array<string>} 日期字符串数组
 */
export const generateDateRange = (days, endDate = new Date()) => {
  const dates = [];
  const end = new Date(endDate);
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(end);
    date.setDate(date.getDate() - i);
    dates.push(formatDate(date));
  }
  
  return dates;
};

/**
 * 计算两个日期之间的天数差
 * @param {Date|string} date1 - 第一个日期
 * @param {Date|string} date2 - 第二个日期
 * @returns {number} 天数差
 */
export const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 格式化时间为 HH:MM 格式
 * @param {Date|string} date - 日期对象
 * @returns {string} 格式化后的时间字符串
 */
export const formatTime = (date = new Date()) => {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * 格式化日期时间为 YYYY-MM-DD HH:MM 格式
 * @param {Date|string} date - 日期对象
 * @returns {string} 格式化后的日期时间字符串
 */
export const formatDateTime = (date = new Date()) => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

/**
 * 格式化相对时间
 * @param {Date|string} date - 日期对象
 * @returns {string} 相对时间字符串
 */
export const formatRelativeTime = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  return formatDate(date);
};

export default {
  formatDate,
  getToday,
  generateDateRange,
  daysBetween,
  formatTime,
  formatDateTime,
  formatRelativeTime
};
