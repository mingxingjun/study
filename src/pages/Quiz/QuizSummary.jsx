import { useNavigate } from 'react-router-dom';
import { Trophy, Target, Clock, ArrowRight, Home, RotateCcw } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import useCountUp from '../../hooks/useCountUp';

/**
 * 数据栅格单元 - 数字滚动动画
 * @param {Object} props
 * @param {React.ReactNode} props.icon - 图标
 * @param {string} props.label - 标签
 * @param {number} props.value - 目标数值
 * @param {string} props.valueClass - 数值文本类名
 * @param {string} props.bgClass - 背景类名
 */
const StatCell = ({ icon, label, value, valueClass, bgClass }) => {
  const animated = useCountUp(value, { duration: 1500 });
  return (
    <div className={`p-6 ${bgClass} text-center`}>
      <div className="flex items-center justify-center gap-2 text-gray-400 mb-3">
        {icon}
        <span className="text-[11px] font-mono uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p
        className={`font-serif text-3xl tabular-nums ${valueClass}`}
        style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 }}
      >
        {animated}
      </p>
    </div>
  );
};

/**
 * 答题总结组件
 * 衬线大号正确率 + 金色环形进度（数字滚动 + 圆环同步填充） + 编辑式数据栅格
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
  // 数字滚动：圆环 strokeDashoffset 基于 animatedAccuracy 逐帧计算，与中心数字同步
  const animatedAccuracy = useCountUp(accuracy, { duration: 1600 });

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
  const strokeDashoffset = circumference - (animatedAccuracy / 100) * circumference;

  return (
    <Card className="p-8 sm:p-12 card-hover" elevated>
      {/* 标题区 - mono 标签 + 衬线大字 + 金色句点 */}
      <div className="mb-10 stagger-1">
        <p className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.25em] mb-3">
          Quiz Completed · 练习结果
        </p>
        <h1 className="text-4xl md:text-5xl text-primary" style={{ fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.035em' }}>
          练习完成<span className="text-accent-dark">.</span>
        </h1>
        <p className="mt-3 text-sm text-gray-500">本次练习的表现如下</p>
      </div>

      {/* 环形正确率 - 衬线大数字 + 金色描边（数字与圆环同步滚动） */}
      <div className="relative inline-block mb-10 stagger-2">
        <svg width="160" height="160" className="transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#f0f0f0"
            strokeWidth="6"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#c9a227"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline">
            <span
              className="font-serif text-5xl text-primary tabular-nums"
              style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 }}
            >
              {animatedAccuracy}
            </span>
            <span className="font-serif text-2xl text-gray-400 ml-0.5">%</span>
          </div>
          <span className="text-[11px] font-mono text-gray-500 mt-2 uppercase tracking-[0.2em]">正确率</span>
        </div>
      </div>

      {/* 数据栅格 - 编辑式三栏（数字滚动） */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-200 rounded-xl overflow-hidden mb-8 stagger-3 border border-gray-200">
        <StatCell
          icon={<Target size={14} strokeWidth={1.5} />}
          label="总题数"
          value={totalQuestions}
          valueClass="text-primary"
          bgClass="bg-white"
        />
        <StatCell
          icon={<Trophy size={14} strokeWidth={1.5} />}
          label="正确数"
          value={correctCount}
          valueClass="text-accent"
          bgClass="bg-primary"
        />
        <div className="p-6 bg-white text-center">
          <div className="flex items-center justify-center gap-2 text-gray-400 mb-3">
            <Clock size={14} strokeWidth={1.5} />
            <span className="text-[11px] font-mono uppercase tracking-[0.2em]">用时</span>
          </div>
          <p
            className="font-serif text-3xl text-primary tabular-nums"
            style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 }}
          >
            {formatTime(timeUsed)}
          </p>
        </div>
      </div>

      {/* 鼓励语 - 编辑式引文 */}
      <div className="p-5 bg-gray-50/60 rounded-xl mb-8 border border-gray-100 stagger-4">
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
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors cursor-pointer"
        >
          <RotateCcw size={14} />
          再练一次
        </button>
      )}
    </Card>
  );
};

export default QuizSummary;
