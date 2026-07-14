import { useNavigate } from 'react-router-dom';
import { Trophy, Target, Clock, ArrowRight, Home, RotateCcw } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

/**
 * 答题总结组件
 * @param {Object} props
 * @param {number} props.totalQuestions - 总题数
 * @param {number} props.correctCount - 正确数
 * @param {number} props.timeUsed - 用时（秒）
 * @param {Function} props.onRestart - 重新开始回调
 */
const QuizSummary = ({
  totalQuestions,
  correctCount,
  timeUsed,
  onRestart
}) => {
  const navigate = useNavigate();
  const accuracy = totalQuestions > 0
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) {
      return `${secs}秒`;
    }
    return `${mins}分${secs}秒`;
  };

  const getEncouragement = () => {
    if (accuracy >= 90) {
      return '太棒了！你对这些知识点掌握得非常扎实，继续保持这种状态！';
    } else if (accuracy >= 70) {
      return '做得不错！大部分知识点都掌握了，再巩固一下薄弱环节会更好。';
    } else if (accuracy >= 50) {
      return '还需要加油哦！建议多看看错题解析，把知识点吃透。';
    } else {
      return '别灰心！学习就是一个不断犯错和进步的过程，慢慢来。';
    }
  };

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (accuracy / 100) * circumference;

  return (
    <Card className="p-8 sm:p-12 text-center card-hover">
      <div className="mb-8 stagger-1">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-5">
          <Trophy className="text-white" size={28} strokeWidth={2} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-primary">练习完成</h1>
        <p className="mt-2 text-sm text-gray-500">本次练习的表现如下</p>
      </div>

      <div className="relative inline-block mb-8 stagger-2">
        <svg width="160" height="160" className="transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#f0f0f0"
            strokeWidth="8"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#171717"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-4xl font-bold text-gray-900 tabular-nums">
            {accuracy}
            <span className="text-2xl text-gray-400">%</span>
          </span>
          <span className="text-xs text-gray-500 mt-2 tracking-wider">正确率</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8 stagger-3">
        <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-center gap-2 text-gray-400 mb-3">
            <Target size={15} />
            <span className="text-xs tracking-wide">总题数</span>
          </div>
          <p className="font-mono text-2xl font-bold text-gray-900 tabular-nums">{totalQuestions}</p>
        </div>

        <div className="p-5 bg-primary rounded-xl">
          <div className="flex items-center justify-center gap-2 text-gray-400 mb-3">
            <Trophy size={15} />
            <span className="text-xs tracking-wide">正确数</span>
          </div>
          <p className="font-mono text-2xl font-bold text-white tabular-nums">{correctCount}</p>
        </div>

        <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-center gap-2 text-gray-400 mb-3">
            <Clock size={15} />
            <span className="text-xs tracking-wide">用时</span>
          </div>
          <p className="font-mono text-2xl font-bold text-gray-900 tabular-nums">{formatTime(timeUsed)}</p>
        </div>
      </div>

      <div className="p-5 bg-gray-50 rounded-xl mb-8 border border-gray-200 stagger-4">
        <p className="text-gray-700 leading-relaxed text-sm">{getEncouragement()}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center stagger-5">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => navigate('/wrong-book')}
        >
          查看错题
          <ArrowRight size={18} />
        </Button>
        <Button
          size="lg"
          onClick={() => navigate('/')}
        >
          <Home size={18} />
          返回首页
        </Button>
      </div>

      {onRestart && (
        <button
          onClick={onRestart}
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <RotateCcw size={14} />
          再练一次
        </button>
      )}
    </Card>
  );
};

export default QuizSummary;
