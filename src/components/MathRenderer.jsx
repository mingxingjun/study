import { useMemo, useRef, useEffect, useCallback } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * 将纯文本中的简单上下标转换为 LaTeX 行内公式
 * 例如 (1001.11)_2 -> $(1001.11)_{2}$，x^2 -> $x^{2}$
 * @param {string} text - 原始纯文本
 * @returns {string} 转换后的文本
 */
const convertSubSupToMath = (text) => {
    return text.replace(
        /([)\]}]|\([^)]+\)|\[[^\]]+\]|\{[^}]+\}|[a-zA-Z0-9])([\^_])([-+]?\d+|[a-zA-Z])/g,
        (match, base, mark, index) => `$${base}${mark}{${index}}$`
    );
};

/**
 * 处理不含 $...$ 的纯文本片段：转换上下标后再解析其中新产生的行内公式
 * 采用非递归方式（while 循环），避免递归调用导致的栈溢出
 * @param {string} plainText - 纯文本片段
 * @param {Array} result - 用于收集解析结果的目标数组
 */
const processPlainSegment = (plainText, result) => {
    const convertedText = convertSubSupToMath(plainText);
    const inlineRegex = /\$([^$\n]+?)\$/g;
    let inlineLastIndex = 0;
    let inlineMatch;

    while ((inlineMatch = inlineRegex.exec(convertedText)) !== null) {
        if (inlineMatch.index > inlineLastIndex) {
            result.push({
                type: 'plain',
                content: convertedText.slice(inlineLastIndex, inlineMatch.index)
            });
        }
        try {
            result.push({
                type: 'inline',
                html: katex.renderToString(inlineMatch[1], {
                    displayMode: false,
                    throwOnError: false
                })
            });
        } catch (e) {
            result.push({ type: 'plain', content: inlineMatch[0] });
        }
        inlineLastIndex = inlineMatch.index + inlineMatch[0].length;
    }

    if (inlineLastIndex < convertedText.length) {
        result.push({ type: 'plain', content: convertedText.slice(inlineLastIndex) });
    }
};

/**
 * 解析文本片段中的行内公式 $...$，将结果推入目标数组
 * @param {string} textContent - 待解析的文本片段
 * @param {Array} result - 用于收集解析结果的目标数组
 */
const parseInlineMath = (textContent, result) => {
    const inlineRegex = /\$([^$\n]+?)\$/g;
    let inlineLastIndex = 0;
    let inlineMatch;

    while ((inlineMatch = inlineRegex.exec(textContent)) !== null) {
        // 行内公式前的纯文本：转换上下标并解析
        if (inlineMatch.index > inlineLastIndex) {
            processPlainSegment(textContent.slice(inlineLastIndex, inlineMatch.index), result);
        }
        // 渲染行内公式，失败时回退为原始文本
        try {
            result.push({
                type: 'inline',
                html: katex.renderToString(inlineMatch[1], {
                    displayMode: false,
                    throwOnError: false
                })
            });
        } catch (e) {
            result.push({ type: 'plain', content: inlineMatch[0] });
        }
        inlineLastIndex = inlineMatch.index + inlineMatch[0].length;
    }

    // 末尾剩余纯文本
    if (inlineLastIndex < textContent.length) {
        processPlainSegment(textContent.slice(inlineLastIndex), result);
    }
};

/**
 * 解析包含 LaTeX 公式的文本为可渲染的片段数组
 * 解析顺序：先提取块级公式 $$...$$，再从剩余文本中提取行内公式 $...$
 * 块级公式内容原样交给 KaTeX，align 等多行环境（含 \\ 和 &）不被预处理干扰
 * @param {string} text - 包含 LaTeX 公式的原始文本
 * @returns {Array<{type: string, content?: string, html?: string}>} 解析后的片段数组
 */
const parseTextToSegments = (text) => {
    if (text == null || text === '') {
        return [];
    }

    const blockRegex = /\$\$([\s\S]+?)\$\$/g;
    const result = [];
    let lastIndex = 0;
    let match;

    // 第一步：按 $$...$$ 拆分，提取块级公式
    while ((match = blockRegex.exec(text)) !== null) {
        // 公式前的文本片段（可能含行内公式）
        if (match.index > lastIndex) {
            parseInlineMath(text.slice(lastIndex, match.index), result);
        }
        // 渲染块级公式，失败时回退为原始文本
        try {
            result.push({
                type: 'block',
                html: katex.renderToString(match[1], {
                    displayMode: true,
                    throwOnError: false
                })
            });
        } catch (e) {
            result.push({ type: 'plain', content: match[0] });
        }
        lastIndex = match.index + match[0].length;
    }

    // 末尾剩余文本
    if (lastIndex < text.length) {
        parseInlineMath(text.slice(lastIndex), result);
    }

    return result;
};

// 变量高亮背景色（金色半透明，契合黑白金极简设计系统）
const HIGHLIGHT_BACKGROUND = 'rgba(201, 162, 39, 0.3)';
// 块级公式容器类名，用于变量高亮作用域限定（行内公式不挂载此类）
const BLOCK_CONTAINER_CLASS = 'math-block-container';

