import { useState, useEffect } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import { getImage, isImageKey } from '../../services/imageStorage';

/**
 * 题目图片组件
 * 提供加载占位与加载失败 fallback，避免裂图
 *
 * 支持两种图片来源（自动识别）：
 * 1. `src` 为 base64 data URL 或 http URL → 直接渲染
 * 2. `src` 为 IndexedDB key（以 "img-" 开头）→ 异步从 IndexedDB 加载后渲染
 * 3. 也可通过 `srcKey` prop 显式指定 IndexedDB key
 *
 * @param {Object} props
 * @param {string} [props.src] - 图片地址（base64/URL/IndexedDB key 均可）
 * @param {string} [props.srcKey] - IndexedDB 图片 key（优先级高于 src）
 * @param {string} [props.alt='题目图片'] - 图片替代文本
 * @param {string} [props.className=''] - 额外的 CSS 类名
 * @param {string} [props.containerClassName=''] - 容器额外的 CSS 类名
 */
const QuestionImage = ({
  src,
  srcKey,
  alt = '题目图片',
  className = '',
  containerClassName = ''
}) => {
  const [status, setStatus] = useState('loading');
  const [resolvedSrc, setResolvedSrc] = useState('');

  // 确定实际要加载的图片源：srcKey 优先，其次 src
  const rawSource = srcKey || src;

  useEffect(() => {
    // 每次切换图片源时重置状态
    setStatus('loading');
    setResolvedSrc('');

    if (!rawSource) {
      setStatus('error');
      return;
    }

    let cancelled = false;

    const resolveSource = async () => {
      // 如果是 IndexedDB key，异步加载
      if (isImageKey(rawSource)) {
        try {
          const base64 = await getImage(rawSource);
          if (cancelled) return;
          if (base64) {
            setResolvedSrc(base64);
            // 此时图片尚未 onLoad，保持 loading 状态
          } else {
            setStatus('error');
          }
        } catch (error) {
          if (!cancelled) setStatus('error');
        }
      } else {
        // base64 或 URL，直接使用
        if (!cancelled) setResolvedSrc(rawSource);
      }
    };

    resolveSource();

    return () => {
      cancelled = true;
    };
  }, [rawSource]);

  const handleLoad = () => setStatus('loaded');
  const handleError = () => setStatus('error');

  return (
    <div
      className={`inline-block rounded-xl border border-gray-200 bg-gray-50 overflow-hidden ${containerClassName}`}
    >
      {status === 'loading' && (
        <div className="flex items-center justify-center min-h-[120px] px-6">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="ml-2 text-xs text-gray-500">图片加载中...</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center justify-center min-h-[120px] px-6 text-center">
          <ImageOff className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-xs text-gray-500">图片加载失败</span>
        </div>
      )}

      {resolvedSrc && (
        <img
          src={resolvedSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`${status === 'loaded' ? 'block' : 'hidden'} max-w-full max-h-64 object-contain ${className}`}
        />
      )}
    </div>
  );
};

export default QuestionImage;
