import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ExternalLink, Check, Clock } from 'lucide-react';
import AgentMessage from '../../components/agents/AgentMessage';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import QuestionImage from '../../components/ui/QuestionImage';
import MathRenderer from '../../components/MathRenderer';
import { sampleKnowledgePoints } from '../../mock/sampleData';
import useReducedMotion from '../../hooks/useReducedMotion';
import { getNextReviewDate, getReviewIntervalText } from '../../utils/reviewSchedule';

const WrongQuestionDetail = ({
  wrongQuestion,
  answerRecords,
  questions,
  resourceLinks,
  explainerAgent,
  onPracticeSimilar
}) => {
  const stepsRef = useRef(null);
  const reducedMotion = useReducedMotion();

  /**
   * 解析步骤依次淡入动画
   * 当错题切换或组件首次渲染时触发
   */
  useGSAP(() => {
    if (!stepsRef.current || reducedMotion) {
      return;
    }

    const items = stepsRef.current.querySelectorAll('.step-item');
    if (items.length === 0) {
      return;
    }

    gsap.fromTo(
      items,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.12,
        ease: 'power2.out',
        clearProps: 'transform'
      }
    );
  }, [wrongQuestion?.id, reducedMotion]);

  if (!wrongQuestion) return null;

  const { question, userAnswer, mastered } = wrongQuestion;
  const nextReviewDate = getNextReviewDate(wrongQuestion, answerRecords);
  const reviewText = getReviewIntervalText(wrongQuestion, answerRecords);
  const knowledgePoint = sampleKnowledgePoints.find(kp => kp.id === question.knowledgePointId);
  const relatedResources = resourceLinks.filter(r => r.knowledgePointId === question.knowledgePointId);
  const similarQuestions = questions
    .filter(q => q.knowledgePointId === question.knowledgePointId && q.id !== question.id)
    .slice(0, 3);

  const getOptionLetter = (index) => String.fromCharCode(65 + index);

  const steps = [
    {
      title: '错因分析',
      content: `这道题你选择了 ${userAnswer}，而正确答案是 ${question.answer}。\n\n${question.explanation ? '关键考点：' + question.explanation : '你可能混淆了相关概念，建议仔细回顾相关知识点。'}`,
    },
    {
      title: '知识点回顾',
      content: knowledgePoint
        ? `【${knowledgePoint.name}】\n\n${knowledgePoint.description}`
        : '这道题涉及的知识点需要重点复习，建议先回顾基础概念再做题。',
    },
    ...(relatedResources.length > 0 ? [{
      title: '相关教学资源',
      content: 'resources',
    }] : []),
    {
      title: '正确思路',
      content: `正确解法：\n\n${question.explanation || '仔细审题，回忆相关知识点，逐步推导得出答案。'}`,
    },
    {
      title: '相似题推荐',
      content: 'similar',
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-primary">题目详情</h2>
          <div className="flex items-center gap-2">
            {!mastered && (
              <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                <Clock size={12} />
                建议 {reviewText}（{nextReviewDate}）
              </span>
            )}
            {mastered && (
              <span className="flex items-center gap-1 text-xs text-white bg-primary px-2.5 py-1 rounded-md">
                <Check size={12} />
                已掌握
              </span>
            )}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-900 text-lg leading-relaxed"><MathRenderer text={question.question} /></p>
        </div>

        {question.image && (
          <div className="mb-6">
            <QuestionImage src={question.image} alt="题目图片" />
          </div>
        )}

        {question.options && question.options.length > 0 && (
          <div className="space-y-3 mb-5">
            {question.options.map((option, index) => {
              const letter = getOptionLetter(index);
              const isUserAnswer = letter === userAnswer;
              const isCorrectAnswer = letter === question.answer;

              let optionClass = 'border-gray-200 bg-gray-50 text-gray-600';
              let badge = null;

              if (isCorrectAnswer) {
                optionClass = 'border-primary bg-gray-50 text-primary';
                badge = (
                  <span className="text-xs font-medium bg-primary text-white px-2 py-0.5 rounded ml-2">
                    正确答案
                  </span>
                );
              } else if (isUserAnswer && !isCorrectAnswer) {
                optionClass = 'border-gray-300 bg-gray-50 text-gray-500';
                badge = (
                  <span className="text-xs text-gray-500 border border-gray-300 px-2 py-0.5 rounded ml-2">
                    你的答案
                  </span>
                );
              }

              return (
                <div
                  key={index}
                  className={`p-3.5 rounded-xl border ${optionClass} flex flex-col sm:flex-row sm:items-start gap-2 transition-colors`}
                >
                  <span className="font-mono text-sm mr-2.5 flex-shrink-0">{letter}.</span>
                  <span className="flex-1"><MathRenderer text={option} /></span>
                  {badge}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {knowledgePoint && (
            <span className="text-xs bg-gray-100 text-secondary px-2.5 py-1 rounded-md border border-gray-200">
              {knowledgePoint.name}
            </span>
          )}
        </div>
      </Card>

      {explainerAgent && (
        <AgentMessage agent={explainerAgent} message="让我来帮你详细分析这道题..." />
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-primary mb-8">题目解析</h3>
        <ol ref={stepsRef}>
          {steps.map((stepConfig, stepIndex) => (
            <li key={stepIndex} className="step-item relative pl-9 pb-6 last:pb-0">
              {stepIndex < steps.length - 1 && (
                <div className="absolute left-3 top-7 bottom-0 w-px bg-gray-200" />
              )}
              <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-mono flex items-center justify-center">
                {stepIndex + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-gray-900 mb-2">
                  {stepConfig.title}
                </h4>

                {stepConfig.content === 'resources' ? (
                  <div className="space-y-2">
                    {relatedResources.map(resource => (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-150 group"
                      >
                        <span className="flex-1 text-sm text-gray-700">{resource.title}</span>
                        <span className="text-xs text-gray-400 font-mono">{resource.source}</span>
                        <ExternalLink size={14} className="text-gray-400 group-hover:text-gray-600" />
                      </a>
                    ))}
                  </div>
                ) : stepConfig.content === 'similar' ? (
                  <div className="space-y-2.5">
                    {similarQuestions.length > 0 ? (
                      similarQuestions.map((sq) => (
                        <div key={sq.id} className="p-3.5 bg-gray-50 rounded-xl">
                          <p className="text-sm text-gray-700 mb-2.5 leading-relaxed">
                            <MathRenderer text={sq.question} />
                          </p>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onPracticeSimilar(sq)}
                          >
                            做这道
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">暂无相似题目</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    <MathRenderer text={stepConfig.content} />
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
};

export default WrongQuestionDetail;
