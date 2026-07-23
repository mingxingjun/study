import AgentAvatar from './AgentAvatar';
import MathRenderer from '../MathRenderer';
import VisualizationRenderer from '../visualization/VisualizationRenderer';
import { BarChart3 } from 'lucide-react';

/**
 * 尝试解析结构化 JSON 分析结果
 * @param {string} text - 原始消息文本
 * @returns {Object|null} 解析后的对象
 */
const tryParseStructuredJson = (text) => {
    if (!text || typeof text !== 'string') {
        return null;
    }
    try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
            return parsed;
        }
        return null;
    } catch {
        // 尝试提取 ```json 代码块
        const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            try {
                const parsed = JSON.parse(codeBlockMatch[1]);
                if (parsed && typeof parsed === 'object') {
                    return parsed;
                }
            } catch { /* fall through */ }
        }
        // 尝试提取 { ... } 对象
        const objMatch = text.match(/\{[\s\S]*\}/);
        if (objMatch) {
            try {
                const parsed = JSON.parse(objMatch[0]);
                if (parsed && typeof parsed === 'object') {
                    return parsed;
                }
            } catch { /* fall through */ }
        }
        return null;
    }
};

/**
 * 渲染结构化错题分析内容
 * @param {Object} data - 解析后的 JSON 数据
 */
const StructuredAnalysis = ({ data }) => {
    const sections = [];
    if (data.errorRootCause) {
        sections.push({ title: '错因分析', content: data.errorRootCause });
    }
    if (data.knowledgeReview) {
        sections.push({ title: '知识点回顾', content: data.knowledgeReview });
    }
    if (data.stepByStep) {
        const stepText = Array.isArray(data.stepByStep)
            ? data.stepByStep.map((step, i) => `${i + 1}. ${step}`).join('\n')
            : String(data.stepByStep);
        sections.push({ title: '正确思路', content: stepText });
    }
    if (data.metacognitivePrompt) {
        sections.push({ title: '反思引导', content: data.metacognitivePrompt });
    }
    if (data.tips) {
        sections.push({ title: '复习建议', content: data.tips });
    }

    if (sections.length === 0) return null;

    return (
        <div className="space-y-3">
            {sections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                        {section.title}
                    </h4>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        <MathRenderer text={section.content} />
                    </div>
                </div>
            ))}
        </div>
    );
};

/**
 * 可视化解析区域：渲染 AI 返回的 visualizations 数组
 * 位于文字内容之后，用分隔线区分；卡片样式遵循 Refined Editorial Minimalism 设计系统
 * @param {Object} props
 * @param {Array} props.visualizations - 可视化配置数组，每项含 type/data/title
 * @returns {React.ReactElement|null} visualizations 为空时返回 null
 */
const VisualizationSection = ({ visualizations }) => {
    if (!Array.isArray(visualizations) || visualizations.length === 0) {
        return null;
    }
    return (
        <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-1.5 mb-3">
                <BarChart3 className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
                <span className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                    可视化解析
                </span>
            </div>
            <div className="space-y-3">
                {visualizations.map((viz, idx) => (
                    <div
                        key={idx}
                        className="bg-white rounded-xl border border-gray-200 p-3"
                    >
                        <VisualizationRenderer visualization={viz} />
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Agent 消息气泡组件
 * @param {Object} props
 * @param {Object} props.agent - Agent 对象
 * @param {string} props.message - 消息内容
 * @param {boolean} [props.isTyping=false] - 是否正在输入
 * @param {string} [props.className] - 额外的 CSS 类名
 */
const AgentMessage = ({ agent, message, isTyping = false, className = '' }) => {
    const { color } = agent;

    const structuredData = tryParseStructuredJson(message);
    const hasStructuredContent = structuredData &&
        (structuredData.errorRootCause || structuredData.knowledgeReview || structuredData.stepByStep);

    // 提取可视化数据：优先从解析结果对象中获取，兼容消息对象顶层直接携带 visualizations 的情况
    const messageVisualizations = message && typeof message === 'object'
        ? message.visualizations
        : null;
    const visualizations = Array.isArray(structuredData?.visualizations)
        ? structuredData.visualizations
        : Array.isArray(messageVisualizations)
            ? messageVisualizations
            : [];
    const hasVisualizations = visualizations.length > 0;

    // 当存在可视化但无文字结构化字段时，仍走结构化分支以渲染可视化区域
    const renderStructured = hasStructuredContent || hasVisualizations;

    return (
        <div className={`flex items-start gap-3 animate-fade-in ${className}`}>
            <AgentAvatar agent={agent} size="sm" className="flex-shrink-0 mt-0.5" />
            <div
                className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%]"
                style={{ borderLeft: `3px solid ${color}` }}
            >
                {isTyping ? (
                    <div className="flex items-center gap-1 py-1">
                        <span className="text-xs text-gray-400 mr-1">正在输入</span>
                        <span className="flex gap-0.5">
                            <span
                                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: '0ms' }}
                            />
                            <span
                                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: '150ms' }}
                            />
                            <span
                                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: '300ms' }}
                            />
                        </span>
                    </div>
                ) : renderStructured ? (
                    <>
                        <StructuredAnalysis data={structuredData} />
                        {hasVisualizations && (
                            <VisualizationSection visualizations={visualizations} />
                        )}
                    </>
                ) : (
                    <div className="text-sm text-gray-700 leading-relaxed">
                        <MathRenderer text={message} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentMessage;
