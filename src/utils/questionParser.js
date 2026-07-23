/**
 * @file 题库解析工具（增强版）
 * @description 基于状态机的多格式题库文本解析器，支持自动探测多种版式：
 *              - 题号格式：1. / 1、 / 1) / (1) / （1） / Q1. / ①②③ / 一、
 *              - 选项格式：A. / A、 / A) / (A) / [A] / A： / A）
 *              - 答案标识：答案：/ 答：/ Ans: / Answer: / 正确答案：
 *              - 答案位置：题内联 / 独立行 / 文末统一答案表
 *
 * 设计参考：
 * - IMS QTI（Question and Test Interoperability）题目模型
 * - text2qti（https://github.com/gpoore/text2qti）状态机式文本解析思路
 * - 中文试卷常见版式：题号 + 题干 + 选项（A-D）+ 答案 + 解析
 *
 * 兼容性：保持原有 parseQuestionBank 输出结构，向后兼容
 */

const QUESTION_TYPE = {
    SINGLE: 'single',
    MULTIPLE: 'multiple',
    TRUE_FALSE: 'truefalse',
    FILL_BLANK: 'fillblank',
    ESSAY: 'essay'
};

const FILL_BLANK_REGEX = /_{2,}/;

const SECTION_HEADING_REGEX = /^\s*(?:[一二三四五六七八九十]{1,3}[、．.．]\s*(?:单选|多选|判断|填空|简答|计算|综合|问答|选择).*?题|第[一二三四五六七八九十\d]+[章节]|\d+[、.．]\s*(?:单选|多选|判断|填空|简答|计算|综合|问答|选择).*?题)/;

/**
 * 预处理文本：统一换行、去多余空白
 * @param {string} text - 原始文本
 * @returns {string[]} 非空行数组
 */
const preprocessLines = (text) => {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\u00A0/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
};

/**
 * 格式探测：扫描全文，统计各种题号/选项/答案标识格式出现次数
 * 返回置信度最高的 patterns 组合
 * @param {string[]} lines - 预处理后的行数组
 * @returns {{question: RegExp, option: RegExp, answer: RegExp, explanation: RegExp}}
 */
