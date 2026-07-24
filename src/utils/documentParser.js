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

// ==================== 康熙部首 → CJK 字符归一化 ====================
// PDF 字体编码有时会将中文汉字映射到康熙部首区（U+2F00-U+2FD5），
// 原文预览时显示为乱码。此映射表将 214 个康熙部首还原为正常 CJK 汉字。

const KANGXI_TO_CJK = {
    '\u2F00': '\u4E00', '\u2F01': '\u4E28', '\u2F02': '\u4E36', '\u2F03': '\u4E3F',
    '\u2F04': '\u4E59', '\u2F05': '\u4E85', '\u2F06': '\u4E8C', '\u2F07': '\u4EA0',
    '\u2F08': '\u4EBA', '\u2F09': '\u513F', '\u2F0A': '\u5165', '\u2F0B': '\u516B',
    '\u2F0C': '\u5182', '\u2F0D': '\u5196', '\u2F0E': '\u51AB', '\u2F0F': '\u51E0',
    '\u2F10': '\u51F5', '\u2F11': '\u5200', '\u2F12': '\u529B', '\u2F13': '\u52F9',
    '\u2F14': '\u5315', '\u2F15': '\u531A', '\u2F16': '\u5338', '\u2F17': '\u5341',
    '\u2F18': '\u535C', '\u2F19': '\u5369', '\u2F1A': '\u5382', '\u2F1B': '\u53B6',
    '\u2F1C': '\u53C8', '\u2F1D': '\u53E3', '\u2F1E': '\u56D7', '\u2F1F': '\u571F',
    '\u2F20': '\u58EB', '\u2F21': '\u5902', '\u2F22': '\u590A', '\u2F23': '\u5915',
    '\u2F24': '\u5927', '\u2F25': '\u5973', '\u2F26': '\u5B50', '\u2F27': '\u5B80',
    '\u2F28': '\u5BF8', '\u2F29': '\u5C0F', '\u2F2A': '\u5C22', '\u2F2B': '\u5C38',
    '\u2F2C': '\u5C6E', '\u2F2D': '\u5C71', '\u2F2E': '\u5DDD', '\u2F2F': '\u5DE5',
    '\u2F30': '\u5DF1', '\u2F31': '\u5DFE', '\u2F32': '\u5E72', '\u2F33': '\u5E7A',
    '\u2F34': '\u5E7F', '\u2F35': '\u5EF4', '\u2F36': '\u5EFE', '\u2F37': '\u5F0B',
    '\u2F38': '\u5F13', '\u2F39': '\u5F50', '\u2F3A': '\u5F61', '\u2F3B': '\u5F73',
    '\u2F3C': '\u5FC3', '\u2F3D': '\u6208', '\u2F3E': '\u6236', '\u2F3F': '\u624B',
    '\u2F40': '\u652F', '\u2F41': '\u6534', '\u2F42': '\u6587', '\u2F43': '\u6597',
    '\u2F44': '\u65A4', '\u2F45': '\u65B9', '\u2F46': '\u65E0', '\u2F47': '\u65E5',
    '\u2F48': '\u66F0', '\u2F49': '\u6708', '\u2F4A': '\u6728', '\u2F4B': '\u6B20',
    '\u2F4C': '\u6B62', '\u2F4D': '\u6B79', '\u2F4E': '\u6BB3', '\u2F4F': '\u6BCB',
    '\u2F50': '\u6BD4', '\u2F51': '\u6BDB', '\u2F52': '\u6C0F', '\u2F53': '\u6C14',
    '\u2F54': '\u6C34', '\u2F55': '\u706B', '\u2F56': '\u722A', '\u2F57': '\u7236',
    '\u2F58': '\u723B', '\u2F59': '\u723F', '\u2F5A': '\u7247', '\u2F5B': '\u7259',
    '\u2F5C': '\u725B', '\u2F5D': '\u72AC', '\u2F5E': '\u7384', '\u2F5F': '\u7389',
    '\u2F60': '\u74DC', '\u2F61': '\u74E6', '\u2F62': '\u7518', '\u2F63': '\u751F',
    '\u2F64': '\u7528', '\u2F65': '\u7530', '\u2F66': '\u758B', '\u2F67': '\u7592',
    '\u2F68': '\u7676', '\u2F69': '\u767D', '\u2F6A': '\u76AE', '\u2F6B': '\u76BF',
    '\u2F6C': '\u76EE', '\u2F6D': '\u77DB', '\u2F6E': '\u77E2', '\u2F6F': '\u77F3',
    '\u2F70': '\u793A', '\u2F71': '\u79B8', '\u2F72': '\u79BE', '\u2F73': '\u7A74',
    '\u2F74': '\u7ACB', '\u2F75': '\u7AF9', '\u2F76': '\u7C73', '\u2F77': '\u7CF8',
    '\u2F78': '\u7F36', '\u2F79': '\u7F51', '\u2F7A': '\u7F8A', '\u2F7B': '\u7FBD',
    '\u2F7C': '\u8001', '\u2F7D': '\u800C', '\u2F7E': '\u8012', '\u2F7F': '\u8033',
    '\u2F80': '\u807F', '\u2F81': '\u8089', '\u2F82': '\u81E3', '\u2F83': '\u81EA',
    '\u2F84': '\u81F3', '\u2F85': '\u81FC', '\u2F86': '\u820C', '\u2F87': '\u821B',
    '\u2F88': '\u821F', '\u2F89': '\u826E', '\u2F8A': '\u8272', '\u2F8B': '\u8278',
    '\u2F8C': '\u864D', '\u2F8D': '\u866B', '\u2F8E': '\u8840', '\u2F8F': '\u884C',
    '\u2F90': '\u8863', '\u2F91': '\u897E', '\u2F92': '\u898B', '\u2F93': '\u89D2',
    '\u2F94': '\u8A00', '\u2F95': '\u8C37', '\u2F96': '\u8C46', '\u2F97': '\u8C55',
    '\u2F98': '\u8C78', '\u2F99': '\u8C9D', '\u2F9A': '\u8D64', '\u2F9B': '\u8D70',
    '\u2F9C': '\u8DB3', '\u2F9D': '\u8EAB', '\u2F9E': '\u8ECA', '\u2F9F': '\u8F9B',
    '\u2FA0': '\u8FB0', '\u2FA1': '\u8FB5', '\u2FA2': '\u9091', '\u2FA3': '\u9149',
    '\u2FA4': '\u91C6', '\u2FA5': '\u91CC', '\u2FA6': '\u91D1', '\u2FA7': '\u9577',
    '\u2FA8': '\u9580', '\u2FA9': '\u961C', '\u2FAA': '\u96B6', '\u2FAB': '\u96B9',
    '\u2FAC': '\u96E8', '\u2FAD': '\u9751', '\u2FAE': '\u975E', '\u2FAF': '\u9762',
    '\u2FB0': '\u9769', '\u2FB1': '\u97CB', '\u2FB2': '\u97ED', '\u2FB3': '\u97F3',
    '\u2FB4': '\u9801', '\u2FB5': '\u98A8', '\u2FB6': '\u98DB', '\u2FB7': '\u98DF',
    '\u2FB8': '\u9996', '\u2FB9': '\u9999', '\u2FBA': '\u99AC', '\u2FBB': '\u9AA8',
    '\u2FBC': '\u9AD8', '\u2FBD': '\u9ADF', '\u2FBE': '\u9B25', '\u2FBF': '\u9B2F',
    '\u2FC0': '\u9B32', '\u2FC1': '\u9B3C', '\u2FC2': '\u9B5A', '\u2FC3': '\u9CE5',
    '\u2FC4': '\u9E75', '\u2FC5': '\u9E7F', '\u2FC6': '\u9EA5', '\u2FC7': '\u9EBB',
    '\u2FC8': '\u9EC3', '\u2FC9': '\u9ECD', '\u2FCA': '\u9ED1', '\u2FCB': '\u9EF9',
    '\u2FCC': '\u9EFD', '\u2FCD': '\u9F0E', '\u2FCE': '\u9F13', '\u2FCF': '\u9F20',
    '\u2FD0': '\u9F3B', '\u2FD1': '\u9F4A', '\u2FD2': '\u9F52', '\u2FD3': '\u9F8D',
    '\u2FD4': '\u9F9C', '\u2FD5': '\u9FA0',
};

/**
 * 将康熙部首（U+2F00-U+2FD5）还原为正常 CJK 字符
 * PDF 字体编码有时会将汉字映射到部首区，导致原文预览显示乱码
 * @param {string} text - 原始文本
 * @returns {string} 归一化后的文本
 */
const normalizeCJKRadicals = (text) => {
    if (!text) return text;
    return text.replace(/[\u2F00-\u2FD5]/g, (ch) => KANGXI_TO_CJK[ch] || ch);
};

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
    // 归一化康熙部首 → 正常 CJK 字符（修复 PDF 字体编码导致的乱码）
    return normalizeCJKRadicals(textParts.join('\n'));
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
    // 归一化康熙部首 → 正常 CJK 字符（修复 PDF 字体编码导致的乱码）
    return { text: normalizeCJKRadicals(textParts.join('\n')), images };
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
