/**
 * 进度计算工具函数
 */

/**
 * 计算知识点掌握进度百分比
 * @param {Array} knowledgePoints - 知识点列表
 * @returns {number} 进度百分比 (0-100)
 */
export const calculateOverallProgress = (knowledgePoints = []) => {
  if (knowledgePoints.length === 0) return 0;
  const totalMastery = knowledgePoints.reduce((sum, kp) => sum + (kp.mastery || 0), 0);
  return Math.round(totalMastery / knowledgePoints.length);
};

/**
 * 计算单个知识点的进度（基于答题正确率）
 * @param {Array} answerRecords - 答题记录
 * @param {string} knowledgePointId - 知识点ID
 * @returns {number} 掌握度百分比 (0-100)
 */
export const calculateKnowledgePointMastery = (answerRecords = [], knowledgePointId) => {
  const records = answerRecords.filter(r => r.knowledgePointId === knowledgePointId);
  if (records.length === 0) return 0;
  
  const correctCount = records.filter(r => r.isCorrect).length;
  return Math.round((correctCount / records.length) * 100);
};

/**
 * 计算今日学习统计
 * @param {Array} answerRecords - 答题记录
 * @param {string} today - 今日日期字符串
 * @returns {Object} 今日统计 { totalQuestions, correctCount, accuracy, studyTime }
 */
export const calculateTodayStats = (answerRecords = [], today) => {
  const todayRecords = answerRecords.filter(r => r.date === today);
  const totalQuestions = todayRecords.length;
  const correctCount = todayRecords.filter(r => r.isCorrect).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  
  return {
    totalQuestions,
    correctCount,
    accuracy,
    studyTime: todayRecords.length * 3
  };
};

/**
 * 计算连续打卡天数
 * @param {Array} checkInDates - 打卡日期数组
 * @returns {number} 连续打卡天数
 */
export const calculateStreak = (checkInDates = []) => {
  if (checkInDates.length === 0) return 0;
  
  const sortedDates = [...checkInDates].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const firstDate = new Date(sortedDates[0]);
  firstDate.setHours(0, 0, 0, 0);
  
  if (firstDate.getTime() !== today.getTime() && firstDate.getTime() !== yesterday.getTime()) {
    return 0;
  }
  
  for (const dateStr of sortedDates) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (date.getTime() < currentDate.getTime()) {
      break;
    }
  }
  
  return streak;
};

/**
 * 计算错题复习进度
 * @param {Array} wrongQuestions - 错题列表
 * @returns {Object} { total, reviewed, percentage }
 */
export const calculateWrongBookProgress = (wrongQuestions = []) => {
  const total = wrongQuestions.length;
  const reviewed = wrongQuestions.filter(q => q.reviewed).length;
  const percentage = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  
  return { total, reviewed, percentage };
};

export default {
  calculateOverallProgress,
  calculateKnowledgePointMastery,
  calculateTodayStats,
  calculateStreak,
  calculateWrongBookProgress
};
