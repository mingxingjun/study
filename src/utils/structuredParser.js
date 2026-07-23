/**
 * @file 结构化题库解析器
 * @description 支持 JSON / CSV / Markdown 三种纯文本结构化格式的精准解析。
 *              字段名智能映射（中英文别名），题型自动推断，输出结构与
 *              questionParser.js 保持一致，便于上层统一处理。
 *
 * 设计原则：
 * - 零第三方依赖：仅使用浏览器原生 API（File.text()）
 * - 字段名容错：题干/题目/question、答案/answer/正确答案 等自动识别
 * - 题型推断：未声明 type 时，根据 answer 和 options 自动推断
 *
 * 不支持的格式：
 * - .xlsx/.xls（二进制 ZIP 压缩格式，浏览器原生无法解析）
 *   → 在 pipeline 层提示用户"另存为 CSV 后上传"
 */

/** 字段名别名表（中英文常见命名，均会做小写 + 去分隔符归一化） */
const FIELD_ALIASES = {
    question: ['question', '题干', '题目', 'stem', 'content', 'title', 'text', 'q'],
    type: ['type', '题型', 'questiontype', 'qtype', 'category'],
    options: ['options', '选项', 'choices', 'alternatives', 'optionlist'],
    answer: ['answer', '答案', 'correctanswer', 'correct_answer', '正确答案', 'key', 'ans'],
    explanation: ['explanation', '解析', '分析', '解析内容', 'analysis', 'reason', 'solution'],
    difficulty: ['difficulty', '难度', 'level', 'diff'],
    knowledgePointId: ['knowledgepointid', '知识点', 'knowledgepoint', 'kpid', 'topic', 'categoryid']
};

/** 题型别名映射（统一归一化为枚举值） */
const TYPE_MAP = {
    single: 'single', 单选: 'single', 单选题: 'single', singlechoice: 'single',
    multiple: 'multiple', 多选: 'multiple', 多选题: 'multiple', multiplechoice: 'multiple',
    truefalse: 'truefalse', 判断: 'truefalse', 判断题: 'truefalse', tf: 'truefalse',
    fillblank: 'fillblank', 填空: 'fillblank', 填空题: 'fillblank', fill: 'fillblank', blank: 'fillblank',
    essay: 'essay', 简答: 'essay', 简答题: 'essay', shortanswer: 'essay',
    calculation: 'calculation', 计算: 'calculation', 计算题: 'calculation', calc: 'calculation'
};

/**
 * 字段名归一化：小写 + 去除 _ - 空格
 * @param {string} name - 原始字段名
 * @returns {string} 归一化后的字段名
 */
const normalizeFieldName = (name) => {
    return String(name || '').trim().toLowerCase().replace(/[_\-\s]/g, '');
};

/**
 * 从原始对象中按别名查找字段值
 * @param {Object} obj - 原始对象
 * @param {string} canonicalField - 标准字段名（FIELD_ALIASES 的 key）
 * @returns {any} 找到的字段值，未找到返回 undefined
 */
const findField = (obj, canonicalField) => {
    const aliases = FIELD_ALIASES[canonicalField].map(normalizeFieldName);
    for (const key of Object.keys(obj)) {
        if (aliases.includes(normalizeFieldName(key))) {
            return obj[key];
        }
    }
    return undefined;
};

/**
 * 题型归一化
 * @param {string} type - 原始题型字符串
 * @returns {string} 标准题型枚举值
 */
const normalizeType = (type) => {
    const t = String(type || '').toLowerCase().trim().replace(/[_\-\s]/g, '');
    return TYPE_MAP[t] || t;
};

/**
 * 答案归一化（与 questionParser.js 保持一致）
 * @param {any} answer - 原始答案
 * @returns {string} 归一化后的答案
 */
const normalizeAnswer = (answer) => {
    if (typeof answer === 'boolean') return answer ? 'true' : 'false';
    const t = String(answer ?? '').trim();
    const upper = t.toUpperCase();
    if (/^[A-H]+$/.test(upper)) return upper;
    if (/^(正确|对|√|是|YES|T|TRUE)$/i.test(t)) return 'true';
    if (/^(错误|错|×|否|NO|F|FALSE)$/i.test(t)) return 'false';
    return t;
};

/**
 * 选项归一化：确保每个选项格式为 "A. 内容"
 * @param {Array|string} options - 原始选项（数组或字符串）
 * @returns {string[]} 归一化后的选项数组
 */
const normalizeOptions = (options) => {
    let arr = options;
    if (typeof options === 'string') {
        // 字符串按换行或分号分割
        arr = options.split(/[\n;；]+/).map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(arr)) return [];
    return arr.map((opt, idx) => {
        const text = String(opt ?? '').trim();
        if (!text) return null;
        // 已包含字母前缀（如 "A. xxx" / "A、xxx"）则保留
        if (/^[A-Ha-h][.、．：:)]/.test(text)) return text;
        // 已是 "A) xxx" 格式
        if (/^[A-Ha-h]\)/.test(text)) return text.replace(/^([A-Ha-h])\)/, '$1. ');
        // 否则自动添加字母前缀
        const label = String.fromCharCode(65 + idx);
        return `${label}. ${text}`;
    }).filter(Boolean);
};

