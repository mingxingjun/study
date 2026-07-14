/**
 * 按钮组件
 * @param {Object} props
 * @param {React.ReactNode} props.children - 按钮内容
 * @param {string} [props.variant='primary'] - 按钮变体
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
    primary: 'bg-accent text-primary hover:bg-accent/90 border-transparent',
    secondary: 'bg-white text-primary border-gray-200 hover:border-gray-300 hover:bg-gray-50',
    accent: 'bg-accent text-primary hover:bg-accent/90 border-transparent',
    ghost: 'bg-transparent text-gray-600 border-transparent hover:text-primary hover:bg-gray-100'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-1.5
        rounded-xl border font-medium
        cursor-pointer
        transition-all duration-150
        hover:-translate-y-0.5 active:translate-y-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:translate-y-0
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
