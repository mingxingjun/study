import { AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';

/**
 * 薄弱知识点条形图
 * @param {Object} props
 * @param {Array} props.weakPoints - 薄弱知识点数据
 */
const WeakPointsChart = ({ weakPoints }) => {
  if (!weakPoints || weakPoints.length === 0) {
    return (
      <Card className="card-hover">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
            <AlertCircle className="w-4 h-4 text-secondary" />
          </div>
          <h2 className="text-lg font-semibold text-primary">薄弱知识点</h2>
        </div>
        <div className="flex flex-col items-center justify-center min-h-48 text-center">
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
            暂无答题数据，开始刷题后将显示薄弱知识点分析
          </p>
        </div>
      </Card>
    );
  }

  const getLevel = (rate) => {
    if (rate >= 60) return { label: '严重薄弱', dot: 'bg-primary' };
    if (rate >= 30) return { label: '需要巩固', dot: 'bg-secondary' };
    return { label: '基本掌握', dot: 'bg-gray-400' };
  };

  const maxRate = Math.max(...weakPoints.map(p => p.errorRate), 100);

  return (
    <Card className="card-hover">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
            <AlertCircle className="w-4 h-4 text-secondary" />
          </div>
          <h2 className="text-lg font-semibold text-primary">薄弱知识点</h2>
        </div>
        <span className="font-mono text-xs text-gray-400">
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
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[11px] text-gray-400 tabular-nums w-5 flex-shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm text-gray-900 font-medium truncate">
                    {point.name}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${level.dot} flex-shrink-0`} />
                </div>
                <span className="font-mono text-sm font-bold text-gray-900 tabular-nums flex-shrink-0 ml-2">
                  {point.errorRate}
                  <span className="text-gray-400 font-normal text-xs">%</span>
                </span>
              </div>

              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs text-gray-500">严重薄弱 (≥60%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          <span className="text-xs text-gray-500">需要巩固 (30-59%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-xs text-gray-500">基本掌握 (&lt;30%)</span>
        </div>
      </div>
    </Card>
  );
};

export default WeakPointsChart;
