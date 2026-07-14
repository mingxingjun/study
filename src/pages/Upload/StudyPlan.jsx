import { useState, useMemo } from 'react';
import { Calendar, List, CheckCircle2, Circle, Clock, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { getToday } from '../../utils/date';

const StudyPlan = ({ plan, dueReviewQuestions = [] }) => {
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  const tasksByDate = useMemo(() => {
    if (!plan || !plan.knowledgePoints) return {};
    const grouped = {};
    const today = getToday();

    plan.knowledgePoints.forEach(kp => {
      const date = kp.scheduledDate ? kp.scheduledDate.split('T')[0] : null;
      if (date) {
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push({
          ...kp,
          targetQuestions: Math.floor(Math.random() * 8) + 5,
          status: 'pending'
        });
      }
    });

    if (dueReviewQuestions.length > 0) {
      if (!grouped[today]) grouped[today] = [];
      grouped[today].unshift({
        id: 'review-due-today',
        name: `间隔重复复习（${dueReviewQuestions.length} 道错题）`,
        targetQuestions: dueReviewQuestions.length,
        estimatedTime: Math.max(10, dueReviewQuestions.length * 3),
        status: 'pending',
        isReviewTask: true
      });
    }

    return grouped;
  }, [plan, dueReviewQuestions]);

  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days = [];

    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        day: i,
        date: dateStr,
        hasTasks: tasksByDate[dateStr] && tasksByDate[dateStr].length > 0,
        isToday: dateStr === new Date().toISOString().split('T')[0]
      });
    }

    return days;
  }, [currentMonth, tasksByDate]);

  const allTasksSorted = useMemo(() => {
    return Object.entries(tasksByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([date, tasks]) => tasks.map(t => ({ ...t, date })));
  }, [tasksByDate]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, color: 'text-gray-50', bg: 'bg-primary', node: 'bg-primary' };
      case 'in-progress':
        return { icon: Clock, color: 'text-gray-700', bg: 'bg-gray-100', node: 'bg-gray-300' };
      default:
        return { icon: Circle, color: 'text-gray-400', bg: 'bg-gray-50', node: 'bg-white border-2 border-gray-300' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in-progress': return '进行中';
      default: return '待复习';
    }
  };

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const prevMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setCurrentMonth(prev => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [, m, d] = dateStr.split('-');
    return `${m}.${d}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-mono font-medium text-primary">复习计划</h3>
          {allTasksSorted.length > 0 && (
            <span className="text-xs text-gray-400 font-mono">{allTasksSorted.length} 项任务</span>
          )}
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              viewMode === 'calendar' ? 'bg-white text-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar size={13} />
            日历
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              viewMode === 'list' ? 'bg-white text-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={13} />
            时间轴
          </button>
        </div>
      </div>

      {viewMode === 'calendar' && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/60">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <h4 className="text-sm font-mono font-medium text-primary">
              {currentMonth.year}年 {monthNames[currentMonth.month]}
            </h4>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer">
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-[11px] text-gray-400 py-1 font-mono">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => (
              <div key={idx} className="aspect-square">
                {day && (
                  <button
                    onClick={() => setSelectedDate(day.date)}
                    className={`w-full h-full flex flex-col items-center justify-center rounded-lg text-sm transition-colors relative cursor-pointer ${
                      selectedDate === day.date
                        ? 'bg-primary text-gray-50'
                        : day.isToday
                        ? 'bg-gray-200 text-primary font-medium'
                        : day.hasTasks
                        ? 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200/60'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className={day.isToday && selectedDate !== day.date ? 'font-mono font-medium text-xs sm:text-sm' : 'font-mono text-xs sm:text-sm'}>
                      {day.day}
                    </span>
                    {day.hasTasks && (
                      <div className={`w-1 h-1 rounded-full mt-0.5 ${
                        selectedDate === day.date ? 'bg-gray-50' : 'bg-gray-900'
                      }`} />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          {selectedDate && tasksByDate[selectedDate] && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="text-xs font-mono text-gray-500 mb-3">
                {selectedDate} · {tasksByDate[selectedDate].length} 项任务
              </h5>
              <div className="space-y-2">
                {tasksByDate[selectedDate].map((task, idx) => {
                  const status = getStatusStyle(task.status);
                  const StatusIcon = task.isReviewTask ? RefreshCw : status.icon;
                  const nodeClass = task.isReviewTask ? 'bg-accent text-primary' : status.node;
                  return (
                    <div key={idx} className="bg-white rounded-xl p-3 flex items-center gap-3 border border-gray-200/60">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${nodeClass}`}>
                        <StatusIcon size={15} className={task.isReviewTask ? 'text-primary' : status.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">目标 {task.targetQuestions} 题</p>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.color}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedDate && !tasksByDate[selectedDate] && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-400 font-mono">
              该日期暂无复习任务
            </div>
          )}
        </div>
      )}

      {viewMode === 'list' && (
        <div>
          {allTasksSorted.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-10 text-center border border-dashed border-gray-200">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 border border-gray-200/60">
                <Calendar size={22} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">暂无复习计划</p>
            </div>
          ) : (
            <div className="relative pl-8">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />
              <div className="space-y-4">
                {allTasksSorted.map((task, idx) => {
                  const status = getStatusStyle(task.status);
                  const StatusIcon = task.isReviewTask ? RefreshCw : status.icon;
                  const nodeClass = task.isReviewTask ? 'bg-accent text-primary' : status.node;
                  const iconColor = task.isReviewTask ? 'text-primary' : status.color;
                  return (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[22px] top-4 w-3 h-3 rounded-full ${nodeClass} ring-4 ring-gray-50`} />
                      <div className="bg-white rounded-xl p-4 border border-gray-200/60 card-hover">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                            {formatDate(task.date)}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.color}`}>
                            {getStatusLabel(task.status)}
                          </span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <StatusIcon size={16} className={`${iconColor} flex-shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{task.name}</p>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                              <span className="font-mono">目标 {task.targetQuestions} 题</span>
                              <span className="text-gray-300">·</span>
                              <span className="font-mono">{task.estimatedTime} min</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyPlan;
