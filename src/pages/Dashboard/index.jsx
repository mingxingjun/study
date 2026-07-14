import { useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Play, Sparkles, RefreshCw } from 'lucide-react';
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

  if (showOnboarding) {
    return (
      <div ref={pageRef} className="max-w-5xl mx-auto">
        <div className="mb-14 stagger-item">
          <p className="text-sm text-gray-500 mb-2">{formatDate()}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-primary">
            你好，欢迎使用复习搭子
          </h1>
        </div>

        <Card className="p-8 sm:p-12 mb-10 card-hover stagger-item">
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              不只是通用题库
            </h2>
            <p className="text-gray-500 mb-10 leading-relaxed">
              上传你的教材 / 笔记，AI 自动生成专属复习题库
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
              <Button size="lg" onClick={() => navigate('/upload')}>
                <Upload className="w-5 h-5" />
                上传我的资料
              </Button>
              {state.mode === 'demo' && (
                <Button variant="secondary" size="lg" onClick={handleLoadDemo}>
                  <Play className="w-5 h-5" />
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

        <div className="mb-10 stagger-item">
          <OnboardingSteps />
        </div>

        <div className="stagger-item">
          <AgentsPanel agents={agents} />
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef}>
      {isDemo && (
        <div className="mb-8 stagger-item">
          <DemoModeBanner />
        </div>
      )}

      <div className="mb-14 stagger-item">
        <p className="text-sm text-gray-500 mb-2">{formatDate()}</p>
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
          {isDemo ? '演示模式' : '你好，欢迎回来'}
        </h1>
        <p className="text-gray-500 max-w-2xl">
          不只是通用题库，上传你的教材 / 笔记，AI 自动生成专属复习题库
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* 左侧主内容 */}
        <div className="lg:col-span-8 space-y-10">
          <div className="stagger-item">
            <div className="flex items-center gap-2 mb-4 px-1">
              <h2 className="text-lg font-semibold text-primary">学习概览</h2>
              <span className="font-mono text-xs text-gray-400">Overview</span>
            </div>
            <DashboardStats stats={stats} questionsCount={questions.length} />
          </div>

          <div className="stagger-item">
            <TodayTasks todayTasks={todayTasks} hasMaterials={hasData || isDemo} />
          </div>

          <div className="stagger-item">
            <WeakPointsChart weakPoints={weakPoints} />
          </div>
        </div>

        {/* 右侧边栏 */}
        <div className="lg:col-span-4 space-y-10">
          <div className="stagger-item">
            <MasteryCard answerRecords={answerRecords} />
          </div>

          <div className="stagger-item">
            <Card className="card-hover">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-primary">今日待复习</h3>
                  <p className="text-xs text-gray-400 mt-1 font-mono">基于艾宾浩斯遗忘曲线</p>
                </div>
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="mb-5">
                <span className="text-3xl font-bold text-gray-900">{dueReviewQuestions.length}</span>
                <span className="text-sm text-gray-500 ml-1">道错题到期</span>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate('/wrong-book')}
                disabled={dueReviewQuestions.length === 0}
              >
                去错题本复习
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
