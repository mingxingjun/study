import { useMemo } from 'react';
import { Trophy } from 'lucide-react';
import Card from '../../components/ui/Card';
import useCountUp from '../../hooks/useCountUp';

/**
 * 圆环进度组件 - 大号深蓝圆环
 */
const CircularProgress = ({ value, size = 120, strokeWidth = 5, color = '#0d2349' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const angle = (value / 100) * Math.PI * 2;
  const dotX = size / 2 + radius * Math.cos(angle);
  const dotY = size / 2 + radius * Math.sin(angle);

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
          stroke="#e2eaf2"
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
        {value > 0 && (
          <circle cx={dotX} cy={dotY} r={2} fill="#f5f8fb" stroke="#0d2349" strokeWidth={1.5} />
        )}
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-serif text-3xl leading-none text-primary tabular-nums">
          {value}
        </span>
        <span className="mt-1 font-mono text-[10px] text-gray-400">%</span>
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
  const displayMastery = useCountUp(mastery, { duration: 1400 });

  return (
    <Card className="card-hover p-6" elevated>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-accent-dark">
            Mastery
          </p>
          <h2 className="font-serif text-xl text-primary">
            掌握度
          </h2>
        </div>
        <div className="flex h-9 w-9 items-center justify-center border-2 border-accent/25 bg-accent/10">
          <Trophy className="h-4 w-4 text-accent-dark" strokeWidth={2} />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <CircularProgress value={displayMastery} />
        <div className="flex-1">
          <div className="mb-2 flex items-baseline gap-1.5">
            <span className="font-serif text-4xl leading-none text-primary tabular-nums">
              {displayMastery}
            </span>
            <span className="font-mono text-sm text-gray-500">%</span>
          </div>
          <div className="mb-3 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-accent" />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
          <p className="font-mono text-[10px] tabular-nums text-gray-400">
            基于 {answerRecords.length} 条答题记录
          </p>
        </div>
      </div>
    </Card>
  );
};

export default MasteryCard;
