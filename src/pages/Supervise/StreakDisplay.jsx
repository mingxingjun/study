import { Flame, Calendar, Target, CheckCircle } from 'lucide-react';

const StreakDisplay = ({ stats, checkInDates }) => {
  const currentStreak = stats.currentStreak || 0;
  const totalDays = checkInDates ? checkInDates.length : 0;
  const totalQuestions = stats.totalQuestions || 0;
  const correctCount = stats.correctCount || 0;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const totalFocusMinutes = stats.totalFocusMinutes || 0;

  const statItems = [
    {
      icon: Calendar,
      label: '累计学习',
      value: totalDays,
      unit: '天'
    },
    {
      icon: Target,
      label: '总答题数',
      value: totalQuestions,
      unit: '题'
    },
    {
      icon: CheckCircle,
      label: '总正确率',
      value: accuracy,
      unit: '%'
    }
  ];

  return (
    <div className="w-full">
      {/* 主数据：连续天数 */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <Flame className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
          <span className="text-[10px] text-gray-500 font-mono tracking-[0.25em] uppercase">
            Current Streak
          </span>
        </div>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-5xl font-mono font-light text-primary leading-none tabular-nums">
            {currentStreak}
          </span>
          <span className="text-lg font-sans text-gray-500">天</span>
        </div>
        <div className="mt-2 mx-auto h-px w-8 bg-gray-300"></div>
        <p className="mt-2 text-xs text-gray-500 font-sans">连续学习</p>
        {totalDays === 0 && (
          <p className="mt-3 text-xs text-gray-400 max-w-[200px] mx-auto leading-relaxed">
            坚持每日打卡，连续天数会在这里累计
          </p>
        )}
      </div>

      {/* 分割线 */}
      <div className="border-t border-gray-100 my-4"></div>

      {/* 统计数据三宫格 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {statItems.map((item, index) => (
          <div
            key={index}
            className="text-center py-3 px-2 rounded-xl bg-gray-50/70 border border-gray-100/50 hover:bg-gray-100/70 transition-colors duration-200"
          >
            <item.icon className="w-3.5 h-3.5 text-gray-500 mx-auto mb-1.5" strokeWidth={1.5} />
            <div className="font-mono text-base font-medium text-gray-900 leading-tight tabular-nums">
              {item.value}
              <span className="text-[10px] font-sans text-gray-500 ml-0.5">{item.unit}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-0.5 tracking-wide">{item.label}</p>
          </div>
        ))}
      </div>

      {/* 底部专注时长 */}
      {totalFocusMinutes > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-2">
          <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
            Total Focus
          </span>
          <span className="text-xs font-mono text-gray-700 tabular-nums">
            {totalFocusMinutes}
          </span>
          <span className="text-[10px] text-gray-500">分钟</span>
        </div>
      )}
    </div>
  );
};

export default StreakDisplay;
