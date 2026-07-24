import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Upload, X, FileText, FileSpreadsheet, Presentation, File, FileQuestion, Check, AlertCircle, Loader2, RotateCcw, Info } from 'lucide-react';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import { useStudyContext } from '../../context/StudyContext';
import { parseDocument } from '../../utils/documentParser';
import { parseQuestionFile } from '../../utils/questionPipeline';
import { parseDocumentWithAI, isAIConfigured } from '../../services/aiService';

const FILE_TYPES = {
  material: {
    label: '复习资料',
    accept: '.pdf,.docx,.txt',
    icon: FileText,
    description: 'PDF/Word/TXT'
  },
  questionBank: {
    label: '题库文档',
    accept: '.pdf,.docx,.txt,.json,.csv,.md',
    icon: FileQuestion,
    description: 'PDF/Word/TXT/JSON/CSV/MD'
  },
  answer: {
    label: '答案文件',
    accept: '.pdf,.docx,.txt',
    icon: FileSpreadsheet,
    description: 'PDF/Word/TXT'
  }
};

/** 解析方式的显示标签映射 */
const METHOD_LABELS = {
  structured: '结构化解析',
  rule: '规则解析',
  ai: 'AI 解析',
  'ai-multimodal': 'AI 多模态解析',
  'rule-fallback': '规则解析（AI 降级）',
  'rule-only': '规则解析'
};

