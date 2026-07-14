import { useNavigate } from 'react-router-dom';
import { Upload, Play, CheckCircle2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

/**
 * 今日任务组件
 * @param {Object} props
 * @param {Array} props.todayTasks - 今日任务列表
 * @param {boolean} props.hasMaterials - 是否已上传资料
 */
const TodayTasks = ({ todayTasks, hasMaterials }) => {
  const navigate = useNavigate();

  if (!hasMaterials) {
    return (
      <Card className="card-hover">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
            <CheckCircle2 className="w-4 h-4 text-secondary" />
          </div>
          <h2 className="text-lg font-semibold text-primary">今日任务</h2>
        </div>
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-gray-200">
            <Upload className="w-7 h-7 text-gray-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">
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
      <Card className="card-hover">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
            <CheckCircle2 className="w-4 h-4 text-secondary" />
          </div>
          <h2 className="text-lg font-semibold text-primary">今日任务</h2>
        </div>
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Play className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">
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
    <Card className="card-hover">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
            <CheckCircle2 className="w-4 h-4 text-secondary" />
          </div>
          <h2 className="text-lg font-semibold text-primary">今日任务</h2>
        </div>
        <span className="font-mono text-xs text-gray-500">
          <span className="text-primary font-medium">{todayTasks.length}</span> 个知识点待复习
        </span>
      </div>

      <div className="space-y-4 mb-8">
        {todayTasks.map((task, idx) => {
          const percentage = Math.min(
            100,
            Math.round((task.completedCount / task.targetCount) * 100)
          );
          const isDone = task.completedCount >= task.targetCount;
          return (
            <div
              key={task.id}
              className="flex items-center gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200"
            >
              <span className="font-mono text-xs text-gray-400 tabular-nums w-6 flex-shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">{task.name}</h3>
                <p className="font-mono text-[11px] text-gray-500 mt-0.5">
                  目标 {task.targetCount} 题
                </p>
              </div>

              <div className="w-32 flex-shrink-0">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isDone ? 'bg-primary' : 'bg-secondary'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="font-mono text-[11px] text-gray-500 mt-1.5 text-right tabular-nums">
                  <span className={isDone ? 'text-primary font-medium' : ''}>
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
      </Button>
    </Card>
  );
};

export default TodayTasks;