/**
 * 渲染包含 LaTeX 公式的文本
 * 支持块级公式 $$...$$（居中独占一行）和行内公式 $...$（嵌入文本流）
 * 增强能力：块级公式自动编号、align 多行对齐环境、块级公式变量悬停高亮
 *
 * @param {Object} props
 * @param {string} props.text - 包含 LaTeX 公式的文本
 * @param {string} [props.className] - 额外的 CSS 类名
 * @param {boolean} [props.enableNumbering=false] - 是否为块级公式自动编号（右侧显示 (1)(2)...）
 * @param {boolean} [props.enableVariableHighlight=false] - 是否启用块级公式变量悬停高亮
 * @returns {React.ReactElement} 渲染后的 React 元素
 */
const MathRenderer = ({
    text,
    className = '',
    enableNumbering = false,
    enableVariableHighlight = false
}) => {
    // 使用 useMemo 缓存解析结果，避免每次渲染都重新解析
    const segments = useMemo(() => parseTextToSegments(text), [text]);
    // 容器引用：用于事件委托实现变量高亮
    const containerRef = useRef(null);

    /**
     * 鼠标悬停事件处理（事件委托）
     * 当悬停目标为块级公式内的 .mathnormal 元素时，高亮同一块级公式中所有相同变量
     * 采用 mouseover/mouseout（冒泡）而非 mouseenter/mouseleave（不冒泡），以支持事件委托
     * @param {MouseEvent} event - 鼠标事件
     */
    const handleMouseOver = useCallback((event) => {
        const target = event.target;
        if (!target || typeof target.closest !== 'function') return;
        // 仅处理 .mathnormal 元素（KaTeX 变量类）
        if (!target.classList || !target.classList.contains('mathnormal')) return;
        // 限定在块级公式容器内（行内公式不启用高亮）
        const blockContainer = target.closest(`.${BLOCK_CONTAINER_CLASS}`);
        if (!blockContainer) return;
        const variable = target.textContent;
        if (!variable) return;
        // 高亮同一块级公式内所有相同变量
        const candidates = blockContainer.querySelectorAll('.mathnormal');
        candidates.forEach((el) => {
            if (el.textContent === variable) {
                el.style.backgroundColor = HIGHLIGHT_BACKGROUND;
            }
        });
    }, []);

    /**
     * 鼠标离开事件处理（事件委托）
     * 清除当前块级公式内所有变量的高亮背景
     * @param {MouseEvent} event - 鼠标事件
     */
    const handleMouseOut = useCallback((event) => {
        const target = event.target;
        if (!target || typeof target.closest !== 'function') return;
        if (!target.classList || !target.classList.contains('mathnormal')) return;
        const blockContainer = target.closest(`.${BLOCK_CONTAINER_CLASS}`);
        if (!blockContainer) return;
        // 清除该块级公式内所有高亮
        const highlighted = blockContainer.querySelectorAll('.mathnormal');
        highlighted.forEach((el) => {
            el.style.backgroundColor = '';
        });
    }, []);

    // 绑定/解绑变量高亮事件：仅在启用时挂载，使用事件委托保证 DOM 更新后依然生效
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !enableVariableHighlight) return undefined;
        container.addEventListener('mouseover', handleMouseOver);
        container.addEventListener('mouseout', handleMouseOut);
        return () => {
            container.removeEventListener('mouseover', handleMouseOver);
            container.removeEventListener('mouseout', handleMouseOut);
        };
    }, [enableVariableHighlight, handleMouseOver, handleMouseOut]);

    // 块级公式编号计数器（按渲染顺序递增，当前渲染实例内独立计数）
    let blockNumber = 0;

    return (
        <span ref={containerRef} className={className} style={{ whiteSpace: 'pre-wrap' }}>
            {segments.map((segment, index) => {
                const key = `seg-${index}`;
                if (segment.type === 'block') {
                    // 块级公式：支持编号与变量高亮
                    if (enableNumbering) {
                        blockNumber += 1;
                        // flex 布局：左右等宽弹性占位让公式居中，编号右对齐
                        return (
                            <div
                                key={key}
                                className={`${BLOCK_CONTAINER_CLASS} my-2 flex items-center justify-center`}
                            >
                                <div className="flex-1" />
                                <div
                                    className="text-center"
                                    dangerouslySetInnerHTML={{ __html: segment.html }}
                                />
                                <div className="flex-1 flex justify-end">
                                    <span
                                        className="text-gray-500 ml-4 select-none"
                                        style={{ fontVariantNumeric: 'tabular-nums' }}
                                    >
                                        ({blockNumber})
                                    </span>
                                </div>
                            </div>
                        );
                    }
                    // 仅启用变量高亮时，附加容器类名以便事件委托识别作用域
                    return (
                        <div
                            key={key}
                            className={`text-center my-2${enableVariableHighlight ? ` ${BLOCK_CONTAINER_CLASS}` : ''}`}
                            dangerouslySetInnerHTML={{ __html: segment.html }}
                        />
                    );
                }
                if (segment.type === 'inline') {
                    // 行内公式：嵌入文本流
                    return (
                        <span
                            key={key}
                            dangerouslySetInnerHTML={{ __html: segment.html }}
                        />
                    );
                }
                // 纯文本片段
                return <span key={key}>{segment.content}</span>;
            })}
        </span>
    );
};

export default MathRenderer;
