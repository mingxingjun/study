import { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Play, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import AgentsPanel from '../../components/agents/AgentsPanel';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import SectionTitle from '../../components/ui/SectionTitle';
import { useStudyContext } from '../../context/StudyContext';
import useAgents from '../../hooks/useAgents';
import usePageTitle from '../../hooks/usePageTitle';
import useStaggerAnimation from '../../hooks/useStaggerAnimation';
import { getToday } from '../../utils/date';
import { sampleKnowledgePoints } from '../../mock/sampleData';
import TodayTasks from './TodayTasks';
import DashboardStats from './DashboardStats';
import WeakPointsChart from './WeakPointsChart';
import QuickActions from './QuickActions';
import OnboardingSteps from './OnboardingSteps';
import MasteryCard from './MasteryCard';
import DemoModeBanner from './DemoModeBanner';

/**
 * 仪表盘首页 - Refined Editorial Minimalism
 * 衬线大标题 + 金色精致点缀 + 编辑式分区
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { state, loadDemoData, dueReviewQuestions } = useStudyContext();
  const { agents, thinkAndSay } = useAgents();
  const greetSent = useRef(false);
  const pageRef = useStaggerAnimation([], '.stagger-item');

  usePageTitle('仪表盘');

  const { materials, plan, stats, questions, answerRecords, isDemo } = state;
  const hasData = materials && materials.length > 0;
  const isNewUser = !hasData && !isDemo && answerRecords.length === 0;
  const showOnboarding = materials.length === 0 && questions.length === 0;

  const knowledgePoints = useMemo(() => {
    if (plan && plan.knowledgePoints) {
      return plan.knowledgePoints;
    }
    return sampleKnowledgePoints;
  }, [plan]);

  const todayTasks = useMemo(() => {
    if (!hasData && !isDemo) return [];
    const today = getToday();
    const todayRecords = answerRecords.filter(r => r.date === today);
    const recordsByKp = {};
    todayRecords.forEach(r => {
      if (!recordsByKp[r.knowledgePointId]) {
        recordsByKp[r.knowledgePointId] = 0;
      }
      recordsByKp[r.knowledgePointId]++;
    });
    return knowledgePoints
      .filter(kp => (kp.mastery || 0) < 80)
      .slice(0, 3)
      .map(kp => ({
        id: kp.id,
        name: kp.name,
        targetCount: 5,
        completedCount: recordsByKp[kp.id] || 0
      }));
  }, [hasData, isDemo, knowledgePoints, answerRecords]);

  const weakPoints = useMemo(() => {
    if (answerRecords.length === 0) return [];
    const recordsByKp = {};
    answerRecords.forEach(r => {
      if (!recordsByKp[r.knowledgePointId]) {
        recordsByKp[r.knowledgePointId] = { total: 0, wrong: 0 };
      }
      recordsByKp[r.knowledgePointId].total++;
      if (!r.isCorrect) {
        recordsByKp[r.knowledgePointId].wrong++;
      }
    });
    const kpMap = new Map();
    knowledgePoints.forEach(kp => kpMap.set(kp.id, kp));
    return Object.entries(recordsByKp)
      .map(([kpId, data]) => {
        const kp = kpMap.get(kpId);
        if (!kp) return null;
        return {
          id: kpId,
          name: kp.name,
          errorRate: data.total > 0 ? Math.round((data.wrong / data.total) * 100) : 0
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 6);
  }, [answerRecords, knowledgePoints]);

  const formatDate = () => {
    const now = new Date();
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekDay = weekDays[now.getDay()];
    return `${month}月${day}日 ${weekDay}`;
  };

  const handleLoadDemo = async () => {
    loadDemoData();
  };

  useEffect(() => {
    if (greetSent.current) return;
    greetSent.current = true;
    const timer = setTimeout(async () => {
      if (isNewUser) {
        await thinkAndSay('quiz-master', '你好！欢迎使用折角，我是出题官', 800);
        await thinkAndSay('explainer', '我是讲解师，有不会的题目我来帮你分析！', 800);
        await thinkAndSay('supervisor', '我是督学员，会帮你制定计划、监督学习哦！', 800);
      } else if (isDemo) {
        await thinkAndSay('quiz-master', '欢迎体验示例数据！来试试刷题功能吧！', 800);
      } else {
        await thinkAndSay('quiz-master', '欢迎回来！今天准备好开始学习了吗？', 800);
        await thinkAndSay('explainer', '遇到不会的题目随时问我，我会为你详细解析。', 1000);
        await thinkAndSay('supervisor', '今天也要保持专注，记得劳逸结合哦！', 800);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [thinkAndSay, isNewUser, isDemo]);

  // 新用户引导视图
  if (showOnboarding) {
    return (
      <div ref={pageRef} className="max-w-5xl mx-auto">
        {/* 标题区 - 大号展示字 + mono 日期 */}
        <div className="mb-10 stagger-item">
          <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-gray-400">
            <span className="h-1.5 w-1.5 bg-accent" />
            {formatDate()}
          </p>
          <h1 className="mb-3 text-primary">
            你好，欢迎使用
            <span className="text-accent">折角</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-gray-500">
            从折角处，继续读下去 — 上传你的教材与笔记，AI 自动生成专属复习题库。
          </p>
        </div>

        {/* 主 CTA 卡片 - 硬边面板 + 斜纹装饰 */}
        <Card className="relative mb-10 overflow-hidden p-8 sm:p-14 stagger-item" elevated>
          <div className="stripe-panel pointer-events-none absolute right-0 top-0 h-full w-48 opacity-70" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-accent" />

          <div className="relative mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center border-2 border-primary bg-primary">
              <Sparkles className="h-7 w-7 text-accent-light" strokeWidth={1.5} />
            </div>

            <h2 className="mb-4 text-3xl text-primary md:text-4xl">
              让 AI 成为你的
              <span className="gold-underline mx-1">私人助教</span>
            </h2>
            <p className="mb-10 text-base leading-relaxed text-gray-500">
              上传教材 / 笔记，自动生成专属题库、智能批改、错题复习
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={() => navigate('/upload')}>
                <Upload className="h-4 w-4" />
                上传我的资料
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="lg" onClick={handleLoadDemo}>
                <Play className="h-4 w-4" />
                载入示例数据
              </Button>
            </div>
          </div>
        </Card>

        {state.mode === 'demo' && (
          <div className="mb-10 stagger-item">
            <DemoModeBanner />
          </div>
        )}

        <div className="mb-12 stagger-item">
          <OnboardingSteps />
        </div>

        <div className="stagger-item">
          <AgentsPanel agents={agents} />
        </div>
      </div>
    );
  }

  // 主仪表盘视图
  return (
    <div ref={pageRef}>
      {isDemo && (
        <div className="mb-10 stagger-item">
          <DemoModeBanner />
        </div>
      )}

      {/* 标题区 - 大号展示字 + mono 日期 */}
      <div className="mb-10 stagger-item">
        <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-gray-400">
          <span className="h-1.5 w-1.5 bg-accent" />
          {formatDate()}
        </p>
        <h1 className="mb-3 text-primary">
          {isDemo ? '示例数据' : '你好，欢迎回来'}
          <span className="text-accent">.</span>
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-gray-500">
          从折角处，继续读下去 — 上传教材 / 笔记，AI 自动生成专属复习题库
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* 左侧主内容 */}
        <div className="space-y-10 lg:col-span-8">
          {/* 学习概览 */}
          <div className="stagger-item">
            <SectionTitle title="学习概览" subtitle="Overview" />
            <DashboardStats stats={stats} questionsCount={questions.length} />
          </div>

          {/* 今日任务 */}
          <div className="stagger-item">
            <SectionTitle title="今日任务" subtitle="Today's Tasks" />
            <TodayTasks todayTasks={todayTasks} hasMaterials={hasData || isDemo} />
          </div>

          {/* 薄弱知识点 */}
          <div className="stagger-item">
            <SectionTitle title="薄弱知识点" subtitle="Weak Points" />
            <WeakPointsChart weakPoints={weakPoints} />
          </div>
        </div>

        {/* 右侧边栏 */}
        <div className="space-y-6 lg:col-span-4">
          <div className="stagger-item">
            <MasteryCard answerRecords={answerRecords} />
          </div>

          {/* 今日待复习 - 雾蓝强调卡片 */}
          <div className="stagger-item">
            <Card className="card-hover relative overflow-hidden border-primary/20 bg-[#e9f0f6] p-6" elevated>
              <span className="absolute left-0 top-0 h-1 w-full bg-primary" />
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-accent-dark">
                    Due Today
                  </p>
                  <h3 className="text-base font-serif text-primary">
                    今日待复习
                  </h3>
                  <p className="mt-1 font-mono text-[11px] text-gray-500">艾宾浩斯遗忘曲线</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center border-2 border-primary bg-accent-light">
                  <RefreshCw className="h-4 w-4 text-primary" strokeWidth={2.4} />
                </div>
              </div>
              <div className="mb-6 flex items-baseline gap-2">
                <span className="font-serif text-[56px] leading-none text-primary tabular-nums">
                  {dueReviewQuestions.length}
                </span>
                <span className="text-sm text-gray-500">道错题到期</span>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate('/wrong-book')}
                disabled={dueReviewQuestions.length === 0}
              >
                去错题本复习
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>
          </div>

          <div className="stagger-item">
            <QuickActions />
          </div>

          <div className="stagger-item">
            <AgentsPanel agents={agents} compact />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
