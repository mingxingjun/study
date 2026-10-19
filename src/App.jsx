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
import useReducedMotion from './hooks/useReducedMotion';

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
      y: [14, 0],
      duration: 420,
      ease: 'outCubic',
      onComplete: () => {
        if (mainRef.current) mainRef.current.style.transform = '';
      }
    });

    return () => anim.revert();
  }, [pathname, reducedMotion]);

  return (
    <main
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
            </Routes>
          </PageTransition>
        </div>
      </div>
    </Router>
  );
}

export default App;
