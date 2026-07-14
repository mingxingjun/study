import { useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';

/**
 * 题目图片组件
 * 提供加载占位与加载失败 fallback，避免裂图
 * @param {Object} props
 * @param {string} props.src - 图片地址
 * @param {string} [props.alt='题目图片'] - 图片替代文本
 * @param {string} [props.className=''] - 额外的 CSS 类名
 * @param {string} [props.containerClassName=''] - 容器额外的 CSS 类名
 */
const QuestionImage = ({
  src,
  alt = '题目图片',
  className = '',
  containerClassName = ''
}) => {
  const [status, setStatus] = useState('loading');

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

      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${status === 'loaded' ? 'block' : 'hidden'} max-w-full max-h-64 object-contain ${className}`}
      />
    </div>
  );
};

export default QuestionImage;
