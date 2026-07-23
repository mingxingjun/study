import { useNavigate } from 'react-router-dom';
import { BookOpen, Filter, Clock, Check } from 'lucide-react';
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

  // 空状态 - 编辑式留白卡片
  if (wrongQuestions.length === 0) {
    return (
      <Card className="text-center min-h-[400px] flex flex-col items-center justify-center card-hover p-8" elevated>
        {/* 装饰性大号序号 */}
        <div className="relative mb-8">
          <span
            className="font-serif text-gray-200 block"
            style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1, fontSize: '5rem' }}
          >
            00
          </span>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-px bg-accent" />
        </div>
        <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent-dark mb-3">
          No Records
        </p>
        <h3 className="text-2xl text-primary mb-3" style={{ fontWeight: 400 }}>
          暂无错题记录
        </h3>
        <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">
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
    <Card className="overflow-hidden card-hover" elevated>
      {/* 卡片头部 - 衬线标题 + 计数 + 筛选开关 */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3 min-w-0">
          <h2 className="text-lg text-primary font-serif" style={{ fontWeight: 500 }}>
            错题列表
          </h2>
          <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
            {wrongQuestions.length} ITEMS
          </span>
        </div>
        {wrongQuestions.length > 0 && (
          <button
            onClick={onTogglePrioritize}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer border ${
              prioritizeDue
                ? 'bg-accent text-primary border-accent/40 shadow-gold'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
            }`}
            title="优先显示今日到期/逾期的错题"
          >
            <Filter size={11} strokeWidth={2} />
            优先到期
          </button>
        )}
      </div>

      {/* 列表区 - 限高可滚动 */}
      <div className="max-h-[640px] overflow-y-auto">
        {wrongQuestions.map((wq, idx) => {
          const question = wq.question;
          const kp = sampleKnowledgePoints.find(k => k.id === question.knowledgePointId);
          const isSelected = selectedId === wq.id;
          const isMastered = wq.mastered;
          const nextReviewDate = getNextReviewDate(wq, answerRecords);
          const isDue = !isMastered && nextReviewDate <= today;
          const reviewText = getReviewIntervalText(wq, answerRecords);
          const numberStr = String(idx + 1).padStart(2, '0');

          return (
            <button
              key={wq.id}
              onClick={() => onSelect(wq)}
              className={`w-full text-left px-6 py-5 transition-colors duration-200 border-b border-gray-100 last:border-b-0 cursor-pointer relative ${
                isSelected
                  ? 'bg-warm-50'
                  : 'hover:bg-gray-50/60'
              }`}
            >
              {/* 选中态左侧金色细线 */}
              {isSelected && (
                <span className="absolute left-0 top-0 bottom-0 w-px bg-accent" />
              )}
              <div className="flex items-start gap-4">
                {/* 大号衬线编号 */}
                <span
                  className={`font-serif tabular-nums flex-shrink-0 mt-0.5 ${
                    isSelected ? 'text-accent-dark' : 'text-gray-300'
                  }`}
                  style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1, fontSize: '1.5rem' }}
                >
                  {numberStr}
                </span>
                <div className="flex-1 min-w-0">
                  {/* 题干预览 */}
                  <p
                    className={`text-sm leading-relaxed line-clamp-2 ${
                      isMastered ? 'text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    {question.question}
                  </p>

                  {/* 标签行 - 知识点 / 复习状态 / 掌握状态 */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {kp && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-mono uppercase tracking-wider">
                        {kp.name}
                      </span>
                    )}
                    {!isMastered && (
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${
                          isDue
                            ? 'bg-accent/10 text-accent-dark border-accent/30'
                            : 'bg-white text-gray-500 border-gray-200'
                        }`}
                      >
                        <Clock size={10} strokeWidth={2} />
                        {reviewText}
                      </span>
                    )}
                    {isMastered && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-primary text-white rounded text-[10px] font-mono uppercase tracking-wider">
                        <Check size={10} strokeWidth={2.5} />
                        Mastered
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
