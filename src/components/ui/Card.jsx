import { forwardRef } from 'react';

/**
 * 卡片组件 - Refined Editorial Minimalism
 * 白底 + 精细边框 + 深度阴影 + 纸张质感
 * @param {Object} props
 * @param {React.ReactNode} props.children - 卡片内容
 * @param {string} [props.className] - 额外的 CSS 类名
 * @param {boolean} [props.hover=false] - 是否有悬停效果（边框+阴影变化）
 * @param {boolean} [props.elevated=false] - 是否默认带阴影
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
        bg-white border border-gray-200/80 rounded-2xl
        ${elevated ? 'shadow-sm' : ''}
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
