import { forwardRef } from 'react';

/**
 * 卡片组件
 * @param {Object} props
 * @param {React.ReactNode} props.children - 卡片内容
 * @param {string} [props.className] - 额外的 CSS 类名
 * @param {boolean} [props.hover=false] - 是否有悬停效果
 * @param {React.HTMLAttributes<HTMLDivElement>} props - 其他 div 属性
 */
const Card = forwardRef(({
  children,
  className = '',
  hover = false,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
