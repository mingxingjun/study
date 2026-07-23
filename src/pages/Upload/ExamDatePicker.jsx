import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * 考试日期选择器
 * @param {Object} props
 * @param {string} props.value - 当前日期 (YYYY-MM-DD)
 * @param {Function} props.onChange - 日期变化回调
 */
const ExamDatePicker = ({ value, onChange }) => {
  const scrollRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(value || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  useEffect(() => {
    setSelectedDate(value || '');
    const d = parseDate(value);
    if (d) setPickerDate(d);
  }, [value]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysUntil = (dateStr) => {
    const target = parseDate(dateStr);
    if (!target) return null;
    const diff = target.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const selected = parseDate(selectedDate);
  const daysUntil = getDaysUntil(selectedDate);

  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  const generateDateChips = () => {
    const chips = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      chips.push(date);
    }
    return chips;
  };

  const dateChips = generateDateChips();

  const handleSelect = (dateStr) => {
    setSelectedDate(dateStr);
    onChange(dateStr);
  };

  const handleQuickSelect = (days) => {
    const date = new Date(today);
    date.setDate(today.getDate() + days);
    const dateStr = formatDateStr(date);
    handleSelect(dateStr);
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction * 280, behavior: 'smooth' });
    }
  };

  const quickOptions = [
    { days: 7, label: '1 周后' },
    { days: 14, label: '2 周后' },
    { days: 30, label: '1 个月后' }
  ];

  const pickerYear = pickerDate.getFullYear();
  const pickerMonth = pickerDate.getMonth();

  const changeMonth = (delta) => {
    setPickerDate(new Date(pickerYear, pickerMonth + delta, 1));
  };

  const generateCalendarDays = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const cells = [];
    // 上个月的占位日期
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = formatDateStr(date);
      cells.push({
        date,
        dateStr,
        isCurrentMonth: false,
        isSelected: selectedDate === dateStr,
        isToday: date.getTime() === today.getTime()
      });
    }
    // 当月日期
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = formatDateStr(date);
      cells.push({
        date,
        dateStr,
        isCurrentMonth: true,
        isSelected: selectedDate === dateStr,
        isToday: date.getTime() === today.getTime()
      });
    }
    // 下个月的占位日期
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      const dateStr = formatDateStr(date);
      cells.push({
        date,
        dateStr,
        isCurrentMonth: false,
        isSelected: selectedDate === dateStr,
        isToday: date.getTime() === today.getTime()
      });
    }
    return cells;
  };

  return (
    <div className="space-y-6">
      {/* 已选日期大卡片 - 衬线大日期 + mono 倒计时 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 p-5 bg-gray-50/60 rounded-xl border border-gray-200/80 flex items-center gap-5">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <CalendarIcon className="w-7 h-7 text-accent" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-mono uppercase tracking-wider text-gray-500 mb-1">Selected Date</p>
            {selected ? (
              <div>
                <p className="font-serif text-2xl text-primary tabular-nums" style={{ fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  {selected.getFullYear()}<span className="text-gray-400 mx-1">.</span>{String(selected.getMonth() + 1).padStart(2, '0')}<span className="text-gray-400 mx-1">.</span>{String(selected.getDate()).padStart(2, '0')}
                </p>
                <p className="text-xs text-gray-500 mt-1 font-mono">{weekDays[selected.getDay()]}</p>
              </div>
            ) : (
              <p className="font-serif text-2xl text-gray-400" style={{ fontWeight: 400 }}>请选择日期</p>
            )}
          </div>
        </div>

        {/* 倒计时 - 金色强调卡片 */}
        <div className="sm:w-44 p-5 bg-gradient-to-br from-accent/8 to-accent/3 rounded-xl border border-accent/20 flex flex-col items-center justify-center shadow-gold">
          <p className="text-[11px] font-mono uppercase tracking-wider text-accent-dark mb-2">Days Until</p>
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-5xl text-primary tabular-nums" style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {daysUntil ?? '--'}
            </span>
            <span className="text-sm text-gray-500 font-mono">天</span>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mt-2">距考试</p>
        </div>
      </div>

      {/* 快捷选择 - 编辑式 pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 mr-1">Quick Select</span>
        {quickOptions.map((option) => {
          const dateStr = formatDateStr(new Date(today.getTime() + option.days * 24 * 60 * 60 * 1000));
          const isActive = selectedDate === dateStr;
          return (
            <button
              key={option.days}
              type="button"
              onClick={() => handleQuickSelect(option.days)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isActive
                  ? 'bg-primary text-accent-light border-primary shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* 日期条 - 精致 chips + 衬线日期数字 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-primary hover:border-gray-900 transition-colors shadow-sm cursor-pointer"
          aria-label="向左滚动"
        >
          <ChevronLeft size={16} />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-10 py-1 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {dateChips.map((date) => {
            const dateStr = formatDateStr(date);
            const isSelected = selectedDate === dateStr;
            const isToday = date.getTime() === today.getTime();

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleSelect(dateStr)}
                className={`flex-shrink-0 w-[72px] py-3 rounded-xl border text-center transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isSelected
                    ? 'bg-primary text-accent-light border-primary shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="block text-[10px] opacity-80 mb-1 font-mono uppercase tracking-wider">
                  {isToday ? '今天' : weekDays[date.getDay()]}
                </span>
                <span className="block font-serif text-2xl leading-none tabular-nums" style={{ fontWeight: 400, letterSpacing: '-0.04em' }}>
                  {date.getDate()}
                </span>
                <span className="block text-[10px] opacity-70 mt-1 font-mono tabular-nums">
                  {monthLabels[date.getMonth()]}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-primary hover:border-gray-900 transition-colors shadow-sm cursor-pointer"
          aria-label="向右滚动"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 自定义日期弹层 */}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">Custom Date</span>
        <button
          type="button"
          onClick={() => setShowDatePicker(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-gray-50/60 border border-gray-200 rounded-lg text-sm text-gray-900 font-mono tabular-nums hover:border-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          {selectedDate || '选择日期'}
          <CalendarIcon className="w-4 h-4 text-gray-400" strokeWidth={1.6} />
        </button>

        {showDatePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowDatePicker(false)}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 w-[340px] scale-in" onClick={(e) => e.stopPropagation()}>
              {/* 月份切换 - 衬线 */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                  aria-label="上一月"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="font-serif text-base text-primary" style={{ fontWeight: 500 }}>
                  {pickerYear}<span className="text-gray-400 mx-1">·</span>{String(pickerMonth + 1).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                  aria-label="下一月"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* 星期标题 - mono */}
              <div className="grid grid-cols-7 mb-2">
                {weekDays.map((d) => (
                  <div key={d} className="text-center text-[10px] text-gray-400 py-1 font-mono uppercase tracking-wider">
                    {d}
                  </div>
                ))}
              </div>

              {/* 日期网格 */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays(pickerYear, pickerMonth).map((cell, idx) => {
                  if (!cell) {
                    return <div key={idx} className="h-9" />;
                  }
                  const { date, dateStr, isCurrentMonth, isSelected, isToday: cellIsToday } = cell;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => {
                        handleSelect(dateStr);
                        setShowDatePicker(false);
                      }}
                      disabled={!isCurrentMonth}
                      className={`h-9 w-9 mx-auto rounded-lg text-sm font-medium transition-colors font-mono tabular-nums ${
                        isSelected
                          ? 'bg-primary text-accent-light shadow-sm'
                          : cellIsToday
                            ? 'bg-accent/10 text-accent-dark border border-accent/30'
                            : isCurrentMonth
                              ? 'text-gray-700 hover:bg-gray-100'
                              : 'text-gray-300'
                      }`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* 底部操作 */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    handleSelect('');
                    setShowDatePicker(false);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer font-mono"
                >
                  清除
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = formatDateStr(today);
                    handleSelect(todayStr);
                    setPickerDate(today);
                    setShowDatePicker(false);
                  }}
                  className="text-sm text-accent-dark font-medium hover:text-accent transition-colors cursor-pointer font-mono uppercase tracking-wider"
                >
                  今天
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamDatePicker;
