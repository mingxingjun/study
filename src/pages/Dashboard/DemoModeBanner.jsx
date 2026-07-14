import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const STORAGE_KEY = 'study-buddy-hide-demo-banner';

/**
 * 演示模式提示横幅
 * 引导用户配置 AI，切换到正式模式
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
    <Card className="mb-8 bg-gradient-to-r from-primary/5 to-accent/10 border-primary/20 card-hover">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            当前为演示模式
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            你正在使用本地示例题库体验功能。配置 AI 并上传自己的教材 / 笔记后，即可使用正式模式，让 AI 为你生成专属题库、自动批改与解析。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={() => navigate('/settings')}>
              去配置 AI，开启正式模式
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              暂不开启
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          aria-label="关闭提示"
        >
          <X size={18} />
        </button>
      </div>
    </Card>
  );
};

export default DemoModeBanner;
