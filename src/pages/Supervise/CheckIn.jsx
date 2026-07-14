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
      {/* 小标题 */}
      <div className="flex items-center justify-between w-full mb-4">
        <span className="font-mono text-sm font-medium text-primary">每日打卡</span>
        <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
          {isCheckedIn ? 'Done' : 'Pending'}
        </span>
      </div>

      {/* 打卡按钮 */}
      <button
        onClick={handleCheckIn}
        disabled={isCheckedIn}
        className={`w-full py-4 rounded-2xl font-medium cursor-pointer transition-colors duration-300 active:scale-[0.98] ${
          isCheckedIn
            ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
            : 'bg-primary text-gray-50 hover:bg-secondary'
        } ${isAnimating ? 'scale-95' : 'scale-100'}`}
      >
        {isCheckedIn ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-gray-50" strokeWidth={3} />
            </span>
            <span>今日已打卡</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Calendar className="w-[18px] h-[18px]" />
            <span>今日打卡</span>
          </span>
        )}
      </button>

      {/* 已打卡状态显示 */}
      {isCheckedIn && (
        <div
          className={`mt-4 flex items-center gap-2 transition-all duration-500 ${
            isAnimating ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
          }`}
        >
          <span className="text-xs text-gray-500 font-mono tracking-wider">
            CURRENT STREAK
          </span>
          <span className="text-sm font-mono font-semibold text-gray-900">
            {currentStreak}
          </span>
          <span className="text-xs text-gray-500">天</span>
        </div>
      )}
    </div>
  );
};

export default CheckIn;
