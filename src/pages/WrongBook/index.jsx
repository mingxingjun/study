import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookX, BookOpen } from 'lucide-react';
import { sortByReviewPriority } from '../../utils/reviewSchedule';
import { useStudyContext } from '../../context/StudyContext';
import { useAgents } from '../../hooks/useAgents';
import usePageTitle from '../../hooks/usePageTitle';
import WrongQuestionList from './WrongQuestionList';
import WrongQuestionDetail from './WrongQuestionDetail';
import WrongQuestionActions from './WrongQuestionActions';
import AgentMessage from '../../components/agents/AgentMessage';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import useStaggerAnimation from '../../hooks/useStaggerAnimation';

/**
 * 构建发送给 AI 的错题分析消息
 * @param {Object} wrongQuestion - 错题对象
 * @returns {string} 用户消息
 */
const buildAnalysisPrompt = (wrongQuestion) => {
  const { question, userAnswer } = wrongQuestion;
  let prompt = `请分析以下错题：\n题目：${question.question}`;
  if (question.options && question.options.length > 0) {
    prompt += '\n选项：\n' + question.options.map((o, i) =>
      String.fromCharCode(65 + i) + '. ' + o.replace(/^[A-F][.、]\s*/, '')
    ).join('\n');
  }
  prompt += `\n用户答案：${userAnswer}\n正确答案：${question.answer}`;
  if (question.explanation) {
    prompt += `\n题目解析：${question.explanation}`;
  }
  prompt += '\n\n请按照你的结构化思维链进行分析，输出 JSON 格式。';
  return prompt;
};

/**
 * 尝试从 AI 响应中提取 JSON 分析结果
 * @param {string} response - AI 原始响应
 * @returns {Object|null} 解析后的分析对象
 */
const parseAnalysisResponse = (response) => {
  try {
    return JSON.parse(response);
  } catch {
    // 尝试提取 JSON 代码块
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch { /* fall through */ }
    }
    // 尝试提取 { ... } 对象
    const objMatch = response.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch { /* fall through */ }
    }
    return null;
  }
};

const WrongBook = () => {
  const navigate = useNavigate();
  usePageTitle('错题本');
  const { state, markWrongQuestionMastered } = useStudyContext();
  const { agents, thinkAndSay, thinkAndCallAI, clearHistory } = useAgents();
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [prioritizeDue, setPrioritizeDue] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const pageRef = useStaggerAnimation([], '.stagger-item');

  const explainerAgent = agents.find(a => a.id === 'explainer');

  // 页面初始化：清空 explainer 历史，显示欢迎语
  useEffect(() => {
    clearHistory('explainer');
    const timer = setTimeout(() => {
      thinkAndSay('explainer', '错题是最好的老师，让我来帮你分析这些题目吧！', 500);
    }, 300);
    return () => clearTimeout(timer);
  }, [clearHistory, thinkAndSay]);

  // 选中错题时，调用 AI 进行针对性分析
  useEffect(() => {
    if (!selectedQuestion) return;

    let cancelled = false;
    const analyzeQuestion = async () => {
      setIsAnalyzing(true);
      setAiAnalysis(null);

      try {
        const { question, userAnswer } = selectedQuestion;
        const userMessage = buildAnalysisPrompt(selectedQuestion);
        const response = await thinkAndCallAI('explainer', userMessage, {
          question: question.question,
          userAnswer
        });

        if (cancelled) return;

        const analysis = parseAnalysisResponse(response);
        if (analysis) {
          setAiAnalysis(analysis);
        } else {
          // 解析失败，将原始文本作为纯文本展示
          setAiAnalysis({ plainText: response });
        }
      } catch (error) {
        console.error('AI 错题分析失败:', error);
        if (!cancelled) {
          setAiAnalysis(null);
        }
      } finally {
        if (!cancelled) {
          setIsAnalyzing(false);
        }
      }
    };

    analyzeQuestion();
    return () => { cancelled = true; };
  }, [selectedQuestion?.id, selectedQuestion, thinkAndCallAI]);

  const handleSelectQuestion = (wq) => {
    setSelectedQuestion(wq);
    setAiAnalysis(null);
    setIsAnalyzing(false);
  };

  const handleMarkMastered = () => {
    if (selectedQuestion) {
      markWrongQuestionMastered(selectedQuestion.id);
      thinkAndSay('explainer', '太棒了！这道题你已经掌握了，继续加油！', 500);
      setSelectedQuestion(prev => prev ? { ...prev, mastered: true } : null);
    }
  };

  const handlePracticeAgain = () => {
    navigate('/quiz');
  };

  const handlePracticeSimilar = () => {
    navigate('/quiz');
  };

  const handleBack = () => {
    setSelectedQuestion(null);
    clearHistory('explainer');
    thinkAndSay('explainer', '继续看看其他错题吧，有问题随时问我！', 300);
  };

  const wrongQuestions = state.wrongQuestions || [];
  const questions = state.questions || [];
  const resourceLinks = state.resourceLinks || [];
  const answerRecords = state.answerRecords || [];

  const sortedWrongQuestions = useMemo(() => {
    const sourceQuestions = state.wrongQuestions || [];
    const sourceRecords = state.answerRecords || [];
    if (!prioritizeDue) return sourceQuestions;
    return sortByReviewPriority(sourceQuestions, sourceRecords);
  }, [state.wrongQuestions, state.answerRecords, prioritizeDue]);

  return (
    <div ref={pageRef}>
      <div className="mb-14 stagger-item">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">错题本</h1>
        <p className="text-gray-500 text-sm">分析错题，查漏补缺</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10">
        <div className="stagger-item">
          <WrongQuestionList
            wrongQuestions={sortedWrongQuestions}
            answerRecords={answerRecords}
            selectedId={selectedQuestion?.id}
            onSelect={handleSelectQuestion}
            prioritizeDue={prioritizeDue}
            onTogglePrioritize={() => setPrioritizeDue(prev => !prev)}
          />
        </div>

        <div className="stagger-item">
          {!selectedQuestion ? (
            <Card className="h-full min-h-[400px] flex flex-col">
              <div className="mb-6">
                {explainerAgent && (
                  <AgentMessage agent={explainerAgent} message="错题是最好的老师，让我来帮你分析这些题目吧！" />
                )}
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200">
                  <BookX className="text-gray-400" size={36} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {wrongQuestions.length === 0 ? '暂无错题' : '选择一道错题'}
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed">
                  {wrongQuestions.length === 0
                    ? '答错的题目会自动收录到这里，开始刷题来积累错题吧'
                    : '点击左侧任意一道错题，查看详细解析与相似题推荐'}
                </p>
                {wrongQuestions.length === 0 && (
                  <Button onClick={() => navigate('/quiz')}>
                    <BookOpen className="w-4 h-4" />
                    开始刷题
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              <WrongQuestionDetail
                wrongQuestion={selectedQuestion}
                answerRecords={answerRecords}
                questions={questions}
                resourceLinks={resourceLinks}
                explainerAgent={explainerAgent}
                aiAnalysis={aiAnalysis}
                isAnalyzing={isAnalyzing}
                onPracticeSimilar={handlePracticeSimilar}
              />

              <Card className="p-6 stagger-item">
                <WrongQuestionActions
                  mastered={selectedQuestion.mastered}
                  onPracticeAgain={handlePracticeAgain}
                  onMarkMastered={handleMarkMastered}
                  onBack={handleBack}
                />
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WrongBook;
