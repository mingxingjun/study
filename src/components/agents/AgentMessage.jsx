import AgentAvatar from './AgentAvatar';
import MathRenderer from '../MathRenderer';

/**
 * Agent 消息气泡组件
 * @param {Object} props
 * @param {Object} props.agent - Agent 对象
 * @param {string} props.message - 消息内容
 * @param {boolean} [props.isTyping=false] - 是否正在输入
 * @param {string} [props.className] - 额外的 CSS 类名
 */
const AgentMessage = ({ agent, message, isTyping = false, className = '' }) => {
  const { color } = agent;

  return (
    <div className={`flex items-start gap-3 animate-fade-in ${className}`}>
      <AgentAvatar agent={agent} size="sm" className="flex-shrink-0 mt-0.5" />
      <div
        className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%]"
        style={{ borderLeft: `3px solid ${color}` }}
      >
        {isTyping ? (
          <div className="flex items-center gap-1 py-1">
            <span className="text-xs text-gray-400 mr-1">正在输入</span>
            <span className="flex gap-0.5">
              <span
                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <span
                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <span
                className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </span>
          </div>
        ) : (
          <div className="text-sm text-gray-700 leading-relaxed">
            <MathRenderer text={message} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentMessage;
