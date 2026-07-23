import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { generateDateRange } from '../../utils/date';

const StatsCharts = ({ answerRecords = [], dailyRecords = {} }) => {
  const chartData = useMemo(() => {
    const dates = generateDateRange(7);
    return dates.map(date => {
      const dayRecords = answerRecords.filter(r => r.date === date);
      const totalQuestions = dayRecords.length;
      const correctCount = dayRecords.filter(r => r.isCorrect).length;
      const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
      const dayRecord = dailyRecords[date] || {};
      const focusMinutes = dayRecord.focusMinutes || 0;

      const d = new Date(date);
      const month = d.getMonth() + 1;
      const day = d.getDate();

      return {
        date: `${month}/${day}`,
        fullDate: date,
        复习时长: focusMinutes,
        正确率: accuracy
      };
    });
  }, [answerRecords, dailyRecords]);

  // 自定义 Tooltip — 编辑风极简卡片
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3">
          <p className="text-[10px] font-mono text-gray-400 mb-2 tracking-[0.2em] uppercase">
            {label}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2.5 text-sm">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-500 font-sans">{entry.name}</span>
              <span
                className="font-serif font-medium text-primary ml-auto tabular-nums"
                style={{ letterSpacing: '-0.02em' }}
              >
                {entry.value}{entry.name === '正确率' ? '%' : 'min'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // 自定义图例 — 极简文字样式
  const renderLegend = (value) => (
    <span className="text-[11px] text-gray-500 font-mono tracking-[0.15em] uppercase px-1">
      {value}
    </span>
  );

  const hasData = chartData.some(d => d.复习时长 > 0 || d.正确率 > 0);

  return (
    <div className="w-full">
      {/* 标题区 - 衬线主标 + mono 副标 */}
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h3 className="font-serif text-lg text-primary" style={{ fontWeight: 500 }}>
            最近 7 天学习数据
          </h3>
          <p className="text-[11px] text-gray-400 font-mono tracking-wide mt-1">
            Focus minutes · Accuracy
          </p>
        </div>
        <span className="text-[10px] text-gray-400 font-mono tracking-[0.2em] uppercase">
          7 Days
        </span>
      </div>

      {!hasData && (
        <div className="bg-warm-50/60 rounded-xl p-12 text-center border border-dashed border-gray-200">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200/60 shadow-xs">
            <TrendingUp size={22} className="text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="font-serif text-base text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
            暂无学习数据
          </p>
          <p className="text-xs text-gray-400 font-mono tracking-wide">
            开始刷题或专注后，趋势图将在这里显示
          </p>
        </div>
      )}

      {/* 图表 */}
      {hasData && (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 12, left: -8, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="#e8e5e0"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: '#837b71', fontSize: 11, fontFamily: 'Fira Code' }}
              axisLine={{ stroke: '#e8e5e0' }}
              tickLine={false}
              dy={8}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#837b71', fontSize: 11, fontFamily: 'Fira Code' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fill: '#837b71', fontSize: 11, fontFamily: 'Fira Code' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d6d1ca', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Legend
              wrapperStyle={{ paddingTop: '16px' }}
              iconType="circle"
              formatter={renderLegend}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="复习时长"
              stroke="#171717"
              strokeWidth={2}
              dot={{ fill: '#171717', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#171717', stroke: '#faf9f7', strokeWidth: 2 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="正确率"
              stroke="#c9a227"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ fill: '#c9a227', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#c9a227', stroke: '#faf9f7', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default StatsCharts;
