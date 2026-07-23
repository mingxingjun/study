/**
 * @file AI 服务 - 多服务商适配层
 * @description 统一的 AI 调用服务，支持 OpenAI 兼容接口（DeepSeek、智谱、通义千问等）
 *              和 Gemini 原生接口。提供出题、讲解、督学、计划生成、文档解析等便捷方法，
 *              并在调用失败时自动降级到 Mock 数据，保证应用可用性。
 */

import { aiProviders } from '../config/aiProviders';
import {
    quizMasterPrompt,
    explainerPrompt,
    supervisorPrompt,
    documentParsePrompt,
    generateQuestionsPrompt,
    gradeAnswerPrompt
} from '../config/agentPrompts';
import { sampleKnowledgePoints } from '../mock/sampleData';
import { sampleQuestions } from '../mock/questions';

/** 默认最大输出 token 数 */
const DEFAULT_MAX_TOKENS = 4096;
/** 默认温度参数（0-1，值越大输出越随机） */
const DEFAULT_TEMPERATURE = 0.7;

/**
 * 各 Agent 的差异化生成参数
 * - 出题/生成类需要一定创造性，温度略高
 * - 批改/解析/文档解析类需要稳定、确定，温度较低
 * - 文档解析输出量大，maxTokens 最高
 * @type {Object.<string, {maxTokens: number, temperature: number}>}
 */
export const AGENT_GENERATION_CONFIG = {
    'quiz-master': { maxTokens: 4096, temperature: 0.7 },
    'explainer': { maxTokens: 4096, temperature: 0.3 },
    'supervisor': { maxTokens: 2048, temperature: 0.6 },
    'document-parser': { maxTokens: 16384, temperature: 0.2 },
    'question-generator': { maxTokens: 8192, temperature: 0.7 },
    'answer-grader': { maxTokens: 2048, temperature: 0.2 }
};

/**
 * 获取指定 Agent 的生成参数，支持覆盖
 * @param {string} agentId - Agent ID
 * @param {Object} overrides - 需要覆盖的参数 { maxTokens?, temperature? }
 * @returns {{maxTokens: number, temperature: number}}
 */
export const getAgentOptions = (agentId, overrides = {}) => {
    const defaults = AGENT_GENERATION_CONFIG[agentId] || {
        maxTokens: DEFAULT_MAX_TOKENS,
        temperature: DEFAULT_TEMPERATURE
    };
    return {
        maxTokens: overrides.maxTokens ?? defaults.maxTokens,
        temperature: overrides.temperature ?? defaults.temperature
    };
};

/** 429 速率限制时的最大重试次数（智谱官方建议 5 次指数退避） */
const MAX_RETRIES = 5;
/** 重试基础延迟（毫秒），实际延迟 = BASE * 2^attempt，即 1/2/4/8/16 秒 */
const RETRY_BASE_DELAY = 1000;
/** 单次重试最大延迟上限（毫秒），防止指数退避等待过久 */
const RETRY_MAX_DELAY = 30000;

/** AI 服务状态监听器集合，用于向 UI 暴露回退、重试、JSON 修复等事件 */
const statusListeners = new Set();
/** 最近一次 AI 服务状态 */
let lastAIStatus = { message: '', type: 'info', timestamp: 0 };

/**
 * 订阅 AI 服务状态变化
 * @param {Function} listener - 状态回调 (status) => void
 * @returns {Function} 取消订阅函数
 */
export const subscribeAIStatus = (listener) => {
    statusListeners.add(listener);
    if (lastAIStatus.message) {
        listener(lastAIStatus);
    }
    return () => statusListeners.delete(listener);
};

/**
 * 获取最近一次 AI 服务状态
 * @returns {{message: string, type: string, timestamp: number}}
 */
export const getLastAIStatus = () => lastAIStatus;

/**
 * 通知所有监听器 AI 服务状态变化
 * @param {string} message - 状态消息
 * @param {string} [type='info'] - 状态类型：info | warning | success
 */
const notifyAIStatus = (message, type = 'info') => {
    lastAIStatus = { message, type, timestamp: Date.now() };
    statusListeners.forEach((listener) => {
        try {
            listener(lastAIStatus);
        } catch (error) {
            console.warn('AI 状态监听器执行失败:', error);
        }
    });
};

// ==================== 辅助函数 ====================

/**
 * 根据 providerId 获取服务商配置
 * @param {string} providerId - 服务商唯一标识（如 'deepseek'、'gemini'）
 * @returns {Object|null} 服务商配置对象，未找到时返回 null
 */
export const getProviderById = (providerId) => {
    return aiProviders.find(provider => provider.id === providerId) || null;
};

/**
 * 检查 Agent 配置是否有效（包含服务商、模型和密钥）
 * @param {Object} agentConfig - Agent 配置 { providerId, modelId, apiKey }
 * @returns {boolean} 配置是否完整有效
 */
export const isAIConfigured = (agentConfig) => {
    if (!agentConfig) return false;
    const { providerId, modelId, apiKey } = agentConfig;
    return Boolean(providerId && modelId && apiKey);
};

// ==================== 核心调用函数 ====================

/**
 * 统一 AI 调用入口
 * @param {Object} agentConfig - Agent 配置 { providerId, modelId, apiKey }
 * @param {Array<{role: string, content: string}>} messages - 消息数组，OpenAI 格式
 * @param {Object} options - 调用选项 { maxTokens, temperature, stream, onStreamChunk }
 * @param {number} [options.maxTokens=4096] - 最大输出 token 数
 * @param {number} [options.temperature=0.7] - 采样温度
 * @param {boolean} [options.stream=false] - 是否启用流式输出
 * @param {Function} [options.onStreamChunk] - 流式回调 (delta, fullContent) => void
 * @returns {Promise<string>} AI 返回的文本内容
 * @throws {Error} 当服务商未找到或请求失败时抛出
 */
