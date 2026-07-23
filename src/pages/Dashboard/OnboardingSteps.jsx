import { useNavigate } from 'react-router-dom';
import { Upload, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

/**
 * 首次使用三步引导 - 大号衬线编号 + 编辑式排版
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
      title: 'AI 解析生成题库',
      description: '自动提取知识点，生成专属选择题、填空题与解析',
      icon: Sparkles
    },
    {
      id: 'practice',
      index: '03',
      title: '刷题、批改、错题复习',
      description: '智能评估掌握度，自动收录错题并按遗忘曲线复习',
      icon: BookOpen,
      isLast: true
    }
  ];

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-6">
        <h2 className="text-2xl font-serif text-primary" style={{ fontWeight: 400 }}>
          三步开始
        </h2>
        <span className="text-xs font-mono text-gray-400 uppercase tracking-[0.2em]">
          Get Started
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <Card
              key={step.id}
              className="p-7 card-hover stagger-item relative overflow-hidden group"
              elevated
            >
              {/* 大号衬线编号 - 装饰性背景元素 */}
              <span
                className="absolute -top-2 -right-2 font-serif text-7xl text-gray-50 group-hover:text-accent/8 tabular-nums pointer-events-none transition-colors duration-300"
                style={{ fontWeight: 400, letterSpacing: '-0.06em', lineHeight: 1 }}
              >
                {step.index}
              </span>

              <div className="relative">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center mb-5 border border-accent/20">
                  <Icon className="w-4 h-4 text-accent-dark" strokeWidth={2} />
                </div>

                <h3 className="text-lg font-serif text-primary mb-2" style={{ fontWeight: 500 }}>
                  {step.title}
                </h3>

                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  {step.description}
                </p>

                {step.isLast ? (
                  <Button className="w-full" onClick={() => navigate('/upload')}>
                    上传我的资料
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                    <span className="w-5 h-px bg-gray-300" />
                    <span>STEP {idx + 1}</span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingSteps;
