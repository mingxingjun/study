/**
 * 文档解析工具
 * 支持浏览器端解析 PDF、Word(.docx)、TXT 文件，提取文本内容
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// 配置 PDF.js worker 路径，确保多线程解析
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).href;

/**
 * 解析 PDF 文件，提取全部文本
 * @param {File} file - PDF 文件对象
 * @param {Function} [onProgress] - 进度回调 (0-100)
 * @returns {Promise<string>} 提取的文本内容
 */
export const parsePDF = async (file, onProgress) => {
    // 读取文件为 ArrayBuffer，供 PDF.js 解析使用
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    const totalPages = pdfDocument.numPages;
    const textParts = [];

    // 逐页提取文本内容
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        // 拼接当前页所有文本片段
        const pageText = textContent.items.map(item => item.str).join(' ');
        textParts.push(pageText);

        // 触发进度回调
        if (typeof onProgress === 'function') {
            const progress = Math.round((pageNum / totalPages) * 100);
            onProgress(progress);
        }
    }

    // 部分 PDF.js 版本的 document 对象没有 destroy 方法，安全调用
    if (typeof pdfDocument.destroy === 'function') {
        await pdfDocument.destroy();
    }
    return textParts.join('\n');
};

/**
 * 解析 Word(.docx) 文件，提取全部文本
 * @param {File} file - Word 文件对象
 * @returns {Promise<string>} 提取的文本内容
 */
export const parseWord = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
};

/**
 * 读取 TXT 文件
 * @param {File} file - TXT 文件对象
 * @returns {Promise<string>} 文本内容
 */
export const parseTXT = async (file) => {
    return await file.text();
};

/**
 * 根据文件类型自动选择解析器
 * @param {File} file - 文件对象
 * @param {Function} [onProgress] - 进度回调
 * @returns {Promise<string>} 提取的文本内容
 */
export const parseDocument = async (file, onProgress) => {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.pdf')) {
        return await parsePDF(file, onProgress);
    }
    if (fileName.endsWith('.docx')) {
        return await parseWord(file);
    }
    if (fileName.endsWith('.txt')) {
        return await parseTXT(file);
    }
    if (fileName.endsWith('.doc')) {
        throw new Error('暂不支持 .doc 格式，请将文件另存为 .docx 后再上传');
    }
    throw new Error(`不支持的文件类型: ${file.name}`);
};

export default parseDocument;
