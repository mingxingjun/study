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
      {/* 卡片头部 - 展示字标题 + 计数 + 筛选开关 */}
      <div className="flex items-center justify-between gap-4 border-b border-primary/10 px-6 py-5">
        <div className="flex min-w-0 items-baseline gap-3">
          <h2 className="font-serif text-lg text-primary">
            错题列表
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-400">
            {wrongQuestions.length} ITEMS
          </span>
        </div>
        {wrongQuestions.length > 0 && (
          <button
            onClick={onTogglePrioritize}
            className={`flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-150 ${
              prioritizeDue
                ? 'border-primary bg-accent-light text-primary'
                : 'border-primary/15 bg-white text-gray-500 hover:border-primary hover:text-primary'
            }`}
            title="优先显示今日到期/逾期的错题"
          >
            <Filter size={11} strokeWidth={2} />
            优先到期
          </button>
        )}
      </div>

      {/* 列表区 - 限高可滚动 */}
      <div className="scrollbar-dark max-h-[640px] overflow-y-auto">
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
              style={{ '--d': idx }}
              className={`cv-row row-in relative w-full cursor-pointer border-b border-primary/10 px-6 py-5 text-left transition-colors duration-150 last:border-b-0 ${
                isSelected
                  ? 'bg-warm-50'
                  : 'hover:bg-gray-50/60'
              }`}
            >
              {/* 选中态左侧信号橙竖条 */}
              {isSelected && (
                <span className="absolute bottom-0 left-0 top-0 w-[3px] bg-accent" />
              )}
              <div className="flex items-start gap-4">
                {/* 大号展示编号 */}
                <span
                  className={`mt-0.5 flex-shrink-0 font-serif text-2xl tabular-nums ${
                    isSelected ? 'text-accent-dark' : 'text-gray-300'
                  }`}
                >
                  {numberStr}
                </span>
                <div className="min-w-0 flex-1">
                  {/* 题干预览 */}
                  <p
                    className={`line-clamp-2 text-sm leading-relaxed ${
                      isMastered ? 'text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    {question.question}
                  </p>

                  {/* 标签行 - 知识点 / 复习状态 / 掌握状态 */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {kp && (
                      <span className="border border-primary/15 bg-gray-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
                        {kp.name}
                      </span>
                    )}
                    {!isMastered && (
                      <span
                        className={`flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] ${
                          isDue
                            ? 'border-accent/40 bg-accent/10 text-accent-dark'
                            : 'border-primary/15 bg-white text-gray-500'
                        }`}
                      >
                        <Clock size={10} strokeWidth={2} />
                        {reviewText}
                      </span>
                    )}
                    {isMastered && (
                      <span className="flex items-center gap-1 border border-primary bg-primary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-white">
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
