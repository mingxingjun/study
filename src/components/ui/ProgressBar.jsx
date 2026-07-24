/**
 * 进度条组件 - Refined Editorial Minimalism
 * 细线 + 精致圆角 + 金色选项 + 平滑过渡
 * @param {Object} props
 * @param {number} [props.value=0] - 当前进度值 (0-100)
 * @param {number} [props.max=100] - 最大值
 * @param {string} [props.color='#171717'] - 进度条颜色
 * @param {string} [props.className] - 额外的 CSS 类名
 * @param {boolean} [props.showLabel=false] - 是否显示百分比标签
 * @param {string} [props.size='md'] - 进度条大小 (sm/md/lg)
 * @param {boolean} [props.animated=false] - value 是否已由外部逐帧动画驱动；为 true 时关闭 CSS 过渡避免滞后
 */
const ProgressBar = ({
  value = 0,
  max = 100,
  color = '#171717',
  className = '',
  showLabel = false,
  size = 'md',
  animated = false
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizes = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2.5'
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`h-full rounded-full ${animated ? '' : 'transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]'}`}
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 mt-1.5 block numeric">{Math.round(percentage)}%</span>
      )}
    </div>
  );
};

export default ProgressBar;
