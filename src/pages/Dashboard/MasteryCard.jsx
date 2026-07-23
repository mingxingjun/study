import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import Card from '../../components/ui/Card';

/**
 * 圆环进度组件 - 大号金色圆环
 */
const CircularProgress = ({ value, size = 120, strokeWidth = 5, color = '#c9a227' }) => {
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
          className="transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span
          className="font-serif text-3xl text-primary tabular-nums"
          style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 }}
        >
          {value}
        </span>
        <span className="font-mono text-[10px] text-gray-400 mt-0.5">%</span>
      </div>
    </div>
  );
};

/**
 * 整体掌握度卡片 - Refined Editorial
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
    <Card className="card-hover p-7" elevated>
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-accent-dark mb-1">
            Mastery
          </p>
          <h2 className="text-xl font-serif text-primary" style={{ fontWeight: 500 }}>
            掌握度
          </h2>
        </div>
        <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
          <Trophy className="w-4 h-4 text-accent-dark" strokeWidth={2} />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <CircularProgress value={mastery} />
        <div className="flex-1">
          <div className="flex items-baseline gap-1.5 mb-2">
            <span
              className="font-serif text-4xl text-primary tabular-nums"
              style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 }}
            >
              {mastery}
            </span>
            <span className="text-sm text-gray-500 font-mono">%</span>
          </div>
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
          <p className="font-mono text-[10px] text-gray-400 tabular-nums">
            基于 {answerRecords.length} 条答题记录
          </p>
        </div>
      </div>
    </Card>
  );
};

export default MasteryCard;
