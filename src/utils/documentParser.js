/**
 * 文档解析工具
 * 支持浏览器端解析 PDF、Word(.docx)、TXT 文件，提取文本内容
 * 增强版：支持 PDF/Word 内嵌图片提取为 base64，用于多模态 AI 视觉识别
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// 配置 PDF.js worker 路径，确保多线程解析
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).href;

/** 单文档最多提取的图片数量（避免超出 AI 模型请求限制，20 张是 GPT-4o 单次安全上限） */
const MAX_IMAGES_PER_DOCUMENT = 20;
/** 跳过过小的图片（小于此尺寸的通常是装饰图或图标） */
const MIN_IMAGE_SIZE = 50;
/** 跳过过大的图片（避免 base64 过长导致请求体超限，约 5MB） */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

// ==================== 图片提取功能（用于多模态 AI 视觉识别）====================

/**
 * 将 pdfjs 的 ImageData 对象转换为 base64 PNG data URL
 * 处理不同 pixel format（GRAYSCALE_1BPP / RGB_24BPP / RGBA_32BPP）
 * @param {Object} imgData - pdfjs 返回的图片数据对象 { width, height, data, kind }
 * @returns {string|null} base64 data URL，失败返回 null
 */
const imageDataToBase64 = (imgData) => {
    if (!imgData || !imgData.width || !imgData.height || !imgData.data) {
        return null;
    }

    const { width, height, data, kind } = imgData;

    // 跳过过小的图片（装饰图或图标）
    if (width < MIN_IMAGE_SIZE || height < MIN_IMAGE_SIZE) {
        return null;
    }

    // 跳过过大的图片（避免 base64 过长导致 AI 请求体超限）
    if (width * height * 4 > MAX_IMAGE_BYTES) {
        return null;
    }

    try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const imageData = ctx.createImageData(width, height);
        const dst = imageData.data;

        // pdfjs ImageKind 枚举：1=GRAYSCALE_1BPP, 2=RGB_24BPP, 3=RGBA_32BPP
        if (kind === 2) {
            // RGB_24BPP → RGBA 转换
            const src = data;
            for (let i = 0, j = 0; i < dst.length; i += 4, j += 3) {
                dst[i] = src[j];
                dst[i + 1] = src[j + 1];
                dst[i + 2] = src[j + 2];
                dst[i + 3] = 255;
            }
        } else if (kind === 3) {
            // RGBA_32BPP 直接复制
            dst.set(data);
        } else {
            // GRAYSCALE_1BPP 或其他格式不处理（实际题目图罕见）
            return null;
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.warn('imageData 转 base64 失败:', error);
        return null;
    }
};

/**
 * 从 PDF 单个页面提取内嵌图片为 base64 数组
 * 通过遍历 PDF 操作列表，找出 paintImageXObject 操作并获取对应图片对象
 * @param {Object} page - pdfjs 的 Page 对象
 * @param {string[]} images - 图片数组（累积追加，达到上限则停止）
 * @returns {Promise<void>}
 */
const extractImagesFromPDFPage = async (page, images) => {
    let opList;
    try {
        opList = await page.getOperatorList();
    } catch (error) {
        console.warn('获取页面操作列表失败:', error);
        return;
    }

    const ops = opList.fnArray;
    const args = opList.argsArray;

    for (let i = 0; i < ops.length; i++) {
        // 达到上限就停止提取
        if (images.length >= MAX_IMAGES_PER_DOCUMENT) return;

        if (ops[i] === pdfjsLib.OPS.paintImageXObject) {
            const imgName = args[i][0];
            try {
                // pdfjs objs.get 在对象已加载时同步返回，未加载时通过 callback 异步返回
                // 使用 Promise 包装并设置 2 秒超时，避免阻塞过久
                const imgData = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('图片对象加载超时'));
                    }, 2000);

                    try {
                        page.objs.get(imgName, (data) => {
                            clearTimeout(timeout);
                            resolve(data);
                        });
                    } catch (e) {
                        clearTimeout(timeout);
                        reject(e);
                    }
                });

                const base64 = imageDataToBase64(imgData);
                if (base64) images.push(base64);
            } catch (imgError) {
                console.warn(`提取图片 ${imgName} 失败:`, imgError);
            }
        }
    }
};

