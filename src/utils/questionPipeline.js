/**
 * @file 题库解析统一入口（Pipeline）
 * @description 按 文件类型路由到最佳解析器，实现 规则优先 + AI 补充 策略：
 *
 * 解析流程：
 *   1. 结构化格式（.json/.csv/.md）→ structuredParser 精准解析（100% 可靠）
 *   2. 非结构化文档（.pdf/.docx/.txt）→ 提取文本和图片
 *      2.1 文本先走规则解析（快速、免费、稳定）
 *      2.2 规则解析质量好（successRate ≥ 0.7 且题目数 ≥ 3）→ 直接返回规则结果
 *      2.3 规则解析不足（成功率低或 0 题）→ 走 AI 补充解析：
 *          - 若模型支持多模态且有图片 → 文本+图片并行处理
 *          - 否则仅文本走 AI 解析
 *          - AI 失败时用规则结果兜底
 *      2.4 未配置 AI → 直接返回规则结果
 *   3. Excel（.xlsx/.xls）→ 提示用户另存为 CSV（避免引入大依赖）
 *
 * 输出统一结构：
 *   { questions, knowledgePoints, method, warning, invalidQuestions, ... }
 *   - method: 'structured' | 'rule' | 'ai' | 'ai-multimodal' | 'rule-fallback' | 'rule-only'
 *   - warning: 降级/失败提示（空字符串表示无警告）
 */

import { parseDocument, parseDocumentWithImages, renderPdfPages } from './documentParser';
import { parseQuestionBank } from './questionParser';
import { parseStructured } from './structuredParser';
import {
    parseDocumentWithAI,
    parseImagesWithAI,
    reParseDocument,
    extractDocumentStructure,
    parseQuestionsBatch,
    isAIConfigured,
    isMultimodalModel
} from '../services/aiService';

/** 信心度等级常量：标注每道题 AI 解析的可靠性 */
export const CONFIDENCE = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
};

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
 * @param {string} rawText - 原文文本
 * @param {Array} [pageImages=[]] - PDF 整页渲染图片数组 [{ pageNumber, imageData }]
 * @returns {Object} 统一结构结果
 */
const buildResult = (parsed, method, warning = '', rawText = '', pageImages = []) => ({
    questions: parsed.questions || [],
    knowledgePoints: parsed.knowledgePoints || [],
    invalidQuestions: parsed.invalidQuestions || [],
    answerKey: parsed.answerKey || {},
    successCount: parsed.successCount || (parsed.questions?.length || 0),
    totalCount: parsed.totalCount || (parsed.questions?.length || 0),
    invalidCount: parsed.invalidCount || 0,
    typeDistribution: parsed.typeDistribution || {},
    rawText,
    pageImages,
    method,
    warning
});

/**
 * 根据解析成功率计算信心度等级
 * @param {number} successRate - 成功率（0-1）
 * @returns {string} 信心度等级：high / medium / low
 */
const getConfidenceFromSuccessRate = (successRate) => {
    if (successRate >= 0.8) return CONFIDENCE.HIGH;
    if (successRate >= 0.5) return CONFIDENCE.MEDIUM;
    return CONFIDENCE.LOW;
};

/**
 * 为题目数组批量添加 confidence 字段
 * @param {Array} questions - 题目数组
 * @param {string} level - 信心度等级
 * @returns {Array} 添加信心度后的题目数组
 */
