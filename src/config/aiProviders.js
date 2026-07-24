/**
 * @file AI 服务商配置文件
 * @description 定义 Study Buddy 应用支持的所有 AI 服务商、可用模型、
 *              预设组合方案及默认 Agent 配置。所有服务商均提供 OpenAI 兼容接口，
 *              便于统一调用。数据更新于 2026 年 7 月 24 日，源自各平台官方文档与搜索核实。
 *              共包含 18 个服务商：12 个直营平台 + 6 个聚合平台。
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
 * @property {boolean} [supportsVision] - 是否支持多模态视觉输入（看图解析）
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
 * @description 包含 17 个服务商，涵盖国内外直营平台与聚合平台，覆盖免费/付费、
 *              通用/推理/多模态等不同场景。价格单位均为人民币（元/百万 Tokens）。
 */
export const aiProviders = [
    // ==================== 直营平台（11 个）====================

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
                description: '快速高效，默认开启思维链；输入¥1/M，输出¥2/M tokens',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 384000
            },
            {
                id: 'deepseek-v4-pro',
                name: 'DeepSeek V4 Pro',
                description: '旗舰模型，推理能力最强；输入~¥3/M，输出~¥12/M tokens',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 384000
            },
            {
                id: 'deepseek-r1',
                name: 'DeepSeek R1',
                description: '推理模型，适合复杂逻辑问题；输入~¥1/M，输出~¥2/M tokens',
                isFree: false,
                contextLength: 1000000,
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
                description: '长上下文旗舰，支持视觉理解；输入¥5/M，输出¥5/M tokens',
                isFree: false,
                contextLength: 128000,
                maxOutput: 4096,
                supportsVision: true
            },
            {
                id: 'glm-5.1',
                name: 'GLM-5.1',
                description: '2026 新一代旗舰，编程与推理能力大幅提升',
                isFree: false,
                contextLength: 200000,
                maxOutput: 8192
            },
            {
                id: 'glm-5.2',
                name: 'GLM-5.2',
                description: '2026 最新旗舰，SWE-bench 第一梯队，Coding 能力领先',
                isFree: false,
                contextLength: 200000,
                maxOutput: 8192
            },
            {
                id: 'glm-4-long',
                name: 'GLM-4-Long',
                description: '超长文本模型，128K-1M 上下文；输入¥1/M，输出¥1/M tokens',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 8192
            },
            {
                id: 'glm-4-flashx',
                name: 'GLM-4-FlashX',
                description: '极速轻量模型；输入¥0.1/M，输出¥0.1/M tokens',
                isFree: false,
                contextLength: 128000,
                maxOutput: 4096
            },
            {
                id: 'glm-z1-air',
                name: 'GLM-Z1-Air',
                description: '推理模型，深度思考；输入¥0.5/M，输出¥0.5/M tokens',
                isFree: false,
                contextLength: 128000,
                maxOutput: 8192
            }
        ]
    },
    {
        id: 'qwen',
        name: '阿里通义千问',
        apiBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKeyUrl: 'https://bailian.console.aliyun.com/',
        apiKeyGuide: '登录阿里云百炼平台 → 右上角 API-KEY 管理 → 创建 API Key。新用户赠送 7000 万+ Tokens。',
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
                id: 'qwen3.6-flash',
                name: 'Qwen3.6-Flash',
                description: '极速版，适合高并发场景；输入~¥0.3/M，输出~¥0.6/M tokens',
                isFree: false,
                contextLength: 128000,
                maxOutput: 8192
            },
            {
                id: 'qwen3.6-plus',
                name: 'Qwen3.6-Plus',
                description: '多模态智能体模型，支持文图视频输入；输入~¥2/M，输出~¥12/M tokens',
                isFree: false,
                contextLength: 256000,
                maxOutput: 8192,
                supportsVision: true
            },
            {
                id: 'qwen3-max',
                name: 'Qwen3-Max',
                description: '通义旗舰，综合能力强；输入~¥5/M，输出~¥20/M tokens',
                isFree: false,
                contextLength: 256000,
                maxOutput: 16384
            },
            {
                id: 'qwen3.7-max',
                name: 'Qwen3.7-Max',
                description: '2026 年 5 月最新旗舰，Arena 盲测国产第一，支持工具调用',
                isFree: false,
                contextLength: 256000,
                maxOutput: 16384
            },
            {
                id: 'qwen-long',
                name: 'Qwen-Long',
                description: '超长文本模型，1000 万上下文；输入~¥0.5/M，输出~¥2/M tokens',
                isFree: false,
                contextLength: 10000000,
                maxOutput: 8192
            }
        ]
    },
    {
        id: 'moonshot',
        name: 'Moonshot Kimi',
        apiBaseUrl: 'https://api.moonshot.cn/v1',
        apiKeyUrl: 'https://platform.moonshot.cn/',
        apiKeyGuide: '注册 Moonshot 开放平台 → 左侧 API Key 管理 → 创建。K3 为 2026/7/17 发布的最新旗舰（2.8万亿参数），缓存命中输入仅¥2/M。',
        isFree: false,
        isOpenAICompatible: true,
        models: [
            {
                id: 'kimi-k3',
                name: 'Kimi K3',
                description: '2026/7/17 发布，2.8万亿参数开源旗舰，100万上下文，编程榜单登顶；缓存命中输入¥2/M，未命中¥20/M，输出¥100/M',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 16384,
                supportsVision: true
            },
            {
                id: 'kimi-k2.5',
                name: 'Kimi K2.5',
                description: '多模态旗舰，支持视觉输入与思维链，256K 上下文',
                isFree: false,
                contextLength: 256000,
                maxOutput: 8192,
                supportsVision: true
            },
            {
                id: 'kimi-k2.6',
                name: 'Kimi K2.6',
                description: '2026 年最新旗舰，长文本与 Agentic Coding 升级；命中缓存输入¥1.10/M，未命中¥6.50/M，输出¥27/M',
                isFree: false,
                contextLength: 256000,
                maxOutput: 8192
            },
            {
                id: 'kimi-k2-turbo',
                name: 'Kimi K2 Turbo',
                description: '加速版，适合高并发场景，性价比优',
                isFree: false,
                contextLength: 128000,
                maxOutput: 8192
            },
            {
                id: 'moonshot-v1-8k',
                name: 'Moonshot V1 8K',
                description: '经典模型，稳定可靠；输入¥12/M，输出¥12/M tokens',
                isFree: false,
                contextLength: 8000,
                maxOutput: 8192
            },
            {
                id: 'moonshot-v1-128k',
                name: 'Moonshot V1 128K',
                description: '经典长文本模型，128K 上下文',
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
        apiKeyGuide: '火山引擎控制台 → 方舟 → 创建推理接入点（选择模型）→ API Key 管理 → 创建密钥。Seed-Evolving 为持续迭代模型（每月2-4次升级，统一 Model ID 免迁移），Seed-2.0-Lite 每月 100 万 Token 永久免费！注意：需先创建"推理接入点"获得 endpoint ID，将其作为模型 ID 使用。',
        isFree: true,
        isOpenAICompatible: true,
        models: [
            {
                id: 'doubao-seed-evolving',
                name: 'Doubao Seed Evolving',
                description: '永远最新的模型卡片，聚焦 Coding/Agent，每月2-4次高频迭代，统一 Model ID 零迁移成本，1M 上下文',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 16384,
                supportsVision: true
            },
            {
                id: 'doubao-seed-2.1-turbo',
                name: 'Doubao Seed 2.1 Turbo',
                description: '2026/6 轻量版，响应快，适合高并发场景',
                isFree: false,
                contextLength: 128000,
                maxOutput: 8192
            },
            {
                id: 'doubao-seed-2.1-pro',
                name: 'Doubao Seed 2.1 Pro',
                description: '2026 年 6 月旗舰，多模态推理',
                isFree: false,
                contextLength: 256000,
                maxOutput: 8192,
                supportsVision: true
            },
            {
                id: 'doubao-seed-2.0-pro',
                name: 'Doubao Seed 2.0 Pro',
                description: '旗舰模型，多模态；输入¥3.2/M，输出¥16/M tokens',
                isFree: false,
                contextLength: 128000,
                maxOutput: 8192,
                supportsVision: true
            },
            {
                id: 'doubao-seed-2.0-code',
                name: 'Doubao Seed 2.0 Code',
                description: '代码专用模型，接近 Claude 能力',
                isFree: false,
                contextLength: 128000,
                maxOutput: 16384
            },
            {
                id: 'doubao-seed-2.0-lite',
                name: 'Doubao Seed 2.0 Lite',
                description: '100 万/月永久免费！输入¥0.6/M，输出¥3.66/M tokens',
                isFree: true,
                contextLength: 128000,
                maxOutput: 8192
            },
            {
                id: 'doubao-seed-2.0-mini',
                name: 'Doubao Seed 2.0 Mini',
                description: '轻量高速版；输入¥0.2/M，输出¥2/M tokens',
                isFree: false,
                contextLength: 32000,
                maxOutput: 8192
            },
            {
                id: 'doubao-seed-1.6-flash',
                name: 'Doubao Seed 1.6 Flash',
                description: '价格最低梯队；输入¥0.075/M，输出~¥0.3/M tokens',
                isFree: false,
                contextLength: 32000,
                maxOutput: 8192
            },
            {
                id: 'doubao-1.5-pro-32k',
                name: 'Doubao 1.5 Pro 32K',
                description: '成熟稳定的旗舰模型，32K 上下文',
                isFree: false,
                contextLength: 32000,
                maxOutput: 8192
            },
            {
                id: 'doubao-1.5-lite-32k',
                name: 'Doubao 1.5 Lite 32K',
                description: '轻量高速版，适合简单任务',
                isFree: false,
                contextLength: 32000,
                maxOutput: 4096
            }
        ]
    },
    {
        id: 'hunyuan',
        name: '腾讯混元',
        apiBaseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
        apiKeyUrl: 'https://cloud.tencent.com/product/hunyuan',
        apiKeyGuide: '登录腾讯云 → 控制台搜索"混元" → API Key 管理 → 创建密钥。Hunyuan-lite 永久免费！',
        isFree: true,
        isOpenAICompatible: true,
        models: [
            {
                id: 'hunyuan-2.0-think',
                name: 'Hunyuan 2.0 Think',
                description: '深度思考旗舰；输入¥3.975/M，输出¥15.9/M tokens',
                isFree: false,
                contextLength: 256000,
                maxOutput: 8192
            },
            {
                id: 'hunyuan-2.0-instruct',
                name: 'Hunyuan 2.0 Instruct',
                description: '指令模型，响应快；输入¥3.18/M，输出¥7.95/M tokens',
                isFree: false,
                contextLength: 256000,
                maxOutput: 8192
            },
            {
                id: 'hunyuan-t1',
                name: 'Hunyuan T1',
                description: '推理模型，性价比高；输入¥1/M，输出¥4/M tokens',
                isFree: false,
                contextLength: 128000,
                maxOutput: 8192
            },
            {
                id: 'hunyuan-turbos',
                name: 'Hunyuan TurboS',
                description: '加速版，适合高并发；输入¥0.8/M，输出¥2/M tokens',
                isFree: false,
                contextLength: 128000,
                maxOutput: 8192
            },
            {
                id: 'hunyuan-lite',
                name: 'Hunyuan Lite',
                description: '永久免费！适合日常任务和学习测试',
                isFree: true,
                contextLength: 256000,
                maxOutput: 8192
            }
        ]
    },
    {
        id: 'minimax',
        name: 'MiniMax',
        apiBaseUrl: 'https://api.minimaxi.com/v1',
        apiKeyUrl: 'https://platform.minimaxi.com/',
        apiKeyGuide: '注册 MiniMax 开放平台 → API Keys → 创建。M3 为 2026/7/17 WAIC 首发全模态旗舰，混合 API 定价仅 $0.22/M token。',
        isFree: false,
        isOpenAICompatible: true,
        models: [
            {
                id: 'MiniMax-M3',
                name: 'MiniMax M3',
                description: '2026/7/17 WAIC 首发全模态旗舰，混合 API 定价 $0.22/M token，长上下文性价比极高',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 16384,
                supportsVision: true
            },
            {
                id: 'MiniMax-M2.7',
                name: 'MiniMax M2.7',
                description: '2026 旗舰；输入¥2.1/M，输出¥8.4/M tokens',
                isFree: false,
                contextLength: 197000,
                maxOutput: 8192
            },
            {
                id: 'MiniMax-M2.7-highspeed',
                name: 'MiniMax M2.7 Highspeed',
                description: '高速版，低延迟；输入¥4.2/M，输出¥16.8/M tokens',
                isFree: false,
                contextLength: 197000,
                maxOutput: 8192
            },
            {
                id: 'MiniMax-M1',
                name: 'MiniMax M1',
                description: '推理模型，深度思考，适合复杂逻辑',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 16384
            }
        ]
    },
    {
        id: 'mimo',
        name: '小米 MiMo',
        apiBaseUrl: 'https://api.mimo.xiaomi.com/v1',
        apiKeyUrl: 'https://mimo.xiaomi.com/',
        apiKeyGuide: '前往 Xiaomi MiMo API 开放平台 → 注册 → API Keys → 创建密钥。登录后有专属免费额度。注意：若 API 地址有变更，请以官网文档为准。',
        isFree: true,
        isOpenAICompatible: true,
        models: [
            {
                id: 'MiMo-V2-Pro',
                name: 'MiMo-V2-Pro',
                description: '旗舰模型，深度思考；输入¥7/M，输出¥21/M tokens',
                isFree: false,
                contextLength: 256000,
                maxOutput: 16384
            },
            {
                id: 'MiMo-V2-Omni',
                name: 'MiMo-V2-Omni',
                description: '多模态全能模型，支持图文理解；输入¥2.94/M，输出¥14.7/M tokens',
                isFree: false,
                contextLength: 256000,
                maxOutput: 8192,
                supportsVision: true
            },
            {
                id: 'MiMo-V2-Flash',
                name: 'MiMo-V2-Flash',
                description: '开源 MoE 模型，309B 参数；输入¥0.7/M，输出¥2.1/M tokens',
                isFree: false,
                contextLength: 256000,
                maxOutput: 8192
            }
        ]
    },
    {
        id: 'wenxin',
        name: '百度文心',
        apiBaseUrl: 'https://qianfan.baidubce.com/v2',
        apiKeyUrl: 'https://console.bce.baidu.com/qianfan/',
        apiKeyGuide: '登录百度智能云千帆平台 → 应用中心 → 创建应用 → 获取 API Key 与 Secret Key。新用户赠送 ERNIE 3.5 旗舰 5000 万 Tokens。',
        isFree: true,
        isOpenAICompatible: true,
        models: [
            {
                id: 'ernie-4.5-8k',
                name: '文心 4.5',
                description: '旗舰模型，中文知识问答强；输入~¥0.8-2/M，输出~¥2-4/M tokens',
                isFree: false,
                contextLength: 128000,
                maxOutput: 8192
            },
            {
                id: 'ernie-3.5-8k',
                name: '文心 3.5',
                description: '经典版，企业级方案成熟，新用户免费 5000 万 Tokens',
                isFree: true,
                contextLength: 8000,
                maxOutput: 8192
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
                maxOutput: 8192,
                supportsVision: true
            },
            {
                id: 'gemini-2.5-pro',
                name: 'Gemini 2.5 Pro',
                description: 'Google 旗舰推理模型，100 万上下文，深度思考能力强',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 8192,
                supportsVision: true
            }
        ]
    },
    {
        id: 'openai',
        name: 'OpenAI',
        apiBaseUrl: 'https://api.openai.com/v1',
        apiKeyUrl: 'https://platform.openai.com/api-keys',
        apiKeyGuide: '登录 OpenAI Platform → API Keys → Create new secret key。GPT-5.6 为 2026/7/9 最新发布（Sol/Terra/Luna 三档），需海外网络环境与付费。',
        isFree: false,
        isOpenAICompatible: true,
        models: [
            {
                id: 'gpt-5.6-sol',
                name: 'GPT-5.6 Sol',
                description: '2026/7/9 旗舰版，复杂推理与深度编程，150万上下文；输入$5/M，输出$30/M tokens',
                isFree: false,
                contextLength: 1500000,
                maxOutput: 32768,
                supportsVision: true
            },
            {
                id: 'gpt-5.6-terra',
                name: 'GPT-5.6 Terra',
                description: '2026/7/9 均衡版，能力与成本平衡，适合大多数场景',
                isFree: false,
                contextLength: 1500000,
                maxOutput: 16384,
                supportsVision: true
            },
            {
                id: 'gpt-5.6-luna',
                name: 'GPT-5.6 Luna',
                description: '2026/7/9 性价比版，低成本高吞吐，适合简单任务',
                isFree: false,
                contextLength: 1500000,
                maxOutput: 16384,
                supportsVision: true
            },
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                description: '上一代多模态旗舰，输入$2.5/M，输出$10/M tokens',
                isFree: false,
                contextLength: 128000,
                maxOutput: 16384,
                supportsVision: true
            }
        ]
    },
    {
        id: 'anthropic',
        name: 'Anthropic Claude',
        apiBaseUrl: 'https://api.anthropic.com/v1',
        apiKeyUrl: 'https://console.anthropic.com/',
        apiKeyGuide: '登录 Anthropic Console → API Keys → Create Key。Claude 4 系列连续工作能力达 7 小时，推理与编程能力顶尖。需海外网络环境。注意：Anthropic 使用专属协议，本系统通过 OpenAI 兼容模式调用，模型 ID 以 claude- 开头。',
        isFree: false,
        isOpenAICompatible: true,
        models: [
            {
                id: 'claude-fable-5',
                name: 'Claude Fable 5',
                description: 'Anthropic 最高端旗舰，API 价格最高，适合不差钱追求极致效果的场景',
                isFree: false,
                contextLength: 200000,
                maxOutput: 32768,
                supportsVision: true
            },
            {
                id: 'claude-opus-4-8',
                name: 'Claude Opus 4.8',
                description: 'Claude 4 系列旗舰，连续工作 7 小时，深度推理与长任务；输出$75/M tokens',
                isFree: false,
                contextLength: 200000,
                maxOutput: 32768,
                supportsVision: true
            },
            {
                id: 'claude-sonnet-5',
                name: 'Claude Sonnet 5',
                description: '性价比主力选型，综合能力强；优惠价输入¥22/M，输出¥109/M tokens（9月1日起标准价）',
                isFree: false,
                contextLength: 200000,
                maxOutput: 16384,
                supportsVision: true
            }
        ]
    },

    // ==================== 聚合平台（6 个）====================

    {
        id: 'siliconflow',
        name: '硅基流动',
        apiBaseUrl: 'https://api.siliconflow.cn/v1',
        apiKeyUrl: 'https://cloud.siliconflow.cn/',
        apiKeyGuide: '注册硅基流动 → 新用户赠送 2000 万 Token → 左侧 API 密钥 → 创建密钥。聚合 100+ 开源模型，DeepSeek 推理加速 10 倍+，已上架 Kimi K3 / GLM-5.2 等最新开源模型。',
        isFree: true,
        isOpenAICompatible: true,
        models: [
            {
                id: 'moonshot/Kimi-K3',
                name: 'Kimi K3 (硅基流动)',
                description: '2026/7/27 开源权重，2.8万亿参数，硅基流动加速部署',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 16384,
                supportsVision: true
            },
            {
                id: 'zhipuai/GLM-5.2',
                name: 'GLM-5.2 (硅基流动)',
                description: '智谱 2026/6/15 全量开放旗舰，SWE-bench 第一梯队',
                isFree: false,
                contextLength: 200000,
                maxOutput: 8192
            },
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
            },
            {
                id: 'Pro/deepseek-ai/DeepSeek-V3',
                name: 'DeepSeek-V3 (Pro加速)',
                description: 'DeepSeek 推理加速版，10 倍+速度提升',
                isFree: false,
                contextLength: 64000,
                maxOutput: 8192
            }
        ]
    },
    {
        id: 'openrouter',
        name: 'OpenRouter',
        apiBaseUrl: 'https://openrouter.ai/api/v1',
        apiKeyUrl: 'https://openrouter.ai/',
        apiKeyGuide: '注册 OpenRouter → Keys → Create Key（格式 sk-or-...）。聚合 300+ 全球模型，自动路由，信用点计费。有 27 个免费模型可用，已上架 GPT-5.6 / Claude 4 / Kimi K3 等最新模型。',
        isFree: true,
        isOpenAICompatible: true,
        models: [
            {
                id: 'openai/gpt-5.6-sol',
                name: 'GPT-5.6 Sol (via OpenRouter)',
                description: '2026/7/9 OpenAI 旗舰，150万上下文，复杂推理',
                isFree: false,
                contextLength: 1500000,
                maxOutput: 32768,
                supportsVision: true
            },
            {
                id: 'anthropic/claude-opus-4-8',
                name: 'Claude Opus 4.8 (via OpenRouter)',
                description: 'Anthropic 旗舰，连续工作 7 小时，深度推理',
                isFree: false,
                contextLength: 200000,
                maxOutput: 32768,
                supportsVision: true
            },
            {
                id: 'moonshot/kimi-k3',
                name: 'Kimi K3 (via OpenRouter)',
                description: '2026/7/17 发布，2.8万亿参数开源旗舰',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 16384,
                supportsVision: true
            },
            {
                id: 'google/gemini-2.5-flash',
                name: 'Gemini 2.5 Flash (via OpenRouter)',
                description: '免费模型，100 万上下文，支持多模态',
                isFree: true,
                contextLength: 1000000,
                maxOutput: 8192,
                supportsVision: true
            },
            {
                id: 'deepseek/deepseek-chat',
                name: 'DeepSeek V3 (via OpenRouter)',
                description: '通用大模型，自动路由，略高于官方价',
                isFree: false,
                contextLength: 64000,
                maxOutput: 8192
            },
            {
                id: 'qwen/qwen-2.5-72b-instruct',
                name: 'Qwen 2.5 72B (via OpenRouter)',
                description: '通义旗舰开源版，中文理解领先',
                isFree: false,
                contextLength: 128000,
                maxOutput: 8192
            },
            {
                id: 'anthropic/claude-3.5-sonnet',
                name: 'Claude 3.5 Sonnet (via OpenRouter)',
                description: '国际推理旗舰，需海外网络或信用点',
                isFree: false,
                contextLength: 200000,
                maxOutput: 8192
            }
        ]
    },
    {
        id: 'qiniu',
        name: '七牛云 AI',
        apiBaseUrl: 'https://api.ai7n.io/v1',
        apiKeyUrl: 'https://www.qiniu.com/',
        apiKeyGuide: '注册七牛云 → AI 推理服务 → 创建 API Key。新用户赠送 300 万 Tokens。支持 OpenAI 与 Anthropic 双协议，国内直连 Claude/GPT。注意：本系统仅支持 OpenAI 兼容协议调用。',
        isFree: true,
        isOpenAICompatible: true,
        models: [
            {
                id: 'gpt-4o',
                name: 'GPT-4o (七牛云中转)',
                description: '国内直连 GPT-4o，接近官方价',
                isFree: false,
                contextLength: 128000,
                maxOutput: 16384,
                supportsVision: true
            },
            {
                id: 'claude-3-5-sonnet',
                name: 'Claude 3.5 Sonnet (七牛云中转)',
                description: '国内直连 Claude，支持 MCP',
                isFree: false,
                contextLength: 200000,
                maxOutput: 8192
            },
            {
                id: 'deepseek-chat',
                name: 'DeepSeek V3 (七牛云中转)',
                description: '中转 DeepSeek，参数原生透传',
                isFree: false,
                contextLength: 64000,
                maxOutput: 8192
            }
        ]
    },
    {
        id: 'nonlinear',
        name: '非线智能',
        apiBaseUrl: 'https://api.nonlinear.cn/v1',
        apiKeyUrl: 'https://www.nonlinear.cn/',
        apiKeyGuide: '注册非线智能 → API 管理 → 创建密钥。新用户 20-50 元体验金，官网 8-9 折，输入/输出/缓存分离计费。注意：API 地址请以官网文档为准。',
        isFree: true,
        isOpenAICompatible: true,
        models: [
            {
                id: 'gpt-4o',
                name: 'GPT-4o (非线中转)',
                description: '中转 GPT-4o，官网 8-9 折',
                isFree: false,
                contextLength: 128000,
                maxOutput: 16384,
                supportsVision: true
            },
            {
                id: 'deepseek-v4-pro',
                name: 'DeepSeek V4 Pro (非线中转)',
                description: '中转 DeepSeek 旗舰，透明计费',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 384000
            },
            {
                id: 'claude-3-5-sonnet',
                name: 'Claude 3.5 Sonnet (非线中转)',
                description: '中转 Claude，详单可查',
                isFree: false,
                contextLength: 200000,
                maxOutput: 8192
            }
        ]
    },
    {
        id: 'bumoai',
        name: '不墨 AI',
        apiBaseUrl: 'https://api.bumoai.cn/v1',
        apiKeyUrl: 'https://www.bumoai.com/',
        apiKeyGuide: '注册不墨 AI → API Keys → 创建。一个 Key 调用多模型，OpenAI 兼容统一接口，按量计费。注意：API 地址请以官网文档为准。',
        isFree: false,
        isOpenAICompatible: true,
        models: [
            {
                id: 'gpt-4o',
                name: 'GPT-4o (不墨中转)',
                description: '统一接口调用 GPT-4o',
                isFree: false,
                contextLength: 128000,
                maxOutput: 16384,
                supportsVision: true
            },
            {
                id: 'deepseek-v4-pro',
                name: 'DeepSeek V4 Pro (不墨中转)',
                description: '统一接口调用 DeepSeek 旗舰',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 384000
            },
            {
                id: 'qwen3-max',
                name: 'Qwen3-Max (不墨中转)',
                description: '统一接口调用通义旗舰',
                isFree: false,
                contextLength: 256000,
                maxOutput: 16384
            }
        ]
    },
    {
        id: 'weelinking',
        name: 'weelinking',
        apiBaseUrl: 'https://api.weelinking.com/v1',
        apiKeyUrl: 'https://www.weelinking.com/',
        apiKeyGuide: '注册 weelinking → API 管理 → 创建密钥。新用户百万 Token 免费，按 Token 计费。注意：API 地址请以官网文档为准。',
        isFree: true,
        isOpenAICompatible: true,
        models: [
            {
                id: 'gpt-4o-mini',
                name: 'GPT-4o Mini (weelinking)',
                description: '经济之选，新用户百万 Token 免费',
                isFree: true,
                contextLength: 128000,
                maxOutput: 16384,
                supportsVision: true
            },
            {
                id: 'deepseek-v4-flash',
                name: 'DeepSeek V4 Flash (weelinking)',
                description: '中转 DeepSeek，性价比高',
                isFree: false,
                contextLength: 1000000,
                maxOutput: 384000
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
 * @description 初始状态下三个 Agent 的空配置 + 独立的多模态视觉 AI 配置，等待用户在设置界面填写。
 *              apiKey 字段保持为空字符串，由用户自行输入，禁止硬编码敏感信息。
 *              vision 字段为独立的多模态视觉 AI，当主 AI（quiz-master）不支持多模态时，
 *              文档图片解析将自动使用此配置，避免主 AI 必须选多模态模型的限制。
 */
export const defaultConfig = {
    'quiz-master': { providerId: '', modelId: '', apiKey: '' },
    'explainer': { providerId: '', modelId: '', apiKey: '' },
    'supervisor': { providerId: '', modelId: '', apiKey: '' },
    'vision': { providerId: '', modelId: '', apiKey: '' }
};
