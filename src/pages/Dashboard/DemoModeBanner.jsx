import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, X, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const STORAGE_KEY = 'study-buddy-hide-demo-banner';

/**
 * 演示模式提示横幅 - 金色渐变 + 衬线标题
 */
const DemoModeBanner = () => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  };

  return (
    <Card className="bg-gradient-to-r from-accent/8 via-accent/4 to-transparent border-accent/25 relative overflow-hidden" elevated>
      {/* 装饰性光晕 */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-accent/8 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start gap-4 relative">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
          <Cpu className="w-5 h-5 text-accent" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent-dark mb-1">
            Demo Mode
          </p>
          <h3 className="text-base font-serif text-primary mb-2" style={{ fontWeight: 500 }}>
            当前为演示模式
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            你正在使用本地示例题库体验功能。配置 AI 并上传自己的教材 / 笔记后，即可使用正式模式，让 AI 为你生成专属题库、自动批改与解析。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={() => navigate('/settings')}>
              去配置 AI
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              暂不开启
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
          aria-label="关闭提示"
        >
          <X size={16} />
        </button>
      </div>
    </Card>
  );
};

export default DemoModeBanner;
