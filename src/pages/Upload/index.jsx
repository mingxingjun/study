import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, Check, RotateCcw } from 'lucide-react';
import { useStudyContext } from '../../context/StudyContext';
import { useAgents } from '../../hooks/useAgents';
import usePageTitle from '../../hooks/usePageTitle';
import useStaggerAnimation from '../../hooks/useStaggerAnimation';
import { generatePlan, isAIConfigured } from '../../services/aiService';
import { parseQuestionBank } from '../../utils/questionParser';
import { sampleKnowledgePoints } from '../../mock/sampleData';
import { sampleQuestions } from '../../mock/questions';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import FileUploader from './FileUploader';
import ParsingProcess from './ParsingProcess';
import KnowledgeTree from './KnowledgeTree';
import ResourceLinks from './ResourceLinks';
import StudyPlan from './StudyPlan';
import ExamDatePicker from './ExamDatePicker';

const SAMPLE_QUESTION_BANK = `1. 十进制数 9 的 8421BCD 码是？
A. 1001
B. 1010
C. 1100
D. 1110
答案：A
解析：8421BCD 码用 4 位二进制表示 1 位十进制数，9 对应 1001。

2. 与模拟信号相比，数字信号具有哪些特征？
A. 时间连续
B. 时间离散
C. 数值连续
D. 数值离散
答案：BD
解析：数字信号在时间和数值上都是离散的；模拟信号在时间和数值上都是连续的。

3. 8421BCD 码是一种无权码。
答案：错
解析：8421BCD 码是有权码，4 位二进制各位的权值分别为 8、4、2、1。

4. 逻辑代数中，吸收律 A + \\bar{A}B = ________。
答案：A+B
解析：由吸收律 A + \\bar{A}B = A + B，可用来化简逻辑函数。

5. 理想变压器的电压比 U₁/U₂ 与匝数比的关系为？
A. N₂/N₁
B. N₁/N₂
C. N₁·N₂
D. 1
答案：B
解析：理想变压器电压比等于匝数比：U₁/U₂ = N₁/N₂。`;

const getDefaultExamDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().split('T')[0];
};

/**
 * 区块标题 - 衬线小标题 + mono 英文副标 + 渐变细线
 */
const SectionTitle = ({ title, subtitle, count }) => (
  <div className="flex items-baseline gap-3 mb-6">
    <h2 className="text-2xl text-primary font-serif" style={{ fontWeight: 400 }}>
      {title}
    </h2>
    <span className="text-xs font-mono text-gray-400 uppercase tracking-[0.2em]">
      {subtitle}
    </span>
    {count !== undefined && (
      <span className="text-[11px] font-mono text-accent-dark tabular-nums ml-1">
        {count}
      </span>
    )}
    <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-2" />
  </div>
);

