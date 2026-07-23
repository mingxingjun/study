import { useState } from 'react';
import { X, ChevronDown, ChevronUp, Clock, FileText, RotateCcw, AlertTriangle } from 'lucide-react';
import ProgressBar from '../../components/ui/ProgressBar';

/** 解析方式对应的中文标签 */
const METHOD_LABELS = {
    'ai': 'AI 解析',
    'rule': '规则解析',
    'ai-multimodal': '多模态解析',
    'structured': '结构化解析'
};

/** JSON 修复记录类型对应的颜色方案 */
const REPAIR_TYPE_CONFIG = {
    sanitize: { bg: 'bg-blue-50', text: 'text-blue-700', label: '修复' },
    truncation: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: '截断修复' }
};

/** 原始 JSON 截断显示的最大字符数 */
const MAX_RAW_JSON_LENGTH = 2000;

/** 被丢弃题目原始内容截断显示的最大字符数 */
const MAX_DISCARDED_RAW_LENGTH = 100;

/**
 * 解析日志侧边抽屉面板
 * 展示 AI 解析过程中的详细信息：原始返回、JSON 修复记录、解析耗时、被丢弃题目等
 * @param {Object} props
 * @param {Object} props.parseLog - 解析日志数据
 * @param {Function} props.onClose - 关闭面板回调
 */
