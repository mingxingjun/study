import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Upload, BookOpen, BookMarked, BookX, Clock, Settings, Menu, X, Info } from 'lucide-react';
import { useStudyContext } from '../../context/StudyContext';

/**
 * 顶部导航栏
 * 扁平设计 + 浮动式导航容器，大量留白，移动端可折叠
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { state } = useStudyContext();
  const isDemoMode = state.mode === 'demo';

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
    <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
        {/* Logo 区域 */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-[18px] h-[18px] text-white" strokeWidth={2} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold text-primary tracking-tight">复习搭子</span>
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest hidden sm:inline">v1.0</span>
          </div>
        </div>

        {/* 桌面端导航项 */}
        <div className="hidden lg:flex items-center gap-1 bg-gray-100 rounded-xl p-1 border border-gray-200/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 xl:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer select-none whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:text-primary hover:bg-gray-200/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                    <span className="hidden xl:inline">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* 当前模式徽章 */}
        <div className="relative group">
          <span
            tabIndex={0}
            aria-describedby="mode-tooltip"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-primary border border-accent/20 transition-colors duration-150 cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {isDemoMode ? '演示模式' : '正式模式'}
            <Info className="w-3 h-3 text-accent" />
          </span>
          <div
            id="mode-tooltip"
            role="tooltip"
            className="absolute top-full right-0 mt-2 w-56 p-3 bg-white rounded-xl border border-gray-200 shadow-lg text-xs text-gray-600 leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-150 z-50"
          >
            演示模式使用本地示例题库模拟完整流程；正式模式需配置 AI 并调用真实 API。
          </div>
        </div>

        {/* 移动端菜单按钮 */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label={isMenuOpen ? '关闭菜单' : '打开菜单'}
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 移动端下拉菜单 */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm max-h-[70vh] overflow-y-auto shadow-lg">
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer ${
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
