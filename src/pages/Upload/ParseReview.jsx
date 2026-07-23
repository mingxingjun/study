import { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Check, Square, CheckSquare, Trash2, Plus, FileText,
    RotateCcw, X, AlertTriangle
} from 'lucide-react';
import KnowledgePointEditor from './KnowledgePointEditor';
import QuestionEditor from './QuestionEditor';
import ParseLog from './ParseLog';

/** 信心度颜色映射 */
const CONFIDENCE_COLORS = {
    high: '#22c55e',
    medium: '#eab308',
    low: '#ef4444',
    null: '#9ca3af'
};

/** 信心度中文标签 */
const CONFIDENCE_LABELS = {
    high: '高',
    medium: '中',
    low: '低',
    null: '手动'
};

/** 解析方式中文标签 */
const METHOD_LABELS = {
    'ai': 'AI 解析',
    'rule': '规则解析',
    'ai-multimodal': '多模态解析',
    'structured': '结构化解析',
    'rule-fallback': '规则兜底',
    'rule-only': '规则解析'
};

/** 筛选 Tab 配置 */
const FILTER_TABS = [
    { key: 'all', label: '全部' },
    { key: 'low', label: '低信心度' },
    { key: 'review', label: '需审核' },
    { key: 'modified', label: '已修改' }
];

/** 题型标签 */
const TYPE_LABELS = {
    single: '单选',
    multiple: '多选',
    judgment: '判断',
    fill: '填空'
};

/**
 * 信心度圆点组件
 * @param {string} confidence - 信心度等级：high/medium/low/null
 */
const ConfidenceDot = ({ confidence }) => {
    const color = CONFIDENCE_COLORS[confidence] || CONFIDENCE_COLORS.null;
    const label = CONFIDENCE_LABELS[confidence] || CONFIDENCE_LABELS.null;
    return (
        <span
            className="inline-flex items-center gap-1 flex-shrink-0"
            title={`信心度：${label}`}
        >
            <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
            />
            <span className="text-[10px] font-mono text-gray-400">
                {label}
            </span>
        </span>
    );
};

/**
 * 顶部操作栏
 * 全选、批量删除、查看日志、重新解析、确认导入
 */
const ActionBar = ({
    allSelected,
    someSelected,
    selectedCount,
    onToggleSelectAll,
    onBatchDelete,
    onViewLog,
    onReParse,
    onConfirm,
    onClose
}) => (
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80 bg-white">
        {/* 左侧：全选 + 批量删除 */}
        <div className="flex items-center gap-3">
            {/* 全选复选框 */}
            <button
                onClick={onToggleSelectAll}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors cursor-pointer"
                title={allSelected ? '取消全选' : '全选'}
            >
                {allSelected ? (
                    <CheckSquare size={18} className="text-accent" />
                ) : someSelected ? (
                    <Square size={18} className="text-accent/60" />
                ) : (
                    <Square size={18} />
                )}
                <span className="text-xs font-mono text-gray-400 hidden sm:inline">
                    {allSelected ? '取消全选' : '全选'}
                </span>
            </button>

            {/* 批量删除按钮 */}
            {selectedCount > 0 && (
                <button
                    onClick={onBatchDelete}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title={`删除选中的 ${selectedCount} 道题`}
                >
                    <Trash2 size={14} />
                    <span>批量删除 ({selectedCount})</span>
                </button>
            )}
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
            {/* 查看日志 */}
            <button
                onClick={onViewLog}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="查看解析日志"
            >
                <FileText size={14} />
                <span className="hidden sm:inline">解析日志</span>
            </button>

            {/* 重新解析 */}
            <button
                onClick={onReParse}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="重新解析"
            >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">重新解析</span>
            </button>

            {/* 取消按钮 */}
            <button
                onClick={onClose}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
                <X size={14} />
                <span className="hidden sm:inline">返回</span>
            </button>

            {/* 确认导入 - 金色 CTA */}
            <button
                onClick={onConfirm}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-accent text-white rounded-lg
                           hover:bg-accent-dark shadow-gold transition-all duration-200 cursor-pointer"
            >
                <Check size={16} />
                <span>确认导入</span>
            </button>
        </div>
    </div>
);

