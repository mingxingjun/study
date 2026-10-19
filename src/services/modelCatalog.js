/**
 * 模型目录同步服务
 *
 * 服务商会不断上下线模型 ID，硬编码的模型列表会过时。
 * 这里在浏览器端直接向服务商的 OpenAI 兼容 /models（或各家等价接口）拉取
 * 当前可用模型，缓存到 localStorage（默认 24h），失败时回退到内置列表。
 *
 * 说明：
 * - 只同步模型 ID / 展示名，不保证拿到价格、上下文长度等元数据；
 * - 需要 API Key 的服务商在同步时会带上用户本地填写的 Key；
 * - 部分服务商未开放浏览器跨域（CORS），此时同步会失败并继续用内置列表。
 */

const CACHE_PREFIX = 'study-buddy-model-catalog:';
const CACHE_TTL = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT = 9000;

/** 明显不是对话模型的关键词，同步时过滤掉 */
const NON_CHAT_PATTERN =
  /(embedding|embed-|bge-|whisper|tts|text-to-speech|moderation|dall-e|gpt-image|image-|flux|sdxl|stable-diffusion|rerank|transcribe|audio|realtime|sora|veo|imagen|music|speech)/i;

const cacheKey = (providerId) => `${CACHE_PREFIX}${providerId}`;

/**
 * 读取某个服务商的模型目录缓存
 * @param {string} providerId
 * @param {Object} [options]
 * @param {number} [options.maxAge]
 * @returns {{models: Array, ts: number}|null}
 */
export const getCachedCatalog = (providerId, { maxAge = CACHE_TTL } = {}) => {
  if (!providerId) return null;
  try {
    const raw = localStorage.getItem(cacheKey(providerId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.models) || !parsed.models.length) return null;
    if (!parsed.ts || Date.now() - parsed.ts > maxAge) return null;
    return parsed;
  } catch {
    return null;
  }
};

/**
 * 清空某个服务商的目录缓存
 * @param {string} providerId
 */
export const clearCatalogCache = (providerId) => {
  try {
    localStorage.removeItem(cacheKey(providerId));
  } catch {
    // ignore
  }
};

/**
 * 推断模型列表接口地址与鉴权方式
 * @param {Object} provider
 * @param {string} apiKey
 */
const resolveEndpoint = (provider, apiKey) => {
  const base = String(provider.apiBaseUrl || '').replace(/\/+$/, '');

  // Gemini 的模型列表在 v1beta 根路径，OpenAI 兼容前缀不能直接用
  if (provider.id === 'gemini') {
    const root = base.replace(/\/openai$/, '');
    return {
      url: `${root}/models?key=${encodeURIComponent(apiKey || '')}`,
      headers: {}
    };
  }

  // Anthropic 使用 x-api-key，并需要显式声明允许浏览器直连
  if (provider.id === 'anthropic') {
    return {
      url: `${base}/models`,
      headers: {
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      }
    };
  }

  return {
    url: `${base}/models`,
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
  };
};

/**
 * 把各家不同的返回结构统一成应用内的模型结构
 * @param {Object} provider
 * @param {*} payload
 * @returns {Array<{id: string, name: string, description: string, isFree: boolean, contextLength: number|null, maxOutput: number|null, synced: boolean}>}
 */
const normalizeModels = (provider, payload) => {
  let list = [];
  if (Array.isArray(payload)) list = payload;
  else if (Array.isArray(payload?.data)) list = payload.data;
  else if (Array.isArray(payload?.models)) list = payload.models;

  const seen = new Set();
  const models = [];

  for (const item of list) {
    let id;
    if (typeof item === 'string') {
      id = item;
    } else if (item && typeof item === 'object') {
      id = item.id || item.model || item.name;
    }
    if (!id || typeof id !== 'string') continue;

    // Gemini 返回 models/xxx，且只保留支持 generateContent 的
    if (provider.id === 'gemini') {
      id = id.replace(/^models\//, '');
      const methods = item?.supportedGenerationMethods;
      if (Array.isArray(methods) && !methods.includes('generateContent')) continue;
    }

    if (!id || NON_CHAT_PATTERN.test(id) || seen.has(id)) continue;
    seen.add(id);

    const displayName =
      (item && (item.displayName || item.display_name)) ||
      (item && typeof item.name === 'string' && item.name !== id ? item.name : id);

    models.push({
      id,
      name: displayName || id,
      description: '',
      isFree: false,
      contextLength: null,
      maxOutput: null,
      synced: true
    });
  }

  return models.sort((a, b) => a.id.localeCompare(b.id));
};

/**
 * 请求服务商的模型列表
 * @param {Object} provider
 * @param {string} apiKey
 * @returns {Promise<Array>}
 */
export const fetchProviderModels = async (provider, apiKey) => {
  if (!provider?.apiBaseUrl) throw new Error('服务商缺少 API 地址');

  const { url, headers } = resolveEndpoint(provider, apiKey);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('API Key 无效或没有读取模型目录的权限');
      }
      if (response.status === 404) {
        throw new Error('该服务商未开放模型列表接口');
      }
      throw new Error(`服务商返回 HTTP ${response.status}`);
    }

    const payload = await response.json();
    const models = normalizeModels(provider, payload);
    if (!models.length) throw new Error('服务商返回的模型列表为空');
    return models;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('同步超时，请检查网络');
    if (error instanceof TypeError) throw new Error('浏览器跨域被拦截，无法直接读取');
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * 同步某个服务商的模型目录（优先读缓存，force 时强制刷新）
 * @param {Object} provider
 * @param {string} apiKey
 * @param {Object} [options]
 * @param {boolean} [options.force=false]
 * @returns {Promise<{models: Array, source: 'cache'|'remote', ts: number}>}
 */
export const syncProviderModels = async (provider, apiKey, { force = false } = {}) => {
  if (!provider?.id) throw new Error('未知服务商');

  if (!force) {
    const cached = getCachedCatalog(provider.id);
    if (cached) {
      return { models: cached.models, source: 'cache', ts: cached.ts };
    }
  }

  const models = await fetchProviderModels(provider, apiKey);
  const ts = Date.now();
  try {
    localStorage.setItem(cacheKey(provider.id), JSON.stringify({ ts, models }));
  } catch {
    // localStorage 写入失败不影响本次使用
  }
  return { models, source: 'remote', ts };
};

export const MODEL_CATALOG_TTL = CACHE_TTL;
