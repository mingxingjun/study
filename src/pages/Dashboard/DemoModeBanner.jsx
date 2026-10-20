import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, X, ArrowRight, Upload } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useStudyContext } from '../../context/StudyContext';

const STORAGE_KEY = 'study-buddy-hide-demo-banner';

/**
 * 示例数据提示横幅
 */
const DemoModeBanner = () => {
  const navigate = useNavigate();
  const { state } = useStudyContext();
  const aiReady = ['quiz-master', 'explainer', 'supervisor'].some((agentId) => {
    const config = state.aiConfig?.[agentId];
    return Boolean(config?.providerId && config?.modelId && config?.apiKey);
  });
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
            Sample Data
          </p>
          <h3 className="mb-2 font-serif text-base text-primary">
            当前为示例数据
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {aiReady
              ? '你的 AI 配置已就绪。上传自己的教材 / 笔记后，示例数据会被正式内容替换，AI 将基于你的资料生成题库。'
              : '你正在使用本地示例题库体验功能。上传自己的教材 / 笔记并配置 AI 后，就能生成专属题库、自动批改与解析。'}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {aiReady ? (
              <Button size="sm" onClick={() => navigate('/upload')}>
                <Upload className="h-3.5 w-3.5" />
                上传我的资料
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate('/settings')}>
                去配置 AI
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              知道了
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
