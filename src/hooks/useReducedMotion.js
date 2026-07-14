import { useState, useEffect } from 'react';

const REDUCE_MOTION_KEY = 'study-buddy-reduce-motion';

/**
 * 检测用户是否偏好减少动画
 * 优先读取 localStorage 开关，其次读取系统 prefers-reduced-motion 设置
 * @returns {boolean} 是否应减少动画
 */
const useReducedMotion = () => {
  const getInitialValue = () => {
    try {
      const stored = localStorage.getItem(REDUCE_MOTION_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
    } catch (e) {
      // localStorage 不可用时忽略
    }

    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  const [reducedMotion, setReducedMotion] = useState(getInitialValue);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    /**
     * 系统偏好变化时重新计算
     */
    const handleChange = (event) => {
      try {
        const stored = localStorage.getItem(REDUCE_MOTION_KEY);
        if (stored === null) {
          setReducedMotion(event.matches);
        }
      } catch (e) {
        setReducedMotion(event.matches);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }

    /**
     * 跨标签页同步 localStorage 变化
     */
    const handleStorage = (event) => {
      if (event.key === REDUCE_MOTION_KEY) {
        setReducedMotion(event.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return reducedMotion;
};

export default useReducedMotion;