/**
 * 将原始题目对象归一化为标准结构
 * @param {Object} raw - 原始题目对象
 * @param {number} idx - 题目序号
 * @returns {Object|null} 标准题目对象，题干为空时返回 null
 */
const normalizeQuestion = (raw, idx) => {
    if (!raw || typeof raw !== 'object') return null;
    const question = findField(raw, 'question');
    if (!question) return null;

    const type = normalizeType(findField(raw, 'type') || '');
    const options = normalizeOptions(findField(raw, 'options') || []);
    const answer = normalizeAnswer(findField(raw, 'answer') || '');
    const explanation = String(findField(raw, 'explanation') || '');
    const difficultyRaw = String(findField(raw, 'difficulty') || 'medium').toLowerCase();
    const difficulty = ['easy', 'medium', 'hard'].includes(difficultyRaw) ? difficultyRaw : 'medium';
    const knowledgePointId = String(findField(raw, 'knowledgePointId') || '');

    // 未声明 type 时根据 answer/options 自动推断
    let inferredType = type;
    if (!inferredType) {
        if (/^(true|false)$/.test(answer)) inferredType = 'truefalse';
        else if (options.length >= 2 && /^[A-H]$/.test(answer)) inferredType = 'single';
        else if (options.length >= 2 && /^[A-H]{2,}$/.test(answer)) inferredType = 'multiple';
        else if (answer) inferredType = 'essay';
    }

    return {
        id: `q-struct-${idx + 1}`,
        number: String(idx + 1),
        question: String(question).trim(),
        type: inferredType,
        options,
        answer,
        explanation,
        difficulty,
        knowledgePointId
    };
};

/**
 * 解析 JSON 格式题库
 * 支持结构：
 *   - 数组：[{ question, options, answer, ... }, ...]
 *   - 对象：{ questions: [...], knowledgePoints: [...] }
 *   - 对象：{ items: [...] }
 * @param {string} text - JSON 文本
 * @returns {{questions: Array, knowledgePoints: Array}} 解析结果
 */
const parseJSON = (text) => {
    const data = JSON.parse(text);
    const rawQuestions = Array.isArray(data)
        ? data
        : (data.questions || data.items || data.list || []);
    if (!Array.isArray(rawQuestions)) {
        throw new Error('JSON 结构无法识别：应为数组，或含 questions/items 字段的对象');
    }
    const questions = rawQuestions
        .map((raw, idx) => normalizeQuestion(raw, idx))
        .filter(Boolean);
    const knowledgePoints = data.knowledgePoints || data.knowledge_points || [];
    return { questions, knowledgePoints };
};

/**
 * 解析 CSV 单行（支持双引号包裹和转义）
 * @param {string} line - CSV 行文本
 * @returns {string[]} 字段值数组
 */
const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            // 双引号转义：""
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result.map(s => s.trim());
};

/**
 * 解析 CSV 格式题库
 * 第一行为表头，后续每行为一道题
 * 支持选项列：可以是 "A\nB\nC\nD" 或 "A;B;C;D" 或单独的 A/B/C/D 列
 * @param {string} text - CSV 文本
 * @returns {{questions: Array, knowledgePoints: Array}} 解析结果
 */
const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
        throw new Error('CSV 文件至少需要表头 + 1 行数据');
    }

    const headers = parseCSVLine(lines[0]);
    const rawQuestions = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const obj = {};
        headers.forEach((h, idx) => {
            obj[h] = values[idx] || '';
        });

        // 支持 A/B/C/D 作为独立列的情况：合并为 options 数组
        if (!findField(obj, 'options')) {
            const optCols = ['A', 'B', 'C', 'D', 'E', 'F'];
            const opts = optCols
                .map(col => obj[col])
                .filter(v => v && String(v).trim());
            if (opts.length >= 2) {
                obj.__options = opts;
            }
        }

        rawQuestions.push(obj);
    }

    const questions = rawQuestions
        .map((raw, idx) => {
            // 处理 A/B/C/D 独立列合并的 options
            if (raw.__options) {
                raw.options = raw.__options;
                delete raw.__options;
            }
            return normalizeQuestion(raw, idx);
        })
        .filter(Boolean);

    return { questions, knowledgePoints: [] };
};

/**
 * 解析 Markdown 格式题库
 * 约定格式：
 *   ## 知识点名称（可选）
 *   ### 单选题（可选，题型标题）
 *   1. 题干内容
 *      - A. 选项A
 *      - B. 选项B
 *      答案：A
 *      解析：xxx
 * @param {string} text - Markdown 文本
 * @returns {{questions: Array, knowledgePoints: Array}} 解析结果
 */
