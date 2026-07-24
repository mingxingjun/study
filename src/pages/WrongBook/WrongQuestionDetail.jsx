import { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'animejs';
import {
    ExternalLink, Check, Clock, Loader2, Brain, BookOpen, Lightbulb,
    Target, RotateCcw, Plus, BarChart3, X, Trash2
} from 'lucide-react';
import AgentMessage from '../../components/agents/AgentMessage';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import QuestionImage from '../../components/ui/QuestionImage';
import MathRenderer from '../../components/MathRenderer';
import VisualizationRenderer from '../../components/visualization/VisualizationRenderer';
import FunctionPlot from '../../components/visualization/FunctionPlot';
import { useStudyContext } from '../../context/StudyContext';
import { sampleKnowledgePoints } from '../../mock/sampleData';
import useReducedMotion from '../../hooks/useReducedMotion';
import { getNextReviewDate, getReviewIntervalText } from '../../utils/reviewSchedule';

/** 可视化创建表单的默认值 */
const DEFAULT_VIZ_FORM = {
    expr: 'sin(x)',
    xMin: '-10',
    xMax: '10',
    yMin: '',
    yMax: '',
    title: ''
};

/**
 * 根据表单值构建 FunctionPlot 需要的 data 对象
 * @param {Object} form - 表单值
 * @returns {Object} FunctionPlot data
 */
const buildPlotData = (form) => {
    const xMin = parseFloat(form.xMin);
    const xMax = parseFloat(form.xMax);
    const data = {
        functions: [{ expr: form.expr || '0', label: form.expr || 'f(x)' }],
        xRange: [Number.isFinite(xMin) ? xMin : -10, Number.isFinite(xMax) ? xMax : 10]
    };
    const yMin = parseFloat(form.yMin);
    const yMax = parseFloat(form.yMax);
    if (Number.isFinite(yMin) && Number.isFinite(yMax)) {
        data.yRange = [yMin, yMax];
    }
    return data;
};

/**
 * 可视化创建表单 Modal - 函数图像实时预览
 * @param {Object} props
 * @param {boolean} props.open - 是否显示
 * @param {Function} props.onClose - 关闭回调
 * @param {Function} props.onConfirm - 确认回调，接收 visualization 对象
 */
const VisualizationFormModal = ({ open, onClose, onConfirm }) => {
    const [form, setForm] = useState(DEFAULT_VIZ_FORM);

    if (!open) return null;

    /** 更新表单字段 */
    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    /** 确认创建，组装可视化对象并回调 */
    const handleConfirm = () => {
        const visualization = {
            id: `viz-${Date.now()}`,
            type: 'function-plot',
            title: form.title || `y = ${form.expr}`,
            data: buildPlotData(form)
        };
        onConfirm(visualization);
        setForm(DEFAULT_VIZ_FORM);
    };

    /** 取消并重置表单 */
    const handleCancel = () => {
        setForm(DEFAULT_VIZ_FORM);
        onClose();
    };

    const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors';
    const labelClass = 'block text-xs font-mono uppercase tracking-wider text-gray-500 mb-2';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={handleCancel}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 弹窗头部 */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-baseline gap-3">
                        <h3 className="text-xl text-primary font-serif" style={{ fontWeight: 500 }}>
                            添加可视化
                        </h3>
                        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gray-400">
                            New Visualization
                        </span>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="关闭"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {/* 表单内容 */}
                <div className="p-6 space-y-5">
                    {/* 可视化类型 - 当前仅支持函数图像 */}
                    <div>
                        <label className={labelClass}>可视化类型</label>
                        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-accent/40 bg-accent/10 text-sm text-primary">
                            <BarChart3 size={14} className="text-accent-dark" />
                            函数图像
                        </div>
                    </div>

                    {/* 函数表达式 */}
                    <div>
                        <label className={labelClass}>
                            函数表达式 <span className="text-accent-dark">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.expr}
                            onChange={(e) => handleChange('expr', e.target.value)}
                            placeholder="如 sin(x), x^2, exp(-x)"
                            className={inputClass}
                        />
                        <p className="text-[11px] text-gray-400 mt-1.5 font-mono">
                            支持 sin/cos/tan/exp/log/sqrt/abs，^ 表示幂运算
                        </p>
                    </div>

                    {/* x 范围 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>X 最小值</label>
                            <input
                                type="number"
                                value={form.xMin}
                                onChange={(e) => handleChange('xMin', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>X 最大值</label>
                            <input
                                type="number"
                                value={form.xMax}
                                onChange={(e) => handleChange('xMax', e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* y 范围（可选） */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>
                                Y 最小值 <span className="text-gray-400 normal-case">(可选)</span>
                            </label>
                            <input
                                type="number"
                                value={form.yMin}
                                onChange={(e) => handleChange('yMin', e.target.value)}
                                placeholder="自动"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                Y 最大值 <span className="text-gray-400 normal-case">(可选)</span>
                            </label>
                            <input
                                type="number"
                                value={form.yMax}
                                onChange={(e) => handleChange('yMax', e.target.value)}
                                placeholder="自动"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* 标题（可选） */}
                    <div>
                        <label className={labelClass}>
                            标题 <span className="text-gray-400 normal-case">(可选)</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="留空将使用表达式作为标题"
                            className={`${inputClass} font-sans`}
                        />
                    </div>

                    {/* 实时预览 */}
                    <div>
                        <label className={labelClass}>实时预览</label>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <FunctionPlot data={buildPlotData(form)} />
                        </div>
                    </div>
                </div>

                {/* 底部按钮 */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                    <Button variant="secondary" onClick={handleCancel}>
                        取消
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={!form.expr.trim()}
                    >
                        <Plus size={14} />
                        添加
                    </Button>
                </div>
            </div>
        </div>
    );
};

