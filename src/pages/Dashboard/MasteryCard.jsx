import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import Card from '../../components/ui/Card';

/**
 * 圆环进度组件
 * @param {number} value - 进度值 (0-100)
 * @param {number} size - 圆环尺寸
 * @param {number} strokeWidth - 描边宽度
 * @param {string} color - 进度环颜色
 */
const CircularProgress = ({ value, size = 120, strokeWidth = 6, color = '#D4AF37' }) => {
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
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold text-primary">{value}</span>
        <span className="font-mono text-[10px] text-gray-400">%</span>
      </div>
    </div>
  );
};

/**
 * 整体掌握度卡片
 * 基于答题记录计算正确率，展示为圆环可视化
 * @param {Object} props
 * @param {Array} props.answerRecords - 答题记录列表
 */
const MasteryCard = ({ answerRecords = [] }) => {
  const mastery = useMemo(() => {
    const total = answerRecords.length;
    if (total === 0) return 0;
    const correct = answerRecords.filter(record => record.isCorrect).length;
    return Math.round((correct / total) * 100);
  }, [answerRecords]);

  const label = mastery >= 80 ? '表现优秀' : mastery >= 60 ? '稳步提升' : '持续积累';

  return (
    <Card className="card-hover">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center border border-accent/20">
          <Trophy className="w-4 h-4 text-accent" />
        </div>
        <h2 className="text-lg font-semibold text-primary">掌握度</h2>
      </div>

      <div className="flex items-center gap-6">
        <CircularProgress value={mastery} />
        <div className="flex-1">
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="font-mono text-3xl font-bold text-primary tabular-nums">
              {mastery}
            </span>
            <span className="text-sm text-gray-500">%</span>
          </div>
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
          <p className="font-mono text-xs text-gray-400">
            基于 {answerRecords.length} 条答题记录
          </p>
        </div>
      </div>
    </Card>
  );
};

export default MasteryCard;
