import { useNavigate } from 'react-router-dom';
import { BookX, BookOpen, Filter, Clock } from 'lucide-react';
import { sampleKnowledgePoints } from '../../mock/sampleData';
import { getNextReviewDate, getReviewIntervalText } from '../../utils/reviewSchedule';
import { getToday } from '../../utils/date';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

/**
 * 错题列表组件
 * @param {Object} props
 * @param {Array} props.wrongQuestions - 错题列表
 * @param {Array} props.answerRecords - 答题记录
 * @param {string|null} props.selectedId - 当前选中的错题 ID
 * @param {Function} props.onSelect - 选择错题回调
 * @param {boolean} props.prioritizeDue - 是否优先显示到期错题
 * @param {Function} props.onTogglePrioritize - 切换优先到期排序
 */
const WrongQuestionList = ({
  wrongQuestions,
  answerRecords,
  selectedId,
  onSelect,
  prioritizeDue,
  onTogglePrioritize
}) => {
  const navigate = useNavigate();
  const today = getToday();

  if (wrongQuestions.length === 0) {
    return (
      <Card className="text-center min-h-[400px] flex flex-col items-center justify-center card-hover">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-gray-200">
          <BookX className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">暂无错题记录</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed">
          答错的题目会自动收录到这里，开始刷题来积累错题吧
        </p>
        <Button onClick={() => navigate('/quiz')}>
          <BookOpen className="w-4 h-4" />
          开始刷题
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden card-hover">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-primary">错题列表</h2>
          <p className="text-xs text-gray-400 mt-1 font-mono">{wrongQuestions.length} 道错题</p>
        </div>
        {wrongQuestions.length > 0 && (
          <button
            onClick={onTogglePrioritize}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
              prioritizeDue
                ? 'bg-accent text-primary'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            title="优先显示今日到期/逾期的错题"
          >
            <Filter size={12} />
            优先复习到期
          </button>
        )}
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {wrongQuestions.map((wq, idx) => {
          const question = wq.question;
          const kp = sampleKnowledgePoints.find(k => k.id === question.knowledgePointId);
          const isSelected = selectedId === wq.id;
          const isMastered = wq.mastered;
          const nextReviewDate = getNextReviewDate(wq, answerRecords);
          const isDue = !isMastered && nextReviewDate <= today;
          const reviewText = getReviewIntervalText(wq, answerRecords);

          return (
            <button
              key={wq.id}
              onClick={() => onSelect(wq)}
              className={`w-full text-left p-5 transition-colors duration-150 border-b border-gray-100 last:border-b-0 cursor-pointer ${
                isSelected
                  ? 'bg-primary/[0.03] border-l-2 border-l-primary'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-gray-400 tabular-nums w-5 flex-shrink-0 mt-0.5">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed line-clamp-2 ${isMastered ? 'text-gray-400' : 'text-gray-700'}`}>
                    {question.question}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {kp && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">
                        {kp.name}
                      </span>
                    )}
                    {!isMastered && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                        isDue ? 'bg-accent text-primary' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Clock size={10} />
                        {reviewText}
                      </span>
                    )}
                    {isMastered && (
                      <span className="px-2 py-0.5 bg-primary text-white rounded text-[10px]">
                        已掌握
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default WrongQuestionList;
