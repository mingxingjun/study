/**
 * 折角 / Dog-ear 品牌标记
 * 灵感：读到一半的书页，把右上角折下来；下一页从折角处继续。
 */
const BrandMark = ({ className = '' }) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center bg-accent ${className}`}
    aria-hidden="true"
  >
    <svg viewBox="0 0 40 40" className="h-full w-full">
      <rect width="40" height="40" fill="#ff4d00" />
      {/* 书页 */}
      <path d="M9 6h16l7 7v21H9z" fill="#f4f1e8" />
      {/* 折下来的右上角 */}
      <path d="M25 6l7 7h-7z" fill="#0b0a08" />
      {/* 页面上未读完的三行 */}
      <path
        d="M14 20h12M14 25h14M14 30h9"
        stroke="#0b0a08"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  </span>
);

export default BrandMark;
