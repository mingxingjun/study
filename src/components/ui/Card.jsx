import { forwardRef } from 'react';

/**
 * 卡片组件 — "SIGNAL" 设计系统
 * 纯白纸面 + 2px 墨线 + 硬偏移阴影
 * @param {Object} props
 * @param {React.ReactNode} props.children - 卡片内容
 * @param {string} [props.className] - 额外的 CSS 类名
 * @param {boolean} [props.hover=false] - 是否有悬停效果（抬起 + 硬阴影）
 * @param {boolean} [props.elevated=false] - 是否默认带硬阴影
 * @param {React.HTMLAttributes<HTMLDivElement>} props - 其他 div 属性
 */
const Card = forwardRef(({
  children,
  className = '',
  hover = false,
  elevated = false,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`
        bg-white border-2 border-primary rounded-none
        ${elevated ? 'shadow-md' : ''}
        ${hover ? 'card-hover cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
