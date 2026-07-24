import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import useReducedMotion from './useReducedMotion';

/**
 * 为容器内的子元素添加依次入场动画
 * 使用 anime.js v4 的 stagger 函数实现交错延迟
 * @param {Array} dependencies - 触发重新动画的依赖项
 * @param {string} selector - 子元素选择器，默认 .stagger-item
 * @returns {React.RefObject<HTMLElement>} 容器 ref
 */
const useStaggerAnimation = (dependencies = [], selector = '.stagger-item') => {
  const containerRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!containerRef.current || reducedMotion) {
      return;
    }

    const items = containerRef.current.querySelectorAll(selector);
    if (items.length === 0) {
      return;
    }

    // anime.js v4：fromTo 用数组 [from, to]；
    // stagger(80) 替代 GSAP 的 stagger: 0.08（80ms 间隔）；
    // duration 单位毫秒
    const anim = animate(items, {
      opacity: [0, 1],
      y: [20, 0],
      duration: 500,
      delay: stagger(80),
      ease: 'outCubic',
      onComplete: () => {
        // 清理 transform 内联样式，避免影响后续布局
        items.forEach(el => { el.style.transform = ''; });
      }
    });

    return () => anim.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return containerRef;
};

export default useStaggerAnimation;
