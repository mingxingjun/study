import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../components/ui/Card';
import VisualizationRenderer from '../../components/visualization/VisualizationRenderer';

/**
 * 答题结果组件
 * 编辑式左侧色带 + 衬线状态标题 + 金色 AI 批改点缀
 * @param {Object} props
 * @param {boolean} props.isCorrect - 是否回答正确
 * @param {string} props.correctAnswer - 正确答案
 * @param {string} props.explanation - 题目解析
 * @param {boolean} props.show - 是否显示结果
 */
const QuizResult = ({
  isCorrect,
  correctAnswer,
  explanation,
  aiFeedback = null,
  show = true
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  if (!show) return null;

  return (
    <Card
      className="mt-6 scale-in"
      style={{ borderLeftWidth: '2px', borderLeftColor: isCorrect ? '#c9a227' : '#a3a3a3' }}
      elevated
    >
      <div className="flex items-start gap-5">
        {/* 状态徽标 - 正确金色实底 / 错误描边 */}
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 transition-colors ${
            isCorrect
              ? 'bg-accent shadow-gold'
              : 'bg-white border border-gray-300'
          }`}
        >
          {isCorrect ? (
            <Check className="text-primary" size={22} strokeWidth={2.5} />
          ) : (
            <X className="text-gray-500" size={22} strokeWidth={2.5} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gray-400">
              {isCorrect ? 'Correct' : 'Incorrect'}
            </span>
          </div>
          <h3
            className={`font-serif text-2xl ${isCorrect ? 'text-primary' : 'text-gray-700'}`}
            style={{ fontWeight: 400, letterSpacing: '-0.025em' }}
          >
            {isCorrect ? '回答正确' : '回答错误'}
          </h3>

          {!isCorrect && correctAnswer && (
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">
              <span className="text-gray-400 font-mono uppercase tracking-wider text-[11px]">正确答案</span>
              <span className="mx-3 text-gray-200">·</span>
              <span className="font-mono font-bold text-primary text-base tabular-nums">{correctAnswer}</span>
            </p>
          )}

          {aiFeedback && (
            <div className="mt-4 p-4 bg-accent/5 rounded-xl border border-accent/20">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent-dark">AI 批改</span>
                {aiFeedback.score != null && (
                  <span className="px-2 py-0.5 bg-white border border-accent/30 rounded-full text-xs font-mono font-medium text-accent-dark tabular-nums">
                    {aiFeedback.score} 分
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{aiFeedback.feedback}</p>

              {/* AI 反馈自带的可视化 - 在解析文字之后，帮助直观理解 */}
              {Array.isArray(aiFeedback.visualizations) && aiFeedback.visualizations.length > 0 && (
                <div className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-2">
                    可视化解析
                  </p>
                  <div className="space-y-2">
                    {aiFeedback.visualizations.map((viz, index) => (
                      <VisualizationRenderer key={index} visualization={viz} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {explanation && (
        <div className="mt-6 pt-5 border-t border-gray-100">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors w-full cursor-pointer"
          >
            <span className="font-mono uppercase tracking-[0.2em] text-[11px]">题目解析</span>
            {showExplanation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showExplanation && (
            <div className="mt-4 p-5 bg-gray-50/60 rounded-xl border border-gray-100 text-gray-700 leading-relaxed text-sm scale-in">
              {explanation}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default QuizResult;
