import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Edit3 } from 'lucide-react';

/**
 * 知识点编辑器组件
 * 用于审核文档解析后生成的知识点列表，支持编辑、新增、删除
 *
 * @param {Object} props
 * @param {Array} props.knowledgePoints - 知识点列表 [{id, name, description, questionCount}]
 * @param {Function} props.onUpdate - 知识点变更回调 (updatedKps) => void
 * @param {Function} props.onAdd - 新增知识点回调 (newKp) => void
 * @param {Function} props.onDelete - 删除知识点回调 (kpId) => void
 */
const KnowledgePointEditor = ({ knowledgePoints, onUpdate, onAdd, onDelete }) => {
    // 当前展开编辑的知识点 ID
    const [editingId, setEditingId] = useState(null);
    // 删除确认弹窗目标知识点
    const [deleteTarget, setDeleteTarget] = useState(null);
    // 是否处于新增模式
    const [isAdding, setIsAdding] = useState(false);
    // 新增知识点临时数据
    const [newKpName, setNewKpName] = useState('新知识点');
    const [newKpDescription, setNewKpDescription] = useState('');
    // 输入框引用，用于自动聚焦
    const nameInputRef = useRef(null);
    const newNameInputRef = useRef(null);

    // 新增模式下自动聚焦到名称输入框
    useEffect(() => {
        if (isAdding && newNameInputRef.current) {
            newNameInputRef.current.focus();
            newNameInputRef.current.select();
        }
    }, [isAdding]);

    // 展开编辑面板时自动聚焦到名称输入框
    useEffect(() => {
        if (editingId && nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, [editingId]);

    /**
     * 截断描述文本到指定长度
     * @param {string} text - 原始描述文本
     * @param {number} maxLen - 最大字符数，默认 60
     * @returns {string} 截断后的文本
     */
    const truncateDescription = (text, maxLen = 60) => {
        if (!text) return '暂无描述';
        if (text.length <= maxLen) return text;
        return text.slice(0, maxLen) + '...';
    };

    /**
     * 处理知识点名称变更，实时回调 onUpdate
     * @param {string} kpId - 知识点 ID
     * @param {string} newName - 新名称
     */
    const handleNameChange = (kpId, newName) => {
        const updated = knowledgePoints.map(kp =>
            kp.id === kpId ? { ...kp, name: newName } : kp
        );
        onUpdate(updated);
    };

    /**
     * 处理知识点描述变更，实时回调 onUpdate
     * @param {string} kpId - 知识点 ID
     * @param {string} newDescription - 新描述
     */
    const handleDescriptionChange = (kpId, newDescription) => {
        const updated = knowledgePoints.map(kp =>
            kp.id === kpId ? { ...kp, description: newDescription } : kp
        );
        onUpdate(updated);
    };

    /**
     * 确认新增知识点
     */
    const handleAddConfirm = () => {
        if (!newKpName.trim()) return;
        const newKp = {
            id: `kp-${Date.now()}`,
            name: newKpName.trim(),
            description: newKpDescription.trim(),
            questionCount: 0
        };
        onAdd(newKp);
        setIsAdding(false);
        setNewKpName('新知识点');
        setNewKpDescription('');
    };

    /**
     * 取消新增知识点，重置表单
     */
    const handleAddCancel = () => {
        setIsAdding(false);
        setNewKpName('新知识点');
        setNewKpDescription('');
    };

    /**
     * 确认删除知识点
     */
    const handleDeleteConfirm = () => {
        if (deleteTarget) {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
        }
    };

    // 格式化题目数显示文本
    const formatQuestionCount = (count) => {
        return count === 1 ? '1 题' : `${count} 题`;
    };

    return (
        <div className="space-y-3">
            {/* 列表标题 */}
            <div className="flex items-baseline justify-between px-1 pb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500">
                    知识点列表
                </span>
                <span className="text-xs text-gray-400 font-mono tabular-nums">
                    {knowledgePoints.length} 个
                </span>
            </div>

            {/* 知识点列表 */}
            {deleteTarget && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
                    <p className="text-sm text-red-700">
                        该知识点关联了{' '}
                        <span className="font-mono font-medium text-red-800">
                            {deleteTarget.questionCount}
                        </span>{' '}
                        道题目，删除后这些题目将失去知识点归属，确认删除？
                    </p>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                        <button
                            onClick={() => setDeleteTarget(null)}
                            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700
                                       transition-colors duration-200 cursor-pointer"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleDeleteConfirm}
                            className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg
                                       hover:bg-red-600 transition-colors duration-200 cursor-pointer"
                        >
                            确认删除
                        </button>
                    </div>
                </div>
            )}

            {/* 知识点列表 */}
            {knowledgePoints.map((kp, idx) => {
                const isEditing = editingId === kp.id;
                const questionText = formatQuestionCount(kp.questionCount);

                return (
                    <div
                        key={kp.id}
                        className={`bg-white rounded-xl border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                            isEditing
                                ? 'border-accent/40 shadow-gold'
                                : 'border-gray-200/80 hover:border-gray-300'
                        }`}
                    >
                        {/* 列表项头部 */}
                        <button
                            onClick={() => setEditingId(isEditing ? null : kp.id)}
                            className="w-full flex items-center gap-4 p-4 text-left cursor-pointer"
                        >
                            {/* 大号衬线编号 */}
                            <div className="flex-shrink-0 w-8 text-right">
                                <span
                                    className="font-serif text-xl text-gray-300 tabular-nums"
                                    style={{ fontWeight: 400, letterSpacing: '-0.04em' }}
                                >
                                    {String(idx + 1).padStart(2, '0')}
                                </span>
                            </div>

                            {/* 知识点信息 */}
                            <div className="flex-1 min-w-0">
                                <h4
                                    className="text-sm font-serif text-primary truncate"
                                    style={{ fontWeight: 500 }}
                                >
                                    {kp.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                    {truncateDescription(kp.description)}
                                </p>
                            </div>

                            {/* 关联题目数 */}
                            <span className="text-xs text-gray-400 font-mono tabular-nums flex-shrink-0">
                                {questionText}
                            </span>

                            {/* 编辑图标 */}
                            <Edit3
                                size={14}
                                className="text-gray-300 flex-shrink-0"
                                strokeWidth={1.6}
                            />

                            {/* 删除按钮 */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(kp);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                                title="删除知识点"
                            >
                                <Trash2 size={15} strokeWidth={1.6} />
                            </button>
                        </button>

                        {/* 编辑面板 */}
                        {isEditing && (
                            <div className="px-4 pb-4 ml-[60px] space-y-3">
                                {/* 名称输入 */}
                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                                        知识点名称
                                    </label>
                                    <input
                                        ref={nameInputRef}
                                        type="text"
                                        value={kp.name}
                                        onChange={(e) => handleNameChange(kp.id, e.target.value)}
                                        className="w-full px-3 py-2 text-sm font-serif text-primary bg-gray-50 border border-gray-200 rounded-lg
                                                   focus:outline-none focus:border-accent/50 focus:bg-white focus:ring-1 focus:ring-accent/20
                                                   transition-all duration-200"
                                        style={{ fontWeight: 500 }}
                                    />
                                </div>

                                {/* 描述输入 */}
                                <div>
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                                        描述
                                    </label>
                                    <textarea
                                        value={kp.description}
                                        onChange={(e) => handleDescriptionChange(kp.id, e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg
                                                   focus:outline-none focus:border-accent/50 focus:bg-white focus:ring-1 focus:ring-accent/20
                                                   resize-none transition-all duration-200"
                                    />
                                </div>

                                {/* 关联题目数（只读） */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                                        关联题目
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono tabular-nums bg-gray-100 px-2 py-0.5 rounded">
                                        {questionText}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* 新增知识点区域 */}
            {isAdding ? (
                <div className="bg-white rounded-xl border border-accent/40 shadow-gold p-4">
                    <div className="ml-[60px] space-y-3">
                        {/* 名称输入 */}
                        <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                                知识点名称
                            </label>
                            <input
                                ref={newNameInputRef}
                                type="text"
                                value={newKpName}
                                onChange={(e) => setNewKpName(e.target.value)}
                                className="w-full px-3 py-2 text-sm font-serif text-primary bg-gray-50 border border-gray-200 rounded-lg
                                           focus:outline-none focus:border-accent/50 focus:bg-white focus:ring-1 focus:ring-accent/20
                                           transition-all duration-200"
                                style={{ fontWeight: 500 }}
                            />
                        </div>

                        {/* 描述输入 */}
                        <div>
                            <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                                描述
                            </label>
                            <textarea
                                value={newKpDescription}
                                onChange={(e) => setNewKpDescription(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg
                                           focus:outline-none focus:border-accent/50 focus:bg-white focus:ring-1 focus:ring-accent/20
                                           resize-none transition-all duration-200"
                            />
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleAddConfirm}
                                disabled={!newKpName.trim()}
                                className="px-4 py-2 text-sm font-medium bg-primary text-accent-light rounded-lg
                                           hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed
                                           transition-all duration-200 cursor-pointer"
                            >
                                确认添加
                            </button>
                            <button
                                onClick={handleAddCancel}
                                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700
                                           transition-colors duration-200 cursor-pointer"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4
                               bg-white border border-dashed border-accent/40 rounded-xl
                               text-accent-dark hover:bg-accent/5 hover:border-accent
                               transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer"
                >
                    <Plus size={16} strokeWidth={1.8} />
                    <span className="text-sm font-serif" style={{ fontWeight: 500 }}>
                        新增知识点
                    </span>
                </button>
            )}

        </div>
    );
};

export default KnowledgePointEditor;