const addConfidence = (questions, level) => {
    return (questions || []).map(q => ({ ...q, confidence: level }));
};

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
 * 策略：规则优先 + AI 补充
 * - 结构化格式（JSON/CSV/MD）→ structuredParser 精准解析
 * - 文档格式 → 先规则解析，质量好直接用；不足时走 AI 补充；AI 失败用规则兜底
 *
 * @param {File} file - 文件对象
 * @param {Object} agentConfig - AI Agent 配置 { providerId, modelId, apiKey }
 * @param {Function} [onProgress] - 进度回调 (0-100)
 * @param {Object} [visionAgentConfig] - 独立的多模态视觉 AI 配置 { providerId, modelId, apiKey }，
 *        当主 AI（agentConfig）不支持多模态时，文档图片解析将使用此配置
 * @returns {Promise<Object>} 解析结果（含 method 和 warning 字段）
 *
 * @example
 * // 正式模式：配置了 AI
 * const result = await parseQuestionFile(file, aiConfig, p => setProgress(p));
 * // result.method === 'rule' | 'ai' | 'ai-multimodal' | 'structured' | 'rule-fallback'
 *
 * @example
 * // 未配置 AI：仅用规则解析
 * const result = await parseQuestionFile(file, null);
 * // result.method === 'rule-only'
 */
