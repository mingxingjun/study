import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Pencil, Trash2, BookOpen, Filter, X, Check,
  FileText, Database, Sparkles, Loader2, Layers, Square, CheckSquare,
  Image, Upload
} from 'lucide-react';
import { useStudyContext } from '../../context/StudyContext';
import usePageTitle from '../../hooks/usePageTitle';
import { sampleKnowledgePoints } from '../../mock/sampleData';
import { generateQuestionsByKnowledgePoint, isAIConfigured } from '../../services/aiService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import QuestionImage from '../../components/ui/QuestionImage';
import MathRenderer from '../../components/MathRenderer';
import FormulaInput from '../../components/FormulaInput';
import useStaggerAnimation from '../../hooks/useStaggerAnimation';

/**
 * 题型配置 - 统一金色徽章风格
 * @type {Object.<string, {label: string, badge: string}>}
 */
const TYPE_CONFIG = {
  single: { label: '单选题', badge: 'bg-accent-light/40 text-accent-dark border-accent/30' },
  multiple: { label: '多选题', badge: 'bg-primary/5 text-primary border-primary/20' },
  truefalse: { label: '判断题', badge: 'bg-warm-100 text-gray-700 border-warm-300' },
  fillblank: { label: '填空题', badge: 'bg-accent-light/30 text-accent-dark border-accent/25' },
  essay: { label: '简答题', badge: 'bg-gray-100 text-gray-700 border-gray-200' },
  calculation: { label: '计算题', badge: 'bg-accent/15 text-accent-dark border-accent/40' }
};

/** AI 出题协作步骤 */
const GENERATION_STEPS = ['分析知识点', '生成题干与选项', '评估难度与科学性', '格式化校验'];

/**
 * 难度配置 - 编辑风灰阶 + 金色
 * @type {Object.<string, {label: string, badge: string}>}
 */
const DIFFICULTY_CONFIG = {
  easy: { label: '易', badge: 'border-gray-200 text-gray-500 bg-gray-50' },
  medium: { label: '中', badge: 'border-accent/30 text-accent-dark bg-accent-light/30' },
  hard: { label: '难', badge: 'border-primary text-white bg-primary' }
};

/**
 * 生成唯一题目 ID
 * @returns {string}
 */
