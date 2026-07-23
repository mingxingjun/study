import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import MathRenderer from '../../components/MathRenderer';

/* ==========================================================================
   子组件 1: ConfidenceBadge — 信心度标签（只读）
   ========================================================================== */

/** 信心度等级对应的颜色与文案映射 */
const CONFIDENCE_MAP = {
    high:   { label: 'AI 高信心度',              className: 'bg-green-50 text-green-700 border-green-300' },
    medium: { label: 'AI 中信心度 - 建议审核',    className: 'bg-amber-50 text-amber-700 border-amber-300' },
    low:    { label: 'AI 低信心度 - 需要审核',    className: 'bg-red-50 text-red-700 border-red-300' },
    null:   { label: '手动添加',                 className: 'bg-gray-100 text-gray-500 border-gray-300' },
    undefined: { label: '手动添加',              className: 'bg-gray-100 text-gray-500 border-gray-300' },
};

/**
 * 信心度标签组件
 * @param {Object} props
 * @param {string|null} props.confidence - 信心度等级
 */
const ConfidenceBadge = ({ confidence }) => {
    const info = CONFIDENCE_MAP[confidence] || CONFIDENCE_MAP.null;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${info.className}`}>
            {info.label}
        </span>
    );
};

/* ==========================================================================
   子组件 2: QuestionStem — 题干编辑 + KaTeX 实时预览
   ========================================================================== */

/**
 * 题干编辑组件
 * @param {Object} props
 * @param {string} props.value - 题干文本
 * @param {Function} props.onChange - 变更回调 (newValue) => void
 */
const QuestionStem = ({ value, onChange }) => {
    const hasLatex = useMemo(() => typeof value === 'string' && value.includes('$'), [value]);

    return (
        <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                题干
            </label>
            <textarea
                className="w-full min-h-[80px] px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-y
                           placeholder:text-gray-400"
                placeholder="输入题干内容，支持 LaTeX 公式（用 $...$ 包裹）"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
            />
            {hasLatex && (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">LaTeX 预览</p>
                    <div className="text-sm text-gray-900 leading-relaxed">
                        <MathRenderer text={value} />
                    </div>
                </div>
            )}
        </div>
    );
};

/* ==========================================================================
   子组件 3: DifficultySelector — 难度选择器
   ========================================================================== */

/** 难度选项配置 */
const DIFFICULTY_OPTIONS = [
    { value: 'easy',   label: '简单', pillClass: 'border-green-400 bg-green-50 text-green-700' },
    { value: 'medium', label: '中等', pillClass: 'border-amber-400 bg-amber-50 text-amber-700' },
    { value: 'hard',   label: '困难', pillClass: 'border-red-400 bg-red-50 text-red-700' },
];

/**
 * 难度选择器组件
 * @param {Object} props
 * @param {string} props.value - 当前难度
 * @param {Function} props.onChange - 变更回调 (newValue) => void
 */
const DifficultySelector = ({ value, onChange }) => {
    return (
        <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                难度
            </label>
            <div className="flex gap-2">
                {DIFFICULTY_OPTIONS.map((opt) => {
                    const isSelected = value === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onChange(opt.value)}
                            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all
                                ${isSelected
                                    ? `${opt.pillClass} border-2 shadow-sm`
                                    : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'
                                }`}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

/* ==========================================================================
   子组件 4: OptionsEditor — 选择题/判断题选项编辑
   ========================================================================== */

/**
 * 选项字母映射（A-Z）
 * @param {number} index - 选项索引
 * @returns {string} 选项字母
 */
const getOptionLetter = (index) => String.fromCharCode(65 + index);

/**
 * 选项编辑器组件（单选/多选/判断）
 * @param {Object} props
 * @param {Array} props.options - 选项文本数组
 * @param {string} props.correctAnswer - 正确答案（单选: 'A'，多选: 'AB'，判断: 'true'/'false'）
 * @param {string} props.type - 题型
 * @param {Function} props.onOptionsChange - 选项变更回调 (newOptions) => void
 * @param {Function} props.onAnswerChange - 答案变更回调 (newAnswer) => void
 */
