import { useState } from 'react';
import {
    Key,
    ExternalLink,
    Check,
    Eye,
    EyeOff,
    Gift,
    Zap,
    Crown,
    RotateCcw,
    Sparkles,
    ShieldCheck
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useStudyContext } from '../../context/StudyContext';
import usePageTitle from '../../hooks/usePageTitle';
import useAIStatus from '../../hooks/useAIStatus';
import { aiProviders, presetCombinations } from '../../config/aiProviders';
import { agents as agentMeta } from '../../mock/agents';

/**
 * 预设组合方案元数据
 * @type {Array<{key: string, name: string, desc: string, icon: Object}>}
 */
const PRESET_META = [
    { key: 'free', name: '免费组合', desc: '优先使用含免费额度的服务商与模型，零成本即可体验正式模式。', icon: Gift },
    { key: 'costEffective', name: '性价比组合', desc: '在效果与成本之间取得平衡，适合日常复习与长期学习。', icon: Zap },
    { key: 'strongest', name: '最强组合', desc: '选用推理能力最强的模型，获得更精准的出题、讲解与计划。', icon: Crown }
];

/**
 * 运行模式元数据
 * @type {Array<{key: string, name: string, desc: string}>}
 */
const MODE_META = {
    demo: {
        name: '演示模式',
        desc: '无需配置 API Key，使用内置示例数据即可完整体验上传、刷题、错题本、督学打卡等全部功能，适合首次了解产品或网络受限时使用。'
    },
    formal: {
        name: '正式模式',
        desc: '调用真实 AI 接口完成文档解析、出题、讲解与计划生成。需要为出题官、讲解师、督学员三位助手分别配置服务商、模型和 API Key。'
    }
};

/**
 * 根据 providerId 获取服务商对象
 * @param {string} providerId - 服务商 ID
 * @returns {AiProvider|undefined}
 */
const getProviderById = (providerId) =>
    aiProviders.find((p) => p.id === providerId);

/**
 * 根据 provider 与 modelId 获取模型对象
 * @param {AiProvider|undefined} provider - 服务商对象
 * @param {string} modelId - 模型 ID
 * @returns {AiModel|undefined}
 */
const getModelById = (provider, modelId) => {
    if (!provider) return undefined;
    return provider.models.find((m) => m.id === modelId);
};

/**
 * 判断单个 Agent 配置是否完整（服务商、模型、Key 均已填写）
 * @param {AgentConfig} config - Agent 配置项
 * @returns {boolean}
 */
const isConfigComplete = (config) =>
    !!config.providerId && !!config.modelId && !!config.apiKey;

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
 * AI 配置中心页面
 * @description 用户在此页面切换运行模式、选择预设方案、并分别为三位
 *              AI 助手（出题官 / 讲解师 / 督学员）配置服务商、模型与 API Key。
 */