const generateQuestionId = () => `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * 获取题目类型的显示配置
 * @param {string} type
 * @returns {{label: string, badge: string}}
 */
const getTypeConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.single;

/** 题型筛选项 */
const FILTER_TYPES = [
  { value: 'all', label: '全部' },
  { value: 'single', label: '单选' },
  { value: 'multiple', label: '多选' },
  { value: 'truefalse', label: '判断' },
  { value: 'fillblank', label: '填空' },
  { value: 'essay', label: '简答' },
  { value: 'calculation', label: '计算' }
];

/**
 * 获取难度的显示配置
 * @param {string} difficulty
 * @returns {{label: string, badge: string}}
 */
const getDifficultyConfig = (difficulty) => DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.easy;

/**
 * 将选项数组转为 A/B/C/D 格式
 * @param {string[]} options
 * @returns {string[]}
 */
const normalizeOptions = (options) => {
  if (!Array.isArray(options) || options.length === 0) return [];
  return options.map((opt, idx) => {
    const letter = String.fromCharCode(65 + idx);
    const text = String(opt).replace(/^[A-F][.、]\s*/, '');
    return `${letter}. ${text}`;
  });
};

/**
 * 创建空表单数据
 * @param {string} materialId
 * @returns {Object}
 */
const createEmptyForm = (materialId = 'manual') => ({
  id: '',
  question: '',
  type: 'single',
  difficulty: 'easy',
  knowledgePointId: '',
  options: ['A. ', 'B. ', 'C. ', 'D. '],
  answer: '',
  explanation: '',
  image: '',
  materialId
});

/**
 * 区块标题 - 衬线中文 + mono 英文 + 渐变细线
 */
const SectionTitle = ({ title, subtitle, action }) => (
  <div className="flex items-baseline gap-3 mb-6">
    <h2 className="text-2xl text-primary font-serif" style={{ fontWeight: 400 }}>
      {title}
    </h2>
    <span className="text-xs font-mono text-gray-400 uppercase tracking-[0.2em]">
      {subtitle}
    </span>
    <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-2" />
    {action}
  </div>
);

/**
 * 题库管理页面
 * 按文档/题库分组展示题目，支持增删查改和 AI 按知识点出题
 */
const QuestionBank = () => {
  const navigate = useNavigate();
  usePageTitle('题库管理');
  const pageRef = useStaggerAnimation([], '.stagger-item');
  const {
    state,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    deleteMaterial,
    setQuestions
  } = useStudyContext();

  const questions = useMemo(() => state.questions || [], [state.questions]);
  const materials = useMemo(() => state.materials || [], [state.materials]);
  const knowledgePoints = state.plan?.knowledgePoints?.length > 0
    ? state.plan.knowledgePoints
    : sampleKnowledgePoints;

  // 构建题库列表：每个 material 一个题库 + 手动题库
  const questionBanks = useMemo(() => {
    const banks = [];

    // 来自上传文档的题库
    materials.forEach((material) => {
      const count = questions.filter((q) => q.materialId === material.id).length;
      banks.push({
        id: material.id,
        name: material.name,
        type: 'document',
        questionCount: count,
        uploadedAt: material.uploadedAt
      });
    });

    // 手动添加的题目
    const manualCount = questions.filter((q) => !q.materialId || q.materialId === 'manual').length;
    banks.push({
      id: 'manual',
      name: '手动题库',
      type: 'manual',
      questionCount: manualCount
    });

    return banks;
  }, [materials, questions]);

  const [selectedBankId, setSelectedBankId] = useState(questionBanks[0]?.id || 'manual');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form, setForm] = useState(createEmptyForm(selectedBankId));
  const [deletingId, setDeletingId] = useState(null);
  const [deletingBankId, setDeletingBankId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [formError, setFormError] = useState('');

  // AI 出题弹窗状态
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [selectedKnowledgePointId, setSelectedKnowledgePointId] = useState('');
  const [selectedTypes, setSelectedTypes] = useState(['single']);
  const [questionsPerType, setQuestionsPerType] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorError, setGeneratorError] = useState('');
  const [generationStep, setGenerationStep] = useState(0);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const successCloseTimer = useRef(null);

  // 当题库列表变化时，确保选中项有效
  useEffect(() => {
    if (questionBanks.length > 0 && !questionBanks.find((b) => b.id === selectedBankId)) {
      setSelectedBankId(questionBanks[0].id);
    }
  }, [questionBanks, selectedBankId]);

  // 根据搜索和筛选条件过滤当前题库题目
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const belongsToBank = selectedBankId === 'manual'
        ? (!q.materialId || q.materialId === 'manual')
        : q.materialId === selectedBankId;
      const matchesSearch = !searchQuery.trim() ||
        q.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer?.toString().toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || q.type === typeFilter;
      return belongsToBank && matchesSearch && matchesType;
    });
  }, [questions, selectedBankId, searchQuery, typeFilter]);

  /**
   * 打开新增弹窗
   */
  const handleAdd = useCallback(() => {
    setEditingQuestion(null);
    setForm(createEmptyForm(selectedBankId));
    setFormError('');
    setIsModalOpen(true);
  }, [selectedBankId]);

  /**
   * 打开编辑弹窗
   * @param {Object} question
   */
  const handleEdit = useCallback((question) => {
    setEditingQuestion(question);
    setForm({
      ...question,
      options: normalizeOptions(question.options || [])
    });
    setFormError('');
    setIsModalOpen(true);
  }, []);

  /**
   * 关闭弹窗
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingQuestion(null);
    setForm(createEmptyForm(selectedBankId));
    setFormError('');
  }, [selectedBankId]);

  /**
   * 处理表单字段变更
   * @param {string} field
   * @param {*} value
   */
  const handleChange = useCallback((field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'type') {
        if (value === 'single' || value === 'multiple') {
          next.options = ['A. ', 'B. ', 'C. ', 'D. '];
          next.answer = '';
        } else if (value === 'truefalse') {
          next.options = [];
          next.answer = 'true';
        } else if (value === 'fillblank' || value === 'essay' || value === 'calculation') {
          next.options = [];
          next.answer = '';
        }
      }
      return next;
    });
    setFormError('');
  }, []);

  /**
   * 处理题目图片上传
   * @param {FileList} files
   */
  const handleImageUpload = useCallback((files) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('请上传图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setForm((prev) => ({ ...prev, image: e.target?.result || '' }));
      setFormError('');
    };
    reader.onerror = () => setFormError('图片读取失败');
    reader.readAsDataURL(file);
  }, []);

  /**
   * 移除题目图片
   */
  const handleRemoveImage = useCallback(() => {
    setForm((prev) => ({ ...prev, image: '' }));
  }, []);

  /**
   * 处理选项内容变更
   * @param {number} index
   * @param {string} value
   */
  const handleOptionChange = useCallback((index, value) => {
    setForm((prev) => {
      const options = [...prev.options];
      const letter = String.fromCharCode(65 + index);
      const text = value.replace(/^[A-F][.、]\s*/, '');
      options[index] = `${letter}. ${text}`;
      return { ...prev, options };
    });
  }, []);

  /**
   * 添加新的选项
   */
  const handleAddOption = useCallback(() => {
    setForm((prev) => {
      if (prev.options.length >= 6) return prev;
      const letter = String.fromCharCode(65 + prev.options.length);
      return { ...prev, options: [...prev.options, `${letter}. `] };
    });
  }, []);

  /**
   * 删除选项
   * @param {number} index
   */
  const handleRemoveOption = useCallback((index) => {
    setForm((prev) => {
      const options = prev.options.filter((_, i) => i !== index);
      const normalized = options.map((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        const text = String(opt).replace(/^[A-F][.、]\s*/, '');
        return `${letter}. ${text}`;
      });
      const removedLetter = String.fromCharCode(65 + index);
      let answer = prev.answer;
      if (prev.type === 'single' && answer === removedLetter) {
        answer = '';
      } else if (prev.type === 'multiple') {
        answer = (answer || '').split('').filter(l => l !== removedLetter).sort().join('');
      }
      return { ...prev, options: normalized, answer };
    });
  }, []);

  /**
   * 验证表单数据
   * @returns {boolean}
   */
  const validateForm = useCallback(() => {
    if (!form.question.trim()) {
      setFormError('请输入题干');
      return false;
    }
    if (!form.knowledgePointId) {
      setFormError('请选择知识点');
      return false;
    }
    if (form.type === 'single' || form.type === 'multiple') {
      const validOptions = form.options.filter((opt) => opt.replace(/^[A-F][.、]\s*/, '').trim());
      if (validOptions.length < 2) {
        setFormError('选择题至少需要 2 个有效选项');
        return false;
      }
      if (!form.answer) {
        setFormError('请选择正确答案');
        return false;
      }
    }
    if ((form.type === 'fillblank' || form.type === 'essay' || form.type === 'calculation') && !String(form.answer).trim()) {
      setFormError('请输入答案');
      return false;
    }
    return true;
  }, [form]);

  /**
   * 提交表单
   */
  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    const payload = {
      ...form,
      options: form.type === 'single' || form.type === 'multiple' ? normalizeOptions(form.options) : [],
      answer: form.type === 'truefalse' ? String(form.answer) : form.answer,
      materialId: selectedBankId === 'manual' ? 'manual' : selectedBankId,
      image: form.image || undefined
    };

    if (editingQuestion) {
      updateQuestion(payload);
    } else {
      payload.id = generateQuestionId();
      addQuestion(payload);
    }
    handleCloseModal();
  }, [form, editingQuestion, selectedBankId, validateForm, addQuestion, updateQuestion, handleCloseModal]);

  /**
   * 切换题目选中状态（批量选择）
   * @param {string} id
   */
  const toggleSelectQuestion = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /**
   * 全选当前筛选结果
   */
  const selectAllFiltered = useCallback(() => {
    setSelectedIds(new Set(filteredQuestions.map(q => q.id)));
  }, [filteredQuestions]);

  /**
   * 清空批量选择
   */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsBatchDeleting(false);
  }, []);

  /**
   * 开始行内删除确认
   * @param {string} id
   */
  const startSingleDelete = useCallback((id) => {
    setDeletingId(id);
  }, []);

  /**
   * 确认删除单道题目
   * @param {string} id
   */
  const confirmSingleDelete = useCallback((id) => {
    deleteQuestion(id);
    setDeletingId(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [deleteQuestion]);

  /**
   * 取消单道删除
   */
  const cancelSingleDelete = useCallback(() => {
    setDeletingId(null);
  }, []);

  /**
   * 确认批量删除
   */
  const confirmBatchDelete = useCallback(() => {
    selectedIds.forEach(id => deleteQuestion(id));
    clearSelection();
  }, [selectedIds, deleteQuestion, clearSelection]);

  /**
   * 开始删除题库
   * @param {string} bankId
   */
  const startDeleteBank = useCallback((bankId) => {
    setDeletingBankId(bankId);
  }, []);

  /**
   * 取消删除题库
   */
  const cancelDeleteBank = useCallback(() => {
    setDeletingBankId(null);
  }, []);

  /**
   * 确认删除题库
   * @param {Object} bank
   */
  const confirmDeleteBank = useCallback((bank) => {
    if (bank.type === 'manual') {
      questions
        .filter(q => !q.materialId || q.materialId === 'manual')
        .forEach(q => deleteQuestion(q.id));
    } else {
      deleteMaterial(bank.id);
    }

    if (selectedBankId === bank.id) {
      const nextBank = questionBanks.find(b => b.id !== bank.id);
      setSelectedBankId(nextBank?.id || 'manual');
    }

    setDeletingBankId(null);
  }, [questions, selectedBankId, questionBanks, deleteQuestion, deleteMaterial]);

  /**
   * 当题库、搜索或筛选变化时，清空批量选择，避免选中不可见题目
   */
  useEffect(() => {
    clearSelection();
  }, [selectedBankId, searchQuery, typeFilter, clearSelection]);

  /**
   * AI 出题过程中按时间推进协作步骤
   */
  useEffect(() => {
    if (!isGenerating || generationSuccess) return;

    const timers = [
      setTimeout(() => setGenerationStep(1), 800),
      setTimeout(() => setGenerationStep(2), 2200),
      setTimeout(() => setGenerationStep(3), 4000)
    ];

    return () => timers.forEach(clearTimeout);
  }, [isGenerating, generationSuccess]);

  /**
   * 根据知识点 ID 获取名称
   * @param {string} id
   * @returns {string}
   */
  const getKnowledgePointName = useCallback((id) => {
    return knowledgePoints.find((kp) => kp.id === id)?.name || '未知知识点';
  }, [knowledgePoints]);

  /**
   * 打开 AI 出题弹窗
   */
  const handleOpenAIGenerator = useCallback(() => {
    setSelectedKnowledgePointId(knowledgePoints[0]?.id || '');
    setSelectedTypes(['single']);
    setQuestionsPerType(2);
    setGeneratorError('');
    setGenerationStep(0);
    setGenerationSuccess(false);
    setGeneratedCount(0);
    setIsAIGeneratorOpen(true);
  }, [knowledgePoints]);

  /**
   * 关闭 AI 出题弹窗
   */
  const handleCloseAIGenerator = useCallback(() => {
    if (successCloseTimer.current) {
      clearTimeout(successCloseTimer.current);
      successCloseTimer.current = null;
    }
    setIsAIGeneratorOpen(false);
    setSelectedKnowledgePointId('');
    setSelectedTypes(['single']);
    setQuestionsPerType(2);
    setGeneratorError('');
    setGenerationStep(0);
    setGenerationSuccess(false);
    setGeneratedCount(0);
  }, []);

  /**
   * 切换题型选择
   * @param {string} type
   */
  const toggleQuestionType = useCallback((type) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  }, []);

  /**
   * 执行 AI 出题
   */
  const handleGenerateQuestions = useCallback(async () => {
    if (!selectedKnowledgePointId) {
      setGeneratorError('请选择知识点');
      return;
    }
    if (selectedTypes.length === 0) {
      setGeneratorError('请至少选择一种题型');
      return;
    }

    const agentConfig = state.aiConfig?.['quiz-master'];
    if (!isAIConfigured(agentConfig)) {
      setGeneratorError('请先配置 AI（出题官 Agent）');
      return;
    }

    const knowledgePoint = knowledgePoints.find((kp) => kp.id === selectedKnowledgePointId);
    if (!knowledgePoint) {
      setGeneratorError('知识点不存在');
      return;
    }

    setIsGenerating(true);
    setGeneratorError('');
    setGenerationStep(0);
    setGenerationSuccess(false);
    setGeneratedCount(0);

    try {
      const generated = await generateQuestionsByKnowledgePoint(
        agentConfig,
        knowledgePoint,
        selectedTypes,
        questionsPerType,
        selectedBankId === 'manual' ? 'manual' : selectedBankId
      );

      if (generated.length === 0) {
        setGeneratorError('AI 未生成题目，请检查配置或稍后重试');
        setIsGenerating(false);
        return;
      }

      setGeneratedCount(generated.length);
      setGenerationSuccess(true);

      // 将生成的题目加入题库
      generated.forEach((q) => addQuestion(q));

      successCloseTimer.current = setTimeout(() => {
        handleCloseAIGenerator();
      }, 1500);
    } catch (error) {
      setGeneratorError(error.message || '生成题目失败');
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedKnowledgePointId,
    selectedTypes,
    questionsPerType,
    knowledgePoints,
    state.aiConfig,
    selectedBankId,
    addQuestion,
    handleCloseAIGenerator
  ]);

  /**
   * 将当前题库的题目同步到刷题队列
   */
  const handleGoToQuiz = useCallback(() => {
    const bankQuestions = questions.filter((q) =>
      selectedBankId === 'manual'
        ? (!q.materialId || q.materialId === 'manual')
        : q.materialId === selectedBankId
    );
    setQuestions(bankQuestions);
    navigate('/quiz');
  }, [questions, selectedBankId, setQuestions, navigate]);

  const selectedBank = questionBanks.find((b) => b.id === selectedBankId) || questionBanks[0];

  return (
    <div ref={pageRef} className="page-fade-in">
      {/* 页面标题 - 衬线大字 + mono 标签 */}
      <div className="mb-12 stagger-item">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-[0.25em] mb-3">
              Question Library
            </p>
            <h1 className="text-4xl md:text-5xl text-primary mb-3" style={{ fontWeight: 400, lineHeight: 1.1 }}>
              题库管理
            </h1>
            <p className="text-gray-500 text-base max-w-2xl leading-relaxed">
              按文档管理题库，支持搜索、编辑、手动添加和 AI 出题
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleGoToQuiz}>
              <BookOpen size={16} strokeWidth={1.8} />
              刷当前题库
            </Button>
            <Button onClick={handleAdd}>
              <Plus size={16} strokeWidth={1.8} />
              新增题目
            </Button>
          </div>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="mb-8 stagger-item">
          <Card elevated className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-5">
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-serif text-2xl text-primary tabular-nums"
                    style={{ fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1 }}
                  >
                    {selectedIds.size}
                  </span>
                  <span className="text-sm text-gray-500">题已选</span>
                </div>
                <button
                  onClick={selectAllFiltered}
                  className="text-sm text-primary hover:text-accent-dark font-medium cursor-pointer border-b border-primary/20 hover:border-accent-dark/40 pb-0.5"
                >
                  全选本页
                </button>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  取消选择
                </button>
              </div>

              {!isBatchDeleting ? (
                <button
                  onClick={() => setIsBatchDeleting(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} strokeWidth={1.8} />
                  批量删除
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    确定删除 <span className="font-bold text-red-600">{selectedIds.size}</span> 道题目？
                  </span>
                  <button
                    onClick={() => setIsBatchDeleting(false)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmBatchDelete}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    确认删除
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        {/* 左侧题库列表 */}
        <div className="stagger-item">
          <SectionTitle title="题库列表" subtitle="Libraries" />
          <Card elevated className="p-4 h-fit">
            <div className="space-y-1">
              {questionBanks.map((bank, idx) => {
                const isActive = bank.id === selectedBankId;
                const isDeleting = deletingBankId === bank.id;
                const Icon = bank.type === 'document' ? FileText : Layers;
                return (
                  <div
                    key={bank.id}
                    className={`flex items-center gap-1 rounded-xl transition-all duration-200 ${
                      isActive ? 'bg-primary shadow-sm' : 'text-gray-700 hover:bg-warm-50'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedBankId(bank.id)}
                      className="flex-1 flex items-center gap-3 px-3 py-3 text-left cursor-pointer min-w-0"
                    >
                      {/* 编号 / 图标 */}
                      <div className={`flex-shrink-0 flex items-center gap-2`}>
                        <span
                          className={`font-serif text-sm tabular-nums ${
                            isActive ? 'text-accent' : 'text-gray-300'
                          }`}
                          style={{ fontWeight: 400, letterSpacing: '-0.02em' }}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <Icon
                          size={16}
                          strokeWidth={1.8}
                          className={isActive ? 'text-accent' : 'text-gray-500'}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-white font-serif' : 'text-gray-900'}`} style={isActive ? { fontWeight: 500 } : {}}>
                          {bank.name}
                        </p>
                        <p className={`text-[11px] mt-0.5 font-mono tabular-nums ${isActive ? 'text-white/60' : 'text-gray-400'}`}>
                          {bank.questionCount} 道
                        </p>
                      </div>
                    </button>

                    {!isDeleting ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startDeleteBank(bank.id);
                        }}
                        className={`p-2 mr-2 rounded-lg transition-colors cursor-pointer ${
                          isActive
                            ? 'text-white/60 hover:bg-white/20'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title={bank.type === 'manual' ? '清空手动题库' : '删除题库'}
                      >
                        <Trash2 size={14} strokeWidth={1.8} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 mr-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelDeleteBank();
                          }}
                          className="px-2 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          取消
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteBank(bank);
                          }}
                          className="px-2 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {questionBanks.length === 0 && (
                <div className="px-3 py-10 text-center">
                  <div className="w-14 h-14 bg-warm-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200/60 shadow-xs">
                    <Database className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
                  </div>
                  <p className="font-serif text-base text-gray-700 mb-1.5" style={{ fontWeight: 500 }}>
                    暂无题库
                  </p>
                  <p className="text-xs text-gray-400 font-mono tracking-wide mb-5">
                    上传资料后将自动创建题库
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/upload')}
                  >
                    <Upload size={14} strokeWidth={1.8} />
                    上传资料
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 右侧题目管理 */}
        <div>
          {/* 题库信息卡 */}
          <Card elevated className="p-6 mb-6 stagger-item">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <h2 className="text-xl font-serif text-primary" style={{ fontWeight: 500 }}>
                    {selectedBank?.name || '未选择题库'}
                  </h2>
                  <span className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em]">
                    Bank
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  共 <span className="font-mono text-primary tabular-nums font-medium">{selectedBank?.questionCount || 0}</span> 道题目
                </p>
              </div>
              <Button variant="secondary" onClick={handleOpenAIGenerator}>
                <Sparkles size={16} strokeWidth={1.8} />
                AI 按知识点出题
              </Button>
            </div>
          </Card>

          {/* 搜索与筛选 */}
          <Card elevated className="p-5 mb-6 stagger-item">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-accent/30 transition-all">
                <Search className="text-gray-400 flex-shrink-0 mr-2.5" size={16} strokeWidth={1.8} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索题干或答案..."
                  className="w-full bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                />
              </div>
              <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
                <Filter size={16} className="text-gray-400 flex-shrink-0 mt-2.5 sm:mt-2" strokeWidth={1.8} />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 flex-1">
                  {FILTER_TYPES.map((type) => {
                    const isActive = typeFilter === type.value;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setTypeFilter(type.value)}
                        className={`px-3 py-2 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer min-h-[40px] touch-manipulation ${
                          isActive
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-warm-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* 题目列表 */}
          <div className="space-y-5">
            {filteredQuestions.length === 0 ? (
              <Card elevated className="p-16 text-center stagger-item">
                <div className="w-16 h-16 bg-warm-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-gray-200/60 shadow-xs">
                  <Search className="text-gray-400" size={26} strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-xl text-gray-900 mb-2" style={{ fontWeight: 500 }}>
                  未找到匹配题目
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {selectedBank?.questionCount === 0
                    ? '当前题库为空，点击上方添加题目或使用 AI 出题'
                    : '尝试更换搜索词或筛选条件'}
                </p>
                {selectedBank?.questionCount === 0 && (
                  <div className="flex items-center justify-center gap-3">
                    <Button onClick={handleAdd}>
                      <Plus size={16} strokeWidth={1.8} />
                      新增题目
                    </Button>
                    <Button variant="secondary" onClick={handleOpenAIGenerator}>
                      <Sparkles size={16} strokeWidth={1.8} />
                      AI 出题
                    </Button>
                  </div>
                )}
              </Card>
            ) : (
              filteredQuestions.map((q, index) => {
                const typeConfig = getTypeConfig(q.type || (q.options?.length > 0 ? 'single' : 'fillblank'));
                const difficultyConfig = getDifficultyConfig(q.difficulty);
                return (
                  <Card key={q.id} elevated className="p-6 lg:p-7 hover:border-gray-300 transition-colors duration-200 stagger-item">
                    <div className="flex items-start gap-5">
                      {/* 左侧：选择 + 大号衬线编号 */}
                      <div className="flex items-center gap-3 flex-shrink-0 mt-1">
                        <button
                          onClick={() => toggleSelectQuestion(q.id)}
                          className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          title={selectedIds.has(q.id) ? '取消选择' : '选择'}
                        >
                          {selectedIds.has(q.id) ? (
                            <CheckSquare size={18} className="text-accent-dark" strokeWidth={1.8} />
                          ) : (
                            <Square size={18} className="text-gray-300" strokeWidth={1.8} />
                          )}
                        </button>
                        <span
                          className="font-serif text-3xl text-gray-200 tabular-nums"
                          style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 }}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* 标签组 */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border tracking-wide ${typeConfig.badge}`}>
                            {typeConfig.label}
                          </span>
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border tracking-wide ${difficultyConfig.badge}`}>
                            {difficultyConfig.label}
                          </span>
                          <span className="px-2.5 py-1 bg-warm-50 text-gray-600 rounded-md text-[11px] font-mono border border-gray-200 tracking-wide">
                            {getKnowledgePointName(q.knowledgePointId)}
                          </span>
                          {q.difficultyRationale && (
                            <span className="text-[11px] text-gray-400 font-mono" title={q.difficultyRationale}>
                              · 难度依据
                            </span>
                          )}
                        </div>

                        {/* 题干 */}
                        <h3 className="text-base text-gray-900 mb-4 leading-relaxed font-serif" style={{ fontWeight: 500 }}>
                          <MathRenderer text={q.question} />
                        </h3>

                        {q.image && (
                          <div className="mb-4">
                            <QuestionImage src={q.image} alt="题目图片" />
                          </div>
                        )}

                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                            {q.options.map((opt, i) => (
                              <div key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="font-mono font-medium text-gray-500">{String.fromCharCode(65 + i)}.</span>
                                <MathRenderer text={String(opt).replace(/^[A-F][.、]\s*/, '')} />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 答案 + 解析 */}
                        <div className="bg-warm-50/70 rounded-xl p-4 border border-gray-200/80 space-y-2">
                          <div className="flex items-start gap-2 text-sm">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-accent-dark whitespace-nowrap mt-0.5">
                              Answer
                            </span>
                            <span className="text-gray-700">
                              {q.type === 'truefalse' ? (q.answer === 'true' ? '正确' : '错误') : q.answer}
                            </span>
                          </div>
                          {q.explanation && (
                            <div className="flex items-start gap-2 text-sm">
                              <span className="font-mono text-[10px] uppercase tracking-wider text-accent-dark whitespace-nowrap mt-0.5">
                                Explain
                              </span>
                              <span className="text-gray-600 leading-relaxed">
                                <MathRenderer text={q.explanation} />
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 右侧操作 */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {deletingId === q.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={cancelSingleDelete}
                              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => confirmSingleDelete(q.id)}
                              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white hover:bg-red-700 rounded-full transition-colors cursor-pointer"
                            >
                              确认删除
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(q)}
                              className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer"
                              title="编辑"
                            >
                              <Pencil size={16} strokeWidth={1.8} />
                            </button>
                            <button
                              onClick={() => startSingleDelete(q.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 cursor-pointer"
                              title="删除"
                            >
                              <Trash2 size={16} strokeWidth={1.8} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 新增/编辑弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* 弹窗头部 - 编辑风 */}
            <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between rounded-t-2xl z-10 flex-shrink-0">
              <div>
                <p className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] mb-1">
                  {editingQuestion ? 'Edit Question' : 'New Question'}
                </p>
                <h2 className="font-serif text-xl text-primary" style={{ fontWeight: 500 }}>
                  {editingQuestion ? '编辑题目' : '新增题目'}
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                <X size={20} strokeWidth={1.8} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                  <X size={16} strokeWidth={1.8} />
                  {formError}
                </div>
              )}

              <div>
                <FormulaInput
                  value={form.question}
                  onChange={(value) => handleChange('question', value)}
                  placeholder="请输入题目内容，支持 $...$ 和 $$...$$ LaTeX 公式"
                  rows={3}
                  label="题干"
                />

                {/* 题目图片上传 */}
                {form.image ? (
                  <div className="mt-3 relative inline-block group max-w-full">
                    <img
                      src={form.image}
                      alt="题目图片"
                      className="max-w-full max-h-40 rounded-xl border border-gray-200 object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 p-1.5 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-red-600 hover:border-red-200 shadow-sm transition-colors cursor-pointer"
                    >
                      <X size={14} strokeWidth={1.8} />
                    </button>
                  </div>
                ) : (
                  <label className="mt-3 flex items-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-gray-400 hover:bg-warm-50 transition-colors cursor-pointer w-fit">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files)}
                    />
                    <Image size={16} strokeWidth={1.8} />
                    <span>插入题目图片</span>
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">题型</label>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Type</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { value: 'single', label: '单选' },
                      { value: 'multiple', label: '多选' },
                      { value: 'truefalse', label: '判断' },
                      { value: 'fillblank', label: '填空' },
                      { value: 'essay', label: '简答' },
                      { value: 'calculation', label: '计算' }
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleChange('type', type.value)}
                        className={`px-3 py-2 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer min-h-[40px] touch-manipulation ${
                          form.type === type.value
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-warm-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">难度</label>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Level</span>
                  </div>
                  <select
                    value={form.difficulty}
                    onChange={(e) => handleChange('difficulty', e.target.value)}
                    className="custom-select w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-accent/30 cursor-pointer"
                  >
                    <option value="easy">易</option>
                    <option value="medium">中</option>
                    <option value="hard">难</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">知识点</label>
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Knowledge</span>
                </div>
                <select
                  value={form.knowledgePointId}
                  onChange={(e) => handleChange('knowledgePointId', e.target.value)}
                  className="custom-select w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-accent/30 cursor-pointer"
                >
                  <option value="">请选择知识点</option>
                  {knowledgePoints.map((kp) => (
                    <option key={kp.id} value={kp.id}>{kp.name}</option>
                  ))}
                </select>
              </div>

              {(form.type === 'single' || form.type === 'multiple') && (
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">选项</label>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Options</span>
                  </div>
                  <div className="space-y-2">
                    {form.options.map((opt, index) => {
                      const letter = String.fromCharCode(65 + index);
                      const answerLetters = new Set((form.answer || '').split(''));
                      const isSelected = answerLetters.has(letter);

                      return (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type={form.type === 'multiple' ? 'checkbox' : 'radio'}
                            name="correctAnswer"
                            checked={isSelected}
                            onChange={() => {
                              if (form.type === 'multiple') {
                                const next = new Set(answerLetters);
                                if (next.has(letter)) next.delete(letter);
                                else next.add(letter);
                                handleChange('answer', Array.from(next).sort().join(''));
                              } else {
                                handleChange('answer', letter);
                              }
                            }}
                            className="w-4 h-4 accent-accent-dark cursor-pointer"
                          />
                          <span className="font-mono text-sm text-gray-500 w-5">
                            {letter}.
                          </span>
                          <FormulaInput
                            value={opt.replace(/^[A-F][.、]\s*/, '')}
                            onChange={(value) => handleOptionChange(index, value)}
                            placeholder={`选项 ${letter}`}
                            rows={1}
                            className="flex-1"
                          />
                          {form.options.length > 2 && (
                            <button
                              onClick={() => handleRemoveOption(index)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 cursor-pointer"
                            >
                              <X size={16} strokeWidth={1.8} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {form.options.length < 6 && (
                    <button
                      onClick={handleAddOption}
                      className="mt-3 text-sm text-primary hover:text-accent-dark font-medium flex items-center gap-1 cursor-pointer border-b border-primary/20 hover:border-accent-dark/40 pb-0.5"
                    >
                      <Plus size={14} strokeWidth={1.8} />
                      添加选项
                    </button>
                  )}
                </div>
              )}

              {form.type === 'truefalse' && (
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">正确答案</label>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Answer</span>
                  </div>
                  <div className="flex gap-3">
                    {[
                      { value: 'true', label: '正确' },
                      { value: 'false', label: '错误' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleChange('answer', opt.value)}
                        className={`flex-1 py-2.5 rounded-full border text-sm font-medium transition-all duration-200 cursor-pointer ${
                          form.answer === opt.value
                            ? 'bg-accent text-primary border-accent shadow-gold'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-warm-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(form.type === 'fillblank' || form.type === 'essay' || form.type === 'calculation') && (
                <div>
                  <FormulaInput
                    value={form.answer}
                    onChange={(value) => handleChange('answer', value)}
                    placeholder={form.type === 'calculation' ? '请输入计算结果或表达式' : '请输入参考答案'}
                    rows={1}
                    label="参考答案"
                  />
                </div>
              )}

              <div>
                <FormulaInput
                  value={form.explanation}
                  onChange={(value) => handleChange('explanation', value)}
                  placeholder="请输入题目解析（可选）"
                  rows={3}
                  label="解析"
                />
              </div>
            </div>

            <div className="bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl flex-shrink-0">
              <Button variant="secondary" onClick={handleCloseModal}>
                取消
              </Button>
              <Button onClick={handleSubmit}>
                <Check size={16} strokeWidth={1.8} />
                {editingQuestion ? '保存修改' : '添加题目'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI 出题弹窗 */}
      {isAIGeneratorOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            onClick={handleCloseAIGenerator}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* 弹窗头部 */}
            <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <div>
                <p className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] mb-1">
                  AI Generator
                </p>
                <h2 className="font-serif text-xl text-primary flex items-center gap-2" style={{ fontWeight: 500 }}>
                  <Sparkles size={18} className="text-accent-dark" strokeWidth={1.8} />
                  AI 按知识点出题
                </h2>
              </div>
              <button
                onClick={handleCloseAIGenerator}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                <X size={20} strokeWidth={1.8} />
              </button>
            </div>

            {isGenerating || generationSuccess ? (
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  {GENERATION_STEPS.map((label, idx) => {
                    const isDone = generationSuccess || idx < generationStep;
                    const isActive = !generationSuccess && isGenerating && idx === generationStep;

                    return (
                      <div key={label} className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-200 ${
                            isDone
                              ? 'bg-accent text-primary shadow-gold'
                              : isActive
                                ? 'bg-accent text-primary shadow-gold'
                                : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {isDone ? (
                            <Check size={13} strokeWidth={2.5} />
                          ) : isActive ? (
                            <Loader2 size={13} className="animate-spin" strokeWidth={2.5} />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span
                          className={`text-sm font-serif transition-colors duration-200 ${
                            isActive ? 'text-primary' : isDone ? 'text-gray-700' : 'text-gray-400'
                          }`}
                          style={{ fontWeight: 500 }}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {generationSuccess && (
                  <div className="p-3 bg-accent-light/30 border border-accent/30 rounded-xl text-sm text-accent-dark flex items-center gap-2 animate-fade-in">
                    <Check size={16} strokeWidth={2} />
                    AI 已生成 <span className="font-serif font-medium tabular-nums">{generatedCount}</span> 道题
                  </div>
                )}

                {generatorError && !generationSuccess && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                    <X size={16} strokeWidth={1.8} />
                    {generatorError}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {generatorError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                    <X size={16} strokeWidth={1.8} />
                    {generatorError}
                  </div>
                )}

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">选择知识点</label>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Topic</span>
                  </div>
                  <select
                    value={selectedKnowledgePointId}
                    onChange={(e) => setSelectedKnowledgePointId(e.target.value)}
                    className="custom-select w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-accent/30 cursor-pointer"
                  >
                    {knowledgePoints.map((kp) => (
                      <option key={kp.id} value={kp.id}>{kp.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">选择题型</label>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Types</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { value: 'single', label: '单选题' },
                      { value: 'multiple', label: '多选题' },
                      { value: 'truefalse', label: '判断题' },
                      { value: 'fillblank', label: '填空题' },
                      { value: 'essay', label: '简答题' },
                      { value: 'calculation', label: '计算题' }
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => toggleQuestionType(type.value)}
                        className={`px-3 py-2 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer min-h-[40px] touch-manipulation ${
                          selectedTypes.includes(type.value)
                            ? 'bg-accent text-primary border-accent shadow-gold'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-warm-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      每种题型生成数量
                    </label>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Count</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setQuestionsPerType(n)}
                        className={`w-10 h-10 rounded-full text-sm font-mono font-medium border transition-all duration-200 cursor-pointer ${
                          questionsPerType === n
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-warm-50'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <Button variant="secondary" onClick={handleCloseAIGenerator}>
                取消
              </Button>
              <Button onClick={handleGenerateQuestions} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" strokeWidth={1.8} />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} strokeWidth={1.8} />
                    生成题目
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuestionBank;