/**
 * 筛选栏
 * 全部 / 低信心度 / 需审核 / 已修改
 */
const FilterBar = ({ activeFilter, onFilterChange, counts }) => (
    <div className="flex items-center gap-1 px-5 py-2.5 border-b border-gray-100 bg-gray-50/50 overflow-x-auto">
        {FILTER_TABS.map((tab) => (
            <button
                key={tab.key}
                onClick={() => onFilterChange(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-all duration-200 cursor-pointer
                    ${activeFilter === tab.key
                        ? 'bg-primary text-accent-light font-medium'
                        : 'text-gray-500 hover:text-primary hover:bg-gray-100'
                    }`}
            >
                <span>{tab.label}</span>
                {counts[tab.key] !== undefined && (
                    <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded-full
                        ${activeFilter === tab.key
                            ? 'bg-white/15'
                            : 'bg-gray-200/60'
                        }`}
                    >
                        {counts[tab.key]}
                    </span>
                )}
            </button>
        ))}
    </div>
);

/**
 * 单个题目列表项
 */
const QuestionListItem = ({
    question,
    index,
    isSelected,
    isChecked,
    onSelect,
    onToggleCheck,
    onDelete
}) => {
    // 截断题干到 80 字符
    const truncatedQuestion = question.question
        ? question.question.length > 80
            ? question.question.slice(0, 80) + '...'
            : question.question
        : '（空题干）';

    const isManual = question._isManual || question.confidence === null;

    return (
        <div
            onClick={() => onSelect(question.id)}
            className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-200
                ${isSelected
                    ? 'border-l-2 border-accent bg-accent/5'
                    : 'border-l-2 border-transparent hover:bg-gray-50'
                }`}
        >
            {/* 复选框 */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleCheck(question.id);
                }}
                className="flex-shrink-0 mt-0.5 text-gray-300 hover:text-accent transition-colors cursor-pointer"
            >
                {isChecked ? (
                    <CheckSquare size={16} className="text-accent" />
                ) : (
                    <Square size={16} />
                )}
            </button>

            {/* 题号 */}
            <span
                className="flex-shrink-0 w-6 text-right font-serif text-lg text-gray-300 tabular-nums"
                style={{ fontWeight: 400, letterSpacing: '-0.04em' }}
            >
                {String(index + 1).padStart(2, '0')}
            </span>

            {/* 题目内容 */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    {/* 题型标签 */}
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 flex-shrink-0">
                        {TYPE_LABELS[question.type] || question.type || '未知'}
                    </span>
                    {/* 信心度圆点 */}
                    <ConfidenceDot confidence={isManual ? null : question.confidence} />
                </div>
                <p className="text-sm text-primary leading-relaxed line-clamp-2">
                    {truncatedQuestion}
                </p>
            </div>

            {/* 删除按钮 */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(question.id);
                }}
                className="flex-shrink-0 p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg
                           opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                title="删除此题"
            >
                <Trash2 size={15} strokeWidth={1.6} />
            </button>
        </div>
    );
};

/**
 * 题目列表组件
 */
const QuestionList = ({
    questions,
    selectedId,
    checkedIds,
    onSelect,
    onToggleCheck,
    onDelete,
    onAdd
}) => (
    <div className="flex-1 overflow-y-auto">
        {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <AlertTriangle size={32} strokeWidth={1.2} className="mb-3" />
                <p className="text-sm">暂无题目</p>
                <button
                    onClick={onAdd}
                    className="mt-3 text-xs text-accent-dark hover:text-accent underline underline-offset-4 cursor-pointer"
                >
                    手动添加一道题
                </button>
            </div>
        ) : (
            questions.map((q, idx) => (
                <QuestionListItem
                    key={q.id}
                    question={q}
                    index={idx}
                    isSelected={selectedId === q.id}
                    isChecked={checkedIds.has(q.id)}
                    onSelect={onSelect}
                    onToggleCheck={onToggleCheck}
                    onDelete={onDelete}
                />
            ))
        )}

        {/* 添加题目按钮 */}
        <button
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 mx-4 my-3
                       border-2 border-dashed border-accent/30 rounded-xl
                       text-accent-dark hover:border-accent hover:bg-accent/5
                       transition-all duration-200 cursor-pointer"
            style={{ width: 'calc(100% - 32px)' }}
        >
            <Plus size={16} strokeWidth={1.8} />
            <span className="text-sm font-serif" style={{ fontWeight: 500 }}>
                添加题目
            </span>
        </button>
    </div>
);

/**
 * 底部摘要栏
 * 总题数、信心度分布、解析方式、耗时
 */
const SummaryBar = ({ questions, method, duration }) => {
    // 统计信心度分布
    const confidenceStats = useMemo(() => {
        const stats = { high: 0, medium: 0, low: 0, manual: 0 };
        questions.forEach((q) => {
            if (q._isManual || q.confidence === null) {
                stats.manual += 1;
            } else if (q.confidence === 'high') {
                stats.high += 1;
            } else if (q.confidence === 'medium') {
                stats.medium += 1;
            } else if (q.confidence === 'low') {
                stats.low += 1;
            }
        });
        return stats;
    }, [questions]);

    return (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200/80 bg-gray-50/80 text-xs font-mono text-gray-500">
            <div className="flex items-center gap-4">
                {/* 总题数 */}
                <span>
                    共 <span className="text-primary font-medium tabular-nums">{questions.length}</span> 题
                </span>

                {/* 信心度分布 */}
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1.5">
                    <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: CONFIDENCE_COLORS.high }}
                    />
                    <span className="tabular-nums">{confidenceStats.high}</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: CONFIDENCE_COLORS.medium }}
                    />
                    <span className="tabular-nums">{confidenceStats.medium}</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: CONFIDENCE_COLORS.low }}
                    />
                    <span className="tabular-nums">{confidenceStats.low}</span>
                </span>
                {confidenceStats.manual > 0 && (
                    <span className="flex items-center gap-1.5">
                        <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: CONFIDENCE_COLORS.null }}
                        />
                        <span className="tabular-nums">{confidenceStats.manual}</span>
                    </span>
                )}
            </div>

            <div className="flex items-center gap-4">
                {/* 解析方式 */}
                <span className="px-2 py-0.5 rounded bg-gray-200/60 text-gray-600">
                    {METHOD_LABELS[method] || method}
                </span>
                {/* 耗时 */}
                {duration !== undefined && duration !== null && (
                    <span className="tabular-nums">
                        {duration.toFixed(1)}s
                    </span>
                )}
            </div>
        </div>
    );
};

/**
 * ParseReview 审核界面主组件
 *
 * 左右分栏布局：左侧题目列表 + 右侧编辑器
 * 包含手动添加/删除题目、批量操作、筛选、解析日志等功能
 *
 * @param {Object} props
 * @param {Object} props.parsedResult - 解析结果
 * @param {Function} props.onConfirm - 确认导入回调 (finalQuestions, finalKnowledgePoints) => void
 * @param {Function} props.onReParse - 重新解析回调 (hints) => void
 * @param {Function} props.onClose - 取消/返回回调
 */
const ParseReview = ({ parsedResult, onConfirm, onReParse, onClose }) => {
    // ========== 本地状态 ==========
    const [questions, setQuestions] = useState(() => {
        return (parsedResult?.questions || []).map((q) => ({ ...q }));
    });
    const [knowledgePoints, setKnowledgePoints] = useState(() => {
        return (parsedResult?.knowledgePoints || []).map((kp) => ({ ...kp }));
    });
    const [selectedId, setSelectedId] = useState(null);
    const [checkedIds, setCheckedIds] = useState(new Set());
    const [activeFilter, setActiveFilter] = useState('all');
    const [showParseLog, setShowParseLog] = useState(false);
    const [activeTab, setActiveTab] = useState('question'); // 'question' | 'knowledge'
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'single'|'batch', id?: string }

    // ========== 筛选后的题目列表 ==========
    const filteredQuestions = useMemo(() => {
        switch (activeFilter) {
            case 'low':
                return questions.filter((q) => q.confidence === 'low');
            case 'review':
                return questions.filter(
                    (q) => q.confidence === 'low' || q.confidence === 'medium'
                );
            case 'modified':
                return questions.filter((q) => q._isModified);
            default:
                return questions;
        }
    }, [questions, activeFilter]);

    // ========== 初始化自动选中第一题 ==========
    useEffect(() => {
        if (!selectedId && filteredQuestions.length > 0) {
            setSelectedId(filteredQuestions[0].id);
        }
    }, [filteredQuestions, selectedId]);

    // ========== 各筛选 Tab 的题目数量 ==========
    const filterCounts = useMemo(() => ({
        all: questions.length,
        low: questions.filter((q) => q.confidence === 'low').length,
        review: questions.filter((q) => q.confidence === 'low' || q.confidence === 'medium').length,
        modified: questions.filter((q) => q._isModified).length
    }), [questions]);

    // ========== 全选状态 ==========
    const allSelected = filteredQuestions.length > 0
        && filteredQuestions.every((q) => checkedIds.has(q.id));
    const someSelected = filteredQuestions.some((q) => checkedIds.has(q.id));

    // ========== 当前选中的题目对象 ==========
    const selectedQuestion = useMemo(() => {
        if (!selectedId) return null;
        return questions.find((q) => q.id === selectedId) || null;
    }, [questions, selectedId]);

    // ========== 编辑操作 ==========

    /**
     * 更新单道题目（供 QuestionEditor 的 onChange 回调）
     * QuestionEditor 传递单个已更新的题目对象
     * @param {Object} updatedQuestion - 更新后的单道题目
     */
    const handleQuestionUpdate = useCallback((updatedQuestion) => {
        setQuestions((prev) => {
            const marked = prev.map((q) => {
                if (q.id !== updatedQuestion.id) return q;
                // 找到原始题目对比，判断是否修改
                const original = parsedResult?.questions?.find((oq) => oq.id === q.id);
                const isModified = original
                    ? JSON.stringify({ ...updatedQuestion, _isModified: undefined, _isManual: undefined })
                        !== JSON.stringify({ ...original, _isModified: undefined, _isManual: undefined })
                    : true;
                return { ...updatedQuestion, _isModified: isModified };
            });
            return marked;
        });
    }, [parsedResult]);

    /**
     * 删除单道题目（供 QuestionEditor 的 onDelete 回调）
     * @param {string} questionId - 要删除的题目 ID
     */
    const handleDeleteQuestion = useCallback((questionId) => {
        setDeleteConfirm({ type: 'single', id: questionId });
    }, []);

    /**
     * 更新知识点列表
     * @param {Array} updatedKps - 更新后的知识点数组
     */
    const handleKnowledgePointsUpdate = useCallback((updatedKps) => {
        setKnowledgePoints(updatedKps);
    }, []);

    /**
     * 新增知识点
     * @param {Object} newKp - 新知识点对象
     */
    const handleKnowledgePointAdd = useCallback((newKp) => {
        setKnowledgePoints((prev) => [...prev, newKp]);
    }, []);

    /**
     * 删除知识点
     * @param {string} kpId - 要删除的知识点 ID
     */
    const handleKnowledgePointDelete = useCallback((kpId) => {
        setKnowledgePoints((prev) => prev.filter((kp) => kp.id !== kpId));
        // 清空关联该知识点的题目
        setQuestions((prev) =>
            prev.map((q) =>
                q.knowledgePointId === kpId ? { ...q, knowledgePointId: '' } : q
            )
        );
    }, []);

    // ========== 选择与筛选 ==========

    /** 切换全选 */
    const handleToggleSelectAll = useCallback(() => {
        if (allSelected) {
            setCheckedIds(new Set());
        } else {
            setCheckedIds(new Set(filteredQuestions.map((q) => q.id)));
        }
    }, [allSelected, filteredQuestions]);

    /** 切换单题选中 */
    const handleToggleCheck = useCallback((id) => {
        setCheckedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    /** 选中题目（编辑） */
    const handleSelectQuestion = useCallback((id) => {
        setSelectedId(id);
        setActiveTab('question');
    }, []);

    // ========== 删除操作 ==========

    /** 打开删除确认弹窗 */
    const handleDeleteRequest = useCallback((id) => {
        setDeleteConfirm({ type: 'single', id });
    }, []);

    /** 批量删除请求 */
    const handleBatchDeleteRequest = useCallback(() => {
        const count = checkedIds.size;
        if (count === 0) return;
        setDeleteConfirm({ type: 'batch', count });
    }, [checkedIds]);

    /** 确认删除 */
    const handleDeleteConfirm = useCallback(() => {
        if (!deleteConfirm) return;

        if (deleteConfirm.type === 'single' && deleteConfirm.id) {
            setQuestions((prev) => prev.filter((q) => q.id !== deleteConfirm.id));
            if (selectedId === deleteConfirm.id) {
                setSelectedId(null);
            }
            setCheckedIds((prev) => {
                const next = new Set(prev);
                next.delete(deleteConfirm.id);
                return next;
            });
        } else if (deleteConfirm.type === 'batch') {
            setQuestions((prev) => prev.filter((q) => !checkedIds.has(q.id)));
            if (selectedId && checkedIds.has(selectedId)) {
                setSelectedId(null);
            }
            setCheckedIds(new Set());
        }
        setDeleteConfirm(null);
    }, [deleteConfirm, checkedIds, selectedId]);

    // ========== 手动添加题目 ==========

    /** 手动添加一道空白题目 */
    const handleAddQuestion = useCallback(() => {
        const newQuestion = {
            id: `manual-${Date.now()}`,
            question: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            knowledgePointId: knowledgePoints.length > 0 ? knowledgePoints[0].id : '',
            difficulty: 'medium',
            type: 'single',
            confidence: null,
            _isManual: true
        };
        setQuestions((prev) => [...prev, newQuestion]);
        setSelectedId(newQuestion.id);
        setActiveTab('question');
    }, [knowledgePoints]);

    // ========== 确认导入 ==========

    /** 确认导入：清理内部字段后回调 */
    const handleConfirm = useCallback(() => {
        const cleanQuestions = questions.map(({ _isModified, _isManual, ...q }) => q);
        onConfirm(cleanQuestions, knowledgePoints);
    }, [questions, knowledgePoints, onConfirm]);

    // ========== 重新解析 ==========

    /** 重新解析 */
    const handleReParse = useCallback(() => {
        onReParse({});
    }, [onReParse]);

    // ========== 解析日志数据 ==========
    const parseLogData = useMemo(() => ({
        method: parsedResult?.method || 'ai',
        fileName: parsedResult?.fileName || '未知文件',
        duration: parsedResult?.duration || 0,
        retryCount: parsedResult?.retryCount || 0,
        rawJson: parsedResult?.rawJson || '',
        repairLog: parsedResult?.repairLog || [],
        discardedQuestions: parsedResult?.discardedQuestions || []
    }), [parsedResult]);

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-2xl border border-gray-200/80 shadow-lg overflow-hidden">
            {/* 顶部操作栏 */}
            <ActionBar
                allSelected={allSelected}
                someSelected={someSelected}
                selectedCount={checkedIds.size}
                onToggleSelectAll={handleToggleSelectAll}
                onBatchDelete={handleBatchDeleteRequest}
                onViewLog={() => setShowParseLog(true)}
                onReParse={handleReParse}
                onConfirm={handleConfirm}
                onClose={onClose}
            />

            {/* 筛选栏 */}
            <FilterBar
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                counts={filterCounts}
            />

            {/* 主内容区：左右分栏 */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">
                {/* 左侧：题目列表 */}
                <div className="w-full lg:w-[40%] flex flex-col border-r border-gray-100 min-h-0">
                    <QuestionList
                        questions={filteredQuestions}
                        selectedId={selectedId}
                        checkedIds={checkedIds}
                        onSelect={handleSelectQuestion}
                        onToggleCheck={handleToggleCheck}
                        onDelete={handleDeleteRequest}
                        onAdd={handleAddQuestion}
                    />
                </div>

                {/* 右侧：编辑器 */}
                <div className="w-full lg:w-[60%] flex flex-col min-h-0">
                    {/* Tab 切换 */}
                    <div className="flex items-center border-b border-gray-100 px-5">
                        <button
                            onClick={() => setActiveTab('question')}
                            className={`px-4 py-3 text-sm font-serif transition-all duration-200 cursor-pointer
                                ${activeTab === 'question'
                                    ? 'text-primary border-b-2 border-accent'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                            style={{ fontWeight: activeTab === 'question' ? 500 : 400 }}
                        >
                            题目编辑
                        </button>
                        <button
                            onClick={() => setActiveTab('knowledge')}
                            className={`px-4 py-3 text-sm font-serif transition-all duration-200 cursor-pointer
                                ${activeTab === 'knowledge'
                                    ? 'text-primary border-b-2 border-accent'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                            style={{ fontWeight: activeTab === 'knowledge' ? 500 : 400 }}
                        >
                            知识点管理
                        </button>
                    </div>

                    {/* 编辑器内容 */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {activeTab === 'question' ? (
                            <QuestionEditor
                                question={selectedQuestion}
                                knowledgePoints={knowledgePoints}
                                onChange={(updated) => handleQuestionUpdate(updated)}
                                onDelete={() => {
                                    if (selectedQuestion) {
                                        handleDeleteQuestion(selectedQuestion.id);
                                    }
                                }}
                            />
                        ) : (
                            <div className="p-5">
                                <KnowledgePointEditor
                                    knowledgePoints={knowledgePoints}
                                    onUpdate={handleKnowledgePointsUpdate}
                                    onAdd={handleKnowledgePointAdd}
                                    onDelete={handleKnowledgePointDelete}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 底部摘要栏 */}
            <SummaryBar
                questions={questions}
                method={parsedResult?.method}
                duration={parsedResult?.duration}
            />

            {/* 解析日志抽屉 */}
            {showParseLog && (
                <ParseLog
                    parseLog={parseLogData}
                    onClose={() => setShowParseLog(false)}
                />
            )}

            {/* 删除确认弹窗 */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200/80">
                        <h3 className="text-base font-serif text-primary mb-2" style={{ fontWeight: 500 }}>
                            确认删除
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {deleteConfirm.type === 'single'
                                ? '确定删除该题目？此操作不可撤销。'
                                : `确定删除选中的 ${deleteConfirm.count} 道题目？此操作不可撤销。`
                            }
                        </p>
                        <div className="flex items-center justify-end gap-3 mt-5">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700
                                           transition-colors duration-200 cursor-pointer"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg
                                           hover:bg-red-600 transition-colors duration-200 cursor-pointer"
                            >
                                确认删除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParseReview;