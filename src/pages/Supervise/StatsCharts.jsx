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

  // 自定义 Tooltip — 极简灰阶卡片
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200/80 rounded-xl shadow-lg px-3.5 py-2.5">
          <p className="text-xs font-mono text-gray-500 mb-1.5 tracking-wider">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}</span>
              <span className="font-mono font-medium text-gray-900 ml-auto tabular-nums">
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
    <span className="text-xs text-gray-600 font-mono tracking-wide px-1">{value}</span>
  );

  const hasData = chartData.some(d => d.复习时长 > 0 || d.正确率 > 0);

  return (
    <div className="w-full">
      {/* 标题区 */}
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h3 className="font-mono text-lg font-semibold text-primary">学习趋势</h3>
          <p className="text-xs text-gray-500 mt-0.5">最近 7 天数据</p>
        </div>
        <span className="text-[10px] text-gray-400 font-mono tracking-[0.2em] uppercase">
          7 DAYS
        </span>
      </div>

      {!hasData && (
        <div className="bg-gray-50 rounded-2xl p-10 text-center border border-dashed border-gray-200">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 border border-gray-200/60">
            <TrendingUp size={22} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">暂无学习数据</p>
          <p className="text-xs text-gray-400 mt-1">开始刷题或专注后，趋势图将在这里显示</p>
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
              tick={{ fill: '#837b71', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: '#e8e5e0' }}
              tickLine={false}
              dy={8}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#837b71', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fill: '#837b71', fontSize: 11, fontFamily: 'JetBrains Mono' }}
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
              stroke="#1a1815"
              strokeWidth={2}
              dot={{ fill: '#1a1815', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#1a1815', stroke: '#faf9f7', strokeWidth: 2 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="正确率"
              stroke="#b0a9a0"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ fill: '#b0a9a0', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#b0a9a0', stroke: '#faf9f7', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default StatsCharts;
