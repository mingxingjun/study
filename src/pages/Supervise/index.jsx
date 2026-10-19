import { useEffect, useRef } from 'react';
import { useStudyContext } from '../../context/StudyContext';
import useAgents from '../../hooks/useAgents';
import usePageTitle from '../../hooks/usePageTitle';
import PomodoroTimer from './PomodoroTimer';
import CheckIn from './CheckIn';
import HeatmapChart from './HeatmapChart';
import StatsCharts from './StatsCharts';
import StreakDisplay from './StreakDisplay';
import AgentMessage from '../../components/agents/AgentMessage';
import Card from '../../components/ui/Card';
import SectionTitle from '../../components/ui/SectionTitle';
import useStaggerAnimation from '../../hooks/useStaggerAnimation';

const Supervise = () => {
  usePageTitle('督学中心');
  const { state } = useStudyContext();
  const { agents, thinkAndSay } = useAgents();
  const greetSent = useRef(false);
  const pageRef = useStaggerAnimation([], '.stagger-item');

  useEffect(() => {
    if (greetSent.current) return;
    greetSent.current = true;

    const timer = setTimeout(async () => {
      await thinkAndSay('supervisor', '今天也要保持专注哦！我来帮你计时，25分钟高效学习开始吧！', 500);
    }, 300);

    return () => clearTimeout(timer);
  }, [thinkAndSay]);

  const handleFocusComplete = async () => {
    await thinkAndSay('supervisor', '很棒！完成一个番茄钟，休息一下吧！', 500);
  };

  const handleCheckIn = async () => {
    const currentStreak = state.stats.currentStreak + 1;
    await thinkAndSay('supervisor', `打卡成功！你已经连续坚持${currentStreak}天了，继续保持！`, 500);
  };

  const supervisorAgent = agents.find(a => a.id === 'supervisor');

  const totalFocusMinutes = Object.values(state.dailyRecords || {}).reduce(
    (sum, record) => sum + (record.focusMinutes || 0),
    0
  );

  return (
    <div ref={pageRef} className="page-fade-in">
      {/* 页面标题 - 展示大字 + mono 眉标 */}
      <div className="mb-10 stagger-item">
        <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-gray-400">
          <span className="h-1.5 w-1.5 bg-accent" />
          Focus · Check-in · Stats
        </p>
        <h1 className="mb-3 text-primary">
          督学中心<span className="text-accent">.</span>
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-gray-500">
          专注学习，劳逸结合。在这里管理你的番茄钟、每日打卡与学习数据。
        </p>
      </div>

      {/* 督学 Agent 消息卡片 */}
      {supervisorAgent && supervisorAgent.history && supervisorAgent.history.length > 0 && (
        <Card elevated className="p-6 mb-12 stagger-item">
          <div className="flex items-baseline gap-3 mb-4 pb-3 border-b border-gray-100">
            <span className="font-serif text-base text-primary" style={{ fontWeight: 500 }}>
              督学助手
            </span>
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em]">
              Supervisor
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-2" />
          </div>
          <div className="space-y-3">
            {supervisorAgent.history.slice(-2).map((msg, idx) => (
              <AgentMessage
                key={msg.id || idx}
                agent={supervisorAgent}
                message={msg.content}
                isTyping={msg.isTyping}
              />
            ))}
            {supervisorAgent.status === 'thinking' && (
              <AgentMessage agent={supervisorAgent} isTyping />
            )}
          </div>
        </Card>
      )}

      {/* 主区域：番茄钟 + 右侧卡片组 */}
      <div className="mb-12 stagger-item">
        <SectionTitle title="专注计时" subtitle="Pomodoro" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          <Card elevated className="p-8 lg:p-10 flex items-center justify-center min-h-[460px] relative overflow-hidden">
            {/* 装饰性金色光晕 */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
            <PomodoroTimer onFocusComplete={handleFocusComplete} />
          </Card>

          <div className="flex flex-col gap-6">
            <Card elevated className="p-6">
              <CheckIn onCheckIn={handleCheckIn} />
            </Card>

            <Card elevated className="p-6">
              <StreakDisplay stats={state.stats} checkInDates={state.checkInDates} />
            </Card>
          </div>
        </div>
      </div>

      {/* 数据可视化区域 */}
      <div className="space-y-12">
        <div className="stagger-item">
          <SectionTitle title="学习热力图" subtitle="Heatmap" />
          <Card elevated className="p-6 lg:p-7">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="font-serif text-lg text-primary">
                最近 12 周学习记录
              </h3>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-400">
                  Total <span className="font-semibold text-primary">{totalFocusMinutes}</span> min
                </span>
                <span className="h-1 w-1 bg-accent" />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-400">
                  Last 12 Weeks
                </span>
              </div>
            </div>
            <HeatmapChart dailyRecords={state.dailyRecords} />
          </Card>
        </div>

        <div className="stagger-item">
          <SectionTitle title="学习趋势" subtitle="Trend" />
          <Card elevated className="p-6 lg:p-7">
            <StatsCharts answerRecords={state.answerRecords} dailyRecords={state.dailyRecords} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Supervise;