const detectFormat = (lines) => {
    // 题号格式计数
    const qPatterns = {
        // 1. / 1、 / 1． / 1： / 1)
        arabicDot: /^\s*\d+[.、．：:)]\s+/,
        // (1) / （1）
        arabicParen: /^\s*[（(]\d+[)）]\s*/,
        // Q1. / Q1: / q1)
        qPrefix: /^\s*[Qq]\d+[.、．：:)]\s*/,
        // ① ② ③ ... ⑳
        circledNum: /^\s*[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]\s*/,
        // 一、 / 二、 / 十、
        chineseNum: /^\s*[一二三四五六七八九十]{1,3}[、．.]\s*/
    };

    // 选项格式计数
    const oPatterns = {
        // A. / A、 / A． / A： / A)
        letterDot: /^\s*[A-Ha-h][.、．：:)]\s+/,
        // (A) / （A）
        letterParen: /^\s*[（(][A-Ha-h][)）]\s*/,
        // [A]
        letterBracket: /^\s*\[[A-Ha-h]\]\s*/,
        // A） / A) （无点）
        letterParenOnly: /^\s*[A-Ha-h][)）]\s*/
    };

    // 答案标识格式计数
    const aPatterns = {
        // 答案：/ 答案:
        ansCN: /^\s*答案[：:]/,
        // 答：
        ansCNShort: /^\s*答[：:]/,
        // 正确答案：
        ansCNFull: /^\s*正确答案[：:]/,
        // Ans: / Answer: / ans:
        ansEN: /^\s*(?:Ans|Answer|ans|answer)[：:]/i
    };

    const countMatches = (patterns) => {
        const counts = {};
        for (const key of Object.keys(patterns)) counts[key] = 0;
        for (const line of lines) {
            for (const [key, regex] of Object.entries(patterns)) {
                if (regex.test(line)) {
                    counts[key]++;
                }
            }
        }
        return counts;
    };

    const qCounts = countMatches(qPatterns);
    const oCounts = countMatches(oPatterns);
    const aCounts = countMatches(aPatterns);

    // 选择出现次数最多的格式
    const pickBest = (counts, patterns) => {
        let bestKey = null;
        let bestCount = 0;
        for (const [key, count] of Object.entries(counts)) {
            if (count > bestCount) {
                bestCount = count;
                bestKey = key;
            }
        }
        return bestKey ? patterns[bestKey] : null;
    };

    const bestQ = pickBest(qCounts, qPatterns) || qPatterns.arabicDot;
    const bestO = pickBest(oCounts, oPatterns) || oPatterns.letterDot;
    const bestA = pickBest(aCounts, aPatterns) || aPatterns.ansCN;

    // 根据探测结果构建捕获组正则
    // 题号正则：捕获题号后的题干内容
    let questionRegex;
    if (bestQ === qPatterns.arabicDot) {
        questionRegex = /^\s*(?:\d+|[一二三四五六七八九十]{1,3})[.、．：:)]\s*(.+)$/;
    } else if (bestQ === qPatterns.arabicParen) {
        questionRegex = /^\s*[（(](\d+)[)）]\s*(.+)$/;
    } else if (bestQ === qPatterns.qPrefix) {
        questionRegex = /^\s*[Qq](\d+)[.、．：:)]\s*(.+)$/;
    } else if (bestQ === qPatterns.circledNum) {
        questionRegex = /^\s*([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])\s*(.+)$/;
    } else if (bestQ === qPatterns.chineseNum) {
        questionRegex = /^\s*([一二三四五六七八九十]{1,3})[、．.]\s*(.+)$/;
    } else {
        questionRegex = /^\s*(?:\d+|[一二三四五六七八九十]{1,3})[.、．：:)]\s*(.+)$/;
    }

    // 选项正则：捕获字母标签和内容
    let optionRegex;
    if (bestO === oPatterns.letterDot) {
        optionRegex = /^\s*([A-Ha-h])[.、．：:)]\s*(.+)$/;
    } else if (bestO === oPatterns.letterParen) {
        optionRegex = /^\s*[（(]([A-Ha-h])[)）]\s*(.+)$/;
    } else if (bestO === oPatterns.letterBracket) {
        optionRegex = /^\s*\[([A-Ha-h])\]\s*(.+)$/;
    } else if (bestO === oPatterns.letterParenOnly) {
        optionRegex = /^\s*([A-Ha-h])[)）]\s*(.+)$/;
    } else {
        optionRegex = /^\s*([A-Ha-h])[.、．：:)]\s*(.+)$/;
    }

    // 答案正则
    let answerRegex;
    if (bestA === aPatterns.ansCNShort) {
        answerRegex = /^\s*答[：:]\s*(.*)$/;
    } else if (bestA === aPatterns.ansCNFull) {
        answerRegex = /^\s*正确答案[：:]\s*(.*)$/;
    } else if (bestA === aPatterns.ansEN) {
        answerRegex = /^\s*(?:Ans|Answer|ans|answer)[：:]\s*(.*)$/i;
    } else {
        answerRegex = /^\s*(?:正确)?答案[：:]\s*(.*)$/;
    }

    // 解析正则（多种别名）
    const explanationRegex = /^\s*(?:答案)?(?:解析|分析|Explanation|Solution)[：:]\s*(.*)$/i;

    return {
        question: questionRegex,
        option: optionRegex,
        answer: answerRegex,
        explanation: explanationRegex
    };
};

/**
 * 答案归一化：统一判断题、字母选项的格式
 * 必须在 detectAnswerKey / detectQuestionType 等函数之前定义，
 * 避免暂时性死区（TDZ）错误
 * @param {string} answer - 原始答案
 * @returns {string} 归一化后的答案
 */
const normalizeAnswer = (answer) => {
    const t = String(answer || '').trim();
    const upper = t.toUpperCase();
    if (/^[A-H]+$/.test(upper)) return upper;
    if (/^(正确|对|√|是|YES|T|TRUE)$/i.test(t)) return 'true';
    if (/^(错误|错|×|否|NO|F|FALSE)$/i.test(t)) return 'false';
    return t;
};

const createQuestion = (numberText) => ({
    number: numberText,
    question: '',
    options: [],
    answer: '',
    explanation: '',
    type: ''
});

/**
 * 检测文末是否包含统一答案表
 * 例如：
 *   答案：1.A 2.B 3.C 4.D
 *   1.A 2.B 3.C
 *   1. A
 *   2. B
 * @param {string[]} lines - 预处理后的行数组
 * @returns {Object|null} 答案表 { 题号: 答案 }，未检测到返回 null
 */
