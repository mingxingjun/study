import { TrendingUp, Clock, Target, Hourglass } from 'lucide-react';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import useCountUp from '../../hooks/useCountUp';

/**
 * 圆环进度组件 - 精致金色描边
 * @param {Object} props
 * @param {number} props.value - 当前数值（已由外部动画驱动，逐帧更新）
 * @param {number} [props.size=56] - 圆环尺寸
 * @param {number} [props.strokeWidth=3] - 描边宽度
 */
const CircularProgress = ({ value, size = 56, strokeWidth = 3 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className="flex items-center justify-center relative"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#c9a227"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-serif text-base text-primary tabular-nums" style={{ fontWeight: 500 }}>
          {Math.round(value)}
        </span>
        <span className="font-mono text-[8px] text-gray-400">%</span>
      </div>
    </div>
  );
};

/**
 * 单个统计卡片
 * 使用 useCountUp 让大数字从 0 平滑滚动到目标值
 * 圆环/进度条接收已动画的数值，与数字同步变化
 */
const StatCard = ({ item, index }) => {
  const animatedValue = useCountUp(item.value, { duration: 1400 });

  return (
    <Card
      className="p-6 card-hover overflow-hidden group"
      elevated
    >
      {/* 卡片顶部 - mono 编号 + 图标 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200/60">
            {item.icon}
          </div>
          <h3 className="text-xs text-gray-500 font-medium">{item.title}</h3>
        </div>
        <span className="font-mono text-[10px] text-gray-300 tabular-nums tracking-wider">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* 主数据 - 衬线大数字（数字滚动动画） */}
      <div className="flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1 mb-2">
            <span
              className="font-serif text-4xl text-primary tabular-nums"
              style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 }}
            >
              {animatedValue}
            </span>
            {item.unit && (
              <span className="text-xs text-gray-400 font-mono">{item.unit}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
            <span className="text-[11px] text-gray-500">{item.label}</span>
          </div>

          <p className="font-mono text-[10px] text-gray-400 tabular-nums">
            {item.subtext}
          </p>
        </div>

        {item.visualType === 'circular' && (
          <div className="flex-shrink-0">
            <CircularProgress value={animatedValue} size={56} />
          </div>
        )}
        {item.visualType === 'bar' && (
          <div className="flex-shrink-0 w-full max-w-[120px]">
            <ProgressBar value={animatedValue} size="md" color="#171717" animated />
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * 仪表盘统计卡片组 - Refined Editorial
 */
const DashboardStats = ({ stats, questionsCount = 0 }) => {
  const accuracy = stats.totalQuestions > 0
    ? Math.round((stats.correctCount / stats.totalQuestions) * 100)
    : 0;
  const studyTime = stats.todayQuestions * 3 || 0;
  const savedMinutes = Math.round(questionsCount * 1.5);

  const items = [
    {
      icon: <TrendingUp className="w-4 h-4 text-gray-600" strokeWidth={2} />,
      title: '正确率',
      value: accuracy,
      unit: '%',
      label: accuracy >= 80 ? '表现优秀' : accuracy >= 60 ? '继续努力' : '需要加油',
      subtext: `共答题 ${stats.totalQuestions} 道`,
      visualType: 'circular'
    },
    {
      icon: <Clock className="w-4 h-4 text-gray-600" strokeWidth={2} />,
      title: '今日时长',
      value: studyTime,
      unit: '分钟',
      label: studyTime >= 30 ? '专注良好' : studyTime > 0 ? '刚刚开始' : '尚未开始',
      subtext: `今日答题 ${stats.todayQuestions} 道`,
      visualType: null
    },
    {
      icon: <Hourglass className="w-4 h-4 text-gray-600" strokeWidth={2} />,
      title: '节省整理',
      value: savedMinutes,
      unit: '分钟',
      label: savedMinutes > 0 ? 'AI 已代劳' : '待生成题库',
      subtext: `已生成 ${questionsCount} 道题`,
      visualType: null
    },
    {
      icon: <Target className="w-4 h-4 text-gray-600" strokeWidth={2} />,
      title: '整体进度',
      value: stats.overallProgress || 0,
      unit: '%',
      label: (stats.overallProgress || 0) >= 50 ? '过半进程' : '稳步推进',
      subtext: '按复习计划推进',
      visualType: 'bar'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
      {items.map((item, idx) => (
        <StatCard key={idx} item={item} index={idx} />
      ))}
    </div>
  );
};

export default DashboardStats;
