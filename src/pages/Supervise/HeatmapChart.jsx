import { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { formatDate } from '../../utils/date';

// 暖灰阶热力图色阶（与设计系统一致）
const COLORS = [
  '#f4f2ef', // gray-100 - 无学习
  '#e8e5e0', // gray-200 - 少量
  '#b0a9a0', // gray-400 - 较少
  '#837b71', // gray-500 - 中等
  '#5c554d', // gray-600 - 较多
  '#1a1815'  // gray-900 - 大量
];

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const getColorByMinutes = (minutes) => {
  if (minutes === 0) return COLORS[0];
  if (minutes <= 15) return COLORS[1];
  if (minutes <= 30) return COLORS[2];
  if (minutes <= 60) return COLORS[3];
  if (minutes <= 120) return COLORS[4];
  return COLORS[5];
};

const HeatmapChart = ({ dailyRecords = {} }) => {
  const [hoveredDate, setHoveredDate] = useState(null);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const weeks = [];
    const monthLabels = [];

    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 83);

    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - currentDate.getDay());

    let currentWeek = [];
    let lastMonth = -1;

    while (currentDate <= endDate || currentWeek.length > 0) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = formatDate(currentDate);
      const isInRange = currentDate >= startDate && currentDate <= endDate;

      const month = currentDate.getMonth();
      if (dayOfWeek === 0 && month !== lastMonth && isInRange) {
        monthLabels.push({
          weekIndex: weeks.length,
          label: `${month + 1}月`
        });
        lastMonth = month;
      }

      if (isInRange) {
        const record = dailyRecords[dateStr] || {};
        const focusMinutes = record.focusMinutes || 0;
        currentWeek.push({
          date: dateStr,
          minutes: focusMinutes,
          day: currentDate.getDate(),
          month: currentDate.getMonth() + 1
        });
      } else {
        currentWeek.push(null);
      }

      if (dayOfWeek === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);

      if (currentDate > endDate && currentWeek.length === 0) break;
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return { weeks, monthLabels };
  }, [dailyRecords]);

  const formatTooltip = (dayData) => {
    if (!dayData) return '';
    const { date, minutes } = dayData;
    if (minutes === 0) {
      return `${date}：未学习`;
    }
    return `${date}：学习 ${minutes} 分钟`;
  };

  const hasData = Object.values(dailyRecords).some(r => (r.focusMinutes || 0) > 0);

  return (
    <div className="overflow-x-auto">
      {!hasData && (
        <div className="bg-gray-50 rounded-2xl p-10 text-center border border-dashed border-gray-200">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 border border-gray-200/60">
            <Calendar size={22} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">暂无打卡记录</p>
          <p className="text-xs text-gray-400 mt-1">每日打卡和专注学习后，热力图将逐渐点亮</p>
        </div>
      )}

      {hasData && (
        <div className="inline-block min-w-full">
          {/* 月份标签 */}
        <div className="flex items-end mb-2 ml-8">
          {monthLabels.map((label, i) => (
            <div
              key={i}
              className="text-[11px] text-gray-500 font-mono"
              style={{
                marginLeft: i === 0 ? 0 : '52px',
                width: 'auto'
              }}
            >
              {label.label}
            </div>
          ))}
        </div>

        {/* 热力图主体 */}
        <div className="flex">
          {/* 星期标签 */}
          <div className="flex flex-col gap-[3px] mr-2">
            {WEEKDAYS.map((day, i) => (
              <div
                key={i}
                className="h-[13px] w-5 text-[10px] text-gray-400 flex items-center font-mono"
              >
                {i % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>

          {/* 格子网格 */}
          <div className="flex gap-[3px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="w-[13px] h-[13px] rounded-[3px] cursor-pointer transition-all duration-150 hover:ring-1 hover:ring-gray-400 hover:ring-offset-1 hover:ring-offset-white relative"
                    style={{
                      backgroundColor: day ? getColorByMinutes(day.minutes) : 'transparent',
                      opacity: day ? 1 : 0
                    }}
                    onMouseEnter={() => day && setHoveredDate(day)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    {/* Tooltip */}
                    {hoveredDate === day && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-gray-50 text-[11px] rounded-md whitespace-nowrap z-20 shadow-lg font-mono">
                        {formatTooltip(day)}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* 图例 */}
        <div className="flex items-center justify-end mt-4 gap-1.5">
          <span className="text-[10px] text-gray-500 font-mono tracking-wider">少</span>
          {COLORS.map((color, i) => (
            <div
              key={i}
              className="w-[13px] h-[13px] rounded-[3px]"
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="text-[10px] text-gray-500 font-mono tracking-wider">多</span>
        </div>
      </div>
      )}
    </div>
  );
};

export default HeatmapChart;
