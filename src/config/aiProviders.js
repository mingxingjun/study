/**
 * @file AI 服务商配置文件
 * @description 定义 Study Buddy 应用支持的所有 AI 服务商、可用模型、
 *              预设组合方案及默认 Agent 配置。所有服务商均提供 OpenAI 兼容接口，
 *              便于统一调用。数据更新于 2026 年 7 月，源自各平台官方文档。
 */

/**
 * 单个 AI 模型定义
 * @typedef {Object} AiModel
 * @property {string} id            - 模型 ID（API 调用时使用）
 * @property {string} name          - 模型显示名称
 * @property {string} description   - 模型简要描述
 * @property {boolean} isFree       - 是否免费
 * @property {number} contextLength - 上下文窗口大小（单位：token）
 * @property {number} maxOutput     - 最大输出长度（单位：token）
 */

/**
 * 单个 AI 服务商定义
 * @typedef {Object} AiProvider
 * @property {string} id                   - 服务商唯一标识
 * @property {string} name                 - 服务商显示名称
 * @property {string} apiBaseUrl           - API 基础地址（OpenAI 兼容端点）
 * @property {string} apiKeyUrl            - 获取 API Key 的地址
 * @property {string} apiKeyGuide          - 获取 API Key 的简要指南
 * @property {boolean} isFree              - 是否提供免费额度
 * @property {boolean} isOpenAICompatible  - 是否使用 OpenAI 兼容接口
 * @property {AiModel[]} models            - 该服务商提供的可用模型列表
 */

/**
 * 单个 Agent 的配置项
 * @typedef {Object} AgentConfig
 * @property {string} providerId - 服务商 ID
 * @property {string} modelId    - 模型 ID
 * @property {string} apiKey     - API Key（用户填写，敏感信息不硬编码）
 */

/**
 * AI 服务商列表
 * @type {AiProvider[]}
 * @description 包含 8 个主流 AI 服务商，涵盖国内外、免费/付费、通用/推理等不同场景
 */