/**
 * 单条可视化卡片 - 渲染 VisualizationRenderer，用户创建的可视化带标签和删除按钮
 * @param {Object} props
 * @param {Object} props.visualization - 可视化对象 {type, title, data}
 * @param {boolean} [props.isUserCreated=false] - 是否为用户创建
 * @param {Function} [props.onDelete] - 删除回调（仅用户创建时使用）
 */
const VisualizationItem = ({ visualization, isUserCreated = false, onDelete }) => (
    <div className="relative p-5 bg-warm-50 rounded-xl border border-gray-200/60">
        <div className="flex items-center justify-between mb-3">
            {isUserCreated ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-accent-dark bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                    用户创建
                </span>
            ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    AI 生成
                </span>
            )}
            {isUserCreated && onDelete && (
                <button
                    onClick={onDelete}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-700"
                    aria-label="删除可视化"
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
        <VisualizationRenderer visualization={visualization} />
    </div>
);

const WrongQuestionDetail = ({
  wrongQuestion,
  answerRecords,
  questions,
  resourceLinks,
  explainerAgent,
  aiAnalysis,
  isAnalyzing,
  onPracticeSimilar
}) => {
  const { state, addUserVisualization, deleteUserVisualization } = useStudyContext();
  const stepsRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const [showVizForm, setShowVizForm] = useState(false);

  /**
   * 解析步骤依次淡入动画（anime.js v4 实现）
   * 当错题切换或 AI 分析完成时触发
   * 使用 stagger(120) 替代 GSAP stagger:0.12；fromTo 用数组 [from, to]
   */
  useEffect(() => {
    if (!stepsRef.current || reducedMotion) {
      return;
    }

    const items = stepsRef.current.querySelectorAll('.step-item');
    if (items.length === 0) {
      return;
    }

    const anim = animate(items, {
      opacity: [0, 1],
      y: [16, 0],
      duration: 450,
      delay: stagger(120),
      ease: 'outQuad',
      onComplete: () => {
        // 清理 transform 内联样式，避免影响后续布局
        items.forEach(el => { el.style.transform = ''; });
      }
    });

    return () => anim.revert();
  }, [wrongQuestion?.id, aiAnalysis, reducedMotion]);

  if (!wrongQuestion) return null;

  const { question, userAnswer, mastered } = wrongQuestion;
  // 从 state 读取最新的错题数据，确保 userVisualizations 字段同步更新
  const latestWrongQuestion = state.wrongQuestions.find(wq => wq.id === wrongQuestion.id) || wrongQuestion;
  // 提取 AI 返回的可视化（过滤无效项）
  const aiVisualizations = (aiAnalysis?.visualizations || []).filter(
    v => v && typeof v === 'object' && typeof v.type === 'string'
  );
  // 用户手动创建的可视化
  const userVisualizations = latestWrongQuestion.userVisualizations || [];
  const hasVisualizations = aiVisualizations.length > 0 || userVisualizations.length > 0;
  const nextReviewDate = getNextReviewDate(wrongQuestion, answerRecords);
  const reviewText = getReviewIntervalText(wrongQuestion, answerRecords);
  const knowledgePoint = sampleKnowledgePoints.find(kp => kp.id === question.knowledgePointId);
  const relatedResources = resourceLinks.filter(r => r.knowledgePointId === question.knowledgePointId);
  const similarQuestions = questions
    .filter(q => q.knowledgePointId === question.knowledgePointId && q.id !== question.id)
    .slice(0, 3);

  const getOptionLetter = (index) => String.fromCharCode(65 + index);

  /** 确认添加用户可视化 */
  const handleConfirmAddViz = (visualization) => {
    addUserVisualization(wrongQuestion.id, visualization);
    setShowVizForm(false);
  };

  /** 删除用户可视化 */
  const handleDeleteViz = (vizId) => {
    deleteUserVisualization(wrongQuestion.id, vizId);
  };

  /**
   * 根据 AI 分析结果构建解析步骤
   */
  const buildSteps = () => {
    // 有 AI 分析时，使用 AI 生成的内容
    if (aiAnalysis && !aiAnalysis.plainText) {
      const steps = [];
      if (aiAnalysis.errorRootCause) {
        steps.push({
          icon: <Target size={16} />,
          title: '错因分析',
          content: aiAnalysis.errorRootCause
        });
      }
      if (aiAnalysis.knowledgeReview) {
        steps.push({
          icon: <BookOpen size={16} />,
          title: '知识点回顾',
          content: aiAnalysis.knowledgeReview
        });
      }
      if (relatedResources.length > 0) {
        steps.push({
          icon: <ExternalLink size={16} />,
          title: '相关教学资源',
          content: 'resources'
        });
      }
      if (aiAnalysis.stepByStep) {
        steps.push({
          icon: <Lightbulb size={16} />,
          title: '正确思路',
          content: aiAnalysis.stepByStep
        });
      }
      if (aiAnalysis.metacognitivePrompt) {
        steps.push({
          icon: <Brain size={16} />,
          title: '反思引导',
          content: aiAnalysis.metacognitivePrompt
        });
      }
      if (aiAnalysis.similarQuestion) {
        steps.push({
          icon: <RotateCcw size={16} />,
          title: '相似题推荐',
          content: 'ai-similar'
        });
      }
      if (aiAnalysis.tips) {
        steps.push({
          icon: <Check size={16} />,
          title: '复习建议',
          content: aiAnalysis.tips
        });
      }
      return steps;
    }

    // 纯文本回退
    if (aiAnalysis?.plainText) {
      return [{
        icon: <Brain size={16} />,
        title: 'AI 分析',
        content: aiAnalysis.plainText
      }];
    }

    // 无 AI 分析时，使用静态数据
    return [
      {
        icon: <Target size={16} />,
        title: '错因分析',
        content: `这道题你选择了 ${userAnswer}，而正确答案是 ${question.answer}。\n\n${question.explanation ? '关键考点：' + question.explanation : '你可能混淆了相关概念，建议仔细回顾相关知识点。'}`,
      },
      {
        icon: <BookOpen size={16} />,
        title: '知识点回顾',
        content: knowledgePoint
          ? `【${knowledgePoint.name}】\n\n${knowledgePoint.description}`
          : '这道题涉及的知识点需要重点复习，建议先回顾基础概念再做题。',
      },
      ...(relatedResources.length > 0 ? [{
        icon: <ExternalLink size={16} />,
        title: '相关教学资源',
        content: 'resources',
      }] : []),
      {
        icon: <Lightbulb size={16} />,
        title: '正确思路',
        content: `正确解法：\n\n${question.explanation || '仔细审题，回忆相关知识点，逐步推导得出答案。'}`,
      },
      {
        icon: <RotateCcw size={16} />,
        title: '相似题推荐',
        content: 'similar',
      }
    ];
  };

  const steps = buildSteps();

  return (
    <div className="space-y-6">
      {/* 题目卡片 - 衬线题号 + 状态徽章 */}
      <Card className="p-8" elevated>
        {/* 头部：标题 + 状态徽章 */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3 pb-6 border-b border-gray-100">
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl text-primary font-serif" style={{ fontWeight: 400 }}>
              题目详情
            </h2>
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gray-400">
              Question Detail
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!mastered && (
              <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-accent-dark bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
                <Clock size={11} strokeWidth={2} />
                {reviewText} · {nextReviewDate}
              </span>
            )}
            {mastered && (
              <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-white bg-primary px-3 py-1.5 rounded-full">
                <Check size={11} strokeWidth={2.5} />
                Mastered
              </span>
            )}
          </div>
        </div>

        {/* 题干 - 衬线大字 */}
        <div className="mb-6">
          <p className="text-gray-900 text-lg leading-relaxed font-serif" style={{ fontWeight: 400 }}>
            <MathRenderer text={question.question} />
          </p>
        </div>

        {question.image && (
          <div className="mb-6">
            <QuestionImage src={question.image} alt="题目图片" />
          </div>
        )}

        {/* 选项列表 - 编辑式排版 */}
        {question.options && question.options.length > 0 && (
          <div className="space-y-2.5 mb-6">
            {question.options.map((option, index) => {
              const letter = getOptionLetter(index);
              const isUserAnswer = letter === userAnswer;
              const isCorrectAnswer = letter === question.answer;

              let optionClass = 'border-gray-200 bg-white text-gray-600';
              let badge = null;

              if (isCorrectAnswer) {
                optionClass = 'border-primary bg-warm-50 text-primary';
                badge = (
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-primary text-white px-2 py-0.5 rounded">
                    Correct
                  </span>
                );
              } else if (isUserAnswer && !isCorrectAnswer) {
                optionClass = 'border-gray-300 bg-gray-50 text-gray-500';
                badge = (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 border border-gray-300 px-2 py-0.5 rounded">
                    Your Pick
                  </span>
                );
              }

              return (
                <div
                  key={index}
                  className={`p-4 rounded-xl border ${optionClass} flex flex-col sm:flex-row sm:items-center gap-2 transition-colors`}
                >
                  <span className="font-mono text-sm mr-3 flex-shrink-0 font-medium">{letter}.</span>
                  <span className="flex-1 text-sm leading-relaxed">
                    <MathRenderer text={option} />
                  </span>
                  {badge}
                </div>
              );
            })}
          </div>
        )}

        {/* 知识点标签 */}
        <div className="flex flex-wrap gap-2">
          {knowledgePoint && (
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
              {knowledgePoint.name}
            </span>
          )}
        </div>
      </Card>

      {/* Agent 状态消息 - 编辑式提示框 */}
      {explainerAgent && (
        isAnalyzing ? (
          <div className="flex items-center gap-3 p-5 bg-warm-50 rounded-xl border border-gray-200">
            <Loader2 size={18} className="text-accent-dark animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary">AI 正在分析这道错题...</p>
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-500 mt-1">
                Analyzing · 结合题目与作答深度解析
              </p>
            </div>
          </div>
        ) : aiAnalysis ? (
          <AgentMessage agent={explainerAgent} message="分析完成！以下是这道题的详细解析——" />
        ) : (
          <AgentMessage agent={explainerAgent} message="让我来帮你详细分析这道题..." />
        )
      )}

      {/* 解析步骤卡片 - 衬线编号 + 分段小标题 */}
      <Card className="p-8" elevated>
        {/* 区块标题 - 衬线 + mono 副标 + 渐变线 */}
        <div className="flex items-baseline gap-3 mb-8">
          <h3 className="text-2xl text-primary font-serif" style={{ fontWeight: 400 }}>
            {isAnalyzing ? '正在分析中' : '题目解析'}
          </h3>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gray-400">
            {isAnalyzing ? 'Analyzing' : 'Analysis'}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-2" />
        </div>

        <ol ref={stepsRef}>
          {steps.map((stepConfig, stepIndex) => {
            const numberStr = String(stepIndex + 1).padStart(2, '0');
            return (
              <li key={stepIndex} className="step-item relative pl-14 pb-8 last:pb-0">
                {/* 连接线 */}
                {stepIndex < steps.length - 1 && (
                  <div className="absolute left-[1.05rem] top-10 bottom-0 w-px bg-gray-200" />
                )}
                {/* 大号衬线编号 */}
                <div
                  className="absolute left-0 top-0 font-serif tabular-nums text-gray-300"
                  style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1, fontSize: '1.75rem' }}
                >
                  {numberStr}
                </div>

                <div className="flex-1 min-w-0">
                  {/* 步骤小标题 - 衬线 + 图标 */}
                  <div className="flex items-center gap-2 mb-3">
                    {stepConfig.icon && (
                      <span className="text-accent-dark">{stepConfig.icon}</span>
                    )}
                    <h4 className="text-lg text-primary font-serif" style={{ fontWeight: 500 }}>
                      {stepConfig.title}
                    </h4>
                  </div>

                  {/* 步骤内容 - 按类型渲染 */}
                  {stepConfig.content === 'resources' ? (
                    <div className="space-y-2">
                      {relatedResources.map(resource => (
                        <a
                          key={resource.id}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3.5 bg-warm-50 rounded-xl hover:bg-warm-100 transition-colors duration-200 group border border-gray-200/60"
                        >
                          <span className="flex-1 text-sm text-gray-700">{resource.title}</span>
                          <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                            {resource.source}
                          </span>
                          <ExternalLink size={14} className="text-gray-400 group-hover:text-accent-dark" />
                        </a>
                      ))}
                    </div>
                  ) : stepConfig.content === 'similar' ? (
                    <div className="space-y-2.5">
                      {similarQuestions.length > 0 ? (
                        similarQuestions.map((sq) => (
                          <div key={sq.id} className="p-4 bg-warm-50 rounded-xl border border-gray-200/60">
                            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
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
                        <p className="text-sm text-gray-500 italic">暂无相似题目</p>
                      )}
                    </div>
                  ) : stepConfig.content === 'ai-similar' ? (
                    <div className="space-y-2.5">
                      {aiAnalysis?.similarQuestion && (
                        <div className="p-4 bg-warm-50 rounded-xl border border-gray-200/60">
                          <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                            <MathRenderer text={aiAnalysis.similarQuestion.question || '暂无相似题目'} />
                          </p>
                          {aiAnalysis.similarQuestion.options?.length > 0 && (
                            <div className="space-y-1.5 mb-3 pl-3 border-l border-gray-200">
                              {aiAnalysis.similarQuestion.options.map((opt, i) => (
                                <div key={i} className="text-xs text-gray-600 font-mono">
                                  <MathRenderer text={String.fromCharCode(65 + i) + '. ' + opt} />
                                </div>
                              ))}
                            </div>
                          )}
                          {aiAnalysis.similarQuestion.answer && (
                            <p className="text-xs text-gray-500 mb-2 font-mono">
                              ANS · <span className="font-medium text-primary">{aiAnalysis.similarQuestion.answer}</span>
                              {aiAnalysis.similarQuestion.explanation && (
                                <span className="ml-2 text-gray-400">（{aiAnalysis.similarQuestion.explanation}）</span>
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      <MathRenderer text={stepConfig.content} />
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      {/* 可视化解析区域 - AI 可视化 + 用户创建可视化 */}
      <Card className="p-8" elevated>
        {/* 区块标题 - 衬线 + mono 副标 + 渐变线 */}
        <div className="flex items-baseline gap-3 mb-6">
          <h3 className="text-2xl text-primary font-serif" style={{ fontWeight: 400 }}>
            📊 可视化解析
          </h3>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gray-400">
            Visualizations
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-2" />
        </div>

        {/* 可视化列表 - AI 生成在前，用户创建在后 */}
        {hasVisualizations ? (
          <div className="space-y-4">
            {aiVisualizations.map((viz, idx) => (
              <VisualizationItem
                key={`ai-viz-${idx}`}
                visualization={viz}
                isUserCreated={false}
              />
            ))}
            {userVisualizations.map((viz) => (
              <VisualizationItem
                key={viz.id}
                visualization={viz}
                isUserCreated={true}
                onDelete={() => handleDeleteViz(viz.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic mb-4">
            本题暂无可视化，可点击下方按钮手动添加函数图像辅助理解
          </p>
        )}

        {/* 添加可视化按钮 - 金色边框 + Plus 图标 */}
        <div className="mt-6">
          <Button
            variant="secondary"
            onClick={() => setShowVizForm(true)}
            className="border-accent text-accent-dark hover:bg-accent/10 hover:border-accent-dark"
          >
            <Plus size={14} />
            添加可视化
          </Button>
        </div>
      </Card>

      {/* 可视化创建 Modal */}
      <VisualizationFormModal
        open={showVizForm}
        onClose={() => setShowVizForm(false)}
        onConfirm={handleConfirmAddViz}
      />
    </div>
  );
};

export default WrongQuestionDetail;
