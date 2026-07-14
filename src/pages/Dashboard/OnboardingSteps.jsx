import { useNavigate } from 'react-router-dom';
import { Upload, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

/**
 * 首次使用三步引导卡片组
 * 在无资料、无题库时展示，帮助用户快速理解核心流程
 */
const OnboardingSteps = () => {
  const navigate = useNavigate();

  const steps = [
    {
      id: 'upload',
      index: '01',
      title: '上传学习资料',
      description: '支持 PDF / Word / TXT，导入你的教材、笔记或讲义',
      icon: Upload
    },
    {
      id: 'parse',
      index: '02',
      title: 'AI 解析并生成题库',
      description: '自动提取知识点，生成专属选择题、填空题与解析',
      icon: Sparkles
    },
    {
      id: 'practice',
      index: '03',
      title: '刷题、AI 评分、错题复习',
      description: '智能评估掌握度，自动收录错题并按遗忘曲线复习',
      icon: BookOpen,
      isLast: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        return (
          <Card
            key={step.id}
            className="p-6 sm:p-8 card-hover stagger-item relative"
          >
            <span className="absolute top-4 right-4 font-mono text-xs font-medium text-gray-400 tracking-wider">
              {step.index}
            </span>

            <div className="w-11 h-11 bg-accent/10 rounded-xl flex items-center justify-center mb-4 border border-accent/20">
              <Icon className="w-5 h-5 text-accent" />
            </div>

            <h3 className="text-lg font-semibold text-primary mb-2">
              {step.title}
            </h3>

            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              {step.description}
            </p>

            {step.isLast ? (
              <Button className="w-full" onClick={() => navigate('/upload')}>
                上传我的资料
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-6 h-px bg-gray-200" />
                <span>步骤 {idx + 1}</span>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default OnboardingSteps;