export const callAI = async (agentConfig, messages, options = {}) => {
    const { providerId, modelId, apiKey } = agentConfig;
    const provider = getProviderById(providerId);

    if (!provider) {
        throw new Error(`未找到服务商配置: ${providerId}`);
    }

    const { isOpenAICompatible } = provider;
    if (isOpenAICompatible) {
        return await callOpenAICompatible(provider, modelId, apiKey, messages, options);
    }
    return await callGemini(provider, modelId, apiKey, messages, options);
};

// ==================== OpenAI 兼容接口实现 ====================

/**
 * 延迟工具函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 计算指数退避延迟时间
 * 遵循智谱官方建议的 1/2/4/8/16 秒指数退避策略
 * @param {number} attempt - 当前重试次数（从 0 开始）
 * @param {number} [retryAfter] - 服务端返回的 Retry-After 值（秒），优先使用
 * @returns {number} 延迟毫秒数
 */
const calculateBackoffDelay = (attempt, retryAfter) => {
    // 优先使用服务端返回的 Retry-After 值
    if (retryAfter && retryAfter > 0) {
        return Math.min(retryAfter * 1000, RETRY_MAX_DELAY);
    }
    // 指数退避：1s, 2s, 4s, 8s, 16s
    const delay = RETRY_BASE_DELAY * Math.pow(2, attempt);
    return Math.min(delay, RETRY_MAX_DELAY);
};

/**
 * 判断错误状态码是否应该重试
 * 仅对 429（速率限制）和 5xx（服务端错误）进行重试
 * 4xx（除429）为客户端错误，重试无意义
 * @param {number} status - HTTP 状态码
 * @returns {boolean} 是否应该重试
 */
const shouldRetry = (status) => {
    return status === 429 || (status >= 500 && status < 600);
};

/**
 * 生成服务商特定的 429 错误提示
 * @param {string} providerId - 服务商 ID
 * @param {number} attempt - 已重试次数
 * @returns {string} 友好的错误提示
 */
const getRateLimitMessage = (providerId, attempt) => {
    const providerMessages = {
        zhipu: `智谱 GLM 速率限制：免费模型 QPS 有限，已自动重试 ${attempt} 次。建议稍等后重试或切换其他服务商。`,
        deepseek: `DeepSeek 并发限制：请减少同时发起的请求数，已自动重试 ${attempt} 次。`,
        siliconflow: `硅基流动速率限制：免费模型 RPM/TPM 固定，已自动重试 ${attempt} 次。建议等待冷却后重试。`,
        moonshot: `Kimi 速率限制：已自动重试 ${attempt} 次。建议降低请求频率。`,
        doubao: `豆包速率限制：已自动重试 ${attempt} 次。建议等待后重试。`,
        qwen: `通义千问速率限制：已自动重试 ${attempt} 次。建议稍等后重试。`,
        openai: `OpenAI 速率限制：已自动重试 ${attempt} 次。建议降低请求频率。`,
    };
    return providerMessages[providerId] || `AI 请求频率过快，已自动重试 ${attempt} 次，请稍后重试。`;
};

/**
 * 带指数退避重试的 fetch 封装
 * @param {string} url - 请求 URL
 * @param {Object} fetchOptions - fetch 配置项
 * @param {string} providerId - 服务商 ID（用于生成错误提示）
 * @returns {Promise<Response>} fetch 响应对象
 */
const fetchWithRetry = async (url, fetchOptions, providerId) => {
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const response = await fetch(url, fetchOptions);

        // 请求成功或不可重试的错误，直接返回
        if (response.ok || !shouldRetry(response.status)) {
            return response;
        }

        // 可重试的错误（429 或 5xx）
        if (attempt < MAX_RETRIES) {
            // 尝试从 Retry-After 头获取服务端建议的等待时间
            const retryAfterHeader = response.headers.get('Retry-After');
            const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;

            const delay = calculateBackoffDelay(attempt, retryAfter);
            console.warn(
                `API 返回 ${response.status}，${delay / 1000}秒后第 ${attempt + 1}/${MAX_RETRIES} 次重试...`
            );
            notifyAIStatus(
                `检测到 ${response.status}，正在指数退避重试（第 ${attempt + 1}/${MAX_RETRIES} 次）...`,
                'warning'
            );
            await sleep(delay);
            lastError = new Error(getRateLimitMessage(providerId, attempt + 1));
            continue;
        }

        // 已达最大重试次数
        if (response.status === 429) {
            await response.text().catch(() => '');
            throw new Error(getRateLimitMessage(providerId, MAX_RETRIES));
        }
    }

    throw lastError || new Error('AI 请求失败，已达最大重试次数');
};

/**
 * 调用 OpenAI 兼容接口（含 429/5xx 指数退避自动重试）
 * @param {Object} provider - 服务商配置对象
 * @param {string} modelId - 模型 ID
 * @param {string} apiKey - API 密钥
 * @param {Array} messages - 消息数组
 * @param {Object} options - 调用选项
 * @returns {Promise<string>} AI 返回的文本内容
 */