const FileUploader = ({ files, setFiles, onUseSampleQuestions, onParsed }) => {
  const { state } = useStudyContext();
  const mode = state.mode;
  const [selectedType, setSelectedType] = useState('material');
  const [isDragging, setIsDragging] = useState(false);
  // 记录每个文件的解析状态：{ [fileId]: { status, progress, message, error, showLink } }
  const [parseStatus, setParseStatus] = useState({});
  const fileInputRef = useRef(null);

  const getFileIcon = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return FileText;
    if (['doc', 'docx'].includes(ext)) return FileText;
    if (['ppt', 'pptx'].includes(ext)) return Presentation;
    if (['txt'].includes(ext)) return FileText;
    return File;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 获取文件扩展名标签（大写）
  const getFileTypeLabel = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    return ext.toUpperCase();
  };

  // 演示模式：模拟上传进度
  const simulateUpload = (file) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve({ ...file, progress: 100, status: 'completed' });
        } else {
          setFiles(prev => prev.map(f =>
            f.id === file.id ? { ...f, progress } : f
          ));
        }
      }, 200);
    });
  };

  // 正式模式：真实文档解析 + AI 分析
  const parseFileWithAI = async (fileEntry) => {
    const agentConfig = state.aiConfig['quiz-master'];
    const isQuestionBank = fileEntry.type === 'questionBank';

    // 复习资料类型需要 AI 配置；题库类型支持规则兜底，无需强制 AI
    if (!isQuestionBank && !isAIConfigured(agentConfig)) {
      setParseStatus(prev => ({
        ...prev,
        [fileEntry.id]: {
          status: 'error',
          message: 'AI 未配置',
          error: '请先在设置页面配置 AI',
          showLink: true
        }
      }));
      await simulateUpload(fileEntry);
      return;
    }

    try {
      let result;
      let method = '';
      let warning = '';

      if (isQuestionBank) {
        // 题库文档：走统一解析入口（AI 优先 + 规则兜底）
        setParseStatus(prev => ({
          ...prev,
          [fileEntry.id]: { status: 'parsing', progress: 10, message: '正在解析题库...' }
        }));

        // 题库解析使用的 AI 配置：优先用 quiz-master，未配置则传 null 触发规则兜底
        const questionAgentConfig = isAIConfigured(agentConfig) ? agentConfig : null;
        // 独立多模态视觉 AI 配置：当主 AI 不支持多模态时用于文档图片解析
        const visionAgentConfig = state.aiConfig['vision'];
        const parsed = await parseQuestionFile(fileEntry.file, questionAgentConfig, (progress) => {
          setParseStatus(prev => ({
            ...prev,
            [fileEntry.id]: { status: 'parsing', progress, message: '正在解析题库...' }
          }));
        }, isAIConfigured(visionAgentConfig) ? visionAgentConfig : null);

        result = {
          knowledgePoints: parsed.knowledgePoints || [],
          questions: parsed.questions || [],
          rawText: parsed.rawText || '',
          pageImages: parsed.pageImages || []
        };
        method = parsed.method || '';
        warning = parsed.warning || '';

        // 题库解析返回 0 道题目时，视为解析失败
        if (result.questions.length === 0) {
          throw new Error(warning || '未识别到任何题目，请检查文件格式或配置 AI 后重试');
        }
      } else {
        // 复习资料：使用 AI 提取知识点与生成题目
        setParseStatus(prev => ({
          ...prev,
          [fileEntry.id]: { status: 'parsing', progress: 0, message: '正在提取文本...' }
        }));

        const text = await parseDocument(fileEntry.file, (progress) => {
          setParseStatus(prev => ({
            ...prev,
            [fileEntry.id]: { status: 'parsing', progress, message: '正在提取文本...' }
          }));
        });

        setParseStatus(prev => ({
          ...prev,
          [fileEntry.id]: { status: 'parsing', progress: 100, message: 'AI 分析中...' }
        }));
        const fileType = fileEntry.name.split('.').pop().toLowerCase();
        result = await parseDocumentWithAI(agentConfig, text, fileType, fileEntry.id);
        method = 'ai';
      }

      // 解析完成
      setParseStatus(prev => ({
        ...prev,
        [fileEntry.id]: {
          status: 'completed',
          progress: 100,
          message: '解析完成',
          method,
          warning,
          questionCount: result.questions?.length || 0
        }
      }));

      setFiles(prev => prev.map(f =>
        f.id === fileEntry.id ? { ...f, progress: 100, status: 'completed' } : f
      ));

      // 回调通知父组件
      if (onParsed) {
        onParsed({ file: fileEntry, result, method, warning });
      }
    } catch (error) {
      console.error('文件解析失败:', error);
      setParseStatus(prev => ({
        ...prev,
        [fileEntry.id]: {
          status: 'error',
          message: '解析失败',
          error: error.message || (isQuestionBank ? '题库解析失败，请检查文件格式或配置 AI 后重试' : 'AI 解析文档失败，请检查 API Key 是否正确')
        }
      }));
      setFiles(prev => prev.map(f =>
        f.id === fileEntry.id ? { ...f, status: 'error' } : f
      ));
    }
  };

  const handleFiles = async (fileList) => {
    const newFiles = Array.from(fileList).map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: selectedType,
      progress: 0,
      status: 'uploading',
      file
    }));

    setFiles(prev => [...prev, ...newFiles]);

    for (const file of newFiles) {
      if (mode === 'formal') {
        await parseFileWithAI(file);
      } else {
        await simulateUpload(file);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setParseStatus(prev => {
      const next = { ...prev };
      delete next[fileId];
      return next;
    });
  };

  /**
   * 重新解析失败的文件
   * @param {Object} fileEntry - 文件条目
   */
  const retryFile = (fileEntry) => {
    setFiles(prev => prev.map(f =>
      f.id === fileEntry.id ? { ...f, status: 'uploading' } : f
    ));
    parseFileWithAI(fileEntry);
  };

  return (
    <div className="space-y-6">
      {/* 文件类型选择 - 编辑式 pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(FILE_TYPES).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = selectedType === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isActive
                  ? 'bg-primary text-accent-light shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-primary border border-gray-200'
              }`}
            >
              <Icon size={15} strokeWidth={1.8} />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* 拖拽上传区 - 编辑式留白 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border border-dashed rounded-2xl min-h-[200px] h-auto sm:h-56 flex items-center justify-center text-center cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isDragging
            ? 'border-accent bg-accent/5 shadow-gold'
            : 'border-gray-300 hover:border-gray-900 hover:bg-gray-50/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={FILE_TYPES[selectedType].accept}
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300 border ${
            isDragging
              ? 'bg-accent border-accent shadow-gold'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <Upload size={26} className={isDragging ? 'text-primary' : 'text-gray-500'} strokeWidth={1.6} />
          </div>
          <div>
            <p className="text-base font-serif text-primary" style={{ fontWeight: 400 }}>
              拖拽文件到这里，或<span className="text-accent-dark gold-underline mx-1">点击选择</span>
            </p>
            <p className="text-xs text-gray-500 mt-2 font-mono tracking-wide tabular-nums">
              支持 {FILE_TYPES[selectedType].description}
            </p>
          </div>
        </div>
      </div>

      {/* 示例题库提示 - 编辑式横条 */}
      {selectedType === 'questionBank' && (
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-accent-dark mb-1">No File?</p>
              <p className="text-sm font-serif text-gray-900" style={{ fontWeight: 500 }}>没有题库文件？</p>
              <p className="text-xs text-gray-500 mt-0.5">使用预设的电路分析示例题库</p>
            </div>
            <Button variant="secondary" size="sm" onClick={onUseSampleQuestions}>
              使用示例题库
            </Button>
          </div>
        </div>
      )}

      {/* 已添加文件列表 - 编辑式编号 */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between px-1 pb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500">Added Files</span>
            <span className="text-xs text-gray-400 font-mono tabular-nums">{files.length} 个</span>
          </div>
          {files.map((file, idx) => {
            const FileIcon = getFileIcon(file);
            const status = parseStatus[file.id];
            return (
              <div key={file.id} className="bg-white rounded-xl p-4 border border-gray-200/80 hover:border-gray-300 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <div className="flex items-center gap-4">
                  {/* 大号衬线编号 */}
                  <div className="flex-shrink-0 w-10 text-right">
                    <span className="font-serif text-2xl text-gray-200 tabular-nums" style={{ fontWeight: 400, letterSpacing: '-0.04em' }}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200/80">
                    <FileIcon size={18} className="text-gray-500" strokeWidth={1.6} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-serif text-gray-900 truncate" style={{ fontWeight: 500 }}>{file.name}</p>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2 flex-shrink-0 cursor-pointer"
                        title="移除文件"
                      >
                        <X size={15} className="text-gray-400 hover:text-red-600" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-gray-500 font-mono tabular-nums">{formatFileSize(file.size)}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-accent-dark">{getFileTypeLabel(file)}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{FILE_TYPES[file.type].label}</span>
                    </div>

                    {/* 演示模式：上传进度条 */}
                    {mode === 'demo' && file.status === 'uploading' && (
                      <div className="mt-3">
                        <ProgressBar value={file.progress} size="sm" showLabel />
                      </div>
                    )}

                    {/* 正式模式：解析中状态 */}
                    {mode === 'formal' && status && status.status === 'parsing' && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Loader2 size={12} className="text-accent-dark animate-spin" />
                          <span className="text-xs text-gray-600 font-mono">{status.message}</span>
                        </div>
                        <ProgressBar value={status.progress} size="sm" />
                      </div>
                    )}

                    {/* 正式模式：解析错误 */}
                    {mode === 'formal' && status && status.status === 'error' && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
                        <span className="text-xs text-red-500">{status.error}</span>
                        {status.showLink && (
                          <Link to="/settings" className="text-xs text-primary underline ml-1 underline-offset-2">
                            去配置
                          </Link>
                        )}
                        <button
                          onClick={() => retryFile(file)}
                          className="flex items-center gap-1 text-xs text-primary hover:text-accent-dark font-medium ml-1 cursor-pointer transition-colors duration-200"
                        >
                          <RotateCcw size={12} />
                          重试
                        </button>
                      </div>
                    )}

                    {/* 完成状态 */}
                    {file.status === 'completed' && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Check size={12} className="text-accent-dark flex-shrink-0" strokeWidth={2.2} />
                          <span className="text-xs text-gray-600 font-mono">
                            {mode === 'formal' && status && status.status === 'completed'
                              ? `解析完成${status.questionCount ? ` · ${status.questionCount} 道题` : ''}`
                              : '上传完成'}
                          </span>
                          {/* 解析方式标签 */}
                          {mode === 'formal' && status?.method && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono tabular-nums ${
                              status.method === 'structured' || status.method === 'ai' || status.method === 'ai-multimodal' || status.method === 'rule'
                                ? 'bg-accent/10 text-accent-dark border border-accent/30'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {METHOD_LABELS[status.method] || status.method}
                            </span>
                          )}
                        </div>
                        {/* 降级/警告提示 */}
                        {mode === 'formal' && status?.warning && (
                          <div className="flex items-start gap-1.5 text-xs text-amber-600 leading-relaxed">
                            <Info size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <span className="flex-1">{status.warning}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
