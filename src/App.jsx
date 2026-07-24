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
 * 在路由变化时为 main 内容区添加淡入/上滑进入动画
 * 使用 anime.js v4 实现，cleanup 时 revert 避免动画叠加
 */
function PageTransition({ children }) {
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!mainRef.current) return;

    // 降级：用户偏好减少动画，直接显示终态
    if (reducedMotion) {
      utils.set(mainRef.current, { opacity: 1, y: 0 });
      return;
    }

    // fromTo 用数组 [from, to] 实现；duration 单位毫秒
    const anim = animate(mainRef.current, {
      opacity: [0, 1],
      y: [16, 0],
      duration: 450,
      ease: 'outCubic',
      onComplete: () => {
        // 清理 transform 内联样式，避免影响后续布局
        if (mainRef.current) mainRef.current.style.transform = '';
      }
    });

    return () => anim.revert();
  }, [pathname, reducedMotion]);

  return (
    <main
      ref={mainRef}
      className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 pt-12 pb-20"
    >
      {children}
    </main>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-gray-50">
        <Navbar />
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
    </Router>
  );
}

export default App;
