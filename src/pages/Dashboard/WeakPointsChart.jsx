import { AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';

/**
 * 薄弱知识点条形图 - 三色分层（黑/金/灰）
 */
const WeakPointsChart = ({ weakPoints }) => {
  if (!weakPoints || weakPoints.length === 0) {
    return (
      <Card className="card-hover p-7" elevated>
        <SectionHeader />
        <div className="flex flex-col items-center justify-center min-h-48 text-center">
          <div className="w-14 h-14 rounded-full border border-dashed border-gray-300 flex items-center justify-center mb-4">
            <AlertCircle className="w-5 h-5 text-gray-400" strokeWidth={1.8} />
          </div>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
            暂无答题数据，开始刷题后将显示薄弱知识点分析
          </p>
        </div>
      </Card>
    );
  }

  const getLevel = (rate) => {
    if (rate >= 60) return { label: '严重薄弱', color: 'bg-primary', text: 'text-primary' };
    if (rate >= 30) return { label: '需要巩固', color: 'bg-accent', text: 'text-accent-dark' };
    return { label: '基本掌握', color: 'bg-gray-400', text: 'text-gray-400' };
  };

  const maxRate = Math.max(...weakPoints.map(p => p.errorRate), 100);

  return (
    <Card className="card-hover p-7" elevated>
      <div className="flex items-center justify-between mb-7">
        <SectionHeader inline />
        <span className="font-mono text-[11px] text-gray-400 tabular-nums">
          共 <span className="text-primary">{weakPoints.length}</span> 项
        </span>
      </div>

      <div className="space-y-5">
        {weakPoints.map((point, idx) => {
          const level = getLevel(point.errorRate);
          const barWidth = Math.max(2, (point.errorRate / maxRate) * 100);

          return (
            <div key={point.id} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="font-serif text-base text-gray-300 tabular-nums w-6 flex-shrink-0"
                    style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm text-gray-900 font-medium truncate">
                    {point.name}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 flex-shrink-0 ml-2">
                  <span className={`font-serif text-lg tabular-nums ${level.text}`} style={{ fontWeight: 500, letterSpacing: '-0.03em' }}>
                    {point.errorRate}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">%</span>
                </div>
              </div>

              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden ml-9">
                <div
                  className={`h-full rounded-full ${level.color} transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="mt-7 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[11px] text-gray-500">严重薄弱 (≥60%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-[11px] text-gray-500">需要巩固 (30-59%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          <span className="text-[11px] text-gray-500">基本掌握 (&lt;30%)</span>
        </div>
      </div>
    </Card>
  );
};

const SectionHeader = ({ inline = false }) => (
  <div className={`flex items-center gap-2.5 ${inline ? '' : 'mb-7'}`}>
    <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200/60">
      <AlertCircle className="w-4 h-4 text-gray-500" strokeWidth={2} />
    </div>
    <h2 className="text-lg font-serif text-primary" style={{ fontWeight: 500 }}>
      薄弱知识点
    </h2>
  </div>
);

export default WeakPointsChart;
