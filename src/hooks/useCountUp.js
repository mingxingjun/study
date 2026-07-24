import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import useReducedMotion from './useReducedMotion';

/**
 * 数字滚动动画 hook
 * 使用 anime.js v4 驱动数字从当前值平滑滚动到目标值
 * @param {number} target - 目标数字
 * @param {Object} [options]
 * @param {number} [options.duration=1200] - 动画时长（毫秒）
 * @param {string} [options.ease='outExpo'] - 缓动函数，outExpo 末段平滑收敛
 * @param {boolean} [options.round=true] - 是否四舍五入为整数
 * @returns {number} 当前显示的数字
 */
const useCountUp = (target, options = {}) => {
  const { duration = 1200, ease = 'outExpo', round = true } = options;
  const reducedMotion = useReducedMotion();
  // 初值：减少动画偏好时直接使用目标值，避免初始闪烁
  const [display, setDisplay] = useState(reducedMotion ? target : 0);
  // 用 ref 跟踪当前真实数值，作为下次动画起点，避免 display 进入依赖导致循环
  const currentRef = useRef(reducedMotion ? target : 0);

  useEffect(() => {
    if (reducedMotion) {
      currentRef.current = target;
      setDisplay(target);
      return undefined;
    }

    const start = currentRef.current;
    // 目标与起点相同则不触发动画
    if (start === target) {
      setDisplay(target);
      return undefined;
    }

    // anime.js 可 animate 普通 JS 对象；onUpdate 中读取对象属性并同步到 React state
    const obj = { val: start };
    const anim = animate(obj, {
      val: target,
      duration,
      ease,
      onUpdate: () => {
        currentRef.current = obj.val;
        setDisplay(round ? Math.round(obj.val) : obj.val);
      },
      onComplete: () => {
        currentRef.current = target;
      }
    });

    return () => anim.revert();
  }, [target, duration, ease, round, reducedMotion]);

  return display;
};

export default useCountUp;
