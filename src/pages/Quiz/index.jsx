import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowRight, ListOrdered, Shuffle, Filter, Check } from 'lucide-react';
import { useStudyContext } from '../../context/StudyContext';
import { useAgents } from '../../hooks/useAgents';
import usePageTitle from '../../hooks/usePageTitle';
import { sampleQuestions } from '../../mock/questions';
import { sampleKnowledgePoints } from '../../mock/sampleData';
import { getToday } from '../../utils/date';
import { gradeAnswer, isAIConfigured } from '../../services/aiService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import QuestionCard from './QuestionCard';
import QuizResult from './QuizResult';
import QuizProgress from './QuizProgress';
import QuizSummary from './QuizSummary';
import AgentChatStream from '../../components/agents/AgentChatStream';

/** 本地存储刷题模式偏好的键 */
const QUIZ_MODE_KEY = 'study-buddy-quiz-mode';
/** 本地存储题型筛选偏好的键 */
const QUIZ_TYPE_KEY = 'study-buddy-quiz-type';
/** 本地存储跳过已掌握题目偏好的键 */
const SKIP_MASTERED_KEY = 'study-buddy-quiz-skip-mastered';

/** 题型显示配置 */
const TYPE_CONFIG = {
  single: { label: '单选题' },
  multiple: { label: '多选题' },
  truefalse: { label: '判断题' },
  fillblank: { label: '填空题' },
  essay: { label: '简答题' },
  calculation: { label: '计算题' }
};

/**
 * Fisher-Yates 洗牌算法
 * @param {Array} array - 待洗牌数组
 * @returns {Array} 新数组
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * 获取题目类型标签
 * @param {string} type
 * @returns {string}
 */
const getTypeLabel = (type) => TYPE_CONFIG[type]?.label || type;