const parseMarkdown = (text) => {
    const lines = text.split(/\r?\n/);
    const questions = [];
    const knowledgePoints = [];
    let current = null;
    let currentKpId = '';
    let qIdx = 0;

    const finishCurrent = () => {
        if (current) {
            // 推断题型
            if (!current.type) {
                if (/^(true|false)$/.test(current.answer)) current.type = 'truefalse';
                else if (current.options.length >= 2 && /^[A-H]$/.test(current.answer)) current.type = 'single';
                else if (current.options.length >= 2 && /^[A-H]{2,}$/.test(current.answer)) current.type = 'multiple';
                else if (current.answer) current.type = 'essay';
            }
            questions.push(current);
            current = null;
        }
    };

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // 知识点标题 ## xxx
        const h2 = trimmed.match(/^##\s+(.+)/);
        if (h2) {
            finishCurrent();
            currentKpId = `kp-md-${knowledgePoints.length + 1}`;
            knowledgePoints.push({
                id: currentKpId,
                name: h2[1].trim(),
                description: '',
                estimatedTime: 30,
                mastery: 0
            });
            continue;
        }

        // 题型标题 ### xxx（跳过，题型由答案推断）
        if (/^###\s+/.test(trimmed)) continue;
        // 一级标题 # xxx 作为整体标题，跳过
        if (/^#\s+/.test(trimmed)) continue;

        // 题目：1. xxx / 1、xxx / 1）xxx
        const qMatch = trimmed.match(/^(\d+)[.、．)]\s*(.+)/);
        if (qMatch) {
            finishCurrent();
            qIdx++;
            current = {
                id: `q-md-${qIdx}`,
                number: qMatch[1],
                question: qMatch[2].trim(),
                options: [],
                answer: '',
                explanation: '',
                type: '',
                knowledgePointId: currentKpId
            };
            continue;
        }

        if (!current) continue;

        // 选项：- A. xxx / * A. xxx / A. xxx / A、xxx
        const optMatch = trimmed.match(/^(?:[-*+]\s*)?([A-Ha-h])[.、．：:)]\s*(.+)/);
        if (optMatch) {
            const label = optMatch[1].toUpperCase();
            current.options.push(`${label}. ${optMatch[2].trim()}`);
            continue;
        }

        // 答案
        const ansMatch = trimmed.match(/^(?:答案|答|Answer|Ans)[：:]\s*(.+)/i);
        if (ansMatch) {
            const t = ansMatch[1].trim();
            const upper = t.toUpperCase();
            if (/^[A-H]+$/.test(upper)) current.answer = upper;
            else if (/^(正确|对|√|是|YES|TRUE|T)$/i.test(t)) current.answer = 'true';
            else if (/^(错误|错|×|否|NO|FALSE|F)$/i.test(t)) current.answer = 'false';
            else current.answer = t;
            continue;
        }

        // 解析
        const expMatch = trimmed.match(/^(?:解析|分析|Explanation|Solution)[：:]\s*(.+)/i);
        if (expMatch) {
            current.explanation = expMatch[1].trim();
            continue;
        }

        // 其他非空行：未答时追加题干，已答时追加解析
        if (!/^[-*+]/.test(trimmed)) {
            if (!current.answer) {
                current.question += ' ' + trimmed;
            } else if (!current.explanation) {
                current.explanation = trimmed;
            } else {
                current.explanation += ' ' + trimmed;
            }
        }
    }
    finishCurrent();

    return { questions, knowledgePoints };
};

/**
 * 主入口：根据文件扩展名选择结构化解析器
 * @param {File} file - 文件对象
 * @param {Function} [onProgress] - 进度回调 (0-100)
 * @returns {Promise<Object>} 解析结果，结构与 parseQuestionBank 一致
 * @throws {Error} 当格式不支持或解析失败时抛出
 */
export const parseStructured = async (file, onProgress) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const text = await file.text();

    if (onProgress) onProgress(50);

    let result;
    if (ext === 'json') {
        result = parseJSON(text);
    } else if (ext === 'csv') {
        result = parseCSV(text);
    } else if (ext === 'md' || ext === 'markdown') {
        result = parseMarkdown(text);
    } else {
        throw new Error(`不支持的结构化格式: .${ext}`);
    }

    if (onProgress) onProgress(100);

    if (result.questions.length === 0) {
        throw new Error('未识别到任何题目，请检查文件内容是否符合格式要求');
    }

    // 构建 answerKey 与类型分布，保持与 questionParser 输出结构一致
    const answerKey = {};
    const typeDistribution = {};
    result.questions.forEach((q) => {
        answerKey[q.id] = q.answer;
        typeDistribution[q.type] = (typeDistribution[q.type] || 0) + 1;
    });

    return {
        questions: result.questions,
        knowledgePoints: result.knowledgePoints,
        invalidQuestions: [],
        answerKey,
        successCount: result.questions.length,
        totalCount: result.questions.length,
        invalidCount: 0,
        typeDistribution
    };
};

export default parseStructured;
