import { useMemo } from 'react';
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
 * 将包含 LaTeX 公式的文本解析为可渲染的片段数组
 * 解析顺序：先提取块级公式 $$...$$，再从剩余文本中提取行内公式 $...$
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

/**
 * 渲染包含 LaTeX 公式的文本
 * 支持块级公式 $$...$$（居中独占一行）和行内公式 $...$（嵌入文本流）
 * @param {Object} props
 * @param {string} props.text - 包含 LaTeX 公式的文本
 * @param {string} [props.className] - 额外的 CSS 类名
 * @returns {React.ReactElement} 渲染后的 React 元素
 */
const MathRenderer = ({ text, className = '' }) => {
    // 使用 useMemo 缓存解析结果，避免每次渲染都重新解析
    const segments = useMemo(() => parseTextToSegments(text), [text]);

    return (
        <span className={className} style={{ whiteSpace: 'pre-wrap' }}>
            {segments.map((segment, index) => {
                const key = `seg-${index}`;
                if (segment.type === 'block') {
                    // 块级公式：居中显示
                    return (
                        <div
                            key={key}
                            className="text-center my-2"
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