export const aiProviders = [
    {
        id: 'deepseek',
        name: 'DeepSeek',
        apiBaseUrl: 'https://api.deepseek.com',
        apiKeyUrl: 'https://platform.deepseek.com/',
        apiKeyGuide: '登录 DeepSeek 开放平台 → API Keys → 创建 API Key。旧模型 deepseek-chat/deepseek-reasoner 已于 2026/07/24 正式下线，请使用 V4 系列模型。',
        isFree: false,
        isOpenAICompatible: true,
        models: [
            {
                id: 'deepseek-v4-flash',
                name: 'DeepSeek V4 Flash',
                description: '快速高效，默认开启思维链；输入$0.14/M，输出$0.28/M tokens',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 384000
            },
            {
                id: 'deepseek-v4-pro',
                name: 'DeepSeek V4 Pro',
                description: '旗舰模型，推理能力最强；输入$0.435/M，输出$0.87/M tokens',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 384000
            }
        ]
    },
    {
        id: 'siliconflow',
        name: '硅基流动',
        apiBaseUrl: 'https://api.siliconflow.cn/v1',
        apiKeyUrl: 'https://cloud.siliconflow.cn/',
        apiKeyGuide: '注册硅基流动 → 新用户赠送 2000 万 Token → 左侧 API 密钥 → 创建密钥。聚合多家开源模型。',
        isFree: true,
        isOpenAICompatible: true,
        models: [
            {
                id: 'Qwen/Qwen2.5-7B-Instruct',
                name: 'Qwen2.5-7B-Instruct',
                description: '免费模型，轻量高速，适合简单日常任务',
                isFree: true,
                contextLength: 32000,
                maxOutput: 8192
            },
            {
                id: 'Nex-N2-Pro',
                name: 'Nex-N2-Pro',
                description: '硅基自研旗舰，限时免费 API，综合能力优秀',
                isFree: true,
                contextLength: 128000,
                maxOutput: 8192
            },
            {
                id: 'deepseek-ai/DeepSeek-V3',
                name: 'DeepSeek-V3',
                description: '通用大模型，消耗赠送 Token',
                isFree: false,
                contextLength: 64000,
                maxOutput: 8192
            },
            {
                id: 'deepseek-ai/DeepSeek-R1',
                name: 'DeepSeek-R1',
                description: '推理模型，适合复杂逻辑问题，消耗赠送 Token',
                isFree: false,
                contextLength: 64000,
                maxOutput: 16384
            }
        ]
    },
    {
        id: 'zhipu',
        name: '智谱 GLM',
        apiBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        apiKeyUrl: 'https://open.bigmodel.cn/',
        apiKeyGuide: '注册智谱开放平台 BigModel.cn → API Keys → 创建 API Key。GLM-4.7-Flash 完全免费无限调用。',
        isFree: true,
        isOpenAICompatible: true,
        models: [
            {
                id: 'glm-4.7-flash',
                name: 'GLM-4.7-Flash',
                description: '完全免费！混合思考模型，替代 GLM-4.5-Flash，200K 上下文',
                isFree: true,
                contextLength: 200000,
                maxOutput: 8192
            },
            {
                id: 'glm-4-plus',
                name: 'GLM-4-Plus',
                description: '长上下文旗舰，支持视觉理解，适合复杂任务',
                isFree: false,
                contextLength: 128000,
                maxOutput: 4096
            },
            {
                id: 'glm-5.1',
                name: 'GLM-5.1',
                description: '2026 新一代旗舰，编程与推理能力大幅提升',
                isFree: false,
                contextLength: 200000,
                maxOutput: 8192
            }
        ]
    },
    {
        id: 'qwen',
        name: '阿里通义千问',
        apiBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKeyUrl: 'https://bailian.console.aliyun.com/',
        apiKeyGuide: '登录阿里云百炼平台 → 右上角 API-KEY 管理 → 创建 API Key。Qwen-Turbo 每月 100 万 Token 免费额度。',
        isFree: true,
        isOpenAICompatible: true,
        models: [
            {
                id: 'qwen-turbo',
                name: 'Qwen-Turbo',
                description: '免费 100 万 Token/月，支持 100 万长上下文，日常任务首选',
                isFree: true,
                contextLength: 1000000,
                maxOutput: 8192
            },
            {
                id: 'qwen3.6-plus',
                name: 'Qwen3.6-Plus',
                description: '多模态智能体模型，支持文图视频输入，性价比优选',
                isFree: false,
                contextLength: 256000,
                maxOutput: 8192
            },
            {
                id: 'qwen3.7-max',
                name: 'Qwen3.7-Max',
                description: '2026 年 5 月最新旗舰，Arena 盲测国产第一，支持工具调用',
                isFree: false,
                contextLength: 256000,
                maxOutput: 16384
            }
        ]
    },
    {
        id: 'moonshot',
        name: 'Moonshot Kimi',
        apiBaseUrl: 'https://api.moonshot.cn/v1',
        apiKeyUrl: 'https://platform.moonshot.cn/',
        apiKeyGuide: '注册 Moonshot 开放平台 → 左侧 API Key 管理 → 创建。Kimi K2.5 支持视觉理解。',
        isFree: false,
        isOpenAICompatible: true,
        models: [
            {
                id: 'kimi-k2.5',
                name: 'Kimi K2.5',
                description: '多模态旗舰，支持视觉输入与思维链，256K 上下文',
                isFree: false,
                contextLength: 256000,
                maxOutput: 8192
            },
            {
                id: 'kimi-k2.6',
                name: 'Kimi K2.6',
                description: '2026 年最新版本，长文本与智能体能力升级',
                isFree: false,
                contextLength: 256000,
                maxOutput: 8192
            },
            {
                id: 'moonshot-v1-128k',
                name: 'Moonshot V1 128K',
                description: '经典长文本模型，稳定可靠',
                isFree: false,
                contextLength: 128000,
                maxOutput: 8192
            }
        ]
    },
    {
        id: 'doubao',
        name: '火山豆包',
        apiBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
        apiKeyUrl: 'https://console.volcengine.com/ark',
        apiKeyGuide: '火山引擎控制台 → 方舟 → 创建推理接入点（选择模型）→ API Key 管理 → 创建密钥。每日 200 万免费 Token！注意：需先创建"推理接入点"获得 endpoint ID，将其作为模型 ID 使用。',
        isFree: true,
        isOpenAICompatible: true,
        models: [
            {
                id: 'doubao-seed-2.1-pro',
                name: 'Doubao Seed 2.1 Pro',
                description: '2026 年 6 月最新旗舰，多模态推理，每日 200 万免费 Token',
                isFree: true,
                contextLength: 256000,
                maxOutput: 8192
            },
            {
                id: 'doubao-1.5-pro-32k',
                name: 'Doubao 1.5 Pro 32K',
                description: '成熟稳定的旗舰模型，每日 200 万免费 Token',
                isFree: true,
                contextLength: 32000,
                maxOutput: 8192
            },
            {
                id: 'doubao-1.5-lite-32k',
                name: 'Doubao 1.5 Lite 32K',
                description: '轻量高速版，适合简单任务，每日 200 万免费 Token',
                isFree: true,
                contextLength: 32000,
                maxOutput: 4096
            }
        ]
    },
    {
        id: 'gemini',
        name: 'Google Gemini',
        apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        apiKeyUrl: 'https://aistudio.google.com/apikey',
        apiKeyGuide: '访问 Google AI Studio → Get API Key → Create API Key。Gemini 2.5 Flash 每分钟 60 次请求免费（约 1500 次/天）。',
        isFree: true,
        isOpenAICompatible: true,
        models: [
            {
                id: 'gemini-2.5-flash',
                name: 'Gemini 2.5 Flash',
                description: '免费高速模型，100 万上下文，支持多模态，每日免费额度充足',
                isFree: true,
                contextLength: 1000000,
                maxOutput: 8192
            },
            {
                id: 'gemini-2.5-pro',
                name: 'Gemini 2.5 Pro',
                description: 'Google 旗舰推理模型，100 万上下文，深度思考能力强',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 8192
            }
        ]
    },
    {
        id: 'openai',
        name: 'OpenAI',
        apiBaseUrl: 'https://api.openai.com/v1',
        apiKeyUrl: 'https://platform.openai.com/api-keys',
        apiKeyGuide: '登录 OpenAI Platform → API Keys → Create new secret key。需海外网络环境与付费。',
        isFree: false,
        isOpenAICompatible: true,
        models: [
            {
                id: 'gpt-4o-mini',
                name: 'GPT-4o Mini',
                description: '经济之选，输入$0.15/M，输出$0.60/M tokens，速度快',
                isFree: false,
                contextLength: 128000,
                maxOutput: 16384
            },
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                description: '多模态旗舰模型，输入$2.5/M，输出$10/M tokens',
                isFree: false,
                contextLength: 128000,
                maxOutput: 16384
            },
            {
                id: 'gpt-4.1',
                name: 'GPT-4.1',
                description: '2026 年代号 GPT-4.1，指令遵循与代码能力大幅提升',
                isFree: false,
                contextLength: 256000,
                maxOutput: 32768
            }
        ]
    }
];

