/**
 * @file 题库解析统一入口（Pipeline）
 * @description 按 文件类型路由到最佳解析器，实现 AI 优先 + 规则兜底策略：
 *
 * 解析流程：
 *   1. 结构化格式（.json/.csv/.md）→ structuredParser 精准解析（100% 可靠）
 *   2. 非结构化文档（.pdf/.docx/.txt）→ 提取文本和图片
 *      2.1 若已配置 AI 且模型支持多模态 → 文本+图片并行处理：
 *          - 文本走 parseDocumentWithAI（AI 智能解析，适应任意版式）
 *          - 图片走 parseImagesWithAI（多模态视觉识别题目）
 *          - 合并两路结果
 *      2.2 若已配置 AI 但模型不支持多模态 → 仅文本走 parseDocumentWithAI
 *      2.3 AI 失败或未配置 → parseQuestionBank 规则解析兜底
 *   3. Excel（.xlsx/.xls）→ 提示用户另存为 CSV（避免引入大依赖）
 *
 * 输出统一结构：
 *   { questions, knowledgePoints, method, warning, invalidQuestions, ... }
 *   - method: 'structured' | 'ai' | 'ai-multimodal' | 'rule-fallback' | 'rule-only'
 *   - warning: 降级/失败提示（空字符串表示无警告）
 */

import { parseDocument, parseDocumentWithImages } from './documentParser';
import { parseQuestionBank } from './questionParser';
import { parseStructured } from './structuredParser';
import {
    parseDocumentWithAI,
    parseImagesWithAI,
    isAIConfigured,
    isMultimodalModel
} from '../services/aiService';

/** 结构化格式扩展名（纯文本，浏览器原生可解析） */
const STRUCTURED_EXTENSIONS = ['json', 'csv', 'md', 'markdown'];

/** 文档格式扩展名（需 PDF.js / mammoth 提取文本） */
const DOCUMENT_EXTENSIONS = ['pdf', 'docx', 'txt'];

/** Excel 扩展名（二进制 ZIP 格式，浏览器原生无法解析） */
const EXCEL_EXTENSIONS = ['xlsx', 'xls'];

/**
 * 获取文件扩展名（小写）
 * @param {string} fileName - 文件名
 * @returns {string} 扩展名（不含点）
 */
const getExtension = (fileName) => {
    return String(fileName || '').split('.').pop().toLowerCase();
};

/**
 * 构建统一解析结果对象
 * @param {Object} parsed - 解析器原始返回
 * @param {string} method - 解析方式
 * @param {string} warning - 警告信息
 * @returns {Object} 统一结构结果
 */
const buildResult = (parsed, method, warning = '') => ({
    questions: parsed.questions || [],
    knowledgePoints: parsed.knowledgePoints || [],
    invalidQuestions: parsed.invalidQuestions || [],
    answerKey: parsed.answerKey || {},
    successCount: parsed.successCount || (parsed.questions?.length || 0),
    totalCount: parsed.totalCount || (parsed.questions?.length || 0),
    invalidCount: parsed.invalidCount || 0,
    typeDistribution: parsed.typeDistribution || {},
    method,
    warning
});

/**
 * 合并文本解析结果和图片识别结果
 * 知识点按名称去重并重新分配全局 ID，题目重新关联知识点 ID
 * @param {Object} textResult - 文本解析结果 { knowledgePoints, questions }
 * @param {Object} imageResult - 图片识别结果 { knowledgePoints, questions }
 * @param {string} materialId - 文档 ID
 * @returns {Object} 合并后的 { knowledgePoints, questions }
 */
const mergeTextAndImageResults = (textResult, imageResult, materialId) => {
    const knowledgePoints = [];
    const questions = [];
    const kpIdMap = new Map();
    const seenKpNames = new Set();

    const ingestKps = (kps) => {
        for (const kp of kps || []) {
            const name = (kp.name || '').trim().toLowerCase();
            if (name && seenKpNames.has(name)) {
                const existing = knowledgePoints.find(
                    k => (k.name || '').trim().toLowerCase() === name
                );
                if (kp.id) kpIdMap.set(kp.id, existing.id);
            } else {
                const newId = `kp-${knowledgePoints.length + 1}`;
                knowledgePoints.push({ ...kp, id: newId });
                if (kp.id) kpIdMap.set(kp.id, newId);
                if (name) seenKpNames.add(name);
            }
        }
    };

    const ingestQuestions = (qs) => {
        for (const q of qs || []) {
            const newKpId = q.knowledgePointId
                ? (kpIdMap.get(q.knowledgePointId) || knowledgePoints[0]?.id)
                : knowledgePoints[0]?.id;
            questions.push({
                ...q,
                id: `q-${questions.length + 1}`,
                knowledgePointId: newKpId,
                materialId: q.materialId || materialId
            });
        }
    };

    ingestKps(textResult?.knowledgePoints);
    ingestKps(imageResult?.knowledgePoints);
    ingestQuestions(textResult?.questions);
    ingestQuestions(imageResult?.questions);

    return { knowledgePoints, questions };
};