const Settings = () => {
    usePageTitle('AI 配置中心');

    const { state, setMode, setAIConfig, setAllAIConfig, resetAIConfig } =
        useStudyContext();
    const { mode, aiConfig } = state;

    /** 控制 API Key 输入框明文 / 密文显示，按 Agent 分别管理 */
    const [showKeys, setShowKeys] = useState({
        'quiz-master': false,
        explainer: false,
        supervisor: false
    });

    /** 当前选中的预设方案 key，用于高亮显示 */
    const [activePreset, setActivePreset] = useState(null);

    /**
     * 切换运行模式
     * @param {string} targetMode - 'demo' 或 'formal'
     */
    const handleModeChange = (targetMode) => {
        setMode(targetMode);
    };

    /**
     * 应用预设组合方案：整体替换 aiConfig
     * @param {string} presetKey - presetCombinations 的 key
     */
    const handleApplyPreset = (presetKey) => {
        const preset = presetCombinations[presetKey];
        if (!preset) return;
        // 深拷贝避免污染源数据，保留用户已填写的 apiKey 由用户自行覆盖
        const cloned = Object.fromEntries(
            Object.entries(preset).map(([agentId, cfg]) => [
                agentId,
                { ...cfg }
            ])
        );
        setAllAIConfig(cloned);
        setActivePreset(presetKey);
    };

    /**
     * 重置全部 AI 配置为空（清空敏感信息）
     */
    const handleReset = () => {
        resetAIConfig();
        setActivePreset(null);
    };

    /**
     * 更新某个 Agent 的单个字段
     * @param {string} agentId - Agent 标识
     * @param {string} field - 字段名（providerId / modelId / apiKey）
     * @param {string} value - 新值
     */
    const handleFieldChange = (agentId, field, value) => {
        const current = aiConfig[agentId] || {
            providerId: '',
            modelId: '',
            apiKey: ''
        };
        const next = { ...current, [field]: value };
        // 切换服务商时清空已选模型，避免出现不匹配的组合
        if (field === 'providerId' && value !== current.providerId) {
            next.modelId = '';
        }
        setAIConfig(agentId, next);
        setActivePreset(null);
    };

    /**
     * 切换某 Agent 的 API Key 显示状态
     * @param {string} agentId - Agent 标识
     */
    const toggleKeyVisible = (agentId) => {
        setShowKeys((prev) => ({ ...prev, [agentId]: !prev[agentId] }));
    };

    const aiStatus = useAIStatus();
    const statusVisible = aiStatus.message && (Date.now() - aiStatus.timestamp < 8000);

    return (
        <div className="page-fade-in max-w-4xl mx-auto">
            {/* 页面标题 - 衬线大字 + mono 标签 */}
            <div className="mb-12 stagger-1">
                <p className="text-xs font-mono text-gray-400 uppercase tracking-[0.25em] mb-3">
                    Configuration
                </p>
                <h1 className="text-4xl md:text-5xl text-primary mb-3" style={{ fontWeight: 400, lineHeight: 1.1 }}>
                    AI 配置中心
                </h1>
                <p className="text-gray-500 text-base max-w-2xl leading-relaxed">
                    统一管理三位 AI 学习助手的运行模式与服务商配置，所有设置实时生效并自动保存到本地。
                </p>
            </div>

            {/* 运行模式切换 */}
            <div className="mb-12 stagger-2">
                <SectionTitle title="运行模式" subtitle="Mode" />
                <Card elevated className="p-6 lg:p-7">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(MODE_META).map(([key, meta], idx) => {
                            const isActive = mode === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleModeChange(key)}
                                    className={`text-left p-5 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                                        isActive
                                            ? 'border-primary bg-warm-50/60 shadow-sm'
                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="font-serif text-2xl text-gray-200 tabular-nums"
                                                style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 }}
                                            >
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                            <span
                                                className={`font-serif text-lg ${isActive ? 'text-primary' : 'text-gray-700'}`}
                                                style={{ fontWeight: 500 }}
                                            >
                                                {meta.name}
                                            </span>
                                        </div>
                                        {isActive && (
                                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent shadow-gold">
                                                <Check
                                                    className="w-3 h-3 text-primary"
                                                    strokeWidth={3}
                                                />
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {meta.desc}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    {mode === 'demo' && (
                        <div className="mt-5 flex items-start gap-3 p-4 bg-accent-light/30 rounded-xl border border-accent/25">
                            <Sparkles className="w-4 h-4 text-accent-dark flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                            <p className="text-sm text-gray-700 leading-relaxed">
                                当前为演示模式：无需 API Key，上传、刷题、错题讲解、督学打卡均使用示例数据完整可体验。若想使用自己的复习资料并调用真实 AI，请切换到正式模式。
                            </p>
                        </div>
                    )}
                    {mode === 'formal' && (
                        <div className="mt-5 flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <Key className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                            <p className="text-sm text-gray-700 leading-relaxed">
                                正式模式已开启：系统将为出题官、讲解师、督学员分别调用真实 AI 接口。请确保每位助手都配置了有效的服务商、模型与 API Key，否则对应功能将不可用。
                            </p>
                        </div>
                    )}
                </Card>
            </div>

            {/* 健壮性说明 */}
            <div className="mb-12 stagger-2">
                <Card elevated className="p-6 lg:p-7">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent-light/40 border border-accent/25 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-accent-dark" strokeWidth={1.8} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-baseline gap-3 mb-2">
                                <h3 className="text-base font-serif text-primary" style={{ fontWeight: 500 }}>
                                    健壮性说明
                                </h3>
                                <span className="text-[11px] font-mono uppercase tracking-wider text-accent-dark">
                                    Reliability
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                已内置 429 指数退避重试、JSON 截断自修复、空响应重试、PDF 版本兼容，确保在网络波动或模型异常时仍可正常学习。
                            </p>
                            {statusVisible && (
                                <p className={`mt-3 text-xs font-mono tracking-wide animate-fade-in ${
                                    aiStatus.type === 'warning' ? 'text-amber-600' : 'text-accent-dark'
                                }`}>
                                    {aiStatus.message}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* 预设组合方案 */}
            <div className="mb-12 stagger-3">
                <SectionTitle
                    title="预设组合"
                    subtitle="Presets"
                    action={
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="text-gray-500 hover:text-primary"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            重置
                        </Button>
                    }
                />
                <Card elevated className="p-6 lg:p-7">
                    <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                        一键应用推荐方案，自动填充三位 AI 助手的服务商与模型。API Key 需要自行前往对应服务商获取并填入下方输入框。
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {PRESET_META.map((preset, idx) => {
                            const Icon = preset.icon;
                            const isActive = activePreset === preset.key;
                            return (
                                <button
                                    key={preset.key}
                                    type="button"
                                    onClick={() => handleApplyPreset(preset.key)}
                                    className={`text-left p-5 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                                        isActive
                                            ? 'border-accent bg-gradient-to-br from-accent/8 to-transparent shadow-gold'
                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                                    isActive
                                                        ? 'bg-accent border-accent/40'
                                                        : 'bg-gray-50 border-gray-200/60'
                                                }`}
                                            >
                                                <Icon
                                                    className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-gray-500'}`}
                                                    strokeWidth={1.8}
                                                />
                                            </div>
                                            <span
                                                className={`font-serif text-base ${isActive ? 'text-primary' : 'text-gray-700'}`}
                                                style={{ fontWeight: 500 }}
                                            >
                                                {preset.name}
                                            </span>
                                        </div>
                                        {isActive ? (
                                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent shadow-gold">
                                                <Check
                                                    className="w-3 h-3 text-primary"
                                                    strokeWidth={3}
                                                />
                                            </span>
                                        ) : (
                                            <span className="font-mono text-[10px] text-gray-300 tabular-nums tracking-wider">
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed">{preset.desc}</p>
                                </button>
                            );
                        })}
                    </div>
                </Card>
            </div>

            {/* 三个 Agent 配置卡片 */}
            <div className="mb-8">
                <div className="flex items-baseline gap-3 mb-6">
                    <h2 className="text-2xl text-primary font-serif" style={{ fontWeight: 400 }}>
                        助手配置
                    </h2>
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-[0.2em]">
                        Agents
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent ml-2" />
                </div>

                {agentMeta.map((agent, idx) => {
                    const config = aiConfig[agent.id] || {
                        providerId: '',
                        modelId: '',
                        apiKey: ''
                    };
                    const provider = getProviderById(config.providerId);
                    const model = getModelById(provider, config.modelId);
                    const complete = isConfigComplete(config);
                    const keyVisible = showKeys[agent.id];

                    return (
                        <Card
                            key={agent.id}
                            elevated
                            className={`mb-6 p-6 lg:p-7 stagger-${idx + 3}`}
                        >
                            {/* 卡片头部：编号 + Agent 信息 + 状态指示 */}
                            <div className="flex items-start justify-between mb-7 pb-6 border-b border-gray-100">
                                <div className="flex items-center gap-5">
                                    {/* 大号衬线编号 */}
                                    <span
                                        className="font-serif text-5xl text-gray-200 tabular-nums"
                                        style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 }}
                                    >
                                        {String(idx + 1).padStart(2, '0')}
                                    </span>
                                    <div>
                                        <div className="flex items-baseline gap-3 mb-1">
                                            <h3 className="text-xl font-serif text-primary" style={{ fontWeight: 500 }}>
                                                {agent.name}
                                            </h3>
                                            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em]">
                                                {agent.id}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 leading-relaxed max-w-md">
                                            {agent.description}
                                        </p>
                                    </div>
                                </div>

                                {/* 状态指示器 */}
                                <div
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono tracking-wide ${
                                        complete
                                            ? 'bg-accent-light/30 text-accent-dark border border-accent/30'
                                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                                    }`}
                                    title={
                                        complete
                                            ? '配置完整'
                                            : '需填写服务商、模型与 API Key'
                                    }
                                >
                                    <span
                                        className={`inline-flex items-center justify-center w-1.5 h-1.5 rounded-full ${
                                            complete ? 'bg-accent' : 'bg-gray-400'
                                        }`}
                                    />
                                    {complete ? '已就绪' : '未配置'}
                                </div>
                            </div>

                            {/* 服务商选择 */}
                            <div className="mb-5">
                                <div className="flex items-baseline justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        AI 服务商
                                    </label>
                                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                                        Provider
                                    </span>
                                </div>
                                <div className="relative">
                                    <select
                                        value={config.providerId}
                                        onChange={(e) =>
                                            handleFieldChange(
                                                agent.id,
                                                'providerId',
                                                e.target.value
                                            )
                                        }
                                        className="custom-select w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-accent/30 cursor-pointer"
                                    >
                                        <option value="">选择 AI 提供商</option>
                                        {aiProviders.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                                {p.isFree ? '（含免费额度）' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        ▼
                                    </span>
                                </div>
                                {provider && (
                                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                                        {provider.isFree && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-light/40 text-accent-dark rounded-md text-[11px] font-mono font-medium border border-accent/30 tracking-wide">
                                                <Gift className="w-3 h-3" />
                                                FREE TIER
                                            </span>
                                        )}
                                        <span className="text-[11px] text-gray-400 font-mono tabular-nums">
                                            {provider.apiBaseUrl}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 模型选择 */}
                            <div className="mb-5">
                                <div className="flex items-baseline justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        模型
                                    </label>
                                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                                        Model
                                    </span>
                                </div>
                                <div className="relative">
                                    <select
                                        value={config.modelId}
                                        onChange={(e) =>
                                            handleFieldChange(
                                                agent.id,
                                                'modelId',
                                                e.target.value
                                            )
                                        }
                                        disabled={!provider}
                                        className="custom-select w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-accent/30 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                                    >
                                        <option value="">选择模型</option>
                                        {provider?.models.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}
                                                {m.isFree ? '（免费）' : ''} - {m.description}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        ▼
                                    </span>
                                </div>
                                {model && (
                                    <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[11px] text-gray-500 font-mono">
                                        {model.isFree && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-light/40 text-accent-dark rounded-md text-[11px] font-medium border border-accent/30 tracking-wide">
                                                <Gift className="w-3 h-3" />
                                                FREE MODEL
                                            </span>
                                        )}
                                        <span className="tabular-nums">CTX {model.contextLength.toLocaleString()}</span>
                                        <span className="text-gray-300">·</span>
                                        <span className="tabular-nums">OUT {model.maxOutput.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            {/* API Key 输入 */}
                            <div className="mb-5">
                                <div className="flex items-baseline justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        API Key
                                    </label>
                                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                                        Secret
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type={keyVisible ? 'text' : 'password'}
                                        value={config.apiKey}
                                        onChange={(e) =>
                                            handleFieldChange(
                                                agent.id,
                                                'apiKey',
                                                e.target.value
                                            )
                                        }
                                        placeholder="请输入 API Key（敏感信息仅保存在本地）"
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-accent/30 font-mono"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleKeyVisible(agent.id)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary cursor-pointer"
                                        title={keyVisible ? '隐藏' : '显示'}
                                    >
                                        {keyVisible ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* API Key 获取链接 */}
                            {provider && (
                                <div className="p-4 bg-warm-50/70 rounded-xl border border-gray-200/80">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Key className="w-3.5 h-3.5 text-accent-dark" strokeWidth={1.8} />
                                        <span className="text-[11px] font-mono uppercase tracking-wider text-accent-dark">
                                            How to get API Key
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                                        {provider.apiKeyGuide}
                                    </p>
                                    <a
                                        href={provider.apiKeyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:text-accent-dark transition-colors border-b border-primary/20 hover:border-accent-dark/40 pb-0.5"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        前往 {provider.name} 获取 API Key
                                    </a>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* 底部说明 */}
            <div className="mt-10 text-center stagger-5 space-y-1.5 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-mono tracking-wide">
                    所有配置仅保存在本地浏览器，不会上传至服务器。请妥善保管 API Key。
                </p>
                <p className="text-xs text-gray-400 font-mono tracking-wide">
                    遇到模型无响应或返回异常时，可尝试切换服务商、检查 API Key 余额，或回到演示模式继续使用。
                </p>
            </div>
        </div>
    );
};

export default Settings;