/**
 * 预设组合方案
 * @type {Object.<string, Object.<string, AgentConfig>>}
 * @description 提供 3 种预设方案，分别针对免费、性价比和最强能力场景。
 *              每个方案将三个 Agent（quiz-master 出题官、explainer 讲解官、
 *              supervisor 督学官）映射到指定服务商和模型。
 */
export const presetCombinations = {
    /** 免费方案：三个 Agent 全部使用智谱 GLM-4.7-Flash，零成本体验 */
    free: {
        'quiz-master': { providerId: 'zhipu', modelId: 'glm-4.7-flash', apiKey: '' },
        'explainer': { providerId: 'zhipu', modelId: 'glm-4.7-flash', apiKey: '' },
        'supervisor': { providerId: 'zhipu', modelId: 'glm-4.7-flash', apiKey: '' }
    },
    /** 性价比方案：三个 Agent 全部使用 DeepSeek V4 Flash，极低价格兼顾速度与质量 */
    costEffective: {
        'quiz-master': { providerId: 'deepseek', modelId: 'deepseek-v4-flash', apiKey: '' },
        'explainer': { providerId: 'deepseek', modelId: 'deepseek-v4-flash', apiKey: '' },
        'supervisor': { providerId: 'deepseek', modelId: 'deepseek-v4-flash', apiKey: '' }
    },
    /** 最强方案：分别使用各家旗舰模型，追求最佳出题、讲解、督学效果 */
    strongest: {
        'quiz-master': { providerId: 'deepseek', modelId: 'deepseek-v4-pro', apiKey: '' },
        'explainer': { providerId: 'qwen', modelId: 'qwen3.7-max', apiKey: '' },
        'supervisor': { providerId: 'moonshot', modelId: 'kimi-k2.6', apiKey: '' }
    }
};

/**
 * 默认 Agent 配置
 * @type {Object.<string, AgentConfig>}
 * @description 初始状态下三个 Agent 的空配置，等待用户在设置界面填写。
 *              apiKey 字段保持为空字符串，由用户自行输入，禁止硬编码敏感信息。
 */
export const defaultConfig = {
    'quiz-master': { providerId: '', modelId: '', apiKey: '' },
    'explainer': { providerId: '', modelId: '', apiKey: '' },
    'supervisor': { providerId: '', modelId: '', apiKey: '' }
};