const callOpenAICompatible = async (provider, modelId, apiKey, messages, options) => {
    const {
        maxTokens = DEFAULT_MAX_TOKENS,
        temperature = DEFAULT_TEMPERATURE,
        stream = false,
        onStreamChunk
    } = options;

    const url = `${provider.apiBaseUrl}/chat/completions`;

    // 非流式请求：对空响应也进行重试（429 恢复后可能返回空内容）
    if (!stream) {
        let lastError = null;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const requestBody = {
                model: modelId,
                messages,
                max_tokens: maxTokens,
                temperature,
                stream: false
            };

            const response = await fetchWithRetry(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody)
            }, provider.id);

            if (!response.ok) {
                const errorText = await response.text().catch(() => '未知错误');
                throw new Error(`OpenAI 兼容接口请求失败 (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';

            // 内容非空，直接返回
            if (content.trim()) {
                return content;
            }

            // 空响应重试（429 恢复后常见行为）
            if (attempt < MAX_RETRIES) {
                const delay = calculateBackoffDelay(attempt);
                console.warn(`AI 返回空内容，${delay / 1000}秒后第 ${attempt + 1}/${MAX_RETRIES} 次重试...`);
                notifyAIStatus('AI 返回空内容，正在自动重试...', 'warning');
                await sleep(delay);
                lastError = new Error('AI 返回内容为空，可能 API Key 无效、请求被拒绝或速率限制未完全恢复');
                continue;
            }

            throw lastError;
        }
        throw lastError || new Error('AI 返回内容为空');
    }

    // 流式请求
    const requestBody = {
        model: modelId,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true
    };

    const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
    }, provider.id);

    if (!response.ok) {
        const errorText = await response.text().catch(() => '未知错误');
        throw new Error(`OpenAI 兼容接口请求失败 (${response.status}): ${errorText}`);
    }

    return await parseOpenAIStream(response, onStreamChunk);
};

/**
 * 解析 OpenAI 兼容接口的 SSE 流式响应
 * @param {Response} response - fetch 响应对象
 * @param {Function} onStreamChunk - 流式数据回调 (delta, fullContent) => void
 * @returns {Promise<string>} 完整的文本内容
 */
const parseOpenAIStream = async (response, onStreamChunk) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // 最后一行可能不完整，保留到 buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
            const delta = extractOpenAIDelta(line);
            if (delta) {
                fullContent += delta;
                if (onStreamChunk) onStreamChunk(delta, fullContent);
            }
        }
    }

    return fullContent;
};

/**
 * 从单行 SSE 数据中提取 OpenAI 增量文本
 * @param {string} line - SSE 数据行
 * @returns {string} 增量文本，无内容时返回空字符串
 */
const extractOpenAIDelta = (line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('data:')) return '';

    const dataStr = trimmedLine.slice(5).trim();
    if (dataStr === '[DONE]') return '';

    try {
        const chunk = JSON.parse(dataStr);
        return chunk.choices?.[0]?.delta?.content || '';
    } catch (parseError) {
        console.warn('解析 OpenAI SSE 数据块失败:', parseError);
        return '';
    }
};

// ==================== Gemini 原生接口实现 ====================

/**
 * 调用 Gemini 原生接口
 * @param {Object} provider - 服务商配置对象
 * @param {string} modelId - 模型 ID
 * @param {string} apiKey - API 密钥
 * @param {Array} messages - 消息数组（OpenAI 格式，内部会转换）
 * @param {Object} options - 调用选项
 * @returns {Promise<string>} AI 返回的文本内容
 */
const callGemini = async (provider, modelId, apiKey, messages, options) => {
    const {
        maxTokens = DEFAULT_MAX_TOKENS,
        temperature = DEFAULT_TEMPERATURE,
        stream = false,
        onStreamChunk
    } = options;

    // 流式与非流式使用不同的 action 端点
    const action = stream ? 'streamGenerateContent' : 'generateContent';
    const streamParam = stream ? '&alt=sse' : '';
    const url = `${provider.apiBaseUrl}/models/${modelId}:${action}?key=${apiKey}${streamParam}`;

    const { systemInstruction, contents } = convertMessagesToGeminiFormat(messages);
    const requestBody = {
        contents,
        generationConfig: {
            maxOutputTokens: maxTokens,
            temperature
        }
    };
    if (systemInstruction) {
        requestBody.systemInstruction = systemInstruction;
    }

    const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    }, provider.id);

    if (!response.ok) {
        const errorText = await response.text().catch(() => '未知错误');
        throw new Error(`Gemini 接口请求失败 (${response.status}): ${errorText}`);
    }

    if (stream) {
        return await parseGeminiStream(response, onStreamChunk);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

/**
 * 将 OpenAI 格式的消息数组转换为 Gemini 格式
 * 支持：
 *   - 纯文本消息 content: string
 *   - 多模态消息 content: [{ type: 'text', text }, { type: 'image_url', image_url: { url: 'data:...' } }]
 * @param {Array<{role: string, content: string|Array}>} messages - OpenAI 格式消息
 * @returns {{systemInstruction: Object|null, contents: Array}} Gemini 格式消息
 */
const convertMessagesToGeminiFormat = (messages) => {
    let systemInstruction = null;
    const contents = [];

    for (const message of messages) {
        if (message.role === 'system') {
            // system 消息一般不含图片，统一拼接为文本
            const text = Array.isArray(message.content)
                ? message.content.filter(i => i.type === 'text').map(i => i.text).join('\n')
                : message.content;
            systemInstruction = { parts: [{ text }] };
        } else {
            // OpenAI 的 assistant 角色对应 Gemini 的 model 角色
            const role = message.role === 'assistant' ? 'model' : 'user';

            if (Array.isArray(message.content)) {
                // 多模态消息：将 OpenAI 的 content 数组转换为 Gemini 的 parts 数组
                const parts = [];
                for (const item of message.content) {
                    if (item.type === 'text') {
                        parts.push({ text: item.text });
                    } else if (item.type === 'image_url' && item.image_url?.url) {
                        // 从 data URL 解析 mime_type 和 base64 data
                        // Gemini 使用 inline_data 字段，而非 OpenAI 的 image_url
                        const dataUrlMatch = item.image_url.url.match(/^data:([^;]+);base64,(.+)$/);
                        if (dataUrlMatch) {
                            parts.push({
                                inline_data: {
                                    mime_type: dataUrlMatch[1],
                                    data: dataUrlMatch[2]
                                }
                            });
                        }
                    }
                }
                contents.push({ role, parts });
            } else {
                // 纯文本消息（向后兼容）
                contents.push({
                    role,
                    parts: [{ text: message.content }]
                });
            }
        }
    }

    return { systemInstruction, contents };
};

/**
 * 解析 Gemini 的 SSE 流式响应
 * @param {Response} response - fetch 响应对象
 * @param {Function} onStreamChunk - 流式数据回调 (delta, fullContent) => void
 * @returns {Promise<string>} 完整的文本内容
 */
const parseGeminiStream = async (response, onStreamChunk) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const delta = extractGeminiDelta(line);
            if (delta) {
                fullContent += delta;
                if (onStreamChunk) onStreamChunk(delta, fullContent);
            }
        }
    }

    return fullContent;
};

/**
 * 从单行 SSE 数据中提取 Gemini 增量文本
 * @param {string} line - SSE 数据行
 * @returns {string} 增量文本，无内容时返回空字符串
 */
const extractGeminiDelta = (line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine.startsWith('data:')) return '';

    const dataStr = trimmedLine.slice(5).trim();
    try {
        const chunk = JSON.parse(dataStr);
        return chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (parseError) {
        console.warn('解析 Gemini SSE 数据块失败:', parseError);
        return '';
    }
};

// ==================== JSON 解析工具 ====================

/**
 * 从 AI 返回的文本中提取并解析 JSON
 * 支持 ```json 代码块包裹和纯 JSON 两种格式
 * @param {string} text - AI 返回的文本
 * @returns {Object} 解析后的 JSON 对象
 * @throws {SyntaxError} 当文本无法解析为 JSON 时抛出
 */
/**
 * 尝试修复截断的 JSON 字符串
 * AI 输出可能因 maxTokens 限制被截断，导致 JSON 不完整
 * 策略：找到最后一个完整的对象边界，截断后补全括号
 * @param {string} jsonStr - 可能被截断的 JSON 字符串
 * @returns {Object|null} 修复成功返回解析后的对象，失败返回 null
 */
const repairTruncatedJson = (jsonStr) => {
    let str = jsonStr.trim();

    // 确保以 { 开头
    const firstBrace = str.indexOf('{');
    if (firstBrace === -1) return null;
    if (firstBrace > 0) str = str.substring(firstBrace);

    // 尝试直接解析
    try {
        return JSON.parse(str);
    } catch (e) {
        // 继续修复
    }

    // 策略：从后往前找最后一个完整的 } 或 }，在其后截断
    // 这样可以保留已完成的对象，丢弃不完整的部分
    let lastCompleteIdx = -1;
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (escape) {
            escape = false;
            continue;
        }
        if (ch === '\\') {
            escape = true;
            continue;
        }
        if (ch === '"') {
            inString = !inString;
            continue;
        }
        if (inString) continue;

        if (ch === '{' || ch === '[') depth++;
        else if (ch === '}' || ch === ']') {
            depth--;
            // depth 回到 0 或正数时，说明一个完整对象/数组刚闭合
            if (depth >= 1) {
                lastCompleteIdx = i;
            }
        }
    }

    // 如果找到了最后一个完整对象的闭合位置，从那里截断
    if (lastCompleteIdx > 0) {
        // 截断到最后一个完整的 } 后面
        let truncated = str.substring(0, lastCompleteIdx + 1);

        // 移除尾部逗号
        truncated = truncated.replace(/,\s*$/, '');

        // 统计未闭合的括号并补全
        let openBraces = 0;
        let openBrackets = 0;
        inString = false;
        escape = false;

        for (let i = 0; i < truncated.length; i++) {
            const ch = truncated[i];
            if (escape) { escape = false; continue; }
            if (ch === '\\') { escape = true; continue; }
            if (ch === '"') { inString = !inString; continue; }
            if (inString) continue;
            if (ch === '{') openBraces++;
            else if (ch === '}') openBraces--;
            else if (ch === '[') openBrackets++;
            else if (ch === ']') openBrackets--;
        }

        for (let i = 0; i < openBrackets; i++) truncated += ']';
        for (let i = 0; i < openBraces; i++) truncated += '}';

        try {
            const result = JSON.parse(truncated);
            console.warn('JSON 修复成功（截断到最后一个完整对象）');
            notifyAIStatus('JSON 截断自修复成功', 'success');
            return result;
        } catch (e) {
            // 继续尝试其他方法
        }
    }

    // 最后手段：暴力补全
    // 先闭合未完成的字符串
    let repaired = str;
    inString = false;
    escape = false;
    for (let i = 0; i < repaired.length; i++) {
        if (escape) { escape = false; continue; }
        if (repaired[i] === '\\') { escape = true; continue; }
        if (repaired[i] === '"') inString = !inString;
    }
    if (inString) repaired += '"';

    // 移除尾部不完整的部分
    repaired = repaired.replace(/,\s*"[^"]*:?\s*$/, '');
    repaired = repaired.replace(/,\s*$/, '');

    // 补全括号
    let openBraces = 0;
    let openBrackets = 0;
    inString = false;
    escape = false;
    for (let i = 0; i < repaired.length; i++) {
        if (escape) { escape = false; continue; }
        if (repaired[i] === '\\') { escape = true; continue; }
        if (repaired[i] === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (repaired[i] === '{') openBraces++;
        else if (repaired[i] === '}') openBraces--;
        else if (repaired[i] === '[') openBrackets++;
        else if (repaired[i] === ']') openBrackets--;
    }
    for (let i = 0; i < openBrackets; i++) repaired += ']';
    for (let i = 0; i < openBraces; i++) repaired += '}';

    try {
        const result = JSON.parse(repaired);
        console.warn('JSON 修复成功（暴力补全）');
        notifyAIStatus('JSON 截断自修复成功', 'success');
        return result;
    } catch (e) {
        console.warn('JSON 修复失败，原始内容（前200字符）:', str.substring(0, 200));
        notifyAIStatus('JSON 截断自修复失败，已降级到本地数据', 'warning');
        return null;
    }
};

const parseJsonFromText = (text) => {
    if (!text || !text.trim()) {
        throw new SyntaxError('AI 返回内容为空，可能 API Key 无效或请求被拒绝');
    }
    // 优先尝试提取 ```json ... ``` 代码块
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonBlockMatch ? jsonBlockMatch[1].trim() : text.trim();

    try {
        return JSON.parse(jsonStr);
    } catch (parseError) {
        // JSON 解析失败，尝试修复截断的 JSON
        const repaired = repairTruncatedJson(jsonStr);
        if (repaired) {
            console.warn('JSON 已自动修复（AI 输出可能被截断）');
            return repaired;
        }
        throw new SyntaxError(`JSON 解析失败: ${parseError.message}`);
    }
};

// ==================== 便捷业务函数 ====================

/**
 * 生成学习计划
 * @param {Object} agentConfig - Agent 配置 { providerId, modelId, apiKey }
 * @param {Array} materials - 学习资料列表
 * @param {string} examDate - 考试日期（ISO 格式字符串）
 * @returns {Promise<Object>} 学习计划对象，包含知识点和时间安排
 */
export const generatePlan = async (agentConfig, materials = [], examDate = '') => {
    const systemPrompt = '你是一位专业的学习规划师，擅长根据学习资料和考试日期制定科学的学习计划。' +
        '请返回 JSON 格式的学习计划，包含 id、title、createdAt、knowledgePoints、estimatedDays、totalMinutes 字段。';

    const userPrompt = `请根据以下信息生成详细的学习计划。\n考试日期: ${examDate}\n` +
        `学习资料: ${JSON.stringify(materials)}\n` +
        '请确保知识点有合理的学习顺序和时间安排，返回纯 JSON 格式。';

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    try {
        const content = await callAI(agentConfig, messages);
        return parseJsonFromText(content);
    } catch (error) {
        console.warn('生成学习计划失败，降级到 Mock 数据:', error);
        return mockGeneratePlan(materials);
    }
};

/**
 * 生成题目
 * @param {Object} agentConfig - Agent 配置 { providerId, modelId, apiKey }
 * @param {string|Object} knowledgePoint - 知识点 ID 或知识点对象
 * @param {number} count - 题目数量
 * @param {string} difficulty - 难度等级（easy/medium/hard）
 * @returns {Promise<Array>} 题目列表数组
 */
export const generateQuestions = async (agentConfig, knowledgePoint, count = 5, difficulty = 'medium') => {
    const kpDesc = typeof knowledgePoint === 'string' ? knowledgePoint : JSON.stringify(knowledgePoint);
    const userPrompt = `请为知识点 "${kpDesc}" 生成 ${count} 道难度为 ${difficulty} 的选择题。\n` +
        '每道题包含 id、type、question、options、answer、explanation、knowledgePointId、difficulty 字段。\n' +
        '返回 JSON 数组格式。';

    const messages = [
        { role: 'system', content: quizMasterPrompt },
        { role: 'user', content: userPrompt }
    ];

    try {
        const content = await callAI(agentConfig, messages, getAgentOptions('quiz-master'));
        return parseJsonFromText(content);
    } catch (error) {
        console.warn('生成题目失败，降级到 Mock 数据:', error);
        const kpId = typeof knowledgePoint === 'string' ? knowledgePoint : knowledgePoint?.id;
        return mockGenerateQuestions(kpId, count);
    }
};

/**
 * 解析题目（讲解用户答案对错及原理）
 * @param {Object} agentConfig - Agent 配置 { providerId, modelId, apiKey }
 * @param {Object} question - 题目对象
 * @param {string} userAnswer - 用户提交的答案
 * @returns {Promise<Object>} 解析结果，包含 isCorrect、correctAnswer、explanation、tips
 */
export const explainQuestion = async (agentConfig, question, userAnswer) => {
    const userPrompt = `请解析以下题目，用户的答案是: ${userAnswer}\n` +
        `题目信息: ${JSON.stringify(question)}\n` +
        '请返回 JSON 格式，包含 isCorrect、correctAnswer、explanation、tips 字段。';

    const messages = [
        { role: 'system', content: explainerPrompt },
        { role: 'user', content: userPrompt }
    ];

    try {
        const content = await callAI(agentConfig, messages, getAgentOptions('explainer'));
        return parseJsonFromText(content);
    } catch (error) {
        console.warn('解析题目失败，降级到 Mock 数据:', error);
        return mockExplainQuestion(question, userAnswer);
    }
};

/**
 * 按知识点和题型生成题目
 * @param {Object} agentConfig - Agent 配置 { providerId, modelId, apiKey }
 * @param {Object} knowledgePoint - 知识点对象 { id, name, description }
 * @param {string[]} types - 题型数组 ['single', 'truefalse', 'fillblank', 'essay', 'calculation']
 * @param {number} count - 每种题型生成的题目数量
 * @param {string} materialId - 题目所属文档 ID
 * @returns {Promise<Array>} 题目列表数组
 */
export const generateQuestionsByKnowledgePoint = async (
    agentConfig,
    knowledgePoint,
    types = ['single'],
    count = 3,
    materialId = 'manual'
) => {
    const typeLabels = {
        single: '单选题',
        multiple: '多选题',
        truefalse: '判断题',
        fillblank: '填空题',
        essay: '简答题',
        calculation: '计算题'
    };
    const selectedTypes = types.filter(t => typeLabels[t]).map(t => `${t}(${typeLabels[t]})`).join('、');

    const userPrompt = `请为以下知识点生成 ${count} 道练习题。\n` +
        `知识点: ${JSON.stringify(knowledgePoint)}\n` +
        `要求题型: ${selectedTypes}\n` +
        `题目所属文档ID: ${materialId}\n` +
        '请确保题型分布均衡（如果指定多种题型，则每种题型约 ' + count + ' 道），返回 JSON 数组。';

    const messages = [
        { role: 'system', content: generateQuestionsPrompt },
        { role: 'user', content: userPrompt }
    ];

    try {
        const content = await callAI(agentConfig, messages, getAgentOptions('question-generator'));
        const parsed = parseJsonFromText(content);
        const questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        return questions.map((q, idx) => ({
            ...q,
            id: `q-${Date.now()}-${idx}`,
            knowledgePointId: knowledgePoint.id,
            materialId: q.materialId || materialId
        }));
    } catch (error) {
        console.warn('按知识点生成题目失败:', error);
        return [];
    }
};

/**
 * AI 批改用户答案
 * 当用户答案与标准答案不完全一致时，由 AI 判断是否存在等价表达
 * @param {Object} agentConfig - Agent 配置 { providerId, modelId, apiKey }
 * @param {Object} question - 题目对象
 * @param {string} userAnswer - 用户答案
 * @returns {Promise<{isCorrect: boolean, score: number, feedback: string}>}
 */
export const gradeAnswer = async (agentConfig, question, userAnswer) => {
    const userPrompt = `请判断用户答案是否正确。\n` +
        `题目: ${JSON.stringify({
            question: question.question,
            type: question.type,
            options: question.options,
            answer: question.answer,
            explanation: question.explanation
        })}\n` +
        `用户答案: ${userAnswer}\n` +
        '请返回 JSON 格式。';

    const messages = [
        { role: 'system', content: gradeAnswerPrompt },
        { role: 'user', content: userPrompt }
    ];

    try {
        const content = await callAI(agentConfig, messages, getAgentOptions('answer-grader'));
        const parsed = parseJsonFromText(content);
        return {
            isCorrect: Boolean(parsed.isCorrect),
            score: Number(parsed.score) || 0,
            feedback: parsed.feedback || 'AI 批改完成'
        };
    } catch (error) {
        console.warn('AI 批改失败:', error);
        return {
            isCorrect: false,
            score: 0,
            feedback: 'AI 批改失败，已按标准答案判定为错误'
        };
    }
};

/**
 * 获取督学消息（鼓励或提醒）
 * @param {Object} agentConfig - Agent 配置 { providerId, modelId, apiKey }
 * @param {Object} context - 学习上下文（学习时长、进度等）
 * @returns {Promise<string>} 督学消息文本
 */
export const getSuperviseMessage = async (agentConfig, context = {}) => {
    const userPrompt = `根据当前学习状态，给出一条鼓励或提醒的监督消息。\n` +
        `学习上下文: ${JSON.stringify(context)}`;

    const messages = [
        { role: 'system', content: supervisorPrompt },
        { role: 'user', content: userPrompt }
    ];

    try {
        const content = await callAI(agentConfig, messages, getAgentOptions('supervisor'));
        // supervisorPrompt 输出 JSON 格式，提取 message 字段
        try {
            const parsed = parseJsonFromText(content);
            return parsed.message || content;
        } catch (jsonError) {
            // JSON 解析失败时直接返回原始文本
            return content;
        }
    } catch (error) {
        console.warn('获取督学消息失败，降级到 Mock 数据:', error);
        return mockGetSuperviseMessage(context);
    }
};

/** 每个分块的最大字符数（用于分块解析） */
const DOC_CHUNK_SIZE = 10000;

/**
 * 题号边界正则：用于在固定长度切分时找到最近的题目起始位置
 * 支持 1. / 1、 / (1) / Q1. / ① / 一、 等多种格式
 */
const QUESTION_BOUNDARY_REGEX = /(?:\n|^)\s*(?:\d+|[一二三四五六七八九十]{1,3}|[（(]\d+[)）]|[Qq]\d+|[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])[.、．：:)]\s/g;

