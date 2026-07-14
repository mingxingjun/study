/**
 * localStorage 存储服务
 * 封装 localStorage 的读写操作，提供统一的数据持久化接口
 */

/**
 * 保存数据到 localStorage
 * @param {string} key - 存储键名
 * @param {any} data - 要存储的数据（会自动序列化为JSON）
 */
export const saveData = (key, data) => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`Error saving data to localStorage: ${key}`, error);
  }
};

/**
 * 从 localStorage 加载数据
 * @param {string} key - 存储键名
 * @param {any} defaultValue - 数据不存在时返回的默认值
 * @returns {any} 解析后的数据或默认值
 */
export const loadData = (key, defaultValue = null) => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error(`Error loading data from localStorage: ${key}`, error);
    return defaultValue;
  }
};

/**
 * 从 localStorage 删除数据
 * @param {string} key - 存储键名
 */
export const removeData = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing data from localStorage: ${key}`, error);
  }
};
