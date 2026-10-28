import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { Suspense, useEffect, useRef } from 'react';
import { animate, utils } from 'animejs';
import Navbar from './components/layout/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import { pages, prefetchRoutesIdle } from './router/pages';
import useReducedMotion from './hooks/useReducedMotion';

const { '/': Dashboard, '/upload': Upload, '/quiz': Quiz, '/wrong-book': WrongBook,
  '/question-bank': QuestionBank, '/supervise': Supervise, '/settings': Settings,
  '/manual': Manual, '*': NotFound } = pages;

function RouteProgress() {
  const { pathname } = useLocation();
  return <div key={pathname} className="route-progress" aria-hidden="true" />;
}

/**
 * 滚动位置管理
 * 前进/切页 → 回到顶部；浏览器后退 → 还原原来的滚动位置。
 * 之前一律滚到顶部，从长列表返回时要重新往下翻，很打断节奏。
 */
const scrollPositions = new Map();

function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const { pathname, key } = location;

  // 滚动时持续记录当前位置（而不是离开时才读，那时 DOM 可能已经换成新页面）
  useEffect(() => {
    if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    const record = () => scrollPositions.set(key, window.scrollY);
    window.addEventListener('scroll', record, { passive: true });
    return () => window.removeEventListener('scroll', record);
  }, [key]);

  useEffect(() => {
    if (navigationType === 'POP') {
      const saved = scrollPositions.get(key);
      if (typeof saved === 'number') {
        // 等页面内容渲染完成再还原，否则会被截断到当前高度
        requestAnimationFrame(() => window.scrollTo(0, saved));
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, key, navigationType]);

  return null;
}

/**
 * 页面骨架屏：懒加载页面的占位，尺寸与真实内容对齐，避免加载完成时跳动
 */
function RouteSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse">
      <span className="sr-only">页面加载中</span>
      <div className="mb-3 h-3 w-24 bg-primary/10" />
      <div className="mb-9 h-10 w-2/3 max-w-md bg-primary/15" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 border-2 border-primary/10 bg-white/60" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="h-64 border-2 border-primary/10 bg-white/60 lg:col-span-2" />
        <div className="h-64 border-2 border-primary/10 bg-white/60" />
      </div>
    </div>
  );
}

/**
 * 页面切换动画包装器
 * 路由变化时内容区淡入 + 轻微上移，同时保证移动端顶栏留白
 */
function PageTransition({ children }) {
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!mainRef.current) return;

    if (reducedMotion) {
      utils.set(mainRef.current, { opacity: 1, y: 0 });
      return;
    }

    // will-change 只在动画期间存在，结束后立刻移除，避免长期占用合成层
    mainRef.current.style.willChange = 'opacity, transform';

    const anim = animate(mainRef.current, {
      opacity: [0, 1],
      y: [10, 0],
      duration: 320,
      ease: 'outCubic',
      onComplete: () => {
        if (!mainRef.current) return;
        mainRef.current.style.transform = '';
        mainRef.current.style.willChange = '';
      }
    });

    return () => anim.revert();
  }, [pathname, reducedMotion]);

  return (
    <main
      id="main"
      tabIndex={-1}
      ref={mainRef}
      className="mx-auto w-full max-w-[1440px] px-5 pb-24 pt-24 sm:px-8 lg:px-14 lg:pt-14"
    >
      <Suspense fallback={<RouteSkeleton />}>{children}</Suspense>
    </main>
  );
}

function App() {
  // 首屏渲染完成、浏览器空闲时预取最常用页面，让后续导航接近瞬时
  useEffect(() => {
    prefetchRoutesIdle(['/quiz', '/upload']);
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-transparent">
        <a href="#main" className="skip-link">跳到主要内容</a>
        <RouteProgress />
        <Navbar />
        <div className="lg:pl-[264px]">
          <ErrorBoundary>
            <PageTransition>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/question-bank" element={<QuestionBank />} />
                <Route path="/wrong-book" element={<WrongBook />} />
                <Route path="/supervise" element={<Supervise />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/manual" element={<Manual />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTransition>
          </ErrorBoundary>
        </div>
      </div>
    </Router>
  );
}

export default App;