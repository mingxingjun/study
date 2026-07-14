import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useStudyContext } from '../../context/StudyContext';
import { sampleKnowledgePoints } from '../../mock/sampleData';
import { Check, Loader2 } from 'lucide-react';
import AgentAvatar from '../../components/agents/AgentAvatar';
import Card from '../../components/ui/Card';
import QuestionImage from '../../components/ui/QuestionImage';
import MathRenderer from '../../components/MathRenderer';
import FormulaInput from '../../components/FormulaInput';
import useReducedMotion from '../../hooks/useReducedMotion';

/**
 * 题目卡片组件
 * @param {Object} props
 * @param {Object} props.question - 题目数据
 * @param {number} props.questionNumber - 当前题号
 * @param {string|null} props.selectedAnswer - 已选答案
 * @param {Function} props.onAnswerSelect - 选择答案回调
 * @param {boolean} props.disabled - 是否禁用选择
 * @param {boolean} [props.isGrading=false] - 是否正在 AI 批改
 * @param {string} [props.gradingStatus=''] - 批改状态提示
 * @param {Object|null} props.activeAgent - 当前活跃的 Agent
 */
const QuestionCard = ({
  question,
  questionNumber,
  selectedAnswer,
  onAnswerSelect,
  disabled = false,
  isGrading = false,
  gradingStatus = '',
  activeAgent = null,
  showResult = false,
  isCorrect = false
}) => {
  const { state } = useStudyContext();
  const cardRef = useRef(null);
  const reducedMotion = useReducedMotion();

  /**
   * 答题反馈动画
   * 正确：绿色闪烁
   * 错误：水平抖动 + 红色闪烁
   */
  useGSAP(() => {
    if (!cardRef.current || !showResult || reducedMotion) {
      return;
    }

    if (isCorrect) {
      gsap.fromTo(
        cardRef.current,
        { backgroundColor: '#dcfce7' },
        { backgroundColor: '#ffffff', duration: 0.6, ease: 'power2.out', clearProps: 'backgroundColor' }
      );
    } else {
      const tl = gsap.timeline();
      tl.fromTo(
        cardRef.current,
        { x: 0, backgroundColor: '#fee2e2' },
        { x: -6, duration: 0.08, ease: 'power1.inOut' }
      )
        .to(cardRef.current, { x: 6, duration: 0.08, ease: 'power1.inOut' })
        .to(cardRef.current, { x: -6, duration: 0.08, ease: 'power1.inOut' })
        .to(cardRef.current, { x: 6, duration: 0.08, ease: 'power1.inOut' })
        .to(cardRef.current, { x: 0, backgroundColor: '#ffffff', duration: 0.25, ease: 'power2.out', clearProps: 'all' });
    }
  }, [showResult, isCorrect, reducedMotion]);
  // 优先从 Context 中查找知识点（正式模式），回退到示例知识点（演示模式）
  const contextKps = state.plan?.knowledgePoints || [];
  const knowledgePoint = contextKps.find(kp => kp.id === question.knowledgePointId)
    || sampleKnowledgePoints.find(kp => kp.id === question.knowledgePointId);

  const getDifficultyConfig = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return { label: '易', className: 'border-gray-200 text-gray-500 bg-gray-50' };
      case 'medium':
        return { label: '中', className: 'border-gray-300 text-gray-700 bg-gray-100' };
      case 'hard':
        return { label: '难', className: 'border-primary text-white bg-primary' };
      default:
        return { label: '易', className: 'border-gray-200 text-gray-500 bg-gray-50' };
    }
  };

  const getQuestionType = () => {
    if (question.type === 'fillblank' || question.type === 'fill') {
      return 'fill';
    }
    if (question.type === 'truefalse') {
      return 'truefalse';
    }
    if (question.type === 'multiple') {
      return 'multiple';
    }
    if (question.type === 'single' || (question.options && question.options.length > 0)) {
      return 'choice';
    }
    if (question.type === 'essay') {
      return 'essay';
    }
    if (question.type === 'calculation') {
      return 'calculation';
    }
    return 'choice';
  };

  const questionType = getQuestionType();
  const difficultyConfig = getDifficultyConfig(question.difficulty);

  const getStatusText = (status) => {
    switch (status) {
      case 'thinking':
        return '思考中';
      case 'working':
        return '工作中';
      case 'speaking':
        return '正在发言';
      case 'idle':
      default:
        return '待命';
    }
  };

  return (
    <Card ref={cardRef}>
      {activeAgent && (
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center bg-gray-50 rounded-full pl-1.5 pr-3 py-1.5 border border-gray-200">
            <span
              className="w-1 h-5 rounded-full mr-2 flex-shrink-0"
              style={{ backgroundColor: activeAgent.color }}
            />
            <AgentAvatar agent={activeAgent} size="sm" />
            <div className="ml-2 flex items-baseline gap-1.5">
              <span className="text-sm font-medium text-gray-800">
                {activeAgent.name}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{getStatusText(activeAgent.status)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="flex items-center justify-center w-9 h-9 bg-primary text-white rounded-lg text-sm font-mono font-bold flex-shrink-0">
          {String(questionNumber).padStart(2, '0')}
        </span>
        {knowledgePoint && (
          <span className="px-3 py-1 bg-gray-100 text-secondary rounded-full text-xs font-medium border border-gray-200">
            {knowledgePoint.name}
          </span>
        )}
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${difficultyConfig.className}`}>
          {difficultyConfig.label}
        </span>
      </div>

      <h2 className="text-xl font-medium text-gray-900 mb-6 leading-relaxed">
        <MathRenderer text={question.question} />
      </h2>

      {question.image && (
        <div className="mb-6">
          <QuestionImage src={question.image} alt="题目图片" />
        </div>
      )}

      {questionType === 'choice' && (
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const optionLetter = option.charAt(0);
            const isSelected = selectedAnswer === optionLetter;

            return (
              <button
                key={index}
                onClick={() => !disabled && onAnswerSelect(optionLetter)}
                disabled={disabled}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-150 active:scale-[0.99] ${
                  isSelected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                } ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    className={`flex items-center justify-center w-11 h-11 rounded-lg text-sm font-mono font-bold flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-white text-gray-900'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {optionLetter}
                  </span>
                  <span className="text-base leading-relaxed break-words min-w-0"><MathRenderer text={option.substring(3)} /></span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {questionType === 'multiple' && (
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const optionLetter = option.charAt(0);
            const selectedLetters = new Set((selectedAnswer || '').split(''));
            const isSelected = selectedLetters.has(optionLetter);

            return (
              <button
                key={index}
                onClick={() => {
                  if (disabled) return;
                  const next = new Set(selectedLetters);
                  if (next.has(optionLetter)) {
                    next.delete(optionLetter);
                  } else {
                    next.add(optionLetter);
                  }
                  onAnswerSelect(Array.from(next).sort().join(''));
                }}
                disabled={disabled}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-150 active:scale-[0.99] ${
                  isSelected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                } ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    className={`flex items-center justify-center w-11 h-11 rounded-lg text-sm font-mono font-bold flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-white text-gray-900'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {isSelected ? <Check size={18} /> : optionLetter}
                  </span>
                  <span className="text-base leading-relaxed break-words min-w-0"><MathRenderer text={option.substring(3)} /></span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {questionType === 'fill' && (
        <div className="mt-2">
          <FormulaInput
            value={selectedAnswer || ''}
            onChange={(value) => !disabled && onAnswerSelect(value)}
            placeholder="请输入答案..."
            rows={1}
            disabled={disabled}
          />
        </div>
      )}

      {questionType === 'calculation' && (
        <div className="mt-2">
          <FormulaInput
            value={selectedAnswer || ''}
            onChange={(value) => !disabled && onAnswerSelect(value)}
            placeholder="请输入计算结果..."
            rows={1}
            disabled={disabled}
          />
        </div>
      )}

      {questionType === 'truefalse' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: 'true', label: '正确' },
            { value: 'false', label: '错误' }
          ].map((option) => {
            const isSelected = selectedAnswer === option.value;
            return (
              <button
                key={option.value}
                onClick={() => !disabled && onAnswerSelect(option.value)}
                disabled={disabled}
                className={`p-4 rounded-xl border transition-all duration-150 active:scale-[0.99] min-h-[44px] touch-manipulation ${
                  isSelected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                } ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              >
                <span className="text-base font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {questionType === 'essay' && (
        <div className="mt-2">
          <FormulaInput
            value={selectedAnswer || ''}
            onChange={(value) => !disabled && onAnswerSelect(value)}
            placeholder="请输入你的答案..."
            rows={6}
            disabled={disabled}
          />
        </div>
      )}

      {isGrading && gradingStatus && ['fill', 'calculation', 'essay'].includes(questionType) && (
        <div className="mt-4 flex items-center gap-2 w-fit px-3 py-2 rounded-full bg-accent-light/40 border border-accent/30 text-sm text-primary animate-fade-in">
          <Loader2 size={14} className="animate-spin text-accent" />
          <span>{gradingStatus}</span>
        </div>
      )}
    </Card>
  );
};

export default QuestionCard;