export const parseQuestionFile = async (file, agentConfig, onProgress, visionAgentConfig) => {
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
            // 读取文件原始文本用于原文预览
            const fileText = await file.text();
            const result = await parseStructured(file, onProgress);
            // 结构化格式（JSON/CSV）解析准确，信心度为 high
            result.questions = addConfidence(result.questions, CONFIDENCE.HIGH);
            return buildResult(result, 'structured', '', fileText);
        } catch (error) {
            // 结构化解析失败，尝试读取文本后用规则解析兜底
            console.warn('结构化解析失败，降级到规则解析:', error);
            try {
                const text = await file.text();
                const fallback = parseQuestionBank(text);
                // 结构化解析失败的降级路径，信心度为 low
                fallback.questions = addConfidence(fallback.questions, CONFIDENCE.LOW);
                return buildResult(
                    fallback,
                    'rule-fallback',
                    `结构化解析失败（${error.message}），已降级到规则解析，复杂版式可能识别不全`,
                    text
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
    const supportsMultimodal = isAIConfigured(agentConfig) && isMultimodalModel(agentConfig);
    // 独立视觉 AI：当主 AI 不支持多模态时，检查是否配置了独立的视觉 AI
    const visionConfigured = isAIConfigured(visionAgentConfig) && isMultimodalModel(visionAgentConfig);
    // 是否有任何可用的多模态能力（主 AI 或独立视觉 AI）
    const hasMultimodalCapability = supportsMultimodal || visionConfigured;
    const isPdf = ext === 'pdf';
    // PDF + 多模态 AI：优先走整页渲染看图解析（解决 getTextContent 无法提取公式的问题）
    // 主 AI 支持多模态用主 AI，否则用独立视觉 AI
    const usePdfPageRendering = isPdf && hasMultimodalCapability;
    // 图片解析使用的 AI 配置：主 AI 优先（若支持多模态），否则用独立视觉 AI
    const imageAgentConfig = supportsMultimodal ? agentConfig : visionAgentConfig;
    let text = '';
    let images = [];
    let pageImages = [];

    try {
        if (usePdfPageRendering) {
            // PDF 整页渲染：保留完整版式、公式、图表，供多模态 AI 看图解析
            if (onProgress) onProgress(5);
            pageImages = await renderPdfPages(file, (progress) => {
                if (onProgress) onProgress(5 + Math.floor(progress * 0.2));
            });
            console.log(`PDF 整页渲染完成：${pageImages.length} 页图片`);

            // 同时提取文本（用于规则解析兜底和原文预览的文本模式）
            if (onProgress) onProgress(25);
            try {
                const docResult = await parseDocumentWithImages(file, (progress) => {
                    if (onProgress) onProgress(25 + Math.floor(progress * 0.15));
                });
                text = docResult.text;
                images = docResult.images || [];
            } catch (textError) {
                // 文本提取失败不影响图片解析
                console.warn('PDF 文本提取失败（不影响图片解析）:', textError.message);
            }
        } else if (supportsMultimodal) {
            // 非 PDF 但支持多模态（如 Word）：提取文本 + 内嵌图片
            if (onProgress) onProgress(10);
            const docResult = await parseDocumentWithImages(file, (progress) => {
                if (onProgress) onProgress(10 + Math.floor(progress * 0.3));
            });
            text = docResult.text;
            images = docResult.images || [];
            console.log(`文档提取完成：文本 ${text.length} 字符，图片 ${images.length} 张`);
        } else {
            if (onProgress) onProgress(10);
            text = await parseDocument(file, (progress) => {
                if (onProgress) onProgress(10 + Math.floor(progress * 0.3));
            });
        }
    } catch (error) {
        throw new Error(`文档文本提取失败: ${error.message}`);
    }

    if (!text || !text.trim()) {
        // 文本为空但有整页图片或内嵌图片时，仍可走多模态 AI 识别
        if (pageImages.length === 0 && images.length === 0) {
            throw new Error('文档提取文本为空，可能是扫描版 PDF 或空文件');
        }
        console.warn('文档提取文本为空，但有图片，将走多模态 AI 识别');
    }

    // ========== 阶段 4：规则优先解析文本 ==========
    if (onProgress) onProgress(45);
    let ruleResult = null;
    if (text.trim()) {
        try {
            ruleResult = parseQuestionBank(text);
            console.log(
                `规则解析完成：成功 ${ruleResult.successCount}/${ruleResult.totalCount} 题` +
                (ruleResult.invalidCount > 0 ? `（${ruleResult.invalidCount} 题无效）` : '')
            );
        } catch (error) {
            console.warn('规则解析异常:', error);
        }
    }

    // 评估规则解析质量
    const ruleQuestions = ruleResult?.questions || [];
    const ruleSuccessRate = ruleResult && ruleResult.totalCount > 0
        ? ruleResult.successCount / ruleResult.totalCount
        : 0;
    // 规则解析质量好：成功率 ≥ 0.7 且题目数 ≥ 3
    const ruleQualityGood = ruleResult && ruleQuestions.length >= 3 && ruleSuccessRate >= 0.7;

    // ========== 阶段 5：规则解析质量好，直接返回 ==========
    if (ruleQualityGood) {
        if (onProgress) onProgress(100);
        let warning = '';
        if (ruleSuccessRate < 1) {
            warning = `规则解析成功率 ${Math.round(ruleSuccessRate * 100)}%` +
                `（${ruleResult.successCount}/${ruleResult.totalCount}）` +
                `${ruleResult.invalidCount > 0 ? `，${ruleResult.invalidCount} 题因信息不完整被丢弃` : ''}。` +
                '配置 AI 可识别更复杂的版式。';
        }
        // 规则解析：根据成功率标注信心度
        ruleResult.questions = addConfidence(
            ruleResult.questions,
            getConfidenceFromSuccessRate(ruleSuccessRate)
        );
        return buildResult(ruleResult, 'rule', warning, text, pageImages);
    }

    // ========== 阶段 6：规则解析不足，走 AI 补充 ==========
    if (!isAIConfigured(agentConfig)) {
        // ========== 阶段 6.1：未配置 AI，直接返回规则结果 ==========
        if (onProgress) onProgress(100);
        if (ruleResult && ruleQuestions.length > 0) {
            // 规则解析：根据成功率标注信心度
            ruleResult.questions = addConfidence(
                ruleResult.questions,
                getConfidenceFromSuccessRate(ruleSuccessRate)
            );
            return buildResult(
                ruleResult,
                'rule-only',
                `未配置 AI，规则解析成功率 ${Math.round(ruleSuccessRate * 100)}%` +
                `（${ruleResult.successCount}/${ruleResult.totalCount}）。` +
                '配置 AI 可识别更多版式与复杂格式。',
                text,
                pageImages
            );
        }
        // 规则解析也无结果
        const hasImagesHint = images.length > 0
            ? `。检测到 ${images.length} 张图片，需配置支持多模态的 AI（GLM-4-Plus / Qwen3.6-Plus / Gemini 2.5 / GPT-4o）识别图片题`
            : '';
        return buildResult(
            { questions: [], knowledgePoints: [] },
            'rule-only',
            '未配置 AI 且规则解析未识别到题目。建议配置 AI 后重新解析，' +
            'AI 能识别多种版式、答案表、英文题库等复杂格式' + hasImagesHint,
            text,
            pageImages
        );
    }

    // ========== 阶段 6.2：已配置 AI，走 AI 补充解析 ==========
    // hasMultimodalCapability 已在阶段 3 定义（主 AI 或独立视觉 AI 任一支持多模态）
    const hasImages = images.length > 0;
    const hasPageImages = pageImages.length > 0;
    const materialId = file.name || `upload-${Date.now()}`;

    try {
        // 情况 0（最高优先级）：PDF 整页渲染图片 + 多模态 AI 看图解析
        // 直接让 AI 看每页图片识别题目，完美保留公式、版式、图表
        // 使用 imageAgentConfig：主 AI 支持多模态用主 AI，否则用独立视觉 AI
        if (hasMultimodalCapability && hasPageImages) {
            if (onProgress) onProgress(50);
            const usedVisionAI = !supportsMultimodal;
            console.log(`走多模态整页图片解析：${pageImages.length} 页图片${usedVisionAI ? '（使用独立视觉 AI）' : ''}`);

            // 将整页图片交给多模态 AI 识别
            // 两阶段解析：视觉 AI（imageAgentConfig）做 OCR 转 Markdown → 主 AI（agentConfig）做结构化解析
            // 当主 AI 支持多模态时，imageAgentConfig === agentConfig，两阶段用同一 AI
            // 当主 AI 不支持多模态时，阶段 1 用独立视觉 AI，阶段 2 用主 AI（配额大，JSON 不截断）
            const pageImageUrls = pageImages.map(p => p.imageData);
            const imageResult = await parseImagesWithAI(imageAgentConfig, pageImageUrls, materialId, agentConfig);

            const totalQuestions = imageResult?.questions?.length || 0;
            // 两阶段解析会返回 rawMarkdown（OCR 转写文本），优先用于原文预览；
            // 单阶段回退无 rawMarkdown，沿用 PDF 原始提取文本 text
            const previewText = imageResult?.rawMarkdown?.trim() ? imageResult.rawMarkdown : text;

            if (totalQuestions > 0) {
                if (onProgress) onProgress(100);
                // 整页图片看图解析成功，信心度为 high
                imageResult.questions = addConfidence(imageResult.questions, CONFIDENCE.HIGH);
                return buildResult(
                    imageResult,
                    'ai-page-image',
                    `多模态看图解析完成：共识别 ${totalQuestions} 题（基于 ${pageImages.length} 页图片）`,
                    previewText,
                    pageImages
                );
            }

            // 整页图片解析返回 0 题，降级到文本解析
            console.warn('整页图片看图解析返回 0 题，降级到文本解析');
            if (ruleResult && ruleQuestions.length > 0) {
                ruleResult.questions = addConfidence(ruleResult.questions, CONFIDENCE.LOW);
                return buildResult(
                    ruleResult,
                    'rule-fallback',
                    'AI 看图解析未识别到题目，已用规则解析结果兜底',
                    previewText,
                    pageImages
                );
            }
            // 继续尝试文本 AI 解析
        }

        // 情况 A：模型支持多模态且文档有内嵌图片 → 文本+图片并行处理
        if (hasMultimodalCapability && hasImages) {
            if (onProgress) onProgress(55);

            // 并行启动文本解析和图片识别
            // 使用 allSettled 确保一路失败不影响另一路
            // 图片识别使用 imageAgentConfig（主 AI 优先，否则独立视觉 AI）
            const [textSettled, imageSettled] = await Promise.allSettled([
                // 文本解析（如果文本为空，跳过此步）
                text.trim()
                    ? parseDocumentWithAI(agentConfig, text, ext, materialId)
                    : Promise.resolve({ knowledgePoints: [], questions: [] }),
                parseImagesWithAI(imageAgentConfig, images, materialId, agentConfig)
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
                // AI 多模态也 0 题，用规则结果兜底
                if (ruleResult && ruleQuestions.length > 0) {
                    console.warn('AI 多模态解析返回 0 道题目，用规则解析结果兜底');
                    // AI 失败降级到规则，信心度为 low
                    ruleResult.questions = addConfidence(ruleResult.questions, CONFIDENCE.LOW);
                    return buildResult(
                        ruleResult,
                        'rule-fallback',
                        'AI 未能从文档中识别题目，已用规则解析结果兜底（图片题未识别）',
                        text,
                        pageImages
                    );
                }
                return buildResult(
                    { questions: [], knowledgePoints: [] },
                    'ai-multimodal',
                    'AI 与规则解析均未识别到题目，请检查文件内容或调整 AI 配置',
                    text,
                    pageImages
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
            // AI 多模态解析成功，信心度为 high
            merged.questions = addConfidence(merged.questions, CONFIDENCE.HIGH);
            return buildResult(merged, 'ai-multimodal', warning, text, pageImages);
        }

        // ========== 阶段 4.5：AI 两阶段解析（优先于单次解析） ==========
        if (text.trim()) {
            try {
                if (onProgress) onProgress(30);

                // 阶段 1：提取文档结构
                const structure = await extractDocumentStructure(agentConfig, text);

                if (onProgress) onProgress(45);

                if (structure.questionRanges && structure.questionRanges.length > 0) {
                    // 阶段 2：根据结构信息截取每道题，逐题并行解析
                    const questionTexts = structure.questionRanges.map(range => {
                        const start = Math.max(0, (range.estimatedStart || 0) - 10);
                        const end = Math.min(text.length, (range.estimatedEnd || text.length) + 10);
                        return text.slice(start, end);
                    });

                    if (onProgress) onProgress(50);

                    const questions = await parseQuestionsBatch(agentConfig, questionTexts);

                    if (onProgress) onProgress(90);

                    if (questions.length > 0) {
                        // 提取知识点（从题目中汇总）
                        const knowledgePoints = [...new Set(
                            questions.map(q => q.knowledgePoint).filter(Boolean)
                        )].map((name, i) => ({
                            id: `kp-${Date.now()}-${i}`,
                            name,
                            description: `来自文档解析的知识点`,
                            questionCount: questions.filter(q => q.knowledgePoint === name).length
                        }));

                        return buildResult(
                            { questions: addConfidence(questions, CONFIDENCE.HIGH), knowledgePoints },
                            'ai-two-pass',
                            `两阶段解析完成：共识别 ${structure.totalQuestions} 题，成功解析 ${questions.length} 题`,
                            text,
                            pageImages
                        );
                    }
                }

                // 阶段 1 成功但阶段 2 无结果，回退到单次解析
                console.warn('两阶段解析的阶段 2 无结果，回退到单次 AI 解析');
            } catch (err) {
                // 两阶段解析失败，回退到单次解析
                console.warn('两阶段解析失败，回退到单次 AI 解析:', err.message);
            }
        }

        // 情况 B：仅文本解析（模型不支持多模态或文档无图片）
        if (text.trim()) {
            if (onProgress) onProgress(55);
            const aiResult = await parseDocumentWithAI(agentConfig, text, ext, materialId);
            const aiQuestions = aiResult.questions || [];
            const aiKnowledgePoints = aiResult.knowledgePoints || [];

            // AI 解析返回 0 题，用规则结果兜底
            if (aiQuestions.length === 0) {
                console.warn('AI 解析返回 0 道题目，用规则解析结果兜底');
                if (ruleResult && ruleQuestions.length > 0) {
                    // AI 失败降级到规则，信心度为 low
                    ruleResult.questions = addConfidence(ruleResult.questions, CONFIDENCE.LOW);
                    return buildResult(
                        ruleResult,
                        'rule-fallback',
                        'AI 未能从文档中识别题目，已用规则解析结果兜底',
                        text,
                        pageImages
                    );
                }
                // 文档有图片但模型不支持多模态，给出更明确的提示
                const multimodalHint = hasImages && !supportsMultimodal
                    ? '。检测到文档包含图片，但当前 AI 模型不支持多模态，建议切换到 GLM-4-Plus / Qwen3.6-Plus / Gemini 2.5 / GPT-4o 等支持视觉的模型'
                    : '';
                return buildResult(
                    { questions: [], knowledgePoints: [] },
                    'ai',
                    'AI 与规则解析均未识别到题目，请检查文件内容或调整 AI 配置' + multimodalHint,
                    text,
                    pageImages
                );
            }

            if (onProgress) onProgress(100);
            // AI 解析成功，信心度为 high
            return buildResult(
                { questions: addConfidence(aiQuestions, CONFIDENCE.HIGH), knowledgePoints: aiKnowledgePoints },
                'ai',
                '',
                text,
                pageImages
            );
        }

        // 情况 C：文本为空、模型不支持多模态但有图片：无法处理
        if (hasImages && !supportsMultimodal) {
            throw new Error(
                '文档提取文本为空且包含图片，但当前 AI 模型不支持多模态视觉输入。' +
                '建议切换到 GLM-4-Plus / Qwen3.6-Plus / Gemini 2.5 / GPT-4o 等支持视觉的模型后重试。'
            );
        }
    } catch (error) {
        // AI 解析失败，用规则结果兜底
        console.warn('AI 解析失败，用规则解析结果兜底:', error);
        if (ruleResult && ruleQuestions.length > 0) {
            // AI 异常降级到规则，信心度为 low
            ruleResult.questions = addConfidence(ruleResult.questions, CONFIDENCE.LOW);
            return buildResult(
                ruleResult,
                'rule-fallback',
                `AI 解析失败（${error.message}），已用规则解析结果兜底，复杂版式可能识别不全`,
                text,
                pageImages
            );
        }
        // AI 失败且规则解析也无结果
        throw new Error(
            `AI 解析失败且规则解析未识别到题目。AI 错误: ${error.message}。` +
            '请检查 AI 配置、API Key 余额，或调整文档格式后重试。'
        );
    }
};

/**
 * 带用户提示的重新解析
 * 用户对初次解析结果不满意时，可提供格式提示让 AI 重新解析同一文档。
 * 重新提取文本后，使用增强 prompt（含用户提示）调用 AI 解析。
 * @param {File} file - 原始文件对象
 * @param {Object} agentConfig - AI 配置 { providerId, modelId, apiKey }
 * @param {string[]} userHints - 用户提供的格式提示数组
 * @param {Function} [onProgress] - 进度回调 (0-100)
 * @param {Object} [visionAgentConfig] - 独立多模态视觉 AI 配置（透传，当前未使用，预留扩展）
 * @returns {Promise<Object>} 解析结果 { questions, knowledgePoints, method, warning }
 */
export const reParseQuestionFile = async (file, agentConfig, userHints, onProgress, _visionAgentConfig) => {
    // 重新提取文本
    const ext = getExtension(file.name);
    const text = await parseDocument(file, (p) => {
        if (onProgress) onProgress(Math.floor(p * 0.3));
    });

    if (onProgress) onProgress(30);

    const materialId = file.name || `reparse-${Date.now()}`;

    // 用带提示的 AI 重新解析
    const aiResult = await reParseDocument(agentConfig, text, ext, materialId, userHints);

    if (onProgress) onProgress(80);

    // 为结果标注信心度（重新解析的 AI 结果默认为 high）
    const questions = addConfidence(aiResult.questions || [], CONFIDENCE.HIGH);
    const knowledgePoints = aiResult.knowledgePoints || [];

    if (onProgress) onProgress(100);

    return buildResult(
        { questions, knowledgePoints },
        'ai',
        '重新解析完成（含用户提示）',
        text
    );
};

export default parseQuestionFile;
