import { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

/**
 * 答题进度组件
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
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-bold text-gray-900 tabular-nums">
            {String(currentQuestion).padStart(2, '0')}
          </span>
          <span className="text-gray-300 font-mono text-sm">/</span>
          <span className="font-mono text-sm text-gray-500 tabular-nums">
            {String(totalQuestions).padStart(2, '0')}
          </span>
          <span className="ml-2 font-mono text-xs text-gray-400 tabular-nums">
            {Math.round(progressPercent)}%
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={15} className="text-gray-400" />
            <span className="font-mono text-sm tabular-nums">{formatTime(elapsedTime)}</span>
          </div>
          {showEndButton && onEndQuiz && (
            <Button variant="secondary" size="sm" onClick={onEndQuiz}>
              <X size={15} />
              结束练习
            </Button>
          )}
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </Card>
  );
};

export default QuizProgress;
