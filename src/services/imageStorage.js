/**
 * 图片 IndexedDB 存储服务
 *
 * 设计目的：
 * - 题目图片（base64）体积大，直接放 localStorage 会撑爆 5-10MB 配额
 * - 改用 IndexedDB 单独存储图片，localStorage 只存图片 key（如 "img-{materialId}-{idx}"）
 * - QuestionImage 组件通过 srcKey 异步从 IndexedDB 加载图片
 *
 * key 命名规范：`img-{materialId}-{imageIndex}` 或 `img-manual-{questionId}-{timestamp}`
 */

import { get, set, del, keys, clear } from 'idb-keyval';

/** IndexedDB 存储 key 前缀，便于与未来其他用途的 key 区分 */
const IMAGE_KEY_PREFIX = 'img-';

/**
 * 判断字符串是否为 IndexedDB 图片 key（而非 base64 或 URL）
 * 兼容历史数据：旧的 base64 data URL 和 URL 直接返回 false
 * @param {string} str
 * @returns {boolean}
 */
export const isImageKey = (str) => {
    return typeof str === 'string' && str.startsWith(IMAGE_KEY_PREFIX);
};

/**
 * 生成图片存储 key
 * @param {string} materialId - 文档 ID
 * @param {number|string} index - 图片序号或唯一标识
 * @returns {string} 形如 `img-{materialId}-{index}`
 */
export const buildImageKey = (materialId, index) => {
    const safeMaterial = String(materialId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${IMAGE_KEY_PREFIX}${safeMaterial}-${index}`;
};

/**
 * 保存图片到 IndexedDB
 * @param {string} key - 存储 key（应通过 buildImageKey 生成）
 * @param {string} base64Data - 图片的 base64 data URL
 * @returns {Promise<void>}
 */
export const saveImage = async (key, base64Data) => {
    if (!key || !base64Data) return;
    try {
        await set(key, base64Data);
    } catch (error) {
        // IndexedDB 写入失败通常意味着配额不足或浏览器隐私模式
        console.error(`[imageStorage] 保存图片失败 key=${key}:`, error);
        throw new Error(`图片存储失败：${error.message}`);
    }
};

/**
 * 从 IndexedDB 读取图片
 * @param {string} key - 存储 key
 * @returns {Promise<string|null>} base64 data URL，不存在或失败时返回 null
 */
export const getImage = async (key) => {
    if (!key) return null;
    try {
        const value = await get(key);
        return typeof value === 'string' ? value : null;
    } catch (error) {
        console.error(`[imageStorage] 读取图片失败 key=${key}:`, error);
        return null;
    }
};

/**
 * 删除单张图片
 * @param {string} key - 存储 key
 * @returns {Promise<void>}
 */
export const deleteImage = async (key) => {
    if (!key) return;
    try {
        await del(key);
    } catch (error) {
        console.warn(`[imageStorage] 删除图片失败 key=${key}:`, error);
    }
};

/**
 * 批量删除图片
 * @param {string[]} keyArray - 存储 key 数组
 * @returns {Promise<void>}
 */
export const deleteImages = async (keyArray) => {
    if (!Array.isArray(keyArray) || keyArray.length === 0) return;
    await Promise.all(keyArray.map(k => deleteImage(k)));
};

/**
 * 删除指定 materialId 对应的所有图片
 * 用于删题库（material）时级联清理
 * @param {string} materialId
 * @returns {Promise<number>} 删除的图片数量
 */
export const deleteImagesByMaterial = async (materialId) => {
    if (!materialId) return 0;
    const prefix = `${IMAGE_KEY_PREFIX}${String(materialId).replace(/[^a-zA-Z0-9_-]/g, '_')}-`;
    let count = 0;
    try {
        const allKeys = await keys();
        for (const k of allKeys) {
            if (typeof k === 'string' && k.startsWith(prefix)) {
                await del(k);
                count++;
            }
        }
    } catch (error) {
        console.warn(`[imageStorage] 按 materialId 批量删除失败:`, error);
    }
    return count;
};

/**
 * 清空所有图片存储（谨慎使用，仅用于重置/退出登录）
 * @returns {Promise<void>}
 */
export const clearAllImages = async () => {
    try {
        await clear();
    } catch (error) {
        console.warn(`[imageStorage] 清空所有图片失败:`, error);
    }
};

export default {
    isImageKey,
    buildImageKey,
    saveImage,
    getImage,
    deleteImage,
    deleteImages,
    deleteImagesByMaterial,
    clearAllImages
};