const Upload = () => {
  const navigate = useNavigate();
  usePageTitle('上传资料');
  const pageRef = useStaggerAnimation([], '.stagger-item');
  const {
    state,
    uploadMaterial,
    setPlan,
    setQuestions,
    setExamDate,
    addResourceLink,
    deleteResourceLink,
    dueReviewQuestions
  } = useStudyContext();
  const { agents, thinkAndSay, clearHistory } = useAgents();

  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [examDateInput, setExamDateInput] = useState(state.examDate || getDefaultExamDate());
  const [parseProgress, setParseProgress] = useState(0);
  const [parseResult, setParseResult] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [knowledgePoints, setKnowledgePoints] = useState([]);
  // 正式模式下存储 FileUploader 解析返回的知识点和题目
  const [parsedResults, setParsedResults] = useState([]);

  useEffect(() => {
    if (state.plan && state.plan.knowledgePoints) {
      setKnowledgePoints(state.plan.knowledgePoints);
    } else {
      setKnowledgePoints(sampleKnowledgePoints);
    }
  }, [state.plan]);

  useEffect(() => {
    if (!state.examDate) {
      setExamDate(getDefaultExamDate());
    }
  }, [setExamDate, state.examDate]);

  // 正式模式下接收 FileUploader 的解析结果
  const handleParsed = (parsedData) => {
    console.log('文档解析结果:', {
      fileName: parsedData.file.name,
      knowledgePoints: parsedData.result?.knowledgePoints?.length || 0,
      questions: parsedData.result?.questions?.length || 0,
      resultKeys: Object.keys(parsedData.result || {})
    });
    setParsedResults(prev => {
      // 同名文件合并：保留题目更多的那份结果，同时补充知识点
      const existingIdx = prev.findIndex(r => r.file.name === parsedData.file.name);
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        const merged = {
          ...existing,
          result: {
            // 优先保留题目更多的那份（本地解析通常更完整）
            questions: existing.result.questions.length >= parsedData.result.questions.length
              ? existing.result.questions
              : parsedData.result.questions,
            // 知识点优先保留有内容的（AI 解析会生成知识点）
            knowledgePoints: existing.result.knowledgePoints.length > 0
              ? existing.result.knowledgePoints
              : parsedData.result.knowledgePoints
          }
        };
        console.log('同名文件合并:', {
          fileName: parsedData.file.name,
          finalQuestions: merged.result.questions.length,
          finalKnowledgePoints: merged.result.knowledgePoints.length
        });
        const next = [...prev];
        next[existingIdx] = merged;
        return next;
      }
      return [...prev, parsedData];
    });
  };

  const handleUseSampleQuestions = () => {
    const sampleFile = {
      id: `file-sample-${Date.now()}`,
      name: '电路分析示例题库.txt',
      size: 2048,
      type: 'questionBank',
      progress: 100,
      status: 'completed'
    };
    setFiles(prev => [...prev, sampleFile]);
  };

  const handleStartParse = async () => {
    setIsParsing(true);
    setStep(2);
    setParseProgress(0);
    setParseError('');
    clearHistory();

    const isFormalMode = state.mode === 'formal';
    const supervisorConfig = state.aiConfig['supervisor'];
    const questionFiles = files.filter(f => f.type === 'questionBank');
    let result = { successCount: 0, totalCount: 0, questions: [] };

    const progressInterval = setInterval(() => {
      setParseProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 3;
      });
    }, 150);

    await thinkAndSay('supervisor', '收到资料，正在分析整体结构...', 1500);

    if (isFormalMode && parsedResults.length > 0) {
      // 正式模式：使用 FileUploader 已解析的结果
      const allKnowledgePoints = parsedResults.flatMap(r => r.result.knowledgePoints || []);
      const allQuestions = parsedResults.flatMap(r => r.result.questions || []);
      console.log('正式模式解析汇总:', {
        parsedResultsCount: parsedResults.length,
        knowledgePointsCount: allKnowledgePoints.length,
        questionsCount: allQuestions.length,
        firstQuestion: allQuestions[0] ? JSON.stringify(allQuestions[0]).substring(0, 200) : 'none'
      });

      if (allQuestions.length > 0) {
        await thinkAndSay('quiz-master', '已识别题目，正在整理...', 2000);
        result = {
          successCount: allQuestions.length,
          totalCount: allQuestions.length,
          questions: allQuestions
        };
      } else {
        await thinkAndSay('quiz-master', '我来识别知识点和考点分布...', 2000);
      }

      await thinkAndSay('explainer', '我在标记重点和难点部分...正在关联教学资源...', 1500);

      clearInterval(progressInterval);
      setParseProgress(100);
      setParseResult(result);

      // 关键：将解析的题目写入 Context（正式模式的题库来源）
      if (result.questions.length > 0) {
        const kps = allKnowledgePoints.length > 0 ? allKnowledgePoints : sampleKnowledgePoints;
        const questionsWithKp = result.questions.map((q, idx) => {
          const kpIndex = Math.min(Math.floor(idx / 3), kps.length - 1);
          // 找到该题目对应的 fileId：优先使用已有 materialId，否则根据题目顺序分配到对应文件
          const fileId = q.materialId || parsedResults[Math.min(idx, parsedResults.length - 1)]?.file?.id;
          return {
            ...q,
            knowledgePointId: q.knowledgePointId || kps[kpIndex]?.id,
            difficulty: q.difficulty || ['easy', 'medium', 'hard'][idx % 3],
            materialId: fileId || 'default'
          };
        });
        console.log('写入 Context 的题目数量:', questionsWithKp.length);
        setQuestions(questionsWithKp);
      } else {
        console.warn('正式模式：解析结果中没有题目，不写入 Context');
      }

      // 使用 supervisor 配置生成学习计划（失败时降级到 Mock）
      try {
        const materials = files.map(f => ({ name: f.name, type: f.type }));
        const plan = await generatePlan(supervisorConfig, materials, examDateInput);
        const knowledgePointsToUse = allKnowledgePoints.length > 0
          ? allKnowledgePoints
          : (plan.knowledgePoints || sampleKnowledgePoints);
        const planWithDates = {
          ...plan,
          knowledgePoints: knowledgePointsToUse.map((kp, idx) => {
            const daysToAdd = Math.floor(idx * (14 / knowledgePointsToUse.length));
            const date = new Date();
            date.setDate(date.getDate() + daysToAdd + 1);
            return {
              ...kp,
              scheduledDate: date.toISOString().split('T')[0]
            };
          })
        };
        setPlan(planWithDates);
      } catch (planError) {
        console.warn('生成学习计划失败，使用解析的知识点:', planError);
        setParseError(
          '生成学习计划时遇到异常：' +
          (planError.message || 'AI 服务返回错误') +
          '。已使用本地解析结果生成基础计划，你可以稍后重试或继续刷题。'
        );
        const planWithDates = {
          id: `plan-${Date.now()}`,
          title: '学习计划',
          createdAt: new Date().toISOString(),
          knowledgePoints: allKnowledgePoints.length > 0 ? allKnowledgePoints : sampleKnowledgePoints,
          estimatedDays: 14,
          totalMinutes: (allKnowledgePoints.length > 0 ? allKnowledgePoints : sampleKnowledgePoints).reduce((sum, kp) => sum + (kp.estimatedTime || 60), 0)
        };
        setPlan(planWithDates);
      }
    } else {
      // 演示模式（或正式模式下无解析结果）：保持原有流程
      if (questionFiles.length > 0) {
        await thinkAndSay('quiz-master', '正在解析题库原题...', 2000);
        result = parseQuestionBank(SAMPLE_QUESTION_BANK);
      } else {
        await thinkAndSay('quiz-master', '我来识别知识点和考点分布...', 2000);
        result = {
          successCount: sampleQuestions.length,
          totalCount: sampleQuestions.length,
          questions: sampleQuestions
        };
      }

      await thinkAndSay('explainer', '我在标记重点和难点部分...正在关联教学资源...', 1500);

      clearInterval(progressInterval);
      setParseProgress(100);
      setParseResult(result);

      if (result.questions.length > 0) {
        const demoMaterialId = files.length > 0 ? files[0].id : 'demo';
        const questionsWithKp = result.questions.map((q, idx) => {
          const kpIndex = Math.min(Math.floor(idx / 3), sampleKnowledgePoints.length - 1);
          return {
            ...q,
            knowledgePointId: sampleKnowledgePoints[kpIndex].id,
            difficulty: q.difficulty || ['easy', 'medium', 'hard'][idx % 3],
            materialId: demoMaterialId
          };
        });
        setQuestions(questionsWithKp);
      }

      // 正式模式传入 supervisor 配置，演示模式传 undefined 自动降级到 Mock
      const plan = await generatePlan(
        isFormalMode ? supervisorConfig : undefined,
        files,
        examDateInput
      );
      const planWithDates = {
        ...plan,
        knowledgePoints: plan.knowledgePoints.map((kp, idx) => {
          const daysToAdd = Math.floor(idx * (14 / plan.knowledgePoints.length));
          const date = new Date();
          date.setDate(date.getDate() + daysToAdd + 1);
          return {
            ...kp,
            scheduledDate: date.toISOString().split('T')[0]
          };
        })
      };
      setPlan(planWithDates);
    }

    if (files.length > 0) {
      // 每个文件作为一个独立题库（material），id 与 file.id 一致，便于题目关联
      files.forEach(file => {
        uploadMaterial({
          id: file.id,
          name: file.name,
          content: '上传的复习资料',
          uploadedAt: new Date().toISOString()
        });
      });
    } else {
      uploadMaterial({
        id: 'demo',
        name: '电路分析复习资料',
        content: '默认电路分析复习资料',
        uploadedAt: new Date().toISOString()
      });
    }

    setIsParsing(false);
    setStep(3);
  };

  const allUploaded = files.every(f => f.status === 'completed') || files.length === 0;
  const canStartParse = allUploaded;

  const stepLabels = ['上传资料', '解析中', '复习计划'];
  const stepEnglish = ['UPLOAD', 'PARSING', 'PLAN'];

  return (
    <div ref={pageRef} className="page-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* 标题区 - 衬线大字 + mono 日期 + 金色强调 */}
        <div className="mb-14 stagger-item">
          <p className="text-xs font-mono text-gray-400 uppercase tracking-[0.25em] mb-3">
            上传与解析 · UPLOAD
          </p>
          <h1 className="text-4xl md:text-5xl text-primary mb-3" style={{ fontWeight: 400, lineHeight: 1.1 }}>
            上传资料，生成
            <span className="text-accent-dark">专属题库</span>
          </h1>
          <p className="text-gray-500 text-base max-w-2xl leading-relaxed">
            上传学习资料，AI 将为你生成专属复习计划与智能题库。
          </p>
        </div>

        {/* 步骤指示器 - 衬线编号 + 精致细线 */}
        <div className="flex flex-wrap items-center justify-center mb-14 stagger-item">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-serif text-sm transition-colors duration-300 ${
                  step >= s
                    ? 'bg-primary text-accent-light shadow-sm'
                    : 'bg-gray-50 text-gray-400 border border-gray-200'
                }`} style={step >= s ? { fontWeight: 400, letterSpacing: '-0.02em' } : { fontWeight: 400 }}>
                  {s}
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm transition-colors duration-300 font-serif ${step >= s ? 'text-primary' : 'text-gray-400'}`} style={{ fontWeight: 400 }}>
                    {stepLabels[s - 1]}
                  </span>
                  <span className={`text-[10px] font-mono uppercase tracking-[0.2em] transition-colors duration-300 ${step >= s ? 'text-accent-dark' : 'text-gray-300'}`}>
                    {stepEnglish[s - 1]}
                  </span>
                </div>
              </div>
              {s < 3 && (
                <div className={`h-px w-16 mx-4 transition-colors duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  step > s ? 'bg-primary' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-10">
            {state.mode === 'formal' && !isAIConfigured(state.aiConfig['supervisor']) && (
              <Card className="p-5 stagger-item bg-amber-50/60 border-amber-200/70">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-serif text-amber-800" style={{ fontWeight: 500 }}>请先在设置页面配置 AI</p>
                    <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">未配置 AI 服务时将使用演示数据，无法进行真实文档解析</p>
                  </div>
                  <Link
                    to="/settings"
                    className="text-sm text-primary font-medium underline flex-shrink-0 underline-offset-4"
                  >
                    去配置
                  </Link>
                </div>
              </Card>
            )}

            <Card className="p-6 sm:p-10 stagger-item" elevated>
              <SectionTitle title="上传文件" subtitle="Step 01" />
              <FileUploader
                files={files}
                setFiles={setFiles}
                onUseSampleQuestions={handleUseSampleQuestions}
                onParsed={handleParsed}
              />
            </Card>

            <Card className="p-6 sm:p-10 stagger-item" elevated>
              <SectionTitle title="考试日期" subtitle="Step 02" />
              <ExamDatePicker
                value={examDateInput}
                onChange={(value) => {
                  setExamDateInput(value);
                  if (value) {
                    setExamDate(value);
                  }
                }}
              />
            </Card>

            <div className="flex justify-end stagger-item">
              <Button
                onClick={handleStartParse}
                disabled={!canStartParse}
                size="lg"
              >
                开始刷题
                <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <Card className="p-6 sm:p-10 stagger-item" elevated>
              <SectionTitle title="解析过程" subtitle="Parsing" />
              <ParsingProcess
                agents={agents}
                progress={parseProgress}
                parseResult={parseResult}
                isComplete={!isParsing && parseResult !== null}
              />
            </Card>

            {parseError && (
              <Card className="p-5 stagger-item bg-red-50/60 border-red-200/70">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700 leading-relaxed">{parseError}</p>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-sm text-primary hover:text-accent-dark font-medium cursor-pointer whitespace-nowrap transition-colors duration-200"
                  >
                    <RotateCcw size={14} />
                    返回重试
                  </button>
                </div>
              </Card>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10">
            {parseError && (
              <Card className="p-5 stagger-item bg-red-50/60 border-red-200/70">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700 leading-relaxed">{parseError}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* 刷题引导 - 金色强调卡片 */}
            <Card className="p-6 sm:p-8 stagger-item bg-gradient-to-br from-accent/8 to-accent/3 border-accent/20" elevated>
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center flex-shrink-0 shadow-gold">
                  <Check className="text-primary" size={24} strokeWidth={2.2} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-accent-dark mb-1">
                    Parsing Complete
                  </p>
                  <h2 className="text-2xl text-primary font-serif mb-2" style={{ fontWeight: 400 }}>
                    资料解析完成
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    已为你生成
                    <span className="font-serif text-2xl text-primary mx-2 tabular-nums" style={{ fontWeight: 400, letterSpacing: '-0.04em' }}>
                      {state.questions?.length || 0}
                    </span>
                    道题目。点击右下角「开始刷题」即可进入练习界面。
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-10 stagger-item" elevated>
              <SectionTitle title="知识点结构" subtitle="Knowledge" count={`${knowledgePoints.length} 个`} />
              <KnowledgeTree knowledgePoints={knowledgePoints} />
            </Card>

            <Card className="p-6 sm:p-10 stagger-item" elevated>
              <ResourceLinks
                resourceLinks={state.resourceLinks}
                knowledgePoints={knowledgePoints}
                onAdd={addResourceLink}
                onDelete={deleteResourceLink}
              />
            </Card>

            <Card className="p-6 sm:p-10 stagger-item" elevated>
              <StudyPlan
                plan={state.plan}
                knowledgePoints={knowledgePoints}
                dueReviewQuestions={dueReviewQuestions}
              />
            </Card>

            <div className="flex justify-end stagger-item">
              <Button
                onClick={() => navigate('/quiz')}
                size="lg"
              >
                开始刷题
                <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
