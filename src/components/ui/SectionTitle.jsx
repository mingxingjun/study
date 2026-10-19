/**
 * 区块标题 — "SIGNAL" 设计系统统一版式
 * 信号橙定位块 + 超粗中文标题 + mono 英文副标 + 墨线延伸
 * @param {Object} props
 * @param {string} props.title - 中文标题
 * @param {string} [props.subtitle] - 英文副标
 * @param {React.ReactNode} [props.action] - 右侧操作区
 * @param {React.ReactNode} [props.count] - 可选计数（如资料数量）
 * @param {string} [props.className] - 额外类名
 */
const SectionTitle = ({ title, subtitle, action, count, className = '' }) => (
  <div className={`mb-5 flex flex-wrap items-center gap-3 ${className}`}>
    <span className="h-2.5 w-2.5 shrink-0 bg-accent" />
    <h2 className="font-serif text-[22px] leading-none text-primary">{title}</h2>
    {subtitle && (
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
        {subtitle}
      </span>
    )}
    {count !== undefined && (
      <span className="font-mono text-[11px] tabular-nums text-accent-dark">{count}</span>
    )}
    <span className="ml-1 h-px flex-1 bg-primary/15" />
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default SectionTitle;