const OptionsEditor = ({ options, correctAnswer, type, onOptionsChange, onAnswerChange }) => {
    /**
     * 处理选项文本变更
     * @param {number} index - 选项索引
     * @param {string} newText - 新文本
     */
    const handleOptionTextChange = useCallback((index, newText) => {
        const newOptions = [...options];
        newOptions[index] = newText;
        onOptionsChange(newOptions);
    }, [options, onOptionsChange]);

    /**
     * 添加新选项
     */
    const handleAddOption = useCallback(() => {
        onOptionsChange([...options, '']);
    }, [options, onOptionsChange]);

    /**
     * 删除选项
     * @param {number} index - 选项索引
     */
    const handleRemoveOption = useCallback((index) => {
        if (options.length <= 2) return; // 至少保留 2 个选项
        const newOptions = options.filter((_, i) => i !== index);
        // 如果删除的是正确选项，清除对应答案
        const removedLetter = getOptionLetter(index);
        if (correctAnswer.includes(removedLetter)) {
            const newAnswer = correctAnswer
                .split('')
                .filter((c) => c !== removedLetter)
                .join('');
            onAnswerChange(newAnswer);
        }
        onOptionsChange(newOptions);
    }, [options, correctAnswer, onOptionsChange, onAnswerChange]);

    /**
     * 切换选项正确/错误状态
     * @param {string} letter - 选项字母
     */
    const handleToggleCorrect = useCallback((letter) => {
        if (type === 'single') {
            // 单选题：radio 行为，只能选一个
            onAnswerChange(letter === correctAnswer ? '' : letter);
        } else if (type === 'multi') {
            // 多选题：checkbox 行为，可多选
            const current = correctAnswer || '';
            if (current.includes(letter)) {
                onAnswerChange(current.replace(letter, ''));
            } else {
                // 按字母顺序排列
                const newAnswer = (current + letter).split('').sort().join('');
                onAnswerChange(newAnswer);
            }
        }
    }, [type, correctAnswer, onAnswerChange]);

    /**
     * 判断题切换
     * @param {string} value - 'true' 或 'false'
     */
    const handleToggleTrueFalse = useCallback((value) => {
        onAnswerChange(value === correctAnswer ? '' : value);
    }, [correctAnswer, onAnswerChange]);

    // 判断题渲染
    if (type === 'truefalse') {
        const tfOptions = [
            { value: 'true', label: '正确', letter: '✓' },
            { value: 'false', label: '错误', letter: '✗' },
        ];
        return (
            <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                    选项
                </label>
                <div className="flex gap-4">
                    {tfOptions.map((opt) => {
                        const isCorrect = correctAnswer === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleToggleTrueFalse(opt.value)}
                                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all
                                    ${isCorrect
                                        ? 'border-green-400 bg-green-50 text-green-700'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                                    ${isCorrect ? 'bg-green-500 text-white' : 'bg-accent text-white'}`}
                                >
                                    {opt.letter}
                                </span>
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // 单选/多选题渲染
    return (
        <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                选项
            </label>
            <div className="space-y-2">
                {options.map((option, index) => {
                    const letter = getOptionLetter(index);
                    const isCorrect = (correctAnswer || '').includes(letter);
                    return (
                        <div key={index} className="flex items-center gap-2.5">
                            {/* 选项字母标签 — 点击切换正确/错误 */}
                            <button
                                type="button"
                                onClick={() => handleToggleCorrect(letter)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                                    flex-shrink-0 transition-all
                                    ${isCorrect
                                        ? 'bg-green-500 text-white shadow-sm'
                                        : 'bg-accent text-white hover:bg-accent-dark'
                                    }`}
                                title={isCorrect ? '点击取消正确答案' : '点击设为正确答案'}
                            >
                                {letter}
                            </button>
                            {/* 选项文本输入框 */}
                            <input
                                type="text"
                                className="flex-1 px-2.5 py-1.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-md
                                           focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                                           placeholder:text-gray-400"
                                placeholder={`选项 ${letter}`}
                                value={option}
                                onChange={(e) => handleOptionTextChange(index, e.target.value)}
                            />
                            {/* 删除按钮 */}
                            {options.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveOption(index)}
                                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    title="删除选项"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
            {/* 添加选项按钮 */}
            <button
                type="button"
                onClick={handleAddOption}
                className="mt-2 inline-flex items-center gap-1 text-sm text-accent hover:text-accent-dark transition-colors"
            >
                <Plus size={14} />
                添加选项
            </button>
        </div>
    );
};

/* ==========================================================================
   子组件 5: AnswerEditor — 填空/简答答案编辑
   ========================================================================== */

/**
 * 答案编辑器组件（填空/简答）
 * @param {Object} props
 * @param {string} props.type - 题型
 * @param {string} props.correctAnswer - 答案文本
 * @param {Function} props.onChange - 变更回调 (newAnswer) => void
 */
const AnswerEditor = ({ type, correctAnswer, onChange }) => {
    if (type === 'fill') {
        return (
            <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                    正确答案
                </label>
                <input
                    type="text"
                    className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                               placeholder:text-gray-400"
                    placeholder="输入填空答案"
                    value={correctAnswer || ''}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        );
    }

    // 简答题
    return (
        <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                参考答案
            </label>
            <textarea
                className="w-full min-h-[100px] px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-y
                           placeholder:text-gray-400"
                placeholder="输入参考答案"
                value={correctAnswer || ''}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
            />
        </div>
    );
};

/* ==========================================================================
   子组件 6: KnowledgePointSelector — 知识点多选选择器
   ========================================================================== */

/**
 * 知识点多选选择器组件
 * @param {Object} props
 * @param {Array} props.selectedIds - 已选知识点 ID 数组
 * @param {Array} props.knowledgePoints - 所有知识点列表 [{id, name, description}]
 * @param {Function} props.onChange - 变更回调 (newIds) => void
 * @param {Function} props.onCreate - 创建新知识点回调 (name) => void
 */
const KnowledgePointSelector = ({ selectedIds, knowledgePoints, onChange, onCreate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // 点击外部关闭下拉
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchText('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 打开下拉时自动聚焦搜索框
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    /** 已选知识点对象列表 */
    const selectedKps = useMemo(() => {
        return knowledgePoints.filter((kp) => selectedIds.includes(kp.id));
    }, [knowledgePoints, selectedIds]);

    /** 过滤后的可选知识点列表 */
    const filteredKps = useMemo(() => {
        if (!searchText.trim()) return knowledgePoints;
        const lower = searchText.toLowerCase();
        return knowledgePoints.filter(
            (kp) =>
                kp.name.toLowerCase().includes(lower) ||
                (kp.description && kp.description.toLowerCase().includes(lower))
        );
    }, [knowledgePoints, searchText]);

    /**
     * 切换知识点选中状态
     * @param {string} kpId - 知识点 ID
     */
    const handleToggle = useCallback((kpId) => {
        if (selectedIds.includes(kpId)) {
            onChange(selectedIds.filter((id) => id !== kpId));
        } else {
            onChange([...selectedIds, kpId]);
        }
    }, [selectedIds, onChange]);

    /**
     * 移除已选知识点
     * @param {string} kpId - 知识点 ID
     */
    const handleRemove = useCallback((kpId) => {
        onChange(selectedIds.filter((id) => id !== kpId));
    }, [selectedIds, onChange]);

    /**
     * 处理搜索框回车，尝试创建新知识点
     * @param {KeyboardEvent} e - 键盘事件
     */
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && searchText.trim()) {
            e.preventDefault();
            // 检查是否已存在同名知识点
            const existing = knowledgePoints.find(
                (kp) => kp.name.toLowerCase() === searchText.trim().toLowerCase()
            );
            if (existing) {
                // 已存在则直接选中
                if (!selectedIds.includes(existing.id)) {
                    onChange([...selectedIds, existing.id]);
                }
            } else {
                // 不存在则创建
                onCreate(searchText.trim());
            }
            setSearchText('');
        }
    }, [searchText, knowledgePoints, selectedIds, onChange, onCreate]);

    return (
        <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                知识点归属
            </label>

            {/* 已选知识点标签 */}
            {selectedKps.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedKps.map((kp) => (
                        <span
                            key={kp.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                                       bg-accent-light text-accent-dark border border-accent/30"
                        >
                            {kp.name}
                            <button
                                type="button"
                                onClick={() => handleRemove(kp.id)}
                                className="hover:text-red-500 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* 下拉选择器 */}
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-500
                               bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                    <span>{selectedIds.length > 0 ? `已选 ${selectedIds.length} 个知识点` : '选择知识点'}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                        {/* 搜索输入框 */}
                        <div className="p-2 border-b border-gray-100">
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full px-2.5 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md
                                           focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                                           placeholder:text-gray-400"
                                placeholder="搜索知识点..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        {/* 知识点列表 */}
                        <div className="overflow-y-auto max-h-44">
                            {filteredKps.length === 0 ? (
                                <div className="px-3 py-4 text-sm text-gray-400 text-center">
                                    暂无匹配知识点
                                </div>
                            ) : (
                                filteredKps.map((kp) => {
                                    const isSelected = selectedIds.includes(kp.id);
                                    return (
                                        <button
                                            key={kp.id}
                                            type="button"
                                            onClick={() => handleToggle(kp.id)}
                                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm
                                                transition-colors hover:bg-gray-50
                                                ${isSelected ? 'bg-accent-light/50' : ''}`}
                                        >
                                            {/* 选中标记 */}
                                            <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center
                                                ${isSelected
                                                    ? 'bg-accent border-accent text-white'
                                                    : 'border-gray-300'
                                                }`}
                                            >
                                                {isSelected && <span className="text-xs">✓</span>}
                                            </span>
                                            <div className="min-w-0">
                                                <span className="font-medium text-gray-900">{kp.name}</span>
                                                {kp.description && (
                                                    <span className="ml-1.5 text-gray-400 text-xs truncate">
                                                        {kp.description.length > 30
                                                            ? kp.description.slice(0, 30) + '...'
                                                            : kp.description}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                        {/* 创建新知识点入口 */}
                        {searchText.trim() && (
                            <div className="border-t border-gray-100 p-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onCreate(searchText.trim());
                                        setSearchText('');
                                    }}
                                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-accent
                                               hover:bg-accent-light/30 rounded-md transition-colors"
                                >
                                    <Plus size={14} />
                                    创建新知识点 &ldquo;{searchText.trim()}&rdquo;
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/* ==========================================================================
   主组件: QuestionEditor — 单题编辑器
   ========================================================================== */

/** 题型选项配置 */
const TYPE_OPTIONS = [
    { value: 'single',    label: '单选题' },
    { value: 'multi',     label: '多选题' },
    { value: 'truefalse', label: '判断题' },
    { value: 'fill',      label: '填空题' },
    { value: 'essay',     label: '简答题' },
];

/**
 * 单题编辑器组件
 * 支持编辑题干、选项、正确答案、知识点归属、难度、题型、解析
 * 编辑后自动标记 _isModified: true
 *
 * @param {Object} props
 * @param {Object} props.question - 题目对象
 * @param {Array} props.knowledgePoints - 知识点列表
 * @param {Function} props.onChange - 题目变更回调 (updatedQuestion) => void
 * @param {Function} props.onDelete - 删除回调 () => void
 */
const QuestionEditor = ({ question, knowledgePoints, onChange, onDelete }) => {
    const [explanationOpen, setExplanationOpen] = useState(false);

    // 兼容旧数据：knowledgePointId 转为 knowledgePointIds 数组
    const safeKnowledgePointIds = useMemo(() => {
        if (!question) return [];
        if (question.knowledgePointIds && question.knowledgePointIds.length > 0) {
            return question.knowledgePointIds;
        }
        if (question.knowledgePointId) {
            return [question.knowledgePointId];
        }
        return [];
    }, [question]);

    /**
     * 触发题目变更，自动附带 _isModified 标记
     * @param {Object} partial - 需要更新的字段
     */
    const emitChange = useCallback((partial) => {
        if (!question) return;
        onChange({
            ...question,
            ...partial,
            _isModified: true,
        });
    }, [question, onChange]);

    /**
     * 处理题型切换，自动调整选项和答案格式
     * @param {string} newType - 新题型
     */
    const handleTypeChange = useCallback((newType) => {
        if (!question) return;
        const updates = { type: newType };
        const oldType = question.type;

        // 根据新旧题型自动调整数据
        if (newType === 'truefalse') {
            updates.options = ['正确', '错误'];
            updates.correctAnswer = '';
        } else if (newType === 'single' || newType === 'multi') {
            if (oldType === 'truefalse' || oldType === 'fill' || oldType === 'essay') {
                updates.options = ['', '', '', ''];
                updates.correctAnswer = '';
            }
        } else if (newType === 'fill' || newType === 'essay') {
            updates.correctAnswer = '';
        }

        emitChange(updates);
    }, [question, emitChange]);

    // 如果 question 为 null/undefined，显示空状态
    if (!question) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
                <span className="text-5xl mb-4 opacity-30">&#x1F4DD;</span>
                <p className="text-sm font-serif text-gray-500">请在左侧选择一道题目进行编辑</p>
                <p className="text-xs text-gray-400 mt-1">或点击「添加题目」创建新题目</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            {/* 顶部：信心度标签 + 题目编号 */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                <ConfidenceBadge confidence={question.confidence} />
                <span className="text-xs text-gray-400 font-mono">{question.id}</span>
            </div>

            {/* 编辑区域 */}
            <div className="p-5 space-y-0">
                {/* 题型选择 */}
                <div className="mb-5">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                        题型
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                        {TYPE_OPTIONS.map((opt) => {
                            const isSelected = question.type === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleTypeChange(opt.value)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                                        ${isSelected
                                            ? 'border-accent bg-accent-light/50 text-accent-dark'
                                            : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 题干编辑 */}
                <QuestionStem
                    value={question.question || ''}
                    onChange={(val) => emitChange({ question: val })}
                />

                {/* 选项编辑（选择/判断）或 答案编辑（填空/简答） */}
                {['single', 'multi', 'truefalse'].includes(question.type) && (
                    <OptionsEditor
                        options={question.options || []}
                        correctAnswer={question.correctAnswer || ''}
                        type={question.type}
                        onOptionsChange={(opts) => emitChange({ options: opts })}
                        onAnswerChange={(ans) => emitChange({ correctAnswer: ans })}
                    />
                )}
                {['fill', 'essay'].includes(question.type) && (
                    <AnswerEditor
                        type={question.type}
                        correctAnswer={question.correctAnswer || ''}
                        onChange={(ans) => emitChange({ correctAnswer: ans })}
                    />
                )}

                {/* 知识点归属 */}
                <KnowledgePointSelector
                    selectedIds={safeKnowledgePointIds}
                    knowledgePoints={knowledgePoints}
                    onChange={(ids) => emitChange({ knowledgePointIds: ids })}
                    onCreate={(name) => {
                        // 创建新知识点 — 生成临时 ID
                        const newId = `kp-new-${Date.now()}`;
                        const newIds = [...safeKnowledgePointIds, newId];
                        // 将新知识点加入 knowledgePoints 列表（通过回调告知父组件）
                        emitChange({
                            knowledgePointIds: newIds,
                            _newKnowledgePoint: { id: newId, name, description: '' },
                        });
                    }}
                />

                {/* 难度选择 */}
                <DifficultySelector
                    value={question.difficulty || 'medium'}
                    onChange={(val) => emitChange({ difficulty: val })}
                />

                {/* 解析编辑（折叠区） */}
                <div className="border-t border-gray-100 pt-4">
                    <button
                        type="button"
                        onClick={() => setExplanationOpen(!explanationOpen)}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        {explanationOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        AI 解析
                        {!question.explanation && (
                            <span className="text-xs text-gray-400">（暂无解析）</span>
                        )}
                    </button>
                    {explanationOpen && (
                        <div className="mt-2">
                            <textarea
                                className="w-full min-h-[80px] px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200
                                           rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                                           resize-y placeholder:text-gray-400"
                                placeholder="输入题目解析..."
                                value={question.explanation || ''}
                                onChange={(e) => emitChange({ explanation: e.target.value })}
                                rows={3}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 底部操作栏 */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <button
                    type="button"
                    onClick={onDelete}
                    className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
                >
                    <Trash2 size={16} />
                    删除此题
                </button>
                {question._isModified && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        已修改
                    </span>
                )}
            </div>
        </div>
    );
};

export default QuestionEditor;