/**
 * 按标题/模块拆分文档文本为多个 chunk
 * 优先按 Markdown 标题或数字标题拆分，固定长度切分时按题目边界对齐
 * @param {string} text - 文档全文
 * @returns {string[]} 文本块数组
 */
const splitDocumentIntoChunks = (text) => {
    const chunks = [];
    // 优先按标题行拆分：##、模块、单元、章节、第x章 等
    const headingRegex = /(?:\n|\r|^)(?:#{1,3}\s+|\d+[.、]\s*[^\n]+|第[一二三四五六七八九十\d]+章|模块[一二三四五六七八九十\d]+|单元[一二三四五六七八九十\d]+)[\s\S]*?(?=\n(?:#{1,3}\s+|\d+[.、]\s*[^\n]+|第[一二三四五六七八九十\d]+章|模块[一二三四五六七八九十\d]+|单元[一二三四五六七八九十\d]+)|$)/g;
    const matches = text.match(headingRegex);

    if (matches && matches.length > 1) {
        // 合并可能的小 chunk，使其接近 DOC_CHUNK_SIZE
        let currentChunk = '';
        for (const match of matches) {
            if ((currentChunk + match).length > DOC_CHUNK_SIZE && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = match;
            } else {
                currentChunk += '\n' + match;
            }
        }
        if (currentChunk.trim()) chunks.push(currentChunk.trim());
    } else {
        // 无法按标题拆分时，按题目边界对齐切分
        let cursor = 0;
        while (cursor < text.length) {
            // 如果剩余文本不足一个 chunk，直接收尾
            if (cursor + DOC_CHUNK_SIZE >= text.length) {
                const tail = text.substring(cursor).trim();
                if (tail) chunks.push(tail);
                break;
            }

            // 在 [cursor + DOC_CHUNK_SIZE*0.6, cursor + DOC_CHUNK_SIZE*1.2] 范围内
            // 寻找最近的题目边界，避免切断题目
            const searchStart = cursor + Math.floor(DOC_CHUNK_SIZE * 0.6);
            const searchEnd = Math.min(cursor + Math.floor(DOC_CHUNK_SIZE * 1.2), text.length);
            const searchRegion = text.substring(searchStart, searchEnd);

            // 查找该区域内所有的题目边界
            const boundaryIndices = [];
            let m;
            const regex = new RegExp(QUESTION_BOUNDARY_REGEX.source, 'g');
            while ((m = regex.exec(searchRegion)) !== null) {
                // 边界在原文中的绝对位置
                boundaryIndices.push(searchStart + m.index + (m[0].length - m[0].trimStart().length));
            }

            if (boundaryIndices.length > 0) {
                // 优先选择接近 DOC_CHUNK_SIZE 的边界
                const targetEnd = cursor + DOC_CHUNK_SIZE;
                let bestBoundary = boundaryIndices[0];
                let bestDist = Math.abs(boundaryIndices[0] - targetEnd);
                for (const idx of boundaryIndices) {
                    const dist = Math.abs(idx - targetEnd);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestBoundary = idx;
                    }
                }
                const chunk = text.substring(cursor, bestBoundary).trim();
                if (chunk) chunks.push(chunk);
                cursor = bestBoundary;
            } else {
                // 区域内未找到题目边界，回退到固定长度切分
                const chunk = text.substring(cursor, cursor + DOC_CHUNK_SIZE).trim();
                if (chunk) chunks.push(chunk);
                cursor += DOC_CHUNK_SIZE;
            }
        }
    }

    return chunks.filter(c => c.trim().length > 100);
};

/**
 * 合并多个分块解析结果，并重新生成全局唯一 ID
 * @param {Object[]} results - 各分块的解析结果数组
 * @param {string} materialId - 题目所属文档 ID
 * @returns {Object} 合并后的 { knowledgePoints, questions }
 */
const mergeParseResults = (results, materialId) => {
    const knowledgePoints = [];
    const questions = [];

    results.forEach((result) => {
        const chunkKnowledgePoints = result.knowledgePoints || [];
        const chunkQuestions = result.questions || [];

        // 为该分块的知识点重新分配全局 ID
        const localToGlobalKpId = new Map();
        chunkKnowledgePoints.forEach((kp, idx) => {
            const localId = kp.id || `kp-${idx}`;
            const globalId = `kp-${knowledgePoints.length + idx + 1}`;
            localToGlobalKpId.set(localId, globalId);
            knowledgePoints.push({ ...kp, id: globalId });
        });

        chunkQuestions.forEach((q, idx) => {
            const globalKpId = localToGlobalKpId.get(q.knowledgePointId) || knowledgePoints[0]?.id;
            questions.push({
                ...q,
                id: `q-${questions.length + idx + 1}`,
                knowledgePointId: globalKpId,
                materialId: q.materialId || materialId
            });
        });
    });

    // 知识点按名称去重
    const uniqueKps = [];
    const seenNames = new Set();
    knowledgePoints.forEach(kp => {
        const key = (kp.name || '').trim().toLowerCase();
        if (key && !seenNames.has(key)) {
            seenNames.add(key);
            uniqueKps.push(kp);
        } else if (!key) {
            uniqueKps.push(kp);
        }
    });

    // 重新修正所有知识点 ID 和题目关联
    const finalKpMap = new Map();
    uniqueKps.forEach((kp, idx) => {
        finalKpMap.set(kp.id, `kp-${idx + 1}`);
        kp.id = `kp-${idx + 1}`;
    });

    const finalQuestions = questions.map((q, idx) => ({
        ...q,
        id: `q-${idx + 1}`,
        knowledgePointId: finalKpMap.get(q.knowledgePointId) || uniqueKps[0]?.id,
        materialId: q.materialId || materialId
    }));

    return { knowledgePoints: uniqueKps, questions: finalQuestions };
};

/**
 * 使用 AI 解析文档，提取知识点和题目
 * 对大文档自动分块解析，避免超出模型上下文/输出限制
 * @param {Object} agentConfig - Agent 配置 { providerId, modelId, apiKey }
 * @param {string} text - 文档提取后的纯文本内容
 * @param {string} documentType - 文档类型（如 'pdf'、'docx'）
 * @param {string} materialId - 题目所属文档 ID
 * @returns {Promise<Object>} 解析结果 { knowledgePoints, questions }
 */
export const parseDocumentWithAI = async (agentConfig, text, documentType = 'text', materialId = 'default') => {
    const chunks = splitDocumentIntoChunks(text);
    console.log(`文档分块数量: ${chunks.length}, 总字符数: ${text.length}`);

    // 如果文档很短，直接一次解析
    if (chunks.length <= 1) {
        const userPrompt = `文档类型: ${documentType}\n` +
            `题目所属文档ID: ${materialId}\n` +
            `文档内容:\n${text}\n\n` +
            '请提取知识点和生成题目。';

        const messages = [
            { role: 'system', content: documentParsePrompt },
            { role: 'user', content: userPrompt }
        ];

        const content = await callAI(agentConfig, messages, getAgentOptions('document-parser'));
        return parseJsonFromText(content);
    }

    // 分块解析：分块之间主动延迟，避免触发服务商速率限制
    const parseResults = [];
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    for (let i = 0; i < chunks.length; i++) {
        if (i > 0) {
            // 智谱免费模型约 5-10 QPS，每块之间等待 300ms 降低触发概率
            await delay(300);
        }

        const chunk = chunks[i];
        const userPrompt = `文档类型: ${documentType}\n` +
            `题目所属文档ID: ${materialId}\n` +
            `这是文档的第 ${i + 1}/${chunks.length} 部分。\n` +
            `文档内容:\n${chunk}\n\n` +
            '请提取本部分的知识点和题目。';

        const messages = [
            { role: 'system', content: documentParsePrompt },
            { role: 'user', content: userPrompt }
        ];

        const content = await callAI(agentConfig, messages, getAgentOptions('document-parser'));
        console.log(`分块 ${i + 1}/${chunks.length} 返回长度: ${content.length}`);
        const result = parseJsonFromText(content);
        parseResults.push(result);
    }

    const merged = mergeParseResults(parseResults, materialId);
    console.log('分块解析合并完成:', {
        knowledgePoints: merged.knowledgePoints.length,
        questions: merged.questions.length
    });
    return merged;
};

