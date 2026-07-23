/**
 * 按钮组件 - Refined Editorial Minimalism
 * 金色 CTA + 精致阴影 + 微妙位移
 * @param {Object} props
 * @param {React.ReactNode} props.children - 按钮内容
 * @param {string} [props.variant='primary'] - 按钮变体：primary(金底)/secondary(白底)/accent(金底强调)/ghost(透明)
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
    // 金色主按钮 - 奢侈品 CTA 风格
    primary: 'bg-accent text-primary hover:bg-accent-dark border border-accent/40 hover:border-accent-dark hover:shadow-gold',
    // 白底描边 - 编辑风次按钮
    secondary: 'bg-white text-primary border border-gray-300 hover:border-gray-900 hover:bg-gray-50 hover:shadow-sm',
    // 金底强调 - 与 primary 一致，语义别名
    accent: 'bg-accent text-primary hover:bg-accent-dark border border-accent/40 hover:border-accent-dark hover:shadow-gold',
    // 透明幽灵 - 极简内嵌
    ghost: 'bg-transparent text-gray-600 border border-transparent hover:text-primary hover:bg-gray-100/80'
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs tracking-wide',
    md: 'px-5 py-2.5 text-sm tracking-wide',
    lg: 'px-7 py-3.5 text-sm tracking-wider'
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-full font-medium
        cursor-pointer select-none
        transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:translate-y-0 disabled:hover:shadow-none
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
