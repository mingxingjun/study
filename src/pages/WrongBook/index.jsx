import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
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

  // 统计数据：待复习数与已掌握数
  // 依赖 state.wrongQuestions 而非派生的 wrongQuestions，避免每次渲染生成新数组引用
  const dueCount = useMemo(
    () => (state.wrongQuestions || []).filter(wq => !wq.mastered).length,
    [state.wrongQuestions]
  );
  const masteredCount = useMemo(
    () => (state.wrongQuestions || []).filter(wq => wq.mastered).length,
    [state.wrongQuestions]
  );

  return (
    <div ref={pageRef}>
      {/* 页面标题区 - 衬线大字 + mono 标签 + 金色点缀 */}
      <div className="mb-14 stagger-item">
        <p className="text-xs font-mono text-gray-400 uppercase tracking-[0.25em] mb-3">
          Wrong Book · 错题档案
        </p>
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl text-primary mb-3" style={{ fontWeight: 400, lineHeight: 1.1 }}>
              错题本
              <span className="text-accent-dark">.</span>
            </h1>
            <p className="text-gray-500 text-base max-w-xl leading-relaxed">
              分析错题，查漏补缺 — 每一道错题都是一次精进的契机。
            </p>
          </div>
          {/* 右侧数据指标 - 衬线大数字 + mono 标签 */}
          {wrongQuestions.length > 0 && (
            <div className="flex items-end gap-10 pb-1">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-accent-dark mb-1">
                  Pending
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="font-serif text-primary tabular-nums"
                    style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1, fontSize: '2.5rem' }}
                  >
                    {dueCount}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">待复习</span>
                </div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1">
                  Mastered
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="font-serif text-gray-400 tabular-nums"
                    style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1, fontSize: '2.5rem' }}
                  >
                    {masteredCount}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">已掌握</span>
                </div>
              </div>
            </div>
          )}
        </div>
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
            <Card className="h-full min-h-[400px] flex flex-col p-8" elevated>
              <div className="mb-6">
                {explainerAgent && (
                  <AgentMessage agent={explainerAgent} message="错题是最好的老师，让我来帮你分析这些题目吧！" />
                )}
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                {/* 装饰性序号 - 衬线大号灰字 */}
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
                  {wrongQuestions.length === 0 ? 'No Records' : 'Select a Question'}
                </p>
                <h3 className="text-2xl text-primary mb-3" style={{ fontWeight: 400 }}>
                  {wrongQuestions.length === 0 ? '暂无错题' : '选择一道错题'}
                </h3>
                <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">
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

              <Card className="p-6 stagger-item" elevated>
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
