import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Upload, BookOpen, BookMarked, BookX, Clock, Settings,
  Menu, X, ArrowUpRight
} from 'lucide-react';
import BrandMark from '../ui/BrandMark';
import { prefetchRoute } from '../../router/pages';
/**
 * 侧边栏导航 — "SIGNAL" 设计系统
 * 深海军蓝底色 + 编号索引 + 雾蓝激活块；移动端折叠为顶部栏 + 抽屉
 */
const NAV_ITEMS = [
  { path: '/', label: '仪表盘', en: 'Dashboard', icon: LayoutDashboard },
  { path: '/upload', label: '上传资料', en: 'Upload', icon: Upload },
  { path: '/quiz', label: '开始刷题', en: 'Quiz', icon: BookOpen },
  { path: '/question-bank', label: '题库管理', en: 'Library', icon: BookMarked },
  { path: '/wrong-book', label: '错题本', en: 'Mistakes', icon: BookX },
  { path: '/supervise', label: '督学中心', en: 'Focus', icon: Clock },
  { path: '/settings', label: '设置', en: 'Settings', icon: Settings }
];

const SidebarBody = ({ onNavigate }) => {
  const location = useLocation();

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="flex h-full flex-col bg-[#0d2349] text-white">
      {/* 品牌 */}
      <NavLink
        to="/"
        onClick={onNavigate}
        className="brand-enter group flex items-center gap-3 px-6 pb-6 pt-7"
      >
        <BrandMark className="brand-enter h-10 w-10 ring-1 ring-white/10 transition-transform duration-150 group-hover:-translate-y-0.5" />
        <span className="min-w-0">
          <span className="block font-serif text-[19px] leading-tight tracking-tight text-white">
            折角
          </span>
          <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
            Dog-ear / 1.0
          </span>
        </span>
      </NavLink>

      <div className="mx-6 h-px bg-white/10" />

      {/* 导航 */}
      <nav className="scrollbar-dark mt-4 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        <p className="px-3 pb-2 pt-2 font-mono text-[9px] uppercase tracking-[0.24em] text-white/25">
          导航 · Navigation
        </p>
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onNavigate}
              // 悬停 / 键盘聚焦时提前下载该页面的代码，点击后无需等待
              onMouseEnter={() => prefetchRoute(item.path)}
              onFocus={() => prefetchRoute(item.path)}
              style={{ '--i': idx }}
              className={`nav-enter group flex min-h-[44px] items-center gap-3 border-l-2 px-3 py-2.5 transition-colors duration-150 ${
                active
                  ? 'border-[#bdcddc] bg-[#bdcddc] text-[#0d2349]'
                  : 'border-transparent text-white/60 hover:border-white/25 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span
                className={`w-5 font-mono text-[10px] tabular-nums ${
                  active ? 'text-[#0d2349]/55' : 'text-white/30 group-hover:text-white/50'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
              <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.4 : 2} />
              <span className="text-[13px] font-semibold tracking-wide">{item.label}</span>
              <span
                className={`ml-auto max-w-[72px] truncate font-mono text-[8px] uppercase tracking-[0.18em] ${
                  active ? 'text-[#0d2349]/45' : 'text-white/0 group-hover:text-white/35'
                }`}
              >
                {item.en}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* 使用手册 + 页脚 */}
      <div className="space-y-3 border-t border-white/10 px-3 pb-5 pt-4">
        <NavLink
          to="/manual"
          onClick={onNavigate}
          onMouseEnter={() => prefetchRoute('/manual')}
          onFocus={() => prefetchRoute('/manual')}
          style={{ '--i': 7 }}
          className="nav-enter group block border border-white/15 p-3 transition-colors duration-150 hover:border-[#bdcddc] hover:bg-white/[0.04]"
        >
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#bdcddc]">
              <BookOpen className="h-3 w-3" />
              Guide & Demo
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-white/35 transition-transform duration-150 group-hover:-translate-y-0.5" />
          </span>
          <span className="mt-2 block text-[11px] leading-relaxed text-white/45">
            使用手册 · 效果展示 · 载入示例
          </span>
        </NavLink>

        <p className="px-1 text-[10px] leading-relaxed tracking-[0.08em] text-white/35">
          从折角处，继续读下去
        </p>

        <p className="px-1 font-mono text-[9px] uppercase leading-relaxed tracking-[0.18em] text-white/25">
          Local-first · No cloud sync
        </p>
      </div>
    </div>
  );
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // 路由切换时收起抽屉
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // 抽屉打开时锁定滚动，并支持 Esc 关闭
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMenuOpen]);

  const activeItem = NAV_ITEMS.find((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  );

  return (
    <>
      {/* 桌面侧边栏 */}
      <aside className="fixed inset-y-0 left-0 z-[100] hidden w-[264px] border-r-2 border-black lg:block">
        <SidebarBody />
      </aside>

      {/* 移动端顶栏 */}
      <header className="fixed inset-x-0 top-0 z-[100] flex h-16 items-center justify-between border-b-2 border-black bg-[#0d2349] px-4 text-white lg:hidden">
        <NavLink to="/" className="flex min-w-0 items-center gap-2.5">
          <BrandMark className="h-8 w-8" />
          <span className="truncate font-serif text-base tracking-tight">折角</span>
        </NavLink>
        <div className="flex shrink-0 items-center gap-3">
          <span className="max-w-[84px] truncate font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            {activeItem ? activeItem.en : ''}
          </span>
          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label={isMenuOpen ? '关闭菜单' : '打开菜单'}
            aria-expanded={isMenuOpen}
            className="tap-44 flex items-center justify-center border border-white/25 text-white transition-colors duration-150 hover:border-accent hover:text-accent"
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* 移动端抽屉 */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <button
            type="button"
            aria-label="关闭菜单"
            onClick={() => setIsMenuOpen(false)}
            className="drawer-overlay absolute inset-0 bg-black/65"
          />
          <div className="drawer-panel absolute inset-y-0 left-0 w-[280px] border-r-2 border-black shadow-xl">
            <SidebarBody onNavigate={() => setIsMenuOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
