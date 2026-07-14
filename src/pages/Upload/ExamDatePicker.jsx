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
    <div className="space-y-5">
      {/* 已选日期大卡片 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 p-5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center gap-4">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">已选考试日期</p>
            {selected ? (
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {selected.getFullYear()}年{selected.getMonth() + 1}月{selected.getDate()}日
                </p>
                <p className="text-sm text-gray-500">{weekDays[selected.getDay()]}</p>
              </div>
            ) : (
              <p className="text-xl font-bold text-gray-400">请选择日期</p>
            )}
          </div>
        </div>

        <div className="sm:w-40 p-5 bg-primary rounded-2xl flex flex-col items-center justify-center text-white">
          <p className="text-xs opacity-80 mb-1">距离考试</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono">{daysUntil ?? '--'}</span>
            <span className="text-sm">天</span>
          </div>
        </div>
      </div>

      {/* 快捷选择 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 mr-1">快捷选择</span>
        {quickOptions.map((option) => {
          const dateStr = formatDateStr(new Date(today.getTime() + option.days * 24 * 60 * 60 * 1000));
          const isActive = selectedDate === dateStr;
          return (
            <button
              key={option.days}
              type="button"
              onClick={() => handleQuickSelect(option.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isActive
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* 日期条 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-sm"
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
                className={`flex-shrink-0 w-[72px] py-3 rounded-xl border text-center transition-colors ${
                  isSelected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="block text-[10px] opacity-80 mb-1">
                  {isToday ? '今天' : weekDays[date.getDay()]}
                </span>
                <span className="block text-lg font-bold font-mono leading-none">
                  {date.getDate()}
                </span>
                <span className="block text-[10px] opacity-70 mt-1">
                  {monthLabels[date.getMonth()]}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-sm"
          aria-label="向右滚动"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 自定义日期弹层 */}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-xs text-gray-400">自定义日期</span>
        <button
          type="button"
          onClick={() => setShowDatePicker(true)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-mono hover:border-gray-300 hover:bg-gray-100 transition-colors"
        >
          {selectedDate || '选择日期'}
          <CalendarIcon className="w-4 h-4 text-gray-400" />
        </button>

        {showDatePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowDatePicker(false)}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-5 w-[340px]" onClick={(e) => e.stopPropagation()}>
              {/* 月份切换 */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-base font-semibold text-gray-900">
                  {pickerYear}年{String(pickerMonth + 1).padStart(2, '0')}月
                </span>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* 星期标题 */}
              <div className="grid grid-cols-7 mb-2">
                {weekDays.map((d) => (
                  <div key={d} className="text-center text-xs text-gray-400 py-1">
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
                      className={`h-9 w-9 mx-auto rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary text-white'
                          : cellIsToday
                            ? 'bg-gray-100 text-primary'
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
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
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
                  className="text-sm text-primary font-medium hover:text-accent transition-colors"
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