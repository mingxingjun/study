import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import usePageTitle from '../hooks/usePageTitle';

/**
 * 404 — 走错的页面
 * 保持 SIGNAL 的硬边排版：超大 404 + 信号橙定位块 + mono 路径信息
 */
const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  usePageTitle('页面不存在');

  return (
    <div className="relative flex min-h-[62vh] flex-col justify-center py-8">
      <p className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-gray-400">
        <span className="h-2 w-2 bg-accent" />
        Error 404 · Page Not Found
      </p>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <h1 className="leading-[0.82] tracking-[-0.05em]">
          4<span className="text-accent">0</span>4
        </h1>
        <div className="mb-2 max-w-md">
          <h2 className="mb-2 text-2xl text-primary">这个页面不存在</h2>
          <p className="text-sm leading-relaxed text-gray-500">
            链接可能已经失效，或者地址拼错了。回到仪表盘继续复习吧。
          </p>
        </div>
      </div>

      <div className="mt-8 border-y-2 border-primary py-4">
        <p className="break-all font-mono text-[11px] uppercase tracking-[0.12em] text-gray-400">
          Requested · {location.pathname}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => navigate('/')} size="lg">
          <Home className="h-4 w-4" />
          回到仪表盘
        </Button>
        <Button variant="secondary" size="lg" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          返回上一页
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
