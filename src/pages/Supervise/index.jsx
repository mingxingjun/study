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
import useStaggerAnimation from '../../hooks/useStaggerAnimation';

const cardClass = "bg-white rounded-2xl border border-gray-200 card-hover";

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

  return (
    <div ref={pageRef}>
      {/* 页面标题 */}
      <div className="mb-14 stagger-item">
        <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight mb-2">
          督学中心
        </h1>
        <p className="text-gray-500 text-sm tracking-wide">专注学习，劳逸结合</p>
        <div className="mt-3 h-px w-12 bg-primary"></div>
      </div>

      {/* 督学 Agent 消息卡片 */}
      {supervisorAgent && supervisorAgent.history && supervisorAgent.history.length > 0 && (
        <div className={`${cardClass} p-5 mb-6 stagger-item`}>
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
            <span className="font-mono text-sm font-medium text-primary">督学助手</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-400 font-mono">SUPERVISOR</span>
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
        </div>
      )}

      {/* 主区域：番茄钟 + 右侧卡片组 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 mb-8">
        <div className={`${cardClass} p-8 lg:p-10 flex items-center justify-center min-h-[440px] stagger-item`}>
          <PomodoroTimer onFocusComplete={handleFocusComplete} />
        </div>

        <div className="flex flex-col gap-8">
          <div className={`${cardClass} p-6 stagger-item`}>
            <CheckIn onCheckIn={handleCheckIn} />
          </div>

          <div className={`${cardClass} p-6 stagger-item`}>
            <StreakDisplay stats={state.stats} checkInDates={state.checkInDates} />
          </div>
        </div>
      </div>

      {/* 数据可视化区域 */}
      <div className="space-y-10">
        <div className={`${cardClass} p-6 lg:p-7 stagger-item`}>
          <div className="flex items-baseline justify-between mb-5">
            <h3 className="font-mono text-lg font-semibold text-primary">学习热力图</h3>
            <span className="text-xs text-gray-400 font-mono tracking-wider">LAST 12 WEEKS</span>
          </div>
          <HeatmapChart dailyRecords={state.dailyRecords} />
        </div>

        <div className={`${cardClass} p-6 lg:p-7 stagger-item`}>
          <StatsCharts answerRecords={state.answerRecords} dailyRecords={state.dailyRecords} />
        </div>
      </div>
    </div>
  );
};

export default Supervise;
