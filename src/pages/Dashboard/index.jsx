import { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Play, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import AgentsPanel from '../../components/agents/AgentsPanel';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
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
        await thinkAndSay('quiz-master', '你好！欢迎使用复习搭子，我是出题官', 800);
        await thinkAndSay('explainer', '我是讲解师，有不会的题目我来帮你分析！', 800);
        await thinkAndSay('supervisor', '我是督学员，会帮你制定计划、监督学习哦！', 800);
      } else if (isDemo) {
        await thinkAndSay('quiz-master', '欢迎体验演示模式！来试试刷题功能吧！', 800);
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
        {/* 标题区 - 衬线大字 + mono 日期 */}
        <div className="mb-16 stagger-item">
          <p className="text-xs font-mono text-gray-400 uppercase tracking-[0.25em] mb-3">
            {formatDate()}
          </p>
          <h1 className="text-4xl md:text-5xl text-primary mb-3" style={{ fontWeight: 400, lineHeight: 1.1 }}>
            你好，欢迎使用
            <span className="text-accent-dark">复习搭子</span>
          </h1>
          <p className="text-gray-500 text-base max-w-xl leading-relaxed">
            不只是通用题库 — 上传你的教材与笔记，AI 自动生成专属复习题库。
          </p>
        </div>

        {/* 主 CTA 卡片 - 大留白 + 居中 */}
        <Card className="p-10 sm:p-16 mb-12 stagger-item relative overflow-hidden" elevated>
          {/* 装饰性金色光晕 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/3 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto relative">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-7 shadow-md">
              <Sparkles className="w-7 h-7 text-accent" strokeWidth={1.5} />
            </div>

            <h2 className="text-3xl md:text-4xl text-primary mb-4" style={{ fontWeight: 400 }}>
              让 AI 成为你的
              <span className="gold-underline mx-1">私人助教</span>
            </h2>
            <p className="text-gray-500 mb-10 leading-relaxed text-base">
              上传教材 / 笔记，自动生成专属题库、智能批改、错题复习
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate('/upload')}>
                <Upload className="w-4 h-4" />
                上传我的资料
                <ArrowRight className="w-4 h-4" />
              </Button>
              {state.mode === 'demo' && (
                <Button variant="secondary" size="lg" onClick={handleLoadDemo}>
                  <Play className="w-4 h-4" />
                  先看看演示
                </Button>
              )}
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

      {/* 标题区 - 衬线大字 + mono 日期 + 金色下划线点缀 */}
      <div className="mb-14 stagger-item">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-[0.25em] mb-3">
          {formatDate()}
        </p>
        <h1 className="text-4xl md:text-5xl text-primary mb-3" style={{ fontWeight: 400, lineHeight: 1.1 }}>
          {isDemo ? '演示模式' : '你好，欢迎回来'}
        </h1>
        <p className="text-gray-500 text-base max-w-2xl leading-relaxed">
          不只是通用题库，上传你的教材 / 笔记，AI 自动生成专属复习题库
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* 左侧主内容 */}
        <div className="lg:col-span-8 space-y-12">
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
        <div className="lg:col-span-4 space-y-8">
          <div className="stagger-item">
            <MasteryCard answerRecords={answerRecords} />
          </div>

          {/* 今日待复习 - 金色强调卡片 */}
          <div className="stagger-item">
            <Card className="card-hover bg-gradient-to-br from-accent/8 to-accent/3 border-accent/20" elevated>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-accent-dark mb-1">
                    Due Today
                  </p>
                  <h3 className="text-base font-serif text-primary" style={{ fontWeight: 500 }}>
                    今日待复习
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1 font-mono">艾宾浩斯遗忘曲线</p>
                </div>
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-gold">
                  <RefreshCw className="w-4 h-4 text-primary" strokeWidth={2.2} />
                </div>
              </div>
              <div className="mb-6 flex items-baseline gap-2">
                <span className="font-serif text-5xl text-primary tabular-nums" style={{ fontWeight: 400, letterSpacing: '-0.04em' }}>
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

/**
 * 区块标题 - 衬线小标题 + mono 英文副标
 */
const SectionTitle = ({ title, subtitle }) => (
  <div className="flex items-baseline gap-3 mb-6">
    <h2 className="text-2xl text-primary font-serif" style={{ fontWeight: 400 }}>
      {title}
    </h2>
    <span className="text-xs font-mono text-gray-400 uppercase tracking-[0.2em]">
      {subtitle}
    </span>
    <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-2" />
  </div>
);

export default Dashboard;