const detectAnswerKey = (lines) => {
    const answerKey = {};

    // 模式1：单行答案表 "答案：1.A 2.B 3.C" 或 "1.A 2.B 3.C"
    // 扫描后半部分行
    const startIdx = Math.floor(lines.length * 0.5);
    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        // 移除"答案："前缀
        const cleaned = line.replace(/^\s*(?:正确)?答案[：:]\s*/i, '').replace(/^\s*(?:Ans|Answer)[：:]\s*/i, '');
        // 匹配 "1.A" / "1、A" / "1. A" / "1、 A" 等
        const matches = cleaned.match(/(\d+)[.、．]\s*([A-Ha-h]+|正确|错误|对|错|√|×)/g);
        if (matches && matches.length >= 3) {
            // 至少匹配到 3 个才算答案表
            for (const m of matches) {
                const parts = m.match(/(\d+)[.、．]\s*([A-Ha-h]+|正确|错误|对|错|√|×)/);
                if (parts) {
                    answerKey[parts[1]] = normalizeAnswer(parts[2]);
                }
            }
            if (Object.keys(answerKey).length >= 3) {
                return answerKey;
            }
        }
    }

    // 模式2：多行答案表 "1. A" / "2. B"（每行一题，连续多行）
    const tailStart = Math.floor(lines.length * 0.6);
    let consecutiveCount = 0;
    const tempKey = {};
    for (let i = tailStart; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(\d+)[.、．]\s*([A-Ha-h]+|正确|错误|对|错|√|×)$/);
        if (match) {
            tempKey[match[1]] = normalizeAnswer(match[2]);
            consecutiveCount++;
        } else {
            if (consecutiveCount >= 5) {
                // 连续 5 行以上才算答案表
                Object.assign(answerKey, tempKey);
                return answerKey;
            }
            consecutiveCount = 0;
        }
    }
    if (consecutiveCount >= 5) {
        return answerKey;
    }

    return null;
};

/**
 * 根据题干、选项、答案推断题型
 * @param {Object} q - 题目对象
 * @returns {string} 题型枚举值，无法识别返回空字符串
 */
const detectQuestionType = (q) => {
    if (FILL_BLANK_REGEX.test(q.question) || /第\d+空/.test(q.answer)) {
        return QUESTION_TYPE.FILL_BLANK;
    }
    if (/^(true|false)$/.test(q.answer)) {
        return QUESTION_TYPE.TRUE_FALSE;
    }
    if (q.options.length > 0) {
        if (/^[A-H]{2,}$/.test(q.answer)) {
            return QUESTION_TYPE.MULTIPLE;
        }
        if (/^[A-H]$/.test(q.answer)) {
            return QUESTION_TYPE.SINGLE;
        }
    }
    if (q.answer) {
        return QUESTION_TYPE.ESSAY;
    }
    return '';
};

const isValidQuestion = (q) => {
    if (!q.question || !q.answer) return false;
    const type = detectQuestionType(q);
    if (!type) return false;
    if (type === QUESTION_TYPE.SINGLE || type === QUESTION_TYPE.MULTIPLE) {
        return q.options.length >= 2;
    }
    return true;
};

const sanitizeQuestion = (q) => {
    q.question = q.question.replace(SECTION_HEADING_REGEX, '').trim();
    q.answer = q.answer.replace(SECTION_HEADING_REGEX, '').trim();
    q.explanation = q.explanation.trim();
    q.options = q.options.map(opt => opt.trim()).filter(Boolean);
    q.options.sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0));
};

const getInvalidReason = (q) => {
    if (!q.question) return '缺少题干';
    if (!q.answer) return '缺少答案';
    const type = detectQuestionType(q);
    if (!type) return '无法识别题型';
    if ((type === QUESTION_TYPE.SINGLE || type === QUESTION_TYPE.MULTIPLE) && q.options.length < 2) {
        return '选择题选项不足';
    }
    return '未知错误';
};

/**
 * 结算当前题目：校验、入库或加入无效列表
 * @param {Object|null} current - 当前题目
 * @param {Array} questions - 有效题目数组
 * @param {Array} invalidQuestions - 无效题目数组
 * @param {number} successCount - 已成功计数
 * @returns {number} 更新后的成功计数
 */
const finalizeQuestion = (current, questions, invalidQuestions, successCount) => {
    if (!current) return successCount;
    sanitizeQuestion(current);
    if (!isValidQuestion(current)) {
        invalidQuestions.push({ ...current, reason: getInvalidReason(current) });
        return successCount;
    }
    current.type = detectQuestionType(current);
    current.id = `q-parsed-${successCount + 1}`;
    questions.push(current);
    return successCount + 1;
};

/**
 * 解析题库文本，自动探测多种版式格式
 * @param {string} text - 题库原始文本
 * @returns {Object} 解析结果 { questions, invalidQuestions, answerKey, successCount, totalCount, invalidCount, typeDistribution }
 */
