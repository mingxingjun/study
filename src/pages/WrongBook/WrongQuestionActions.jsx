import { RotateCcw, CheckCircle, ArrowLeft, Check } from 'lucide-react';
import Button from '../../components/ui/Button';

/**
 * 错题操作按钮组
 * @param {Object} props
 * @param {boolean} props.mastered - 是否已掌握
 * @param {Function} props.onPracticeAgain - 再练一次回调
 * @param {Function} props.onMarkMastered - 标记已掌握回调
 * @param {Function} props.onBack - 返回列表回调
 */
const WrongQuestionActions = ({
  mastered,
  onPracticeAgain,
  onMarkMastered,
  onBack
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* 左侧：返回 + 再练 */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft size={16} />
          返回列表
        </Button>
        <Button variant="secondary" onClick={onPracticeAgain}>
          <RotateCcw size={16} />
          再练一次
        </Button>
      </div>

      {/* 右侧：掌握状态 / 标记按钮 */}
      <div>
        {!mastered ? (
          <Button onClick={onMarkMastered}>
            <CheckCircle size={16} />
            标记已掌握
          </Button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <Check size={14} className="text-accent-dark" strokeWidth={2.5} />
            <span className="text-xs font-mono uppercase tracking-wider text-accent-dark">
              Mastered
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WrongQuestionActions;
