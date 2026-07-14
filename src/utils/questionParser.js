/**
 * 题库解析工具
 * 解析TXT格式的题库文本，支持单选题、多选题、判断题、填空题
 */

/**
 * 题目类型常量
 */
const QUESTION_TYPE = {
    SINGLE: 'single',         // 单选题
    MULTIPLE: 'multiple',     // 多选题
    TRUE_FALSE: 'truefalse',  // 判断题
    FILL_BLANK: 'fillblank'   // 填空题
};

/**
 * 判断题答案正则（√ × 对 错）
 */
const TRUE_FALSE_ANSWER_REGEX = /^[√×对错]$/;

/**
 * 多选题答案正则（2个或以上大写字母，如 AB、ABC、ABCD）
 */
const MULTIPLE_CHOICE_ANSWER_REGEX = /^[A-D]{2,}$/;

/**
 * 单选题答案正则（单个大写字母 A-D）
 */
const SINGLE_CHOICE_ANSWER_REGEX = /^[A-D]$/;

/**
 * 填空题空白标记正则（3个或以上连续下划线）
 */
const FILL_BLANK_REGEX = /_{3,}/;

/**
 * 根据题干与答案推断题目类型
 * @param {Object} q - 题目对象
 * @returns {string} 题目类型（QUESTION_TYPE 之一，无法识别返回空字符串）
 */
const detectQuestionType = (q) => {
    // 题干包含连续下划线，优先识别为填空题
    if (FILL_BLANK_REGEX.test(q.question)) {
        return QUESTION_TYPE.FILL_BLANK;
    }
    // 判断题答案保持原字符，不转大写
    if (TRUE_FALSE_ANSWER_REGEX.test(q.answer)) {
        return QUESTION_TYPE.TRUE_FALSE;
    }
    const answer = q.answer.toUpperCase();
    if (MULTIPLE_CHOICE_ANSWER_REGEX.test(answer)) {
        return QUESTION_TYPE.MULTIPLE;
    }
    if (SINGLE_CHOICE_ANSWER_REGEX.test(answer)) {
        return QUESTION_TYPE.SINGLE;
    }
    return '';
};

/**
 * 校验题目是否有效
 * @param {Object} q - 题目对象
 * @returns {boolean} 是否有效
 */
const isValidQuestion = (q) => {
    if (!q.question || !q.answer) return false;
    const type = detectQuestionType(q);
    if (!type) return false;
    // 选择题（单选/多选）至少需要 2 个选项
    if (type === QUESTION_TYPE.SINGLE || type === QUESTION_TYPE.MULTIPLE) {
        return q.options.length >= 2;
    }
    return true;
};

/**
 * 完成当前题目的解析并加入题库
 * @param {Object} currentQuestion - 当前题目对象
 * @param {Array} questions - 题目数组
 * @param {Object} answerKey - 答案映射
 * @param {number} successCount - 已成功数量
 * @returns {number} 新的成功数量
 */
const finalizeQuestion = (currentQuestion, questions, answerKey, successCount) => {
    if (!currentQuestion || !isValidQuestion(currentQuestion)) {
        return successCount;
    }
    currentQuestion.type = detectQuestionType(currentQuestion);
    const id = `q-parsed-${successCount + 1}`;
    currentQuestion.id = id;
    questions.push(currentQuestion);
    answerKey[id] = currentQuestion.answer;
    return successCount + 1;
};

/**
 * 解析题库文本
 * @param {string} text - TXT格式题库文本
 * @returns {Object} { questions, answerKey, successCount, totalCount }
 */
export const parseQuestionBank = (text) => {
    const questions = [];
    const answerKey = {};
    let successCount = 0;
    let totalCount = 0;

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let currentQuestion = null;
    let currentField = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 匹配题号开头，如 "1. 题干内容" 或 "1、题干内容"
        const questionMatch = line.match(/^(\d+)[.、]\s*(.+)/);
        if (questionMatch) {
            // 遇到新题号时，先将上一题入库
            successCount = finalizeQuestion(currentQuestion, questions, answerKey, successCount);
            totalCount++;
            currentQuestion = {
                question: questionMatch[2],
                options: [],
                answer: '',
                explanation: ''
            };
            currentField = 'question';
            continue;
        }

        if (!currentQuestion) continue;

        // 匹配选项，如 "A. 选项内容" 或 "A、选项内容"
        const optionMatch = line.match(/^([A-D])[.、]\s*(.+)/);
        if (optionMatch) {
            currentQuestion.options.push(`${optionMatch[1]}. ${optionMatch[2]}`);
            currentField = 'options';
            continue;
        }

        // 匹配答案，支持单选(A-D)、多选(ABCD)、判断(√×对错)
        const answerMatch = line.match(/^答案[：:]\s*([A-Da-d]+|√|×|对|错)/);
        if (answerMatch) {
            const ans = answerMatch[1];
            // 判断题答案保持原样，选择题答案统一转大写
            if (TRUE_FALSE_ANSWER_REGEX.test(ans)) {
                currentQuestion.answer = ans;
            } else {
                currentQuestion.answer = ans.toUpperCase();
            }
            currentField = 'answer';
            continue;
        }

        // 匹配解析
        const explanationMatch = line.match(/^解析[：:]\s*(.*)/);
        if (explanationMatch) {
            currentQuestion.explanation = explanationMatch[1];
            currentField = 'explanation';
            continue;
        }

        // 续行内容追加到对应字段
        if (currentField === 'explanation') {
            currentQuestion.explanation += ' ' + line;
        } else if (currentField === 'question' && !line.match(/^[A-D][.、]/)) {
            currentQuestion.question += ' ' + line;
        }
    }

    // 处理最后一道题
    successCount = finalizeQuestion(currentQuestion, questions, answerKey, successCount);
    if (totalCount === 0 && successCount > 0) totalCount = 1;

    return {
        questions,
        answerKey,
        successCount,
        totalCount
    };
};

export default parseQuestionBank;
