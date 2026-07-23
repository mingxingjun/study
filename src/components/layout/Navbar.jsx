import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Upload, BookOpen, BookMarked, BookX, Clock, Settings, Menu, X, Info } from 'lucide-react';
import { useStudyContext } from '../../context/StudyContext';

/**
 * 顶部导航栏 - Refined Editorial Minimalism
 * 极简浮动导航 + 衬线品牌字 + 金色激活态 + 滚动阴影
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { state } = useStudyContext();
  const isDemoMode = state.mode === 'demo';

  // 滚动时增强阴影
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { path: '/', label: '仪表盘', icon: LayoutDashboard },
    { path: '/upload', label: '上传资料', icon: Upload },
    { path: '/quiz', label: '开始刷题', icon: BookOpen },
    { path: '/question-bank', label: '题库管理', icon: BookMarked },
    { path: '/wrong-book', label: '错题本', icon: BookX },
    { path: '/supervise', label: '督学中心', icon: Clock },
    { path: '/settings', label: '设置', icon: Settings },
  ];

  return (
    <nav
      className={`sticky top-0 z-[100] bg-white/85 backdrop-blur-xl border-b transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        scrolled
          ? 'border-gray-200/80 shadow-sm'
          : 'border-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        {/* Logo 区域 - 衬线品牌字 + 金色小点 */}
        <NavLink to="/" className="flex items-center gap-3 group" onClick={() => setIsMenuOpen(false)}>
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <BookOpen className="w-[18px] h-[18px] text-white" strokeWidth={2} />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent ring-2 ring-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl text-primary tracking-tight" style={{ fontWeight: 500, letterSpacing: '-0.02em' }}>
              复习搭子
            </span>
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] hidden sm:inline">
              v1.0
            </span>
          </div>
        </NavLink>

        {/* 桌面端导航项 - 胶囊式容器 + 金色激活态 */}
        <div className="hidden lg:flex items-center gap-0.5 bg-white/60 rounded-full p-1 border border-gray-200/60 shadow-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 xl:px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 cursor-pointer select-none whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-primary hover:bg-gray-100/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-[14px] h-[14px] flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                    <span className="hidden xl:inline">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* 当前模式徽章 - 金色精致标签 */}
        <div className="relative group hidden sm:block">
          <span
            tabIndex={0}
            aria-describedby="mode-tooltip"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-accent/8 text-accent-dark border border-accent/25 transition-all duration-200 cursor-default hover:border-accent/40 hover:bg-accent/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            {isDemoMode ? 'Demo' : 'Live'}
            <Info className="w-3 h-3 opacity-60" />
          </span>
          <div
            id="mode-tooltip"
            role="tooltip"
            className="absolute top-full right-0 mt-2 w-64 p-4 bg-white rounded-2xl border border-gray-200/80 shadow-lg text-xs text-gray-600 leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50"
          >
            <div className="font-serif font-medium text-primary mb-1.5 text-sm">
              {isDemoMode ? '演示模式' : '正式模式'}
            </div>
            {isDemoMode
              ? '使用本地示例题库模拟完整流程，无需配置 AI。'
              : '需配置 AI 并调用真实 API，所有数据保存在本地。'}
          </div>
        </div>

        {/* 移动端菜单按钮 */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-primary hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label={isMenuOpen ? '关闭菜单' : '打开菜单'}
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 移动端下拉菜单 */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-200/80 bg-white/95 backdrop-blur-xl max-h-[70vh] overflow-y-auto shadow-lg animate-fade-in">
          <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