export const parseQuestionBank = (text) => {
    const questions = [];
    const invalidQuestions = [];
    const answerKey = {};
    let successCount = 0;
    let totalCount = 0;
    let current = null;
    let currentField = null;

    const lines = preprocessLines(text);

    // 格式探测：选择置信度最高的 patterns 组合
    const patterns = detectFormat(lines);

    // 答案表检测：文末统一答案表
    const detectedAnswerKey = detectAnswerKey(lines);

    for (const line of lines) {
        if (SECTION_HEADING_REGEX.test(line)) {
            // 章节标题作为边界：先结算上一题，再清空当前题
            successCount = finalizeQuestion(current, questions, invalidQuestions, successCount);
            current = null;
            currentField = null;
            continue;
        }

        // 答案中的分项编号（如 1. xxx 2. xxx）不应被识别为新题目
        if (current && currentField === 'answer' && /^\s*\d+[.．]\s*/.test(line)) {
            current.answer += ' ' + line;
            continue;
        }

        const questionMatch = patterns.question.exec(line);
        if (questionMatch) {
            successCount = finalizeQuestion(current, questions, invalidQuestions, successCount);
            totalCount += 1;
            current = createQuestion(questionMatch[0].trim());
            const content = questionMatch[questionMatch.length - 1];
            // 处理题干与答案在同一行的情况：简述题常出现"正确答案："紧跟题干
            const inlineAnswerMatch = content.match(/((?:正确)?答案[：:]|答[：:])|((?:Ans|Answer)[：:])/i);
            if (inlineAnswerMatch) {
                const idx = content.search(/(?:正确)?答案[：:]|答[：:]|(?:Ans|Answer)[：:]/i);
                current.question = content.slice(0, idx).trim();
                const afterColon = content.slice(idx).replace(/^(?:正确)?答案[：:]|答[：:]|(?:Ans|Answer)[：:]/i, '').trim();
                current.answer = normalizeAnswer(afterColon);
                currentField = 'answer';
            } else {
                current.question = content.trim();
                currentField = 'question';
            }
            continue;
        }

        if (!current) continue;

        const optionMatch = patterns.option.exec(line);
        if (optionMatch) {
            const label = optionMatch[1].toUpperCase();
            const content = optionMatch[2].trim();
            current.options.push(`${label}. ${content}`);
            currentField = 'options';
            continue;
        }

        const answerMatch = patterns.answer.exec(line);
        if (answerMatch) {
            current.answer = normalizeAnswer(answerMatch[1]);
            currentField = 'answer';
            continue;
        }

        const explanationMatch = patterns.explanation.exec(line);
        if (explanationMatch) {
            current.explanation = explanationMatch[1].trim();
            currentField = 'explanation';
            continue;
        }

        // 其他行：按当前字段追加
        if (currentField === 'answer') {
            current.answer += ' ' + line;
        } else if (currentField === 'explanation') {
            current.explanation += ' ' + line;
        } else if (currentField === 'question') {
            current.question += ' ' + line;
        }
    }

    successCount = finalizeQuestion(current, questions, invalidQuestions, successCount);

    // 答案表回填：对缺少答案的题目，尝试从答案表匹配
    if (detectedAnswerKey) {
        questions.forEach((q) => {
            if (!q.answer && q.number && detectedAnswerKey[q.number]) {
                q.answer = detectedAnswerKey[q.number];
            }
        });
        invalidQuestions.forEach((q) => {
            if (!q.answer && q.number && detectedAnswerKey[q.number]) {
                q.answer = detectedAnswerKey[q.number];
                q.reason = getInvalidReason(q);
            }
        });
        // 回填后重新校验无效题目，可能转为有效
        for (let i = invalidQuestions.length - 1; i >= 0; i--) {
            const q = invalidQuestions[i];
            if (q.answer && q.question) {
                const type = detectQuestionType(q);
                if (type && (type !== QUESTION_TYPE.SINGLE && type !== QUESTION_TYPE.MULTIPLE || q.options.length >= 2)) {
                    q.type = type;
                    q.id = `q-parsed-${questions.length + 1}`;
                    questions.push(q);
                    invalidQuestions.splice(i, 1);
                    successCount++;
                }
            }
        }
    }

    // 重新检测题型（答案表回填后可能变化）
    questions.forEach((q) => {
        if (!q.type) {
            q.type = detectQuestionType(q);
        }
    });

    questions.forEach((q) => {
        answerKey[q.id] = q.answer;
    });

    const typeDistribution = questions.reduce((acc, q) => {
        acc[q.type] = (acc[q.type] || 0) + 1;
        return acc;
    }, {});

    return {
        questions,
        invalidQuestions,
        answerKey,
        successCount,
        totalCount,
        invalidCount: invalidQuestions.length,
        typeDistribution
    };
};

export default parseQuestionBank;
