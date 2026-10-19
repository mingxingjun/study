import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Upload, BookOpen, BookMarked, BookX, Clock, Settings,
  Menu, X, ArrowUpRight
} from 'lucide-react';
import { useStudyContext } from '../../context/StudyContext';

/**
 * 侧边栏导航 — "SIGNAL" 设计系统
 * 深墨底色 + 编号索引 + 信号橙激活块；移动端折叠为顶部栏 + 抽屉
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
  const { state } = useStudyContext();
  const isDemoMode = state.mode === 'demo';
  const location = useLocation();

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="flex h-full flex-col bg-[#0b0a08] text-white">
      {/* 品牌 */}
      <NavLink
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-3 px-6 pb-6 pt-7"
      >
        <span className="flex h-10 w-10 items-center justify-center bg-accent font-serif text-xl leading-none text-black">
          复
        </span>
        <span className="min-w-0">
          <span className="block font-serif text-[19px] leading-tight tracking-tight text-white">
            复习搭子
          </span>
          <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
            Study Buddy / 1.0
          </span>
        </span>
      </NavLink>

      <div className="mx-6 h-px bg-white/10" />

      {/* 导航 */}
      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onNavigate}
              className={`group flex items-center gap-3 border-l-2 px-3 py-2.5 ${
                active
                  ? 'border-accent bg-accent text-black'
                  : 'border-transparent text-white/60 hover:border-white/20 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span
                className={`font-mono text-[10px] tabular-nums ${
                  active ? 'text-black/55' : 'text-white/30 group-hover:text-white/50'
                }`}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
              <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.4 : 2} />
              <span className="text-[13px] font-semibold tracking-wide">{item.label}</span>
              <span
                className={`ml-auto font-mono text-[8px] uppercase tracking-[0.18em] ${
                  active ? 'text-black/45' : 'text-white/0 group-hover:text-white/30'
                }`}
              >
                {item.en}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* 模式 + 页脚 */}
      <div className="space-y-3 px-3 pb-5 pt-4">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className="block border border-white/15 p-3 transition-colors hover:border-accent"
        >
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              <span className="h-1.5 w-1.5 bg-accent" />
              {isDemoMode ? 'Demo Mode' : 'Live Mode'}
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-white/35" />
          </span>
          <span className="mt-2 block text-[11px] leading-relaxed text-white/45">
            {isDemoMode ? '本地示例数据 · 无需配置 AI' : '真实 AI 接口 · 数据仅存本地'}
          </span>
        </NavLink>

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

  // 路由切换时收起移动端抽屉
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // 抽屉打开时锁定页面滚动
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
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
      <header className="fixed inset-x-0 top-0 z-[100] flex h-16 items-center justify-between border-b-2 border-black bg-[#0b0a08] px-4 text-white lg:hidden">
        <NavLink to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center bg-accent font-serif text-base text-black">
            复
          </span>
          <span className="font-serif text-base tracking-tight">复习搭子</span>
        </NavLink>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            {activeItem ? activeItem.en : ''}
          </span>
          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label={isMenuOpen ? '关闭菜单' : '打开菜单'}
            aria-expanded={isMenuOpen}
            className="flex h-9 w-9 items-center justify-center border border-white/25 text-white"
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
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 left-0 w-[280px] border-r-2 border-black shadow-xl">
            <SidebarBody onNavigate={() => setIsMenuOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
