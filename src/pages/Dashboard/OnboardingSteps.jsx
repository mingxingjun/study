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
      <div className="mb-5 flex items-center gap-3">
        <span className="h-2.5 w-2.5 shrink-0 bg-accent" />
        <h2 className="font-serif text-[22px] leading-none text-primary">三步开始</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
          Get Started
        </span>
        <span className="ml-2 h-px flex-1 bg-primary/15" />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <Card
              key={step.id}
              className="card-hover group relative overflow-hidden p-6 stagger-item"
              elevated
            >
              {/* 大号展示编号 - 装饰性背景元素 */}
              <span className="pointer-events-none absolute -right-2 -top-3 font-serif text-7xl tabular-nums text-gray-200 transition-colors duration-200 group-hover:text-accent/25">
                {step.index}
              </span>

              <div className="relative">
                <div className="mb-5 flex h-10 w-10 items-center justify-center border-2 border-accent/25 bg-accent/10">
                  <Icon className="h-4 w-4 text-accent-dark" strokeWidth={2} />
                </div>

                <h3 className="mb-2 font-serif text-lg text-primary">
                  {step.title}
                </h3>

                <p className="mb-6 text-sm leading-relaxed text-gray-500">
                  {step.description}
                </p>

                {step.isLast ? (
                  <Button className="w-full" onClick={() => navigate('/upload')}>
                    上传我的资料
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 font-mono text-[11px] text-gray-400">
                    <span className="h-px w-5 bg-gray-300" />
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