/**
 * 统一题库解析入口
 *
 * @param {File} file - 文件对象
 * @param {Object} agentConfig - AI Agent 配置 { providerId, modelId, apiKey }
 * @param {Function} [onProgress] - 进度回调 (0-100)
 * @returns {Promise<Object>} 解析结果（含 method 和 warning 字段）
 *
 * @example
 * // 正式模式：配置了 AI
 * const result = await parseQuestionFile(file, aiConfig, p => setProgress(p));
 * // result.method === 'ai' | 'ai-multimodal' | 'structured' | 'rule-fallback'
 *
 * @example
 * // 未配置 AI：自动降级到规则解析
 * const result = await parseQuestionFile(file, null);
 * // result.method === 'rule-only' | 'rule-fallback'
 */
export const parseQuestionFile = async (file, agentConfig, onProgress) => {
    const ext = getExtension(file.name);

    // ========== 阶段 1：Excel 格式提示转换 ==========
    if (EXCEL_EXTENSIONS.includes(ext)) {
        throw new Error(
            '暂不支持直接解析 .xlsx/.xls 文件（避免引入大体积依赖）。' +
            '请将 Excel 文件另存为 .csv 格式后上传，CSV 可被精准解析。' +
            '或配置 AI 后，将内容复制到 .txt 文件由 AI 解析。'
        );
    }

    // ========== 阶段 2：结构化格式直接精准解析 ==========
    if (STRUCTURED_EXTENSIONS.includes(ext)) {
        try {
            const result = await parseStructured(file, onProgress);
            return buildResult(result, 'structured');
        } catch (error) {
            // 结构化解析失败，尝试读取文本后用规则解析兜底
            console.warn('结构化解析失败，降级到规则解析:', error);
            try {
                const text = await file.text();
                const fallback = parseQuestionBank(text);
                return buildResult(
                    fallback,
                    'rule-fallback',
                    `结构化解析失败（${error.message}），已降级到规则解析，复杂版式可能识别不全`
                );
            } catch (fallbackError) {
                throw new Error(`结构化解析与规则兜底均失败: ${fallbackError.message}`);
            }
        }
    }

    // ========== 阶段 3：非结构化文档提取文本和图片 ==========
    if (!DOCUMENT_EXTENSIONS.includes(ext)) {
        throw new Error(`不支持的文件格式: .${ext}。支持 PDF/Word/TXT/JSON/CSV/Markdown`);
    }

    // 根据是否需要图片提取，选择不同的解析函数
    const needImages = isAIConfigured(agentConfig) && isMultimodalModel(agentConfig);
    let text = '';
    let images = [];

    try {
        if (needImages) {
            if (onProgress) onProgress(10);
            const docResult = await parseDocumentWithImages(file, (progress) => {
                // 文本+图片提取占整体 10%-50%
                if (onProgress) onProgress(10 + Math.floor(progress * 0.4));
            });
            text = docResult.text;
            images = docResult.images || [];
            console.log(`文档提取完成：文本 ${text.length} 字符，图片 ${images.length} 张`);
        } else {
            if (onProgress) onProgress(10);
            text = await parseDocument(file, (progress) => {
                if (onProgress) onProgress(10 + Math.floor(progress * 0.4));
            });
        }
    } catch (error) {
        throw new Error(`文档文本提取失败: ${error.message}`);
    }

    if (!text || !text.trim()) {
        // 文本为空但有图片时，仍可走多模态 AI 识别
        if (images.length === 0) {
            throw new Error('文档提取文本为空，可能是扫描版 PDF 或空文件');
        }
        console.warn('文档提取文本为空，但提取到图片，将走多模态 AI 识别');
    }

    // ========== 阶段 4：AI 优先解析（若已配置 AI）==========
    if (isAIConfigured(agentConfig)) {
        const supportsMultimodal = isMultimodalModel(agentConfig);
        const hasImages = images.length > 0;
        const materialId = file.name || `upload-${Date.now()}`;

        try {
            // 4.1 文本+图片并行处理（模型支持多模态且文档有图片）
            if (supportsMultimodal && hasImages) {
                if (onProgress) onProgress(55);

                // 并行启动文本解析和图片识别
                // 使用 allSettled 确保一路失败不影响另一路
                const [textSettled, imageSettled] = await Promise.allSettled([
                    // 文本解析（如果文本为空，跳过此步）
                    text.trim()
                        ? parseDocumentWithAI(agentConfig, text, ext, materialId)
                        : Promise.resolve({ knowledgePoints: [], questions: [] }),
                    parseImagesWithAI(agentConfig, images, materialId)
                ]);

                const textResult = textSettled.status === 'fulfilled'
                    ? textSettled.value
                    : null;
                const imageResult = imageSettled.status === 'fulfilled'
                    ? imageSettled.value
                    : null;

                // 文本和图片都失败
                if (!textResult && !imageResult) {
                    throw new Error('文本解析和图片识别均失败');
                }

                // 合并两路结果
                const merged = mergeTextAndImageResults(textResult, imageResult, materialId);
                const totalQuestions = merged.questions?.length || 0;

                if (totalQuestions === 0) {
                    // 合并后仍 0 题，降级到规则解析
                    console.warn('AI 多模态解析返回 0 道题目，降级到规则解析');
                    const ruleResult = parseQuestionBank(text);
                    if (ruleResult.questions.length > 0) {
                        return buildResult(
                            ruleResult,
                            'rule-fallback',
                            'AI 未能从文档中识别题目，已降级到规则解析（图片题无法识别）'
                        );
                    }
                    return buildResult(
                        { questions: [], knowledgePoints: [] },
                        'ai-multimodal',
                        'AI 与规则解析均未识别到题目，请检查文件内容或调整 AI 配置'
                    );
                }

                if (onProgress) onProgress(100);
                // 文本和图片任一失败时给出部分降级提示
                let warning = '';
                if (!textResult) {
                    warning = '文本解析失败，仅使用图片识别结果';
                } else if (!imageResult) {
                    warning = '图片识别失败，仅使用文本解析结果';
                }
                return buildResult(merged, 'ai-multimodal', warning);
            }

            // 4.2 仅文本解析（模型不支持多模态或文档无图片）
            if (text.trim()) {
                if (onProgress) onProgress(55);
                const aiResult = await parseDocumentWithAI(agentConfig, text, ext, materialId);
                const aiQuestions = aiResult.questions || [];
                const aiKnowledgePoints = aiResult.knowledgePoints || [];

                // AI 解析结果检查：题目数为 0 时降级
                if (aiQuestions.length === 0) {
                    console.warn('AI 解析返回 0 道题目，降级到规则解析');
                    const ruleResult = parseQuestionBank(text);
                    if (ruleResult.questions.length > 0) {
                        return buildResult(
                            ruleResult,
                            'rule-fallback',
                            'AI 未能从文档中识别题目，已降级到规则解析'
                        );
                    }
                    // 文档有图片但模型不支持多模态，给出更明确的提示
                    const multimodalHint = hasImages && !supportsMultimodal
                        ? '。检测到文档包含图片，但当前 AI 模型不支持多模态，建议切换到 GLM-4-Plus / Qwen3.6-Plus / Gemini 2.5 / GPT-4o 等支持视觉的模型'
                        : '';
                    return buildResult(
                        { questions: [], knowledgePoints: [] },
                        'ai',
                        'AI 与规则解析均未识别到题目，请检查文件内容或调整 AI 配置' + multimodalHint
                    );
                }

                if (onProgress) onProgress(100);
                return buildResult(
                    { questions: aiQuestions, knowledgePoints: aiKnowledgePoints },
                    'ai'
                );
            }

            // 4.3 文本为空、模型不支持多模态但有图片：无法处理
            if (hasImages && !supportsMultimodal) {
                throw new Error(
                    '文档提取文本为空且包含图片，但当前 AI 模型不支持多模态视觉输入。' +
                    '建议切换到 GLM-4-Plus / Qwen3.6-Plus / Gemini 2.5 / GPT-4o 等支持视觉的模型后重试。'
                );
            }
        } catch (error) {
            // AI 解析失败，降级到规则解析
            console.warn('AI 解析失败，降级到规则解析:', error);
            const ruleResult = parseQuestionBank(text);
            if (ruleResult.questions.length > 0) {
                return buildResult(
                    ruleResult,
                    'rule-fallback',
                    `AI 解析失败（${error.message}），已降级到规则解析，复杂版式可能识别不全`
                );
            }
            // AI 失败且规则解析也无结果
            throw new Error(
                `AI 解析失败且规则解析未识别到题目。AI 错误: ${error.message}。` +
                '请检查 AI 配置、API Key 余额，或调整文档格式后重试。'
            );
        }
    }

    // ========== 阶段 5：未配置 AI，直接规则解析 + 提示 ==========
    if (onProgress) onProgress(80);
    const ruleResult = parseQuestionBank(text);
    if (onProgress) onProgress(100);

    if (ruleResult.questions.length === 0) {
        return buildResult(
            ruleResult,
            'rule-only',
            '未配置 AI 且规则解析未识别到题目。建议在设置页配置 AI 后重新解析，' +
            'AI 能识别多种版式、答案表、英文题库等复杂格式。'
        );
    }

    // 规则解析有结果，根据成功率给出不同程度的提示
    const successRate = ruleResult.totalCount > 0
        ? ruleResult.successCount / ruleResult.totalCount
        : 1;
    let warning = '';
    if (successRate < 0.5) {
        warning = `未配置 AI，规则解析成功率仅 ${Math.round(successRate * 100)}%` +
            `（${ruleResult.successCount}/${ruleResult.totalCount}）。` +
            '建议配置 AI 获得更好的解析效果，AI 能识别多种版式和答案表。';
    } else if (successRate < 1) {
        warning = `未配置 AI，规则解析成功率 ${Math.round(successRate * 100)}%` +
            `（${ruleResult.successCount}/${ruleResult.totalCount}）。` +
            '配置 AI 可进一步提升复杂版式的识别率。';
    } else {
        warning = '未配置 AI，使用规则解析。配置 AI 可支持更多版式与英文题库。';
    }

    return buildResult(ruleResult, 'rule-only', warning);
};

export default parseQuestionFile;
