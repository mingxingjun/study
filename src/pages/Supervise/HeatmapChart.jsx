import { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { formatDate } from '../../utils/date';

// 深海蓝热力色阶（与设计系统一致）
const COLORS = [
  '#e9f0f6', // 无学习
  '#d5e1ec', // 少量
  '#bdcddc', // 较少
  '#93a6ba', // 中等
  '#768294', // 较多
  '#0d2349'  // 大量
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
        <div className="border border-dashed border-primary/25 bg-warm-50/60 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-primary/15 bg-white">
            <Calendar size={22} className="text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="mb-1.5 font-serif text-base text-gray-700">
            暂无打卡记录
          </p>
          <p className="font-mono text-xs tracking-wide text-gray-400">
            每日打卡和专注学习后，热力图将逐渐点亮
          </p>
        </div>
      )}

      {hasData && (
        <div className="inline-block min-w-full">
          {/* 月份标签 - mono 字体 */}
        <div className="flex items-end mb-2.5 ml-8">
          {monthLabels.map((label, i) => (
            <div
              key={i}
              className="text-[11px] text-gray-500 font-mono tracking-wide"
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
          <div className="mr-2.5 flex flex-col gap-[4px]">
            {WEEKDAYS.map((day, i) => (
              <div
                key={i}
                className="flex h-[14px] w-5 items-center font-mono text-[10px] text-gray-400"
              >
                {i % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>

          {/* 格子网格 */}
          <div className="flex gap-[4px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[4px]">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`relative h-[14px] w-[14px] cursor-pointer rounded-[2px] transition-all duration-150 hover:z-10 hover:ring-2 hover:ring-primary ${day ? 'heat-cell' : ''}`}
                    style={{
                      backgroundColor: day ? getColorByMinutes(day.minutes) : 'transparent',
                      opacity: day ? 1 : 0,
                      '--d': weekIndex * 7 + dayIndex
                    }}
                    onMouseEnter={() => day && setHoveredDate(day)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    {/* Tooltip - 硬边卡片 */}
                    {hoveredDate === day && (
                      <div className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap border-2 border-primary bg-white px-2.5 py-1.5 font-mono text-[11px] tracking-wide text-primary shadow-md">
                        {formatTooltip(day)}
                        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-primary"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* 图例 - mono 标签 + 色阶 */}
        <div className="mt-5 flex items-center justify-end gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-gray-400">Less</span>
          <div className="flex gap-[4px]">
            {COLORS.map((color, i) => (
              <div
                key={i}
                className="h-[14px] w-[14px] rounded-[2px] border border-primary/15"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-gray-400">More</span>
        </div>
      </div>
      )}
    </div>
  );
};

export default HeatmapChart;
