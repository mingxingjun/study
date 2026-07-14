import { useState, useEffect } from 'react';
import { saveData, loadData } from '../services/storageService';

/**
 * 自定义 Hook：useStorage
 * 实现状态与 localStorage 的双向同步
 * @param {string} key - localStorage 键名
 * @param {any} initialValue - 初始值
 * @returns {[any, Function]} [状态值, 更新函数]
 */
export const useStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    return loadData(key, initialValue);
  });

  useEffect(() => {
    saveData(key, storedValue);
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};

export default useStorage;
