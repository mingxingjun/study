import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { animate, utils } from 'animejs';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Quiz from './pages/Quiz';
import WrongBook from './pages/WrongBook';
import QuestionBank from './pages/QuestionBank';
import Supervise from './pages/Supervise';
import Settings from './pages/Settings';
import Manual from './pages/Manual';
import NotFound from './pages/NotFound';
import useReducedMotion from './hooks/useReducedMotion';

function RouteProgress() {
  const { pathname } = useLocation();
  return <div key={pathname} className="route-progress" aria-hidden="true" />;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
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

    const anim = animate(mainRef.current, {
      opacity: [0, 1],
      y: [10, 0],
      duration: 320,
      ease: 'outCubic',
      onComplete: () => {
        if (mainRef.current) mainRef.current.style.transform = '';
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
      {children}
    </main>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-transparent">
        <a href="#main" className="skip-link">跳到主要内容</a>
        <RouteProgress />
        <Navbar />
        <div className="lg:pl-[264px]">
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
        </div>
      </div>
    </Router>
  );
}

export default App;
