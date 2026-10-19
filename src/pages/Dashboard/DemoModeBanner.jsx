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
    <Card className="stripe-panel relative overflow-hidden border-accent/30 bg-[#fff6f0] p-5 sm:p-6" elevated>
      <div className="relative flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center border-2 border-primary bg-primary">
          <Cpu className="h-5 w-5 text-accent" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-accent-dark">
            Demo Mode
          </p>
          <h3 className="mb-2 font-serif text-base text-primary">
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
