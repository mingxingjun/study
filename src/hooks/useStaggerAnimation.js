import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import useReducedMotion from './useReducedMotion';

/**
 * 为容器内的子元素添加依次入场动画
 * @param {Array} dependencies - 触发重新动画的依赖项
 * @param {string} selector - 子元素选择器，默认 .stagger-item
 * @returns {React.RefObject<HTMLElement>} 容器 ref
 */
const useStaggerAnimation = (dependencies = [], selector = '.stagger-item') => {
  const containerRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useGSAP(() => {
    if (!containerRef.current || reducedMotion) {
      return;
    }

    const items = containerRef.current.querySelectorAll(selector);
    if (items.length === 0) {
      return;
    }

    gsap.fromTo(
      items,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'transform'
      }
    );
  }, dependencies);

  return containerRef;
};

export default useStaggerAnimation;
