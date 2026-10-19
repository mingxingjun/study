import { useNavigate } from 'react-router-dom';
import { Upload, Play, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

/**
 * 今日任务 - Refined Editorial
 */
const TodayTasks = ({ todayTasks, hasMaterials }) => {
  const navigate = useNavigate();

  if (!hasMaterials) {
    return (
      <Card className="card-hover p-6" elevated>
        <div className="py-12 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border border-dashed border-primary/25 bg-gray-50">
            <Upload className="h-6 w-6 text-gray-400" strokeWidth={1.8} />
          </div>
          <h3 className="mb-2 font-serif text-xl text-primary">
            还没有上传复习资料
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed">
            上传资料后，我将为你制定个性化的复习计划
          </p>
          <Button onClick={() => navigate('/upload')}>
            <Upload className="w-4 h-4" />
            上传资料
          </Button>
        </div>
      </Card>
    );
  }

  if (!todayTasks || todayTasks.length === 0) {
    return (
      <Card className="card-hover p-6" elevated>
        <div className="py-12 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center bg-primary">
            <Play className="h-6 w-6 text-accent" strokeWidth={2} />
          </div>
          <h3 className="mb-2 font-serif text-xl text-primary">
            今日任务已完成
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed">
            明天会有新的复习任务等着你
          </p>
          <Button variant="secondary" onClick={() => navigate('/quiz')}>
            <Play className="w-4 h-4" />
            继续刷题
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-hover p-6" elevated>
      <div className="mb-5 flex items-center justify-between">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400">
          <span className="h-1.5 w-1.5 bg-accent" />
          Daily Plan
        </span>
        <span className="font-mono text-[11px] tabular-nums text-gray-500">
          <span className="font-medium text-primary">{todayTasks.length}</span> 项待复习
        </span>
      </div>

      <div className="space-y-3 mb-7">
        {todayTasks.map((task, idx) => {
          const percentage = Math.min(
            100,
            Math.round((task.completedCount / task.targetCount) * 100)
          );
          const isDone = task.completedCount >= task.targetCount;
          return (
            <div
              key={task.id}
              className="flex items-center gap-4 border border-primary/12 bg-gray-50/60 p-4 transition-colors duration-150 hover:border-primary/40 hover:bg-white"
            >
              <span
                className="font-serif text-lg text-gray-300 tabular-nums w-6 flex-shrink-0"
                style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 }}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">{task.name}</h3>
                <p className="font-mono text-[10px] text-gray-500 mt-0.5 tabular-nums">
                  目标 {task.targetCount} 题
                </p>
              </div>

              <div className="w-28 flex-shrink-0">
                <div className="h-1.5 w-full overflow-hidden bg-gray-200/70">
                  <div
                    className={`h-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isDone ? 'bg-accent' : 'bg-primary'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="font-mono text-[10px] text-gray-500 mt-1.5 text-right tabular-nums">
                  <span className={isDone ? 'text-accent-dark font-medium' : ''}>
                    {task.completedCount}
                  </span>
                  /{task.targetCount}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Button className="w-full" onClick={() => navigate('/quiz')}>
        <Play className="w-4 h-4" />
        开始刷题
        <ArrowRight className="w-4 h-4" />
      </Button>
    </Card>
  );
};

export default TodayTasks;
