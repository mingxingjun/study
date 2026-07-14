import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../components/ui/Card';

/**
 * 答题结果组件
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
      style={{ borderLeftWidth: '3px', borderLeftColor: isCorrect ? '#171717' : '#a3a3a3' }}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 transition-colors ${
            isCorrect
              ? 'bg-primary'
              : 'bg-white border-2 border-gray-300'
          }`}
        >
          {isCorrect ? (
            <Check className="text-white" size={22} strokeWidth={2.5} />
          ) : (
            <X className="text-gray-500" size={22} strokeWidth={2.5} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`text-xl font-semibold ${isCorrect ? 'text-gray-900' : 'text-gray-700'}`}>
            {isCorrect ? '回答正确' : '回答错误'}
          </h3>

          {!isCorrect && correctAnswer && (
            <p className="mt-2 text-gray-600 text-sm leading-relaxed">
              <span className="text-gray-400">正确答案</span>
              <span className="mx-2 text-gray-300">·</span>
              <span className="font-mono font-bold text-gray-900 text-base">{correctAnswer}</span>
            </p>
          )}

          {aiFeedback && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-primary">AI 批改</span>
                {aiFeedback.score != null && (
                  <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600">
                    {aiFeedback.score} 分
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-600 leading-relaxed">{aiFeedback.feedback}</p>
            </div>
          )}
        </div>
      </div>

      {explanation && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors w-full cursor-pointer"
          >
            <span>题目解析</span>
            {showExplanation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showExplanation && (
            <div className="mt-3 p-5 bg-white rounded-xl border border-gray-100 text-gray-700 leading-relaxed text-sm scale-in">
              {explanation}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default QuizResult;
