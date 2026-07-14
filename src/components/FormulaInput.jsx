import { useState, useRef, useCallback } from 'react';
import { FunctionSquare, X } from 'lucide-react';
import MathRenderer from './MathRenderer';

/**
 * 符号分组配置
 * 每组包含标签与插入值；cursorOffset 表示插入后光标相对插入点的偏移量，
 * 未指定时默认置于插入文本末尾
 */
const SYMBOL_GROUPS = [
    {
        title: '常用模板',
        items: [
            { label: '分式', value: '\\frac{}{}', cursorOffset: 6 },
            { label: '根号', value: '\\sqrt{}', cursorOffset: 6 },
            { label: '上标', value: '^{}', cursorOffset: 2 },
            { label: '下标', value: '_{}', cursorOffset: 2 },
            { label: '上下标', value: '_{}^{}', cursorOffset: 2 },
            { label: '块级公式', value: '$$$$', cursorOffset: 2 }
        ]
    },
    {
        title: '希腊字母',
        items: [
            { label: 'α', value: '\\alpha ' },
            { label: 'β', value: '\\beta ' },
            { label: 'γ', value: '\\gamma ' },
            { label: 'θ', value: '\\theta ' },
            { label: 'π', value: '\\pi ' },
            { label: 'σ', value: '\\sigma ' }
        ]
    },
    {
        title: '运算符',
        items: [
            { label: '±', value: '\\pm ' },
            { label: '×', value: '\\times ' },
            { label: '÷', value: '\\div ' },
            { label: '·', value: '\\cdot ' },
            { label: '∞', value: '\\infty ' },
            { label: '∫', value: '\\int ' },
            { label: '∑', value: '\\sum ' },
            { label: '∏', value: '\\prod ' },
            { label: '≤', value: '\\leq ' },
            { label: '≥', value: '\\geq ' },
            { label: '≠', value: '\\neq ' },
            { label: '≈', value: '\\approx ' }
        ]
    },
    {
        title: '括号',
        items: [
            { label: '( )', value: '()', cursorOffset: 1 },
            { label: '[ ]', value: '[]', cursorOffset: 1 },
            { label: '{ }', value: '\\{ \\}', cursorOffset: 2 },
            { label: '⟨ ⟩', value: '\\langle \\rangle ' }
        ]
    }
];

/**
 * 公式输入组件
 * 提供可折叠的数学符号面板，支持在光标处插入 LaTeX 模板或符号，并实时预览
 * 输出保持纯文本，含 $...$ / $$...$$ 标记，可被 MathRenderer 渲染
 *
 * @param {Object} props
 * @param {string} props.value - 当前输入值
 * @param {Function} props.onChange - 值变化回调，接收新字符串
 * @param {string} [props.placeholder] - 输入框占位文本
 * @param {number} [props.rows=3] - textarea 行数
 * @param {string} [props.className] - 额外 CSS 类名
 * @param {string} [props.label] - 标签文本
 * @param {boolean} [props.disabled=false] - 是否禁用
 */
const FormulaInput = ({
    value,
    onChange,
    placeholder = '',
    rows = 3,
    className = '',
    label = '',
    disabled = false
}) => {
    const [paletteOpen, setPaletteOpen] = useState(false);
    const textareaRef = useRef(null);

    /**
     * 切换符号面板显示状态
     */
    const togglePalette = useCallback(() => {
        setPaletteOpen((prev) => !prev);
    }, []);

    /**
     * 在 textarea 当前光标位置插入文本
     * @param {string} insertText - 待插入文本
     * @param {number} [cursorOffset] - 插入后光标相对插入起点的偏移量
     */
    const insertAtCursor = useCallback((insertText, cursorOffset) => {
        const element = textareaRef.current;
        if (!element || disabled) return;

        const start = element.selectionStart;
        const end = element.selectionEnd;
        const currentValue = value || '';
        const before = currentValue.slice(0, start);
        const after = currentValue.slice(end);
        const newValue = before + insertText + after;

        onChange(newValue);

        const offset = typeof cursorOffset === 'number' ? cursorOffset : insertText.length;
        const newCursor = start + offset;

        // 等待 React 渲染完成后恢复焦点与光标位置
        setTimeout(() => {
            element.focus();
            element.setSelectionRange(newCursor, newCursor);
        }, 0);
    }, [value, onChange, disabled]);

    const displayValue = value || '';

    // 实时预览：未手动加 $ 但包含 LaTeX 命令或上下标时，自动用行内公式渲染
    const hasDollar = displayValue.includes('$');
    const hasMathToken = /\\[a-zA-Z]+|[_^]/.test(displayValue);
    const previewValue = !hasDollar && hasMathToken ? `$${displayValue}$` : displayValue;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <div
                className={`border border-gray-200 rounded-xl overflow-hidden bg-white transition-colors ${
                    disabled ? 'bg-gray-50' : 'focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30'
                }`}
            >
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
                    <button
                        type="button"
                        onClick={togglePalette}
                        disabled={disabled}
                        className={`flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-primary transition-colors ${
                            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        }`}
                    >
                        <FunctionSquare size={14} />
                        {paletteOpen ? '关闭公式面板' : '插入公式 / 符号'}
                    </button>
                    {paletteOpen && (
                        <button
                            type="button"
                            onClick={togglePalette}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {paletteOpen && !disabled && (
                    <div className="p-3 border-b border-gray-100 bg-gray-50/50 space-y-3">
                        {SYMBOL_GROUPS.map((group) => (
                            <div key={group.title}>
                                <div className="text-xs text-gray-500 mb-1.5">
                                    {group.title}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {group.items.map((item) => (
                                        <button
                                            key={item.label}
                                            type="button"
                                            onClick={() => insertAtCursor(item.value, item.cursorOffset)}
                                            className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors duration-150 cursor-pointer touch-manipulation"
                                            title={item.value}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <p className="text-xs text-gray-400">
                            提示：使用 $...$ 表示行内公式，$$...$$ 表示块级公式
                        </p>
                    </div>
                )}

                <textarea
                    ref={textareaRef}
                    value={displayValue}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    disabled={disabled}
                    className={`w-full p-3 text-sm focus:outline-none resize-none bg-transparent ${
                        disabled ? 'cursor-not-allowed text-gray-500' : ''
                    }`}
                />

                {displayValue && (
                    <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50">
                        <div className="text-xs text-gray-400 mb-1">实时预览</div>
                        <div className="text-sm text-gray-800 min-h-[1.5em] break-all">
                            <MathRenderer text={previewValue} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormulaInput;