// ==================== Mock 降级函数 ====================

/**
 * 生成 Mock 学习计划
 * @param {Array} materials - 学习资料列表
 * @returns {Object} Mock 学习计划对象
 */
export const mockGeneratePlan = (materials = []) => {
    return {
        id: `plan-${Date.now()}`,
        title: materials.length > 0 ? `${materials[0].name}学习计划` : '电路分析学习计划',
        createdAt: new Date().toISOString(),
        knowledgePoints: sampleKnowledgePoints.map(kp => ({
            ...kp,
            // 随机分配未来 7 天内的学习日期
            scheduledDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })),
        estimatedDays: 14,
        totalMinutes: sampleKnowledgePoints.reduce((sum, kp) => sum + kp.estimatedTime, 0)
    };
};

/**
 * 生成 Mock 题目
 * @param {string} knowledgePointId - 知识点 ID，为空时返回全部题目
 * @param {number} count - 题目数量
 * @returns {Array} Mock 题目列表
 */
export const mockGenerateQuestions = (knowledgePointId, count = 5) => {
    let questions = sampleQuestions;
    if (knowledgePointId) {
        questions = sampleQuestions.filter(q => q.knowledgePointId === knowledgePointId);
    }
    return questions.slice(0, count);
};

/**
 * 生成 Mock 题目解析
 * @param {Object} question - 题目对象
 * @param {string} userAnswer - 用户答案
 * @returns {Object} Mock 解析结果
 */