/**
 * 解析 PDF 文件，提取全部文本和内嵌图片
 * @param {File} file - PDF 文件对象
 * @param {Function} [onProgress] - 进度回调 (0-100)
 * @returns {Promise<{text: string, images: string[]}>} 文本和 base64 图片数组
 */
export const parsePDFWithImages = async (file, onProgress) => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    const totalPages = pdfDocument.numPages;
    const textParts = [];
    const images = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);

        // 提取文本
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        textParts.push(pageText);

        // 提取图片（达到上限后跳过后续页面的图片提取）
        if (images.length < MAX_IMAGES_PER_DOCUMENT) {
            await extractImagesFromPDFPage(page, images);
        }

        if (typeof onProgress === 'function') {
            const progress = Math.round((pageNum / totalPages) * 100);
            onProgress(progress);
        }
    }

    if (typeof pdfDocument.destroy === 'function') {
        await pdfDocument.destroy();
    }
    return { text: textParts.join('\n'), images };
};

/**
 * 解析 Word(.docx) 文件，提取全部文本和内嵌图片
 * 使用 mammoth 的 convertToHtml 配合 convertImage 选项提取图片为 base64
 * @param {File} file - Word 文件对象
 * @returns {Promise<{text: string, images: string[]}>} 文本和 base64 图片数组
 */
export const parseWordWithImages = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const images = [];

    // mammoth.convertToHtml 会保留图片标签，通过 convertImage 钩子转换图片为 base64
    const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
            convertImage: mammoth.images.imgElement((image) => {
                return image.read('base64').then((imageBuffer) => {
                    // 达到上限的图片不再追加到数组（但仍需返回 src 以保证解析流程不中断）
                    if (images.length < MAX_IMAGES_PER_DOCUMENT) {
                        const dataUrl = `data:${image.contentType};base64,${imageBuffer}`;
                        // 过滤过小的图片（如装饰图、图标）
                        // 注意：mammoth 不直接提供图片尺寸信息，通过 base64 长度粗略估算
                        // base64 长度 ≈ 原始字节数 × 4/3，小于 2KB 的通常是图标
                        if (imageBuffer.length > 2000) {
                            images.push(dataUrl);
                        }
                        return { src: dataUrl };
                    }
                    return { src: '' };
                });
            })
        }
    );

    // 从 HTML 中提取纯文本（保留段落换行）
    const html = result.value || '';
    const div = document.createElement('div');
    div.innerHTML = html;
    const textParts = [];
    div.childNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            // 块级元素之间换行
            const text = node.textContent.trim();
            if (text) textParts.push(text);
        } else if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) textParts.push(text);
        }
    });

    return { text: textParts.join('\n'), images };
};

/**
 * 读取 TXT 文件（不含图片）
 * @param {File} file - TXT 文件对象
 * @returns {Promise<{text: string, images: string[]}>} 文本和空图片数组
 */
export const parseTXTWithImages = async (file) => {
    return { text: await file.text(), images: [] };
};

/**
 * 解析文档，同时提取文本和内嵌图片
 * 与 parseDocument 的区别：返回 { text, images } 而非纯字符串
 * @param {File} file - 文件对象
 * @param {Function} [onProgress] - 进度回调
 * @returns {Promise<{text: string, images: string[]}>} 文本和 base64 图片数组
 */
export const parseDocumentWithImages = async (file, onProgress) => {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.pdf')) {
        return await parsePDFWithImages(file, onProgress);
    }
    if (fileName.endsWith('.docx')) {
        return await parseWordWithImages(file);
    }
    if (fileName.endsWith('.txt')) {
        return await parseTXTWithImages(file);
    }
    if (fileName.endsWith('.doc')) {
        throw new Error('暂不支持 .doc 格式，请将文件另存为 .docx 后再上传');
    }
    throw new Error(`不支持的文件类型: ${file.name}`);
};

export default parseDocument;
