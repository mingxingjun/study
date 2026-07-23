import { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

/**
 * 答题进度组件
 * 衬线大号题号 + 精致细线进度条 + mono 时间
 * @param {Object} props
 * @param {number} props.currentQuestion - 当前题号（从1开始）
 * @param {number} props.totalQuestions - 总题数
 * @param {number} props.startTime - 开始时间戳
 * @param {Function} [props.onEndQuiz] - 结束练习回调
 * @param {boolean} [props.showEndButton=true] - 是否显示结束练习按钮
 */
const QuizProgress = ({
  currentQuestion,
  totalQuestions,
  startTime,
  onEndQuiz,
  showEndButton = true
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercent = totalQuestions > 0
    ? (currentQuestion / totalQuestions) * 100
    : 0;

  return (
    <Card className="p-6 sm:p-7" elevated>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        {/* 题号视觉焦点 - 衬线大号 01 / 20 */}
        <div className="flex items-baseline gap-2.5">
          <span
            className="font-serif text-4xl text-primary tabular-nums"
            style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 }}
          >
            {String(currentQuestion).padStart(2, '0')}
          </span>
          <span className="font-serif text-2xl text-gray-300">/</span>
          <span
            className="font-serif text-xl text-gray-400 tabular-nums"
            style={{ fontWeight: 400, letterSpacing: '-0.03em' }}
          >
            {String(totalQuestions).padStart(2, '0')}
          </span>
          <span className="ml-3 text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] tabular-nums">
            {Math.round(progressPercent)}%
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* 用时 - mono 数据风 */}
          <div className="flex items-center gap-2 text-gray-500">
            <Clock size={14} className="text-accent-dark" strokeWidth={1.5} />
            <span className="font-mono text-sm tabular-nums tracking-tight">{formatTime(elapsedTime)}</span>
          </div>
          {showEndButton && onEndQuiz && (
            <Button variant="secondary" size="sm" onClick={onEndQuiz}>
              <X size={14} strokeWidth={2} />
              结束练习
            </Button>
          )}
        </div>
      </div>

      {/* 精致细线进度条 - 缓动曲线 */}
      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </Card>
  );
};

export default QuizProgress;