export const mockExplainQuestion = (question, userAnswer) => {
    const isCorrect = userAnswer === question.answer;
    return {
        isCorrect,
        correctAnswer: question.answer,
        explanation: question.explanation,
        tips: isCorrect
            ? '回答正确！继续保持！'
            : '不要灰心，仔细看一下解析，理解其中的原理后再试试类似题目。'
    };
};

/**
 * 生成 Mock 督学消息
 * @param {Object} context - 学习上下文（Mock 模式下未使用）
 * @returns {string} 随机督学消息
 */
export const mockGetSuperviseMessage = (_context = {}) => {
    const messages = [
        '专注学习，你已经坚持了5分钟了，继续加油！',
        '不要刷手机哦，学习需要专注。',
        '休息一下眼睛，看看远处，然后继续学习吧！',
        '今天的目标完成了多少了？进度不错，继续保持！',
        '错题本里的题目复习了吗？温故而知新。',
        '学习累了可以站起来活动一下，喝杯水。',
        '已经学习很久了，要不要做几道题检验一下？',
        '坚持就是胜利，你离目标又近了一步！'
    ];

    return messages[Math.floor(Math.random() * messages.length)];
};

// ==================== 多模态 AI（视觉识别题目）====================

/**
 * 检查 Agent 配置的模型是否支持多模态视觉输入
 * 通过查询 aiProviders 中的模型 supportsVision 字段判断
 * @param {Object} agentConfig - Agent 配置 { providerId, modelId, apiKey }
 * @returns {boolean} 是否支持视觉输入
 */
export const isMultimodalModel = (agentConfig) => {
    if (!agentConfig || !agentConfig.providerId || !agentConfig.modelId) {
        return false;
    }
    const provider = getProviderById(agentConfig.providerId);
    if (!provider) return false;
    const model = provider.models.find(m => m.id === agentConfig.modelId);
    return Boolean(model?.supportsVision);
};

/** 视觉 AI 单次最多处理的图片数量（避免单次请求图片过多导致超时或超限） */
const MAX_IMAGES_PER_REQUEST = 5;

/**
 * 将图片数组转换为 OpenAI 多模态消息 content 数组
 * @param {string[]} images - base64 data URL 数组
 * @param {string} textPrompt - 文本提示
 * @returns {Array} OpenAI content 数组
 */
const buildMultimodalContent = (images, textPrompt) => {
    const content = [{ type: 'text', text: textPrompt }];
    for (const img of images) {
        content.push({
            type: 'image_url',
            image_url: { url: img }
        });
    }
    return content;
};

/**
 * 使用多模态 AI 识别图片中的题目
 * 将图片分批发送给视觉 AI（每批最多 MAX_IMAGES_PER_REQUEST 张），合并所有批次的识别结果
 * @param {Object} agentConfig - Agent 配置（必须支持多模态）
 * @param {string[]} images - base64 data URL 数组
 * @param {string} materialId - 题目所属文档 ID
 * @returns {Promise<Object>} 识别结果 { knowledgePoints, questions }
 */
export const parseImagesWithAI = async (agentConfig, images, materialId = 'image-source') => {
    if (!images || images.length === 0) {
        return { knowledgePoints: [], questions: [] };
    }

    if (!isMultimodalModel(agentConfig)) {
        throw new Error('当前 AI 模型不支持多模态视觉输入，无法识别图片题目');
    }

    // 分批处理图片，避免单次请求图片过多导致超时或超限
    const batches = [];
    for (let i = 0; i < images.length; i += MAX_IMAGES_PER_REQUEST) {
        batches.push(images.slice(i, i + MAX_IMAGES_PER_REQUEST));
    }

    console.log(`图片题识别：共 ${images.length} 张图片，分 ${batches.length} 批处理`);

    const parseResults = [];
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < batches.length; i++) {
        if (i > 0) {
            // 批次间延迟 500ms，避免触发速率限制
            await delay(500);
        }

        const batch = batches[i];
        const textPrompt = `这是文档中的第 ${i + 1}/${batches.length} 批图片（共 ${batch.length} 张）。\n` +
            `题目所属文档ID: ${materialId}\n` +
            '请识别图片中的所有题目（包括题干、选项、答案、解析），并按 JSON Schema 输出。\n' +
            '注意：图片可能包含电路图、公式、表格等，请尽量识别并描述。';

        const messages = [
            { role: 'system', content: documentParsePrompt },
            { role: 'user', content: buildMultimodalContent(batch, textPrompt) }
        ];

        try {
            const content = await callAI(agentConfig, messages, getAgentOptions('document-parser'));
            console.log(`图片批次 ${i + 1}/${batches.length} 返回长度: ${content.length}`);
            const result = parseJsonFromText(content);
            parseResults.push(result);
        } catch (error) {
            console.warn(`图片批次 ${i + 1}/${batches.length} 识别失败:`, error);
            // 单批失败不影响其他批次
        }
    }

    // 合并各批次结果
    if (parseResults.length === 0) {
        return { knowledgePoints: [], questions: [] };
    }
    if (parseResults.length === 1) {
        return parseResults[0];
    }
    return mergeParseResults(parseResults, materialId);
};

// ==================== 默认导出 ====================

export default {
    callAI,
    generatePlan,
    generateQuestions,
    generateQuestionsByKnowledgePoint,
    gradeAnswer,
    explainQuestion,
    getSuperviseMessage,
    parseDocumentWithAI,
    parseImagesWithAI,
    isAIConfigured,
    isMultimodalModel,
    getProviderById,
    mockGeneratePlan,
    mockGenerateQuestions,
    mockExplainQuestion,
    mockGetSuperviseMessage
};
