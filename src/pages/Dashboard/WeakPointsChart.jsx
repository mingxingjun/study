import { AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';

/**
 * 薄弱知识点条形图 - 信号橙/墨黑/暖灰三档
 */
const WeakPointsChart = ({ weakPoints }) => {
  if (!weakPoints || weakPoints.length === 0) {
    return (
      <Card className="card-hover p-6" elevated>
        <div className="flex min-h-48 flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center border border-dashed border-primary/25 bg-gray-50">
            <AlertCircle className="h-5 w-5 text-gray-400" strokeWidth={1.8} />
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-gray-500">
            暂无答题数据，开始刷题后将显示薄弱知识点分析
          </p>
        </div>
      </Card>
    );
  }

  const getLevel = (rate) => {
    if (rate >= 60) return { label: '严重薄弱', color: 'bg-primary', text: 'text-primary' };
    if (rate >= 30) return { label: '需要巩固', color: 'bg-accent', text: 'text-accent-dark' };
    return { label: '基本掌握', color: 'bg-gray-300', text: 'text-gray-400' };
  };

  const maxRate = Math.max(...weakPoints.map(p => p.errorRate), 100);

  return (
    <Card className="card-hover p-6" elevated>
      <div className="mb-5 flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400">
          <span className="h-1.5 w-1.5 bg-accent" />
          Error Rate
        </span>
        <span className="font-mono text-[11px] tabular-nums text-gray-400">
          共 <span className="text-primary">{weakPoints.length}</span> 项
        </span>
      </div>

      <div className="space-y-5">
        {weakPoints.map((point, idx) => {
          const level = getLevel(point.errorRate);
          const barWidth = Math.max(2, (point.errorRate / maxRate) * 100);

          return (
            <div key={point.id} className="group">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-6 flex-shrink-0 font-serif text-base tabular-nums text-gray-300">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate text-sm font-medium text-gray-900">
                    {point.name}
                  </span>
                </div>
                <div className="ml-2 flex flex-shrink-0 items-baseline gap-1">
                  <span className={`font-serif text-lg tabular-nums ${level.text}`}>
                    {point.errorRate}
                  </span>
                  <span className="font-mono text-[10px] text-gray-400">%</span>
                </div>
              </div>

              <div className="ml-9 h-1.5 w-full overflow-hidden bg-gray-100">
                <div
                  className={`bar-fill h-full ${level.color} transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-primary/10 pt-5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-primary" />
          <span className="text-[11px] text-gray-500">严重薄弱 (≥60%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-accent" />
          <span className="text-[11px] text-gray-500">需要巩固 (30-59%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-gray-300" />
          <span className="text-[11px] text-gray-500">基本掌握 (&lt;30%)</span>
        </div>
      </div>
    </Card>
  );
};

export default WeakPointsChart;
