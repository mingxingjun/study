/**
 * 间隔重复调度工具
 * 基于艾宾浩斯遗忘曲线，为错题本提供复习时间计算
 */

import { formatDate, getToday } from './date';

/**
 * 默认复习间隔（天）
 * 第 1 次正确复习后 1 天、第 2 次 3 天、第 3 次 7 天、第 4 次 14 天、第 5 次 30 天
 */
export const DEFAULT_INTERVALS = [1, 3, 7, 14, 30];

/**
 * 获取错题对应的问题 ID
 * @param {Object} wrongQuestion - 错题记录
 * @returns {string|null} 问题 ID
 */
const getQuestionId = (wrongQuestion) => {
    if (!wrongQuestion) return null;
    return wrongQuestion.question?.id || wrongQuestion.questionId || null;
};

/**
 * 计算错题当前所处复习阶段
 * 阶段 = 自加入错题本以来，该题被答对的次数
 * @param {Object} wrongQuestion - 错题记录
 * @param {Array} answerRecords - 全部答题记录
 * @returns {number} 复习阶段（0 表示尚未复习）
 */
export const getReviewStage = (wrongQuestion, answerRecords = []) => {
    const questionId = getQuestionId(wrongQuestion);
    const addedAt = wrongQuestion?.addedAt;
    if (!questionId || !addedAt) return 0;

    const addedTime = new Date(addedAt).getTime();
    return answerRecords.filter((record) => {
        if (record.questionId !== questionId) return false;
        if (!record.isCorrect) return false;
        const answeredTime = new Date(record.answeredAt || record.date).getTime();
        return answeredTime > addedTime;
    }).length;
};

/**
 * 计算下次复习日期
 * @param {Object} wrongQuestion - 错题记录
 * @param {Array} answerRecords - 全部答题记录
 * @returns {string} 下次复习日期 YYYY-MM-DD
 */
export const getNextReviewDate = (wrongQuestion, answerRecords = []) => {
    const addedAt = wrongQuestion?.addedAt;
    const baseDate = addedAt ? formatDate(addedAt) : getToday();
    const stage = getReviewStage(wrongQuestion, answerRecords);
    const interval = DEFAULT_INTERVALS[Math.min(stage, DEFAULT_INTERVALS.length - 1)] || 1;

    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + interval);
    return formatDate(nextDate);
};

/**
 * 获取建议复习间隔文本
 * @param {Object} wrongQuestion - 错题记录
 * @param {Array} answerRecords - 全部答题记录
 * @returns {string} 如 "3 天后复习"、"今日到期"
 */
export const getReviewIntervalText = (wrongQuestion, answerRecords = []) => {
    const nextDate = getNextReviewDate(wrongQuestion, answerRecords);
    const today = getToday();
    if (nextDate === today) return '今日到期';
    if (nextDate < today) return '已逾期';

    const stage = getReviewStage(wrongQuestion, answerRecords);
    const interval = DEFAULT_INTERVALS[Math.min(stage, DEFAULT_INTERVALS.length - 1)] || 1;
    return `${interval} 天后复习`;
};

/**
 * 获取今日/逾期需复习的错题
 * @param {Array} answerRecords - 全部答题记录
 * @param {Array} wrongQuestions - 全部错题
 * @returns {Array} 到期的错题列表
 */
export const getDueReviews = (answerRecords, wrongQuestions) => {
    const today = getToday();
    return wrongQuestions.filter((wq) => {
        if (wq.mastered) return false;
        const nextDate = getNextReviewDate(wq, answerRecords);
        return nextDate <= today;
    });
};

/**
 * 按复习优先级排序错题：今日到期 > 已逾期 > 未到期
 * @param {Array} wrongQuestions - 错题列表
 * @param {Array} answerRecords - 全部答题记录
 * @returns {Array} 排序后的错题列表
 */
export const sortByReviewPriority = (wrongQuestions, answerRecords = []) => {
    const today = getToday();
    return [...wrongQuestions].sort((a, b) => {
        const nextA = getNextReviewDate(a, answerRecords);
        const nextB = getNextReviewDate(b, answerRecords);
        if (nextA <= today && nextB > today) return -1;
        if (nextB <= today && nextA > today) return 1;
        return nextA.localeCompare(nextB);
    });
};

export default {
    DEFAULT_INTERVALS,
    getReviewStage,
    getNextReviewDate,
    getReviewIntervalText,
    getDueReviews,
    sortByReviewPriority
};
