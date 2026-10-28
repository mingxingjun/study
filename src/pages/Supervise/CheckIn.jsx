import { useState } from 'react';
import { Check, Calendar } from 'lucide-react';
import { useStudyContext } from '../../context/StudyContext';
import { getToday } from '../../utils/date';

const CheckIn = ({ onCheckIn }) => {
  const { state, checkIn } = useStudyContext();
  const [isAnimating, setIsAnimating] = useState(false);
  const today = getToday();
  const isCheckedIn = state.checkInDates.includes(today);
  const currentStreak = state.stats.currentStreak || 0;

  const handleCheckIn = () => {
    if (isCheckedIn) return;

    setIsAnimating(true);
    checkIn();
    onCheckIn && onCheckIn();

    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  return (
    <div className="flex w-full flex-col items-center">
      {/* 小标题 - 展示字 + mono 副标 */}
      <div className="mb-5 flex w-full items-baseline justify-between border-b border-primary/10 pb-3">
        <span className="font-serif text-base text-primary">
          每日打卡
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">
          {isCheckedIn ? 'Done' : 'Pending'}
        </span>
      </div>

      {/* 打卡按钮 - 信号橙硬边 CTA */}
      <button
        onClick={handleCheckIn}
        disabled={isCheckedIn}
        className={`w-full cursor-pointer border-2 py-3.5 font-serif text-base transition-all duration-150 active:translate-y-0 ${
          isCheckedIn
            ? 'cursor-not-allowed border-primary/15 bg-gray-100 text-gray-500'
            : 'border-primary bg-accent text-black hover:-translate-y-0.5 hover:shadow-md'
        } ${isAnimating ? 'translate-y-0.5' : ''}`}
      >
        {isCheckedIn ? (
          <span className="flex items-center justify-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center bg-primary">
              <Check className="h-3 w-3 text-accent-light" strokeWidth={3} />
            </span>
            <span>今日已打卡</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Calendar className="h-[18px] w-[18px]" strokeWidth={1.8} />
            <span>今日打卡</span>
          </span>
        )}
      </button>

      {/* 已打卡状态显示 - 大数字 + mono 标签 */}
      {isCheckedIn && (
        <div
          className={`mt-5 flex items-baseline justify-center gap-2 transition-all duration-500 ${
            isAnimating ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-400">
            Streak
          </span>
          <span className="font-serif text-3xl tabular-nums text-primary">
            {currentStreak}
          </span>
          <span className="text-xs text-gray-500">天</span>
        </div>
      )}
    </div>
  );
};

export default CheckIn;