const ParseLog = ({ parseLog, onClose }) => {
    const [showRawJson, setShowRawJson] = useState(false);

    // 安全解构，提供默认值
    const {
        method = 'ai',
        fileName = '未知文件',
        duration = 0,
        retryCount = 0,
        rawJson = '',
        repairLog = [],
        discardedQuestions = [],
        ruleStats = null
    } = parseLog || {};

    // 判断是否为 AI 类解析方式
    const isAIMethod = method === 'ai' || method === 'ai-multimodal' || method === 'structured';
    // 判断是否为规则解析
    const isRuleMethod = method === 'rule';

    // 原始 JSON 是否需要截断
    const isTruncated = rawJson && rawJson.length > MAX_RAW_JSON_LENGTH;
    const displayRawJson = isTruncated
        ? rawJson.substring(0, MAX_RAW_JSON_LENGTH)
        : rawJson;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* 半透明遮罩层 */}
            <div
                className="absolute inset-0 bg-black/20"
                onClick={onClose}
            />

            {/* 抽屉面板 */}
            <div className="relative w-[400px] max-w-[90vw] h-full bg-white shadow-xl flex flex-col animate-slide-in-right">
                {/* 标题栏 */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/80">
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-base font-serif text-primary" style={{ fontWeight: 500 }}>
                            解析日志
                        </h2>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                            Parse Log
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors"
                        aria-label="关闭解析日志"
                    >
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                {/* 可滚动内容区域 */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
                    {/* 1. 基本信息 */}
                    <Section title="基本信息" english="Basic Info">
                        <div className="space-y-3">
                            {/* 文件名 */}
                            <div className="flex items-center gap-3">
                                <FileText size={16} className="text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-700 truncate">{fileName}</span>
                            </div>

                            {/* 解析方式标签 */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400 flex-shrink-0 w-4">#</span>
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    {METHOD_LABELS[method] || method}
                                </span>
                            </div>

                            {/* 解析耗时 */}
                            <div className="flex items-center gap-3">
                                <Clock size={16} className="text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-700">
                                    {duration.toFixed(1)} 秒
                                </span>
                            </div>

                            {/* 重试次数（0 次不显示） */}
                            {retryCount > 0 && (
                                <div className="flex items-center gap-3">
                                    <RotateCcw size={16} className="text-gray-400 flex-shrink-0" />
                                    <span className="text-sm text-gray-700">
                                        重试 {retryCount} 次
                                    </span>
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* 2. 规则解析统计（仅规则解析时显示） */}
                    {isRuleMethod && ruleStats && (
                        <Section title="解析统计" english="Stats">
                            <div className="space-y-3">
                                {/* 统计数字 */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">总题数</span>
                                    <span className="font-mono tabular-nums text-gray-700">
                                        {ruleStats.totalCount}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">成功题数</span>
                                    <span className="font-mono tabular-nums text-green-600">
                                        {ruleStats.successCount}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">无效题数</span>
                                    <span className="font-mono tabular-nums text-red-500">
                                        {ruleStats.invalidCount}
                                    </span>
                                </div>

                                {/* 成功率进度条 */}
                                <div className="pt-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                                            成功率
                                        </span>
                                        <span className="text-xs font-mono tabular-nums text-gray-600">
                                            {ruleStats.totalCount > 0
                                                ? Math.round((ruleStats.successCount / ruleStats.totalCount) * 100)
                                                : 0}%
                                        </span>
                                    </div>
                                    <ProgressBar
                                        value={ruleStats.successCount}
                                        max={ruleStats.totalCount}
                                        color="#16a34a"
                                        size="md"
                                    />
                                </div>
                            </div>
                        </Section>
                    )}

                    {/* 3. JSON 修复记录（仅 AI 解析时显示） */}
                    {isAIMethod && (
                        <Section title="JSON 修复记录" english="Repair Log">
                            {repairLog.length > 0 ? (
                                <div className="space-y-2.5">
                                    {repairLog.map((repair, idx) => {
                                        const config = REPAIR_TYPE_CONFIG[repair.type] || {
                                            bg: 'bg-gray-50',
                                            text: 'text-gray-600',
                                            label: repair.type
                                        };
                                        return (
                                            <div
                                                key={idx}
                                                className="flex items-start gap-2.5"
                                            >
                                                <span
                                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium flex-shrink-0 mt-0.5 ${config.bg} ${config.text}`}
                                                >
                                                    {config.label}
                                                </span>
                                                <span className="text-sm text-gray-600 leading-relaxed">
                                                    {repair.description}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">无修复记录</p>
                            )}
                        </Section>
                    )}

                    {/* 4. AI 原始返回（仅 AI 解析且有原始 JSON 时显示） */}
                    {isAIMethod && rawJson && (
                        <Section title="AI 原始返回" english="Raw Response">
                            <button
                                onClick={() => setShowRawJson(!showRawJson)}
                                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors mb-3"
                            >
                                {showRawJson ? (
                                    <ChevronUp size={16} />
                                ) : (
                                    <ChevronDown size={16} />
                                )}
                                <span>{showRawJson ? '收起' : '展开'}原始 JSON</span>
                            </button>

                            {showRawJson && (
                                <div className="bg-gray-50 rounded-lg p-3.5 overflow-x-auto">
                                    <pre className="text-xs font-mono text-gray-700 leading-relaxed whitespace-pre-wrap break-all">
                                        {displayRawJson}
                                    </pre>
                                    {isTruncated && (
                                        <p className="mt-2 text-[10px] font-mono text-gray-400 italic">
                                            已截断，完整内容见控制台（共 {rawJson.length} 字符）
                                        </p>
                                    )}
                                </div>
                            )}
                        </Section>
                    )}

                    {/* 5. 被丢弃的无效题目 */}
                    {discardedQuestions.length > 0 && (
                        <Section
                            title={`被丢弃的无效题目（${discardedQuestions.length} 道）`}
                            english="Discarded"
                        >
                            <div className="space-y-3">
                                {discardedQuestions.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-red-50/50 rounded-lg p-3 border border-red-100/50"
                                    >
                                        <div className="flex items-start gap-2 mb-1.5">
                                            <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-xs font-mono text-red-600">
                                                第 {item.index} 题
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-1.5">
                                            丢弃原因：{item.reason}
                                        </p>
                                        {item.raw && (
                                            <div className="bg-white/60 rounded px-2.5 py-1.5">
                                                <p className="text-[10px] font-mono text-gray-400 leading-relaxed break-all">
                                                    {item.raw.length > MAX_DISCARDED_RAW_LENGTH
                                                        ? item.raw.substring(0, MAX_DISCARDED_RAW_LENGTH) + '...'
                                                        : item.raw}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}
                </div>
            </div>

            {/* 滑入动画样式 */}
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
};

/**
 * 日志面板小节组件
 * 统一的小节标题样式：衬线标题 + 英文副标题 + 底部细线
 * @param {Object} props
 * @param {string} props.title - 中文标题
 * @param {string} props.english - 英文副标题
 * @param {React.ReactNode} props.children - 小节内容
 */
const Section = ({ title, english, children }) => (
    <div>
        <div className="flex items-baseline gap-2 mb-3 pb-2 border-b border-gray-100">
            <h3 className="text-sm font-serif text-primary" style={{ fontWeight: 500 }}>
                {title}
            </h3>
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                {english}
            </span>
        </div>
        {children}
    </div>
);

export default ParseLog;