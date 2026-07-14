import { RotateCcw, CheckCircle, ArrowLeft, Check } from 'lucide-react';
import Button from '../../components/ui/Button';

const WrongQuestionActions = ({
  mastered,
  onPracticeAgain,
  onMarkMastered,
  onBack
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" onClick={onBack}>
        <ArrowLeft size={16} />
        返回列表
      </Button>
      <Button variant="secondary" onClick={onPracticeAgain}>
        <RotateCcw size={16} />
        再练一次
      </Button>
      {!mastered && (
        <Button onClick={onMarkMastered}>
          <CheckCircle size={16} />
          标记已掌握
        </Button>
      )}
      {mastered && (
        <div className="flex items-center gap-1.5 text-gray-500 text-sm px-3 py-2">
          <Check size={16} />
          已掌握
        </div>
      )}
    </div>
  );
};

export default WrongQuestionActions;
