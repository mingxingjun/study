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
      labelEn: 'Total Days',
      value: totalDays,
      unit: '天'
    },
    {
      icon: Target,
      label: '总答题数',
      labelEn: 'Questions',
      value: totalQuestions,
      unit: '题'
    },
    {
      icon: CheckCircle,
      label: '总正确率',
      labelEn: 'Accuracy',
      value: accuracy,
      unit: '%'
    }
  ];

  return (
    <div className="w-full">
      {/* 主数据：连续天数 - 衬线大数字 + 金色徽章 */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent-light/40 border border-accent/30">
            <Flame className="w-3 h-3 text-accent-dark" strokeWidth={1.8} />
          </span>
          <span className="text-[11px] text-gray-500 font-mono tracking-[0.25em] uppercase">
            Current Streak
          </span>
        </div>
        <div className="flex items-baseline justify-center gap-2">
          <span
            className="font-serif text-primary tabular-nums"
            style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1, fontSize: '3.5rem' }}
          >
            {currentStreak}
          </span>
          <span className="text-base font-serif text-gray-500" style={{ fontWeight: 500 }}>
            天
          </span>
        </div>
        <div className="mt-3 mx-auto h-px w-10 bg-gradient-to-r from-transparent via-accent to-transparent" />
        <p className="mt-2.5 text-[11px] text-gray-500 font-mono tracking-wide">连续学习</p>
        {totalDays === 0 && (
          <p className="mt-3 text-xs text-gray-400 max-w-[200px] mx-auto leading-relaxed">
            坚持每日打卡，连续天数会在这里累计
          </p>
        )}
      </div>

      {/* 分割线 */}
      <div className="border-t border-gray-100 my-5"></div>

      {/* 统计数据三宫格 - 衬线数字 + mono 标签 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {statItems.map((item, index) => (
          <div
            key={index}
            className="text-center py-3.5 px-2 rounded-xl bg-warm-50/60 border border-gray-100 hover:border-accent/30 hover:bg-accent-light/10 transition-colors duration-200"
          >
            <item.icon className="w-3.5 h-3.5 text-accent-dark mx-auto mb-2" strokeWidth={1.8} />
            <div className="flex items-baseline justify-center gap-1">
              <span
                className="font-serif text-xl text-primary tabular-nums"
                style={{ fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1 }}
              >
                {item.value}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">{item.unit}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 font-serif" style={{ fontWeight: 500 }}>
              {item.label}
            </p>
            <p className="text-[9px] text-gray-400 font-mono tracking-wider uppercase mt-0.5">
              {item.labelEn}
            </p>
          </div>
        ))}
      </div>

      {/* 底部专注时长 */}
      {totalFocusMinutes > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-2.5">
          <span className="text-[10px] text-gray-400 font-mono tracking-[0.2em] uppercase">
            Total Focus
          </span>
          <span className="w-1 h-1 rounded-full bg-accent" />
          <span
            className="font-serif text-base text-primary tabular-nums"
            style={{ fontWeight: 500, letterSpacing: '-0.02em' }}
          >
            {totalFocusMinutes}
          </span>
          <span className="text-[10px] text-gray-500 font-mono">分钟</span>
        </div>
      )}
    </div>
  );
};

export default StreakDisplay;
