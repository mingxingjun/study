import AgentAvatar from './AgentAvatar';
import MathRenderer from '../MathRenderer';

/**
 * 尝试解析结构化 JSON 分析结果
 * @param {string} text - 原始消息文本
 * @returns {Object|null} 解析后的对象
 */
const tryParseStructuredJson = (text) => {
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
                ) : hasStructuredContent ? (
                    <StructuredAnalysis data={structuredData} />
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
