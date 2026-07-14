import { TrendingUp, Clock, Target, Hourglass } from 'lucide-react';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';

/**
 * 圆环进度组件
 * @param {number} value - 进度值 (0-100)
 * @param {number} size - 圆环尺寸
 * @param {number} strokeWidth - 描边宽度
 */
const CircularProgress = ({ value, size = 64, strokeWidth = 4 }) => {
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
          stroke="#171717"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-mono text-xl font-bold text-gray-900">{value}</span>
        <span className="font-mono text-[10px] text-gray-400">%</span>
      </div>
    </div>
  );
};

/**
 * 仪表盘统计卡片组
 * @param {Object} props
 * @param {Object} props.stats - 统计数据
 */
const DashboardStats = ({ stats, questionsCount = 0 }) => {
  const accuracy = stats.totalQuestions > 0
    ? Math.round((stats.correctCount / stats.totalQuestions) * 100)
    : 0;
  const studyTime = stats.todayQuestions * 3 || 0;
  const savedMinutes = Math.round(questionsCount * 1.5);

  const items = [
    {
      icon: <TrendingUp className="w-4 h-4 text-gray-600" />,
      title: '正确率',
      value: `${accuracy}%`,
      label: accuracy >= 80 ? '表现优秀' : accuracy >= 60 ? '继续努力' : '需要加油',
      subtext: `共答题 ${stats.totalQuestions} 道`,
      visual: <CircularProgress value={accuracy} />
    },
    {
      icon: <Clock className="w-4 h-4 text-gray-600" />,
      title: '今日复习时长',
      value: studyTime,
      unit: '分钟',
      label: studyTime >= 30 ? '专注良好' : studyTime > 0 ? '刚刚开始' : '尚未开始',
      subtext: `今日答题 ${stats.todayQuestions} 道`
    },
    {
      icon: <Hourglass className="w-4 h-4 text-gray-600" />,
      title: '节省整理时间',
      value: `≈ ${savedMinutes}`,
      unit: '分钟',
      label: savedMinutes > 0 ? 'AI 已代劳' : '待生成题库',
      subtext: `已生成 ${questionsCount} 道专属题`
    },
    {
      icon: <Target className="w-4 h-4 text-gray-600" />,
      title: '整体进度',
      value: stats.overallProgress || 0,
      unit: '%',
      label: (stats.overallProgress || 0) >= 50 ? '过半进程' : '稳步推进',
      subtext: '按复习计划推进中',
      visual: <ProgressBar value={stats.overallProgress || 0} size="md" color="#171717" />
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 sm:gap-6">
      {items.map((item, idx) => (
        <Card key={idx} className="p-5 sm:p-6 card-hover overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0">
              {item.icon}
            </div>
            <h3 className="text-sm text-gray-500 font-medium truncate">{item.title}</h3>
          </div>

          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums truncate">
                  {item.value}
                </span>
                {item.unit && (
                  <span className="text-sm text-gray-500 flex-shrink-0">{item.unit}</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span className="text-xs text-gray-500 truncate">{item.label}</span>
              </div>

              <p className="font-mono text-xs text-gray-400 truncate">
                {item.subtext}
              </p>
            </div>

            {item.visual && (
              <div className="flex-shrink-0">
                {item.visual}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
