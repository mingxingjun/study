// 题库解析工具
// 设计参考：
// - IMS QTI（Question and Test Interoperability）题目模型
// - text2qti（https://github.com/gpoore/text2qti）状态机式文本解析思路
// - 中文试卷常见版式：题号 + 题干 + 选项（A-D）+ 答案 + 解析

const QUESTION_TYPE = {
  SINGLE: 'single',
  MULTIPLE: 'multiple',
  TRUE_FALSE: 'truefalse',
  FILL_BLANK: 'fillblank',
  ESSAY: 'essay'
};

const FILL_BLANK_REGEX = /_{2,}/;

const SECTION_HEADING_REGEX = /^\s*(?:[一二三四五六七八九十]{1,3}[、．.．]\s*(?:单选|多选|判断|填空|简答|计算|综合|问答|选择).*?题|第[一二三四五六七八九十\d]+[章节]|\d+[、.．]\s*(?:单选|多选|判断|填空|简答|计算|综合|问答|选择).*?题)/;

const LINE_PATTERNS = {
  question: /^\s*(?:\d+|[一二三四五六七八九十]{1,3})[.、．：:)]\s*(.+)$/,
  option: /^\s*([A-Ha-h])[.、．：:)]\s*(.+)$/,
  answer: /^\s*(?:正确)?答案[：:]\s*(.*)$/,
  explanation: /^\s*(?:答案)?解析[：:]\s*(.*)$/
};

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

const createQuestion = (numberText) => ({
  number: numberText,
  question: '',
  options: [],
  answer: '',
  explanation: '',
  type: ''
});

const normalizeAnswer = (answer) => {
  const t = answer.trim();
  const upper = t.toUpperCase();
  if (/^[A-H]+$/.test(upper)) {
    return upper;
  }
  if (/^(正确|对|√|是|YES)$/.test(t)) {
    return 'true';
  }
  if (/^(错误|错|×|否|NO)$/.test(t)) {
    return 'false';
  }
  return t;
};

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

export const parseQuestionBank = (text) => {
  const questions = [];
  const invalidQuestions = [];
  const answerKey = {};
  let successCount = 0;
  let totalCount = 0;
  let current = null;
  let currentField = null;

  const lines = preprocessLines(text);

  for (const line of lines) {
    if (SECTION_HEADING_REGEX.test(line)) {
      // 章节标题作为边界：先结算上一题，再清空当前题，避免跨章节丢失最后一题
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

    const questionMatch = LINE_PATTERNS.question.exec(line);
    if (questionMatch) {
      successCount = finalizeQuestion(current, questions, invalidQuestions, successCount);
      totalCount += 1;
      current = createQuestion(questionMatch[0].trim());
      const content = questionMatch[1];
      // 处理题干与答案在同一行的情况：简述题常出现"正确答案："紧跟题干
      const inlineAnswerMatch = content.match(/((?:正确)?答案[：:])/);
      if (inlineAnswerMatch) {
        const idx = inlineAnswerMatch.index;
        current.question = content.slice(0, idx).trim();
        current.answer = normalizeAnswer(content.slice(idx + inlineAnswerMatch[1].length).trim());
        currentField = 'answer';
      } else {
        current.question = content.trim();
        currentField = 'question';
      }
      continue;
    }

    if (!current) continue;

    const optionMatch = LINE_PATTERNS.option.exec(line);
    if (optionMatch) {
      const label = optionMatch[1].toUpperCase();
      const content = optionMatch[2].trim();
      current.options.push(`${label}. ${content}`);
      currentField = 'options';
      continue;
    }

    const answerMatch = LINE_PATTERNS.answer.exec(line);
    if (answerMatch) {
      current.answer = normalizeAnswer(answerMatch[1]);
      currentField = 'answer';
      continue;
    }

    const explanationMatch = LINE_PATTERNS.explanation.exec(line);
    if (explanationMatch) {
      current.explanation = explanationMatch[1].trim();
      currentField = 'explanation';
      continue;
    }

    if (SECTION_HEADING_REGEX.test(line)) {
      // 防御性保留
    } else if (currentField === 'answer') {
      current.answer += ' ' + line;
    } else if (currentField === 'explanation') {
      current.explanation += ' ' + line;
    } else if (currentField === 'question') {
      current.question += ' ' + line;
    }
  }

  successCount = finalizeQuestion(current, questions, invalidQuestions, successCount);

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
