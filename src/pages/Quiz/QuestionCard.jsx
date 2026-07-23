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
 * 编辑式版心 + 大号衬线题号 + 精致选项卡片
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
   * 正确：金色闪烁
   * 错误：水平抖动 + 红色闪烁
   */
  useGSAP(() => {
    if (!cardRef.current || !showResult || reducedMotion) {
      return;
    }

    if (isCorrect) {
      gsap.fromTo(
        cardRef.current,
        { backgroundColor: '#f5e6b3' },
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
        return { label: '难', className: 'border-accent/40 text-accent-dark bg-accent/5' };
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

  /**
   * 计算单选选项在结果展示态的样式
   * 正确答案：金色描边；用户选错的选项：红色描边
   * @param {string} optionLetter - 选项字母
   * @returns {string} 结果态附加样式类
   */
  const getOptionResultStyle = (optionLetter) => {
    if (!showResult) return '';
    const correctLetter = String(question.answer || '').trim();
    if (optionLetter === correctLetter) {
      return 'border-accent bg-accent/5 shadow-sm';
    }
    if (optionLetter === selectedAnswer && !isCorrect) {
      return 'border-red-500/50 bg-red-50/50';
    }
    return 'border-gray-200 opacity-60';
  };

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
    <Card ref={cardRef} className="p-6 sm:p-8" elevated>
      {activeAgent && (
        <div className="flex items-center justify-end mb-5">
          <div className="flex items-center bg-gray-50/80 rounded-full pl-1.5 pr-3 py-1.5 border border-gray-200">
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

      {/* 题号 + 元信息行 - 大号衬线编号作为视觉焦点 */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          {knowledgePoint && (
            <span className="px-3 py-1 bg-gray-50 text-secondary rounded-full text-xs font-medium border border-gray-200">
              {knowledgePoint.name}
            </span>
          )}
          <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${difficultyConfig.className}`}>
            {difficultyConfig.label}
          </span>
        </div>
        {/* 大号衬线题号 - 编辑式装饰 */}
        <span
          className="font-serif text-3xl text-gray-200 tabular-nums flex-shrink-0 leading-none"
          style={{ fontWeight: 400, letterSpacing: '-0.04em' }}
        >
          {String(questionNumber).padStart(2, '0')}
        </span>
      </div>

      <h2
        className="font-serif text-xl md:text-2xl text-primary mb-7 leading-relaxed"
        style={{ fontWeight: 400, letterSpacing: '-0.02em' }}
      >
        <MathRenderer text={question.question} />
      </h2>

      {question.image && (
        <div className="mb-7">
          <QuestionImage src={question.image} alt="题目图片" />
        </div>
      )}

      {questionType === 'choice' && (
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const optionLetter = option.charAt(0);
            const isSelected = selectedAnswer === optionLetter;
            const resultStyle = getOptionResultStyle(optionLetter);

            return (
              <button
                key={index}
                onClick={() => !disabled && onAnswerSelect(optionLetter)}
                disabled={disabled}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.99] ${
                  showResult
                    ? resultStyle
                    : isSelected
                      ? 'bg-white border-primary shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                } ${disabled && !showResult ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-mono font-bold flex-shrink-0 transition-colors ${
                      showResult && optionLetter === String(question.answer || '').trim()
                        ? 'bg-accent text-primary'
                        : showResult && optionLetter === selectedAnswer && !isCorrect
                          ? 'bg-red-500 text-white'
                          : isSelected
                            ? 'bg-primary text-white'
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
            const correctLetters = new Set(String(question.answer || '').split(''));
            const resultStyle = showResult
              ? (correctLetters.has(optionLetter)
                  ? 'border-accent bg-accent/5 shadow-sm'
                  : isSelected && !isCorrect
                    ? 'border-red-500/50 bg-red-50/50'
                    : 'border-gray-200 opacity-60')
              : '';

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
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.99] ${
                  showResult
                    ? resultStyle
                    : isSelected
                      ? 'bg-white border-primary shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                } ${disabled && !showResult ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-mono font-bold flex-shrink-0 transition-colors ${
                      showResult && correctLetters.has(optionLetter)
                        ? 'bg-accent text-primary'
                        : showResult && isSelected && !isCorrect
                          ? 'bg-red-500 text-white'
                          : isSelected
                            ? 'bg-primary text-white'
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
            const correctValue = String(question.answer || '').trim();
            const resultStyle = showResult
              ? (option.value === correctValue
                  ? 'border-accent bg-accent/5 shadow-sm'
                  : isSelected && !isCorrect
                    ? 'border-red-500/50 bg-red-50/50'
                    : 'border-gray-200 opacity-60')
              : '';

            return (
              <button
                key={option.value}
                onClick={() => !disabled && onAnswerSelect(option.value)}
                disabled={disabled}
                className={`p-5 rounded-xl border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.99] min-h-[44px] touch-manipulation ${
                  showResult
                    ? resultStyle
                    : isSelected
                      ? 'bg-white border-primary shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                } ${disabled && !showResult ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              >
                <span className="text-base font-serif" style={{ fontWeight: 500 }}>{option.label}</span>
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
        <div className="mt-4 flex items-center gap-2 w-fit px-3.5 py-2 rounded-full bg-accent/8 border border-accent/25 text-sm text-primary animate-fade-in">
          <Loader2 size={14} className="animate-spin text-accent-dark" />
          <span className="font-mono text-xs tracking-wide">{gradingStatus}</span>
        </div>
      )}
    </Card>
  );
};

export default QuestionCard;
