import { useState } from 'react';
import {
    Settings as SettingsIcon,
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
            {/* 页面标题 */}
            <div className="mb-10 stagger-1">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                        <SettingsIcon className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-primary">
                        AI 配置中心
                    </h1>
                </div>
                <p className="text-gray-500 leading-relaxed">
                    统一管理三位 AI 学习助手的运行模式与服务商配置，所有设置实时生效并自动保存到本地。
                </p>
            </div>

            {/* 运行模式切换 */}
            <Card className="mb-6 stagger-2">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-semibold text-primary">运行模式</h2>
                    <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                        Mode
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {Object.entries(MODE_META).map(([key, meta]) => {
                        const isActive = mode === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleModeChange(key)}
                                className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                                    isActive
                                        ? 'border-primary bg-gray-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span
                                        className={`font-semibold ${
                                            isActive ? 'text-primary' : 'text-gray-700'
                                        }`}
                                    >
                                        {meta.name}
                                    </span>
                                    {isActive && (
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary">
                                            <Check
                                                className="w-3 h-3 text-white"
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
                    <div className="flex items-start gap-2 p-3 bg-accent-light/40 rounded-lg border border-accent/30">
                        <Sparkles className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 leading-relaxed">
                            当前为演示模式：无需 API Key，上传、刷题、错题讲解、督学打卡均使用示例数据完整可体验。若想使用自己的复习资料并调用真实 AI，请切换到正式模式。
                        </p>
                    </div>
                )}
                {mode === 'formal' && (
                    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <Key className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 leading-relaxed">
                            正式模式已开启：系统将为出题官、讲解师、督学员分别调用真实 AI 接口。请确保每位助手都配置了有效的服务商、模型与 API Key，否则对应功能将不可用。
                        </p>
                    </div>
                )}
            </Card>

            {/* 健壮性说明 */}
            <Card className="mb-6 animate-fade-in">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h2 className="text-sm font-semibold text-primary mb-1">健壮性说明</h2>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            已内置 429 指数退避重试、JSON 截断自修复、空响应重试、PDF 版本兼容，确保在网络波动或模型异常时仍可正常学习。
                        </p>
                        {statusVisible && (
                            <p className={`mt-2 text-xs font-medium animate-fade-in ${
                                aiStatus.type === 'warning' ? 'text-amber-600' : 'text-green-600'
                            }`}>
                                {aiStatus.message}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            {/* 预设组合方案 */}
            <Card className="mb-6 stagger-3">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-primary">预设组合</h2>
                        <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                            Presets
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="text-gray-500"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        重置
                    </Button>
                </div>

                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                    一键应用推荐方案，自动填充三位 AI 助手的服务商与模型。API Key 需要自行前往对应服务商获取并填入下方输入框。
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PRESET_META.map((preset) => {
                        const Icon = preset.icon;
                        const isActive = activePreset === preset.key;
                        return (
                            <button
                                key={preset.key}
                                type="button"
                                onClick={() => handleApplyPreset(preset.key)}
                                className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                                    isActive
                                        ? 'border-primary bg-gray-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Icon
                                            className={`w-4 h-4 ${
                                                isActive ? 'text-primary' : 'text-gray-500'
                                            }`}
                                        />
                                        <span
                                            className={`font-semibold ${
                                                isActive ? 'text-primary' : 'text-gray-700'
                                            }`}
                                        >
                                            {preset.name}
                                        </span>
                                    </div>
                                    {isActive && (
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary">
                                            <Check
                                                className="w-3 h-3 text-white"
                                                strokeWidth={3}
                                            />
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">{preset.desc}</p>
                            </button>
                        );
                    })}
                </div>
            </Card>

            {/* 三个 Agent 配置卡片 */}
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
                        className={`mb-6 stagger-${idx + 3}`}
                    >
                        {/* 卡片头部：Agent 信息 + 状态指示 */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-gray-200"
                                    style={{ backgroundColor: `${agent.color}10` }}
                                >
                                    {agent.avatarEmoji}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold text-primary">
                                            {agent.name}
                                        </h3>
                                        <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                                            {agent.id}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {agent.description}
                                    </p>
                                </div>
                            </div>

                            {/* 状态指示器 */}
                            <div
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                                    complete
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                                }`}
                                title={
                                    complete
                                        ? '配置完整'
                                        : '需填写服务商、模型与 API Key'
                                }
                            >
                                <span
                                    className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${
                                        complete ? 'bg-green-500' : 'bg-gray-300'
                                    }`}
                                >
                                    {complete && (
                                        <Check
                                            className="w-2.5 h-2.5 text-white"
                                            strokeWidth={3}
                                        />
                                    )}
                                </span>
                                {complete ? '已就绪' : '未配置'}
                            </div>
                        </div>

                        {/* 服务商选择 */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                AI 服务商
                            </label>
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
                                    className="custom-select w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent cursor-pointer"
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
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    {provider.isFree && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-light/40 text-secondary rounded text-xs font-medium border border-accent/30">
                                            <Gift className="w-3 h-3" />
                                            含免费额度
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400 font-mono">
                                        {provider.apiBaseUrl}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* 模型选择 */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                模型
                            </label>
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
                                    className="custom-select w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
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
                                <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-gray-500">
                                    {model.isFree && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-light/40 text-secondary rounded text-xs font-medium border border-accent/30">
                                            <Gift className="w-3 h-3" />
                                            免费模型
                                        </span>
                                    )}
                                    <span>上下文 {model.contextLength.toLocaleString()} tokens</span>
                                    <span className="text-gray-300">·</span>
                                    <span>最大输出 {model.maxOutput.toLocaleString()} tokens</span>
                                </div>
                            )}
                        </div>

                        {/* API Key 输入 */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                API Key
                            </label>
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
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent font-mono"
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
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Key className="w-3.5 h-3.5 text-secondary" />
                                    <span className="text-xs font-medium text-gray-700">如何获取 API Key</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                                    {provider.apiKeyGuide}
                                </p>
                                <a
                                    href={provider.apiKeyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:text-accent transition-colors"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    前往 {provider.name} 获取 API Key
                                </a>
                            </div>
                        )}
                    </Card>
                );
            })}

            {/* 底部说明 */}
            <div className="mt-8 text-center text-xs text-gray-400 stagger-5 space-y-1">
                <p>
                    所有配置仅保存在本地浏览器，不会上传至服务器。请妥善保管 API Key。
                </p>
                <p>
                    遇到模型无响应或返回异常时，可尝试切换服务商、检查 API Key 余额，或回到演示模式继续使用。
                </p>
            </div>
        </div>
    );
};

export default Settings;
