import { useNavigate } from 'react-router-dom';
import { Upload, Play, CheckCircle2, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

/**
 * 今日任务 - Refined Editorial
 */
const TodayTasks = ({ todayTasks, hasMaterials }) => {
  const navigate = useNavigate();

  if (!hasMaterials) {
    return (
      <Card className="card-hover p-7" elevated>
        <SectionHeader icon={<CheckCircle2 className="w-4 h-4 text-gray-500" strokeWidth={2} />} title="今日任务" />
        <div className="text-center py-12">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-gray-200/60">
            <Upload className="w-6 h-6 text-gray-400" strokeWidth={1.8} />
          </div>
          <h3 className="text-lg font-serif text-primary mb-2" style={{ fontWeight: 500 }}>
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
      <Card className="card-hover p-7" elevated>
        <SectionHeader icon={<CheckCircle2 className="w-4 h-4 text-gray-500" strokeWidth={2} />} title="今日任务" />
        <div className="text-center py-12">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md">
            <Play className="w-6 h-6 text-accent" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-serif text-primary mb-2" style={{ fontWeight: 500 }}>
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
    <Card className="card-hover p-7" elevated>
      <div className="flex items-center justify-between mb-7">
        <SectionHeader
          icon={<CheckCircle2 className="w-4 h-4 text-gray-500" strokeWidth={2} />}
          title="今日任务"
          inline
        />
        <span className="font-mono text-[11px] text-gray-500 tabular-nums">
          <span className="text-primary font-medium">{todayTasks.length}</span> 项待复习
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
              className="flex items-center gap-4 p-4 bg-gray-50/60 rounded-xl border border-gray-200/60 hover:border-gray-300/60 transition-colors duration-200"
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
                <div className="w-full h-1.5 bg-gray-200/70 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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

const SectionHeader = ({ icon, title, inline = false }) => (
  <div className={`flex items-center gap-2.5 ${inline ? '' : 'mb-7'}`}>
    <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200/60">
      {icon}
    </div>
    <h2 className="text-lg font-serif text-primary" style={{ fontWeight: 500 }}>
      {title}
    </h2>
  </div>
);

export default TodayTasks;
