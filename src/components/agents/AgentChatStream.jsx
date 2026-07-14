import { useRef, useEffect, useMemo } from 'react';
import AgentMessage from './AgentMessage';

/**
 * Agent 消息流组件
 * 扁平卡片，清晰的消息分隔；消息更新时自动滚动到底部
 */
const AgentChatStream = ({ agents }) => {
  const scrollRef = useRef(null);

  const { uniqueMessages, thinkingAgents } = useMemo(() => {
    const allMessages = [];
    const thinking = [];

    agents.forEach(agent => {
      if (agent.history && agent.history.length > 0) {
        agent.history.forEach(msg => {
          allMessages.push({
            ...msg,
            agent
          });
        });
      } else if (agent.message && agent.status !== 'idle') {
        allMessages.push({
          id: `current-${agent.id}`,
          content: agent.message,
          isTyping: agent.status === 'thinking',
          agent
        });
      }

      if (agent.status === 'thinking') {
        thinking.push(agent);
      }
    });

    allMessages.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return aTime - bTime;
    });

    const seen = new Set();
    const unique = allMessages.filter(msg => {
      if (seen.has(msg.id)) return false;
      seen.add(msg.id);
      return true;
    });

    return { uniqueMessages: unique, thinkingAgents: thinking };
  }, [agents]);

  // 消息更新时自动滚动到最底部
  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [uniqueMessages]);

  if (uniqueMessages.length === 0 && thinkingAgents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
      <h3 className="text-sm font-semibold text-gray-700 mb-5">AI 助手消息</h3>
      <div ref={scrollRef} className="space-y-4 max-h-80 overflow-y-auto">
        {uniqueMessages.map((msg, index) => (
          <AgentMessage
            key={msg.id || index}
            agent={msg.agent}
            message={msg.content}
            isTyping={msg.isTyping}
          />
        ))}
        {thinkingAgents.map(agent => (
          <AgentMessage
            key={`thinking-${agent.id}`}
            agent={agent}
            isTyping
          />
        ))}
      </div>
    </div>
  );
};

export default AgentChatStream;
