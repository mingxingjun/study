/**
 * 按钮组件 — "SIGNAL" 设计系统
 * 直角硬边 + 2px 墨线 + 信号橙悬停
 * @param {Object} props
 * @param {React.ReactNode} props.children - 按钮内容
 * @param {string} [props.variant='primary'] - 按钮变体：primary(墨黑)/secondary(白底墨线)/accent(信号橙)/ghost(透明)
 * @param {string} [props.size='md'] - 按钮尺寸
 * @param {string} [props.className] - 额外的 CSS 类名
 * @param {boolean} [props.disabled=false] - 是否禁用
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement>} props - 其他 button 属性
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) => {
  const variants = {
    // 墨黑主按钮：悬停翻转为信号橙
    primary: 'bg-primary text-white border-primary hover:bg-accent hover:text-black hover:border-accent',
    // 白底墨线：悬停压黑
    secondary: 'bg-white text-primary border-primary hover:bg-primary hover:text-white',
    // 信号橙：悬停加深
    accent: 'bg-accent text-black border-black hover:bg-accent-dark hover:text-white',
    // 透明幽灵
    ghost: 'bg-transparent text-gray-600 border-transparent hover:text-primary hover:bg-gray-100'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[11px]',
    md: 'px-4 py-2.5 text-[13px]',
    lg: 'px-6 py-3.5 text-sm'
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-none border-2 font-semibold tracking-wide
        cursor-pointer select-none
        transition-all duration-150
        hover:-translate-y-0.5 active:translate-y-0
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