const Quiz = () => {
  const navigate = useNavigate();
  usePageTitle('开始刷题');
  const { state, addAnswer, addWrongQuestion } = useStudyContext();
  const { agents, thinkAndSay, thinkAndCallAI, clearHistory } = useAgents();

  // 当前可用的题目（正式模式优先使用 state.questions，演示模式可回退到示例题库）
  const availableQuestions = useMemo(() => {
    return state.questions && state.questions.length > 0
      ? state.questions
      : (state.mode === 'demo' ? sampleQuestions : []);
  }, [state.questions, state.mode]);

  // 是否跳过已答对的题目，避免重复刷题
  const [skipMastered, setSkipMastered] = useState(() => {
    return localStorage.getItem(SKIP_MASTERED_KEY) !== 'false';
  });

  // 本次实际可刷的题目：可选过滤掉历史答对的题目
  const baseQuestions = useMemo(() => {
    if (!skipMastered) return availableQuestions;
    const masteredIds = new Set(
      state.answerRecords
        .filter(r => r.isCorrect)
        .map(r => r.questionId)
    );
    return availableQuestions.filter(q => !masteredIds.has(q.id));
  }, [availableQuestions, state.answerRecords, skipMastered]);

  // 当前题库实际存在的题型（没有的题型不显示）
  const presentTypes = useMemo(() => {
    const types = new Set(baseQuestions.map(q => q.type || 'single'));
    return Array.from(types).filter(t => TYPE_CONFIG[t]).sort();
  }, [baseQuestions]);

  // 刷题模式：sequential 顺序 / random 随机 / type 按题型
  const [quizMode, setQuizMode] = useState(() => {
    return localStorage.getItem(QUIZ_MODE_KEY) || 'sequential';
  });
  // 按题型模式下的当前题型
  const [selectedType, setSelectedType] = useState(() => {
    return localStorage.getItem(QUIZ_TYPE_KEY) || presentTypes[0] || 'single';
  });

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [sessionAnswers, setSessionAnswers] = useState([]);
  const [hasNoQuestions, setHasNoQuestions] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingStatus, setGradingStatus] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);

  // 持久化用户模式偏好
  useEffect(() => {
    localStorage.setItem(QUIZ_MODE_KEY, quizMode);
  }, [quizMode]);

  useEffect(() => {
    localStorage.setItem(QUIZ_TYPE_KEY, selectedType);
  }, [selectedType]);

  useEffect(() => {
    localStorage.setItem(SKIP_MASTERED_KEY, String(skipMastered));
  }, [skipMastered]);

  // 当实际存在的题型变化时，确保当前题型有效
  useEffect(() => {
    if (quizMode === 'type' && presentTypes.length > 0 && !presentTypes.includes(selectedType)) {
      setSelectedType(presentTypes[0]);
    }
  }, [presentTypes, selectedType, quizMode]);

  /**
   * 初始化刷题会话
   * 根据模式和题型筛选生成本次要练习的题目列表
   */
  const initQuiz = useCallback(() => {
    if (!baseQuestions || baseQuestions.length === 0) {
      setHasNoQuestions(true);
      return;
    }

    setHasNoQuestions(false);

    let questions = [...baseQuestions];

    if (quizMode === 'type') {
      questions = questions.filter(q => (q.type || 'single') === selectedType);
    }

    if (quizMode === 'random') {
      questions = shuffleArray(questions);
    }

    setQuizQuestions(questions);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setIsCompleted(false);
    setCorrectCount(0);
    setStartTime(Date.now());
    setEndTime(null);
    setSessionAnswers([]);
    setAiFeedback(null);
    setIsGrading(false);
    setGradingStatus('');
    setIsInitialized(true);
    clearHistory();
  }, [baseQuestions, quizMode, selectedType, clearHistory]);

  useEffect(() => {
    initQuiz();
  }, [initQuiz]);

  // 模式、题型或跳过设置改变时重新初始化
  useEffect(() => {
    if (isInitialized) {
      initQuiz();
    }
  }, [quizMode, selectedType, skipMastered, isInitialized, initQuiz]);

  useEffect(() => {
    if (isInitialized && quizQuestions.length > 0 && currentIndex < quizQuestions.length && !showResult && !isCompleted) {
      const currentQuestion = quizQuestions[currentIndex];
      const contextKps = state.plan?.knowledgePoints || [];
      const kp = contextKps.find(k => k.id === currentQuestion.knowledgePointId)
        || sampleKnowledgePoints.find(k => k.id === currentQuestion.knowledgePointId);
      const kpName = kp ? kp.name : '相关知识点';

      thinkAndSay('quiz-master', `这道题考的是${kpName}，试试看？`);
    }
  }, [currentIndex, quizQuestions, isInitialized, showResult, isCompleted, thinkAndSay, state.plan]);

  const getActiveAgent = useCallback(() => {
    const thinkingOrSpeaking = agents.find(a => a.status === 'thinking' || a.status === 'speaking' || a.status === 'working');
    if (thinkingOrSpeaking) return thinkingOrSpeaking;
    const withHistory = agents.find(a => a.history && a.history.length > 0);
    return withHistory || null;
  }, [agents]);

  /**
   * 归一化填空题答案
   * 移除空格、括号，统一运算符格式
   * @param {string} ans
   * @returns {string}
   */
  const normalizeFillAnswer = useCallback((ans) => {
    let normalized = String(ans).trim().toLowerCase();
    normalized = normalized.replace(/[（）()]/g, '');
    normalized = normalized.replace(/\s*([+\-*/=，,])\s*/g, '$1');
    normalized = normalized.replace(/，/g, ',');
    return normalized;
  }, []);

  /**
   * 判断用户答案是否与标准答案一致
   * @param {Object} question
   * @param {string} userAnswer
   * @returns {boolean}
   */
  const isExactCorrect = useCallback((question, userAnswer) => {
    if (userAnswer == null) return false;
    const answer = String(question.answer ?? '');
    const input = String(userAnswer).trim();

    if (question.type === 'fillblank' || question.type === 'calculation') {
      return normalizeFillAnswer(input) === normalizeFillAnswer(answer);
    }
    if (question.type === 'multiple') {
      return input.split('').sort().join('') === answer.split('').sort().join('');
    }
    return input === answer.trim();
  }, [normalizeFillAnswer]);

  /**
   * 提交答案
   * 对填空/简答等开放题型，精确不匹配时调用 AI 批改判断等价表达
   */
  const checkAnswer = useCallback(async () => {
    if (!selectedAnswer || showResult || isGrading) return;

    const currentQuestion = quizQuestions[currentIndex];
    const exactCorrect = isExactCorrect(currentQuestion, selectedAnswer);
    let finalCorrect = exactCorrect;
    let aiResult = null;

    // 精确不正确且为开放题型时，正式模式下启用 AI 批改
    if (!exactCorrect && state.mode === 'formal' && ['fillblank', 'essay', 'calculation'].includes(currentQuestion.type)) {
      const agentConfig = state.aiConfig?.['quiz-master'];
      if (isAIConfigured(agentConfig)) {
        setIsGrading(true);
        setGradingStatus('AI 正在分析答案 → 对比标准答案 → 给出评分');
        try {
          aiResult = await gradeAnswer(agentConfig, currentQuestion, selectedAnswer);
          finalCorrect = Boolean(aiResult.isCorrect);
        } catch (error) {
          console.warn('AI 批改调用失败:', error);
        } finally {
          setIsGrading(false);
          setGradingStatus('');
        }
      }
    }

    setIsCorrect(finalCorrect);
    setShowResult(true);
    setAiFeedback(aiResult ? { score: aiResult.score, feedback: aiResult.feedback } : null);

    const answerRecord = {
      id: `ans-${Date.now()}`,
      questionId: currentQuestion.id,
      knowledgePointId: currentQuestion.knowledgePointId,
      userAnswer: selectedAnswer,
      isCorrect: finalCorrect,
      aiScore: aiResult?.score,
      date: getToday(),
      answeredAt: new Date().toISOString()
    };

    setSessionAnswers(prev => [...prev, answerRecord]);
    addAnswer(answerRecord);

    if (finalCorrect) {
      setCorrectCount(prev => prev + 1);
      const message = aiResult?.feedback
        ? `AI 批改认为你的答案等价，算对！${aiResult.feedback}`
        : '不错！这个知识点掌握得很好';
      thinkAndSay('quiz-master', message);
    } else {
      addWrongQuestion({
        question: currentQuestion,
        userAnswer: selectedAnswer
      });

      // 构建 AI 分析提示，发送当前题目详情给 explainer agent
      const analysisPrompt = `请分析以下错题：\n题目：${currentQuestion.question}\n${
        currentQuestion.options?.length > 0
          ? '选项：\n' + currentQuestion.options.map((o, i) =>
              String.fromCharCode(65 + i) + '. ' + o.replace(/^[A-F][.、]\s*/, '')
            ).join('\n') + '\n'
          : ''
      }用户答案：${selectedAnswer}\n正确答案：${currentQuestion.answer}\n${
        currentQuestion.explanation
          ? `题目解析：${currentQuestion.explanation}\n`
          : ''
      }${
        aiResult?.feedback
          ? `AI 批改反馈：${aiResult.feedback}\n`
          : ''
      }请简要说明错误原因和正确思路。`;

      // 异步调用 AI，不阻塞用户继续答题
      thinkAndCallAI('explainer', analysisPrompt, {
        question: currentQuestion.question,
        userAnswer: selectedAnswer
      });
    }

    const answeredCount = currentIndex + 1;
    if (answeredCount % 5 === 0 && answeredCount < quizQuestions.length) {
      const currentCorrect = finalCorrect ? correctCount + 1 : correctCount;
      const rate = Math.round((currentCorrect / answeredCount) * 100);
      setTimeout(() => {
        thinkAndSay('supervisor', `已完成${answeredCount}题，正确率${rate}%，继续加油！`);
      }, 1500);
    }
  }, [
    selectedAnswer,
    showResult,
    isGrading,
    quizQuestions,
    currentIndex,
    state.mode,
    state.aiConfig,
    isExactCorrect,
    correctCount,
    addAnswer,
    addWrongQuestion,
    thinkAndSay,
    thinkAndCallAI
  ]);

  const nextQuestion = useCallback(() => {
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
      setAiFeedback(null);
    } else {
      setIsCompleted(true);
      setEndTime(Date.now());
    }
  }, [currentIndex, quizQuestions.length]);

  // 回答正确后自动跳转到下一题，无需手动点击
  useEffect(() => {
    if (!showResult || !isCorrect || isCompleted) return;
    const timer = setTimeout(() => {
      nextQuestion();
    }, 1200);
    return () => clearTimeout(timer);
  }, [showResult, isCorrect, isCompleted, nextQuestion]);

  // 单选题、判断题选中选项后直接提交，无需点击提交按钮
  useEffect(() => {
    if (!selectedAnswer || showResult || isGrading || isCompleted) return;
    const currentQuestion = quizQuestions[currentIndex];
    if (!currentQuestion) return;
    if (currentQuestion.type === 'single' || currentQuestion.type === 'truefalse') {
      checkAnswer();
    }
  }, [selectedAnswer, currentIndex, quizQuestions, showResult, isGrading, isCompleted, checkAnswer]);

  const endQuiz = useCallback(() => {
    setIsCompleted(true);
    setEndTime(Date.now());
  }, []);

  const handleRestart = () => {
    initQuiz();
  };

  const activeAgent = getActiveAgent();

  // 已开启跳过且全部答对时给出提示
  if (availableQuestions.length > 0 && baseQuestions.length === 0) {
    return (
      <div className="page-fade-in max-w-3xl mx-auto">
        <div className="mb-14 stagger-1">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">开始刷题</h1>
          <p className="text-gray-500 text-sm">通过刷题巩固知识，发现薄弱点</p>
        </div>
        <Card className="p-16 text-center card-hover stagger-2">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-7">
            <Check className="text-primary" size={28} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">当前题目已全部答对</h2>
          <p className="text-gray-500 mb-8 leading-relaxed max-w-md mx-auto">
            已掌握题目已被自动跳过。如需重新练习，可关闭「跳过已答对题目」或去题库管理添加新题。
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => setSkipMastered(false)}>
              关闭跳过，重新练习
            </Button>
            <Button onClick={() => navigate('/question-bank')}>
              去题库管理
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (hasNoQuestions) {
    return (
      <div className="page-fade-in max-w-3xl mx-auto">
        <div className="mb-14 stagger-1">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">开始刷题</h1>
          <p className="text-gray-500 text-sm">通过刷题巩固知识，发现薄弱点</p>
        </div>
        <Card className="p-16 text-center card-hover stagger-2">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-7">
            <Upload className="text-white" size={28} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">还没有可用题目</h2>
          <p className="text-gray-500 mb-8 leading-relaxed max-w-md mx-auto">
            请先上传复习资料，系统会自动生成题目供你练习
          </p>
          <Button onClick={() => navigate('/upload')} size="lg">
            <Upload size={18} />
            去上传资料
          </Button>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    const timeUsed = endTime && startTime ? Math.floor((endTime - startTime) / 1000) : 0;
    return (
      <div className="page-fade-in max-w-3xl mx-auto">
        <div className="mb-14 stagger-1">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">练习结果</h1>
          <p className="text-gray-500 text-sm">查看本次练习的表现</p>
        </div>
        <div className="stagger-2">
          <QuizSummary
            totalQuestions={sessionAnswers.length}
            correctCount={correctCount}
            timeUsed={timeUsed}
            onRestart={handleRestart}
          />
        </div>
        <div className="mt-8 stagger-3">
          <AgentChatStream agents={agents} />
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="page-fade-in max-w-3xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">开始刷题</h1>
          <p className="text-gray-500 text-sm">正在加载题目...</p>
        </div>
        <div className="flex items-center justify-center py-24">
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
            <span className="text-sm">正在加载题目...</span>
          </div>
        </div>
      </div>
    );
  }

  // 当前筛选条件下无题目
  if (quizQuestions.length === 0) {
    return (
      <div className="page-fade-in max-w-3xl mx-auto">
        <div className="mb-14 stagger-1">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">开始刷题</h1>
          <p className="text-gray-500 text-sm">通过刷题巩固知识，发现薄弱点</p>
        </div>
        <Card className="p-16 text-center card-hover stagger-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">当前筛选条件下没有题目</h2>
          <p className="text-gray-500 mb-6">
            题型 <span className="font-medium text-primary">{getTypeLabel(selectedType)}</span> 暂无题目，尝试切换其他题型或模式
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => setQuizMode('sequential')}>顺序刷题</Button>
            <Button variant="secondary" onClick={() => setQuizMode('random')}>随机刷题</Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = quizQuestions[currentIndex];

  return (
    <div className="page-fade-in max-w-3xl mx-auto">
      <div className="mb-14 stagger-1">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">开始刷题</h1>
        <p className="text-gray-500 text-sm">认真作答，AI 助教会帮你分析错题</p>
      </div>

      {/* 刷题模式选择 */}
      <Card className="p-5 mb-6 stagger-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <ListOrdered size={16} className="text-primary" />
            <span>刷题模式</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setQuizMode('sequential')}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors duration-150 cursor-pointer ${
                quizMode === 'sequential'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              顺序
            </button>
            <button
              onClick={() => setQuizMode('random')}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors duration-150 cursor-pointer ${
                quizMode === 'random'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <Shuffle size={14} className="inline mr-1" />
              随机
            </button>
            <button
              onClick={() => setQuizMode('type')}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors duration-150 cursor-pointer ${
                quizMode === 'type'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <Filter size={14} className="inline mr-1" />
              按题型
            </button>
          </div>

          {quizMode === 'type' && presentTypes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              {presentTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors duration-150 cursor-pointer ${
                    selectedType === type
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {getTypeLabel(type)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => setSkipMastered(prev => !prev)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors cursor-pointer"
          >
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
              skipMastered
                ? 'bg-primary border-primary'
                : 'border-gray-300 bg-white'
            }`}>
              {skipMastered && <Check size={14} className="text-white" />}
            </div>
            跳过已答对题目
          </button>
          <span className="text-xs text-gray-400">
            已过滤 {availableQuestions.length - baseQuestions.length} 道已掌握题目
          </span>
        </div>
      </Card>

      <div className="stagger-3">
        <QuizProgress
          currentQuestion={currentIndex + 1}
          totalQuestions={quizQuestions.length}
          startTime={startTime}
          onEndQuiz={!showResult ? endQuiz : null}
          showEndButton={!showResult}
        />
      </div>

      <div className="mt-10 stagger-4">
        <QuestionCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={setSelectedAnswer}
          disabled={showResult || isGrading}
          isGrading={isGrading}
          gradingStatus={gradingStatus}
          activeAgent={activeAgent}
          showResult={showResult}
          isCorrect={isCorrect}
        />
      </div>

      <div className="stagger-5">
        <QuizResult
          isCorrect={isCorrect}
          correctAnswer={currentQuestion.answer}
          explanation={currentQuestion.explanation}
          aiFeedback={aiFeedback}
          show={showResult}
        />
      </div>

      <div className="mt-10 flex justify-end gap-3 stagger-5">
        {!showResult && currentQuestion.type !== 'single' && currentQuestion.type !== 'truefalse' ? (
          <Button
            size="lg"
            onClick={checkAnswer}
            disabled={!selectedAnswer || isGrading}
          >
            {isGrading ? 'AI 批改中...' : '提交答案'}
          </Button>
        ) : showResult ? (
          <Button size="lg" onClick={nextQuestion}>
            {currentIndex < quizQuestions.length - 1 ? '下一题' : '查看总结'}
            <ArrowRight size={18} />
          </Button>
        ) : null}
      </div>

      <div className="mt-10 stagger-6">
        <AgentChatStream agents={agents} />
      </div>
    </div>
  );
};

export default Quiz;
