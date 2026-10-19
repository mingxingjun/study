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
const CircularProgress = ({ value, size = 56, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#eae5d9"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ff4d00"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-serif text-base tabular-nums text-primary">
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
      className="card-hover group overflow-hidden p-5"
      elevated
    >
      {/* 卡片顶部 - mono 编号 + 图标 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center border border-primary/15 bg-gray-50">
            {item.icon}
          </div>
          <h3 className="text-xs font-medium text-gray-500">{item.title}</h3>
        </div>
        <span className="font-mono text-[10px] tabular-nums tracking-wider text-gray-300">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* 主数据 - 展示大字（数字滚动动画） */}
      <div className="flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-baseline gap-1">
            <span className="font-serif text-4xl leading-none text-primary tabular-nums">
              {animatedValue}
            </span>
            {item.unit && (
              <span className="font-mono text-xs text-gray-400">{item.unit}</span>
            )}
          </div>

          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="h-1 w-1 bg-accent" />
            <span className="text-[11px] text-gray-500">{item.label}</span>
          </div>

          <p className="font-mono text-[10px] tabular-nums text-gray-400">
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
            <ProgressBar value={animatedValue} size="md" color="#0b0a08" animated />
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
