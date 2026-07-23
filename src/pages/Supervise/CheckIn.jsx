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
    <div className="flex flex-col items-center w-full">
      {/* 小标题 - 衬线 + mono 副标 */}
      <div className="flex items-baseline justify-between w-full mb-5 pb-3 border-b border-gray-100">
        <span className="font-serif text-base text-primary" style={{ fontWeight: 500 }}>
          每日打卡
        </span>
        <span className="text-[10px] text-gray-400 font-mono tracking-[0.2em] uppercase">
          {isCheckedIn ? 'Done' : 'Pending'}
        </span>
      </div>

      {/* 打卡按钮 - 金色 CTA 风格 */}
      <button
        onClick={handleCheckIn}
        disabled={isCheckedIn}
        className={`w-full py-4 rounded-full font-medium cursor-pointer transition-all duration-200 active:scale-[0.98] ${
          isCheckedIn
            ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
            : 'bg-accent text-primary border border-accent/40 hover:bg-accent-dark hover:shadow-gold hover:-translate-y-0.5'
        } ${isAnimating ? 'scale-95' : 'scale-100'}`}
      >
        {isCheckedIn ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-accent" strokeWidth={3} />
            </span>
            <span className="font-serif" style={{ fontWeight: 500 }}>今日已打卡</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Calendar className="w-[18px] h-[18px]" strokeWidth={1.8} />
            <span className="font-serif" style={{ fontWeight: 500 }}>今日打卡</span>
          </span>
        )}
      </button>

      {/* 已打卡状态显示 - 衬线大数字 + mono 标签 */}
      {isCheckedIn && (
        <div
          className={`mt-5 flex items-baseline justify-center gap-2 transition-all duration-500 ${
            isAnimating ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
          }`}
        >
          <span className="text-[11px] text-gray-400 font-mono tracking-[0.2em] uppercase">
            Streak
          </span>
          <span
            className="font-serif text-3xl text-primary tabular-nums"
            style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 }}
          >
            {currentStreak}
          </span>
          <span className="text-xs text-gray-500">天</span>
        </div>
      )}
    </div>
  );
};

export default CheckIn;
