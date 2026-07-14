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
 * 题型配置
 * @type {Object.<string, {label: string, badge: string}>}
 */
const TYPE_CONFIG = {
  single: { label: '单选题', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  multiple: { label: '多选题', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  truefalse: { label: '判断题', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  fillblank: { label: '填空题', badge: 'bg-green-50 text-green-700 border-green-200' },
  essay: { label: '简答题', badge: 'bg-gray-50 text-gray-700 border-gray-200' },
  calculation: { label: '计算题', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
};

/** AI 出题协作步骤 */
const GENERATION_STEPS = ['分析知识点', '生成题干与选项', '评估难度与科学性', '格式化校验'];

/**
 * 难度配置
 * @type {Object.<string, {label: string, badge: string}>}
 */
const DIFFICULTY_CONFIG = {
  easy: { label: '易', badge: 'border-gray-200 text-gray-500 bg-gray-50' },
  medium: { label: '中', badge: 'border-gray-300 text-gray-700 bg-gray-100' },
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
    <div ref={pageRef}>
      {/* 页面标题 */}
      <div className="mb-14 stagger-item">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">题库管理</h1>
            <p className="text-gray-500 text-sm">按文档管理题库，支持搜索、编辑、手动添加和 AI 出题</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleGoToQuiz}>
              <BookOpen size={18} />
              刷当前题库
            </Button>
            <Button onClick={handleAdd}>
              <Plus size={18} />
              新增题目
            </Button>
          </div>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="mb-6 stagger-item">
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  已选 <span className="text-primary font-bold">{selectedIds.size}</span> 题
                </span>
                <button
                  onClick={selectAllFiltered}
                  className="text-sm text-primary hover:text-accent font-medium cursor-pointer"
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                  批量删除
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    确定删除 <span className="font-bold text-red-600">{selectedIds.size}</span> 道题目？
                  </span>
                  <button
                    onClick={() => setIsBatchDeleting(false)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmBatchDelete}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    确认删除
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
        {/* 左侧题库列表 */}
        <Card className="p-4 h-fit stagger-item">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Database size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider">题库列表</h2>
          </div>
          <div className="space-y-1">
            {questionBanks.map((bank) => {
              const isActive = bank.id === selectedBankId;
              const isDeleting = deletingBankId === bank.id;
              const Icon = bank.type === 'document' ? FileText : Layers;
              return (
                <div
                  key={bank.id}
                  className={`flex items-center gap-1 rounded-xl transition-colors duration-150 ${
                    isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <button
                    onClick={() => setSelectedBankId(bank.id)}
                    className="flex-1 flex items-center gap-3 px-3 py-3 text-left cursor-pointer min-w-0"
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {bank.name}
                      </p>
                      <p className={`text-xs mt-0.5 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                        {bank.questionCount} 道题目
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
                          ? 'text-white/80 hover:bg-white/20'
                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title={bank.type === 'manual' ? '清空手动题库' : '删除题库'}
                    >
                      <Trash2 size={16} />
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
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200">
                  <Database className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-2">暂无题库</p>
                <p className="text-xs text-gray-400 mb-5">上传资料后将自动创建题库</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/upload')}
                >
                  <Upload size={16} />
                  上传资料
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* 右侧题目管理 */}
        <div>
          {/* 题库信息卡 */}
          <Card className="p-5 mb-6 stagger-item">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-primary">{selectedBank?.name || '未选择题库'}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  共 {selectedBank?.questionCount || 0} 道题目
                </p>
              </div>
              <Button variant="secondary" onClick={handleOpenAIGenerator}>
                <Sparkles size={18} />
                AI 按知识点出题
              </Button>
            </div>
          </Card>

          {/* 搜索与筛选 */}
          <Card className="p-5 mb-6 stagger-item">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索题干或答案..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
              <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
                <Filter size={18} className="text-gray-400 flex-shrink-0 mt-2.5 sm:mt-2" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 flex-1">
                  {FILTER_TYPES.map((type) => {
                    const isActive = typeFilter === type.value;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setTypeFilter(type.value)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors duration-150 cursor-pointer min-h-[44px] touch-manipulation ${
                          isActive
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
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
          <div className="space-y-6">
            {filteredQuestions.length === 0 ? (
              <Card className="p-16 text-center stagger-item">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Search className="text-gray-400" size={28} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">未找到匹配题目</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {selectedBank?.questionCount === 0
                    ? '当前题库为空，点击上方添加题目或使用 AI 出题'
                    : '尝试更换搜索词或筛选条件'}
                </p>
                {selectedBank?.questionCount === 0 && (
                  <div className="flex items-center justify-center gap-3">
                    <Button onClick={handleAdd}>
                      <Plus size={18} />
                      新增题目
                    </Button>
                    <Button variant="secondary" onClick={handleOpenAIGenerator}>
                      <Sparkles size={18} />
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
                  <Card key={q.id} className="p-6 hover:border-gray-300 transition-colors duration-150 stagger-item">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                        <button
                          onClick={() => toggleSelectQuestion(q.id)}
                          className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          title={selectedIds.has(q.id) ? '取消选择' : '选择'}
                        >
                          {selectedIds.has(q.id) ? (
                            <CheckSquare size={18} className="text-primary" />
                          ) : (
                            <Square size={18} className="text-gray-300" />
                          )}
                        </button>
                        <span className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-lg text-xs font-mono font-bold">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${typeConfig.badge}`}>
                            {typeConfig.label}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${difficultyConfig.badge}`}>
                            {difficultyConfig.label}
                          </span>
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-200">
                            {getKnowledgePointName(q.knowledgePointId)}
                          </span>
                          {q.difficultyRationale && (
                            <span className="text-xs text-gray-400" title={q.difficultyRationale}>
                              难度依据
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-medium text-gray-900 mb-4 leading-relaxed">
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

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                          <div className="flex items-start gap-2 text-sm">
                            <span className="font-medium text-primary whitespace-nowrap">答案：</span>
                            <span className="text-gray-700">
                              {q.type === 'truefalse' ? (q.answer === 'true' ? '正确' : '错误') : q.answer}
                            </span>
                          </div>
                          {q.explanation && (
                            <div className="flex items-start gap-2 text-sm">
                              <span className="font-medium text-primary whitespace-nowrap">解析：</span>
                              <span className="text-gray-600">
                                <MathRenderer text={q.explanation} />
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {deletingId === q.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={cancelSingleDelete}
                              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => confirmSingleDelete(q.id)}
                              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                            >
                              确认删除
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(q)}
                              className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors duration-150 cursor-pointer"
                              title="编辑"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => startSingleDelete(q.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150 cursor-pointer"
                              title="删除"
                            >
                              <Trash2 size={18} />
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10 flex-shrink-0">
              <h2 className="text-xl font-bold text-primary">
                {editingQuestion ? '编辑题目' : '新增题目'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                  <X size={16} />
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
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="mt-3 flex items-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer w-fit">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e.target.files)}
                    />
                    <Image size={16} />
                    <span>插入题目图片</span>
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">题型</label>
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
                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors duration-150 cursor-pointer min-h-[44px] touch-manipulation ${
                          form.type === type.value
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">难度</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => handleChange('difficulty', e.target.value)}
                    className="custom-select w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent cursor-pointer"
                  >
                    <option value="easy">易</option>
                    <option value="medium">中</option>
                    <option value="hard">难</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">知识点</label>
                <select
                  value={form.knowledgePointId}
                  onChange={(e) => handleChange('knowledgePointId', e.target.value)}
                  className="custom-select w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent cursor-pointer"
                >
                  <option value="">请选择知识点</option>
                  {knowledgePoints.map((kp) => (
                    <option key={kp.id} value={kp.id}>{kp.name}</option>
                  ))}
                </select>
              </div>

              {(form.type === 'single' || form.type === 'multiple') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选项</label>
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
                            className="w-4 h-4 accent-primary cursor-pointer"
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
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150 cursor-pointer"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {form.options.length < 6 && (
                    <button
                      onClick={handleAddOption}
                      className="mt-3 text-sm text-primary hover:text-accent font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={16} />
                      添加选项
                    </button>
                  )}
                </div>
              )}

              {form.type === 'truefalse' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">正确答案</label>
                  <div className="flex gap-3">
                    {[
                      { value: 'true', label: '正确' },
                      { value: 'false', label: '错误' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleChange('answer', opt.value)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors duration-150 cursor-pointer ${
                          form.answer === opt.value
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
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

            <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-2xl flex-shrink-0">
              <Button variant="secondary" onClick={handleCloseModal}>
                取消
              </Button>
              <Button onClick={handleSubmit}>
                <Check size={18} />
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCloseAIGenerator}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <Sparkles size={20} className="text-accent" />
                AI 按知识点出题
              </h2>
              <button
                onClick={handleCloseAIGenerator}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150 cursor-pointer"
              >
                <X size={20} />
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
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors duration-150 ${
                            isDone
                              ? 'bg-green-500 text-white'
                              : isActive
                                ? 'bg-accent text-primary'
                                : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {isDone ? (
                            <Check size={14} />
                          ) : isActive ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span
                          className={`text-sm transition-colors duration-150 ${
                            isActive ? 'text-primary font-medium' : isDone ? 'text-gray-700' : 'text-gray-400'
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {generationSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2 animate-fade-in">
                    <Check size={16} />
                    AI 已生成 {generatedCount} 道题
                  </div>
                )}

                {generatorError && !generationSuccess && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                    <X size={16} />
                    {generatorError}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {generatorError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                    <X size={16} />
                    {generatorError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择知识点</label>
                  <select
                    value={selectedKnowledgePointId}
                    onChange={(e) => setSelectedKnowledgePointId(e.target.value)}
                    className="custom-select w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent cursor-pointer"
                  >
                    {knowledgePoints.map((kp) => (
                      <option key={kp.id} value={kp.id}>{kp.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">选择题型</label>
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
                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors duration-150 cursor-pointer min-h-[44px] touch-manipulation ${
                          selectedTypes.includes(type.value)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    每种题型生成数量
                  </label>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setQuestionsPerType(n)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium border transition-colors duration-150 cursor-pointer ${
                          questionsPerType === n
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <Button variant="secondary" onClick={handleCloseAIGenerator}>
                取消
              </Button>
              <Button onClick={handleGenerateQuestions} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
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
