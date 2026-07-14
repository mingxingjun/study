import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AgentAvatar from './AgentAvatar';
import AgentMessage from './AgentMessage';
import Card from '../ui/Card';

/**
 * Agent 面板组件
 * 三列网格，扁平卡片，清晰的状态标签
 */
const AgentsPanel = ({ agents, className = '', compact = false }) => {
  const [expandedId, setExpandedId] = useState(null);

  const getStatusText = (status) => {
    switch (status) {
      case 'thinking':
        return '思考中';
      case 'working':
        return '工作中';
      case 'speaking':
        return '正在发言';
      case 'idle':
      default:
        return '待命';
    }
  };

  const toggleExpand = (agentId) => {
    setExpandedId(expandedId === agentId ? null : agentId);
  };

  return (
    <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-5 ${className}`}>
      {agents.map((agent, index) => {
        const isExpanded = expandedId === agent.id;
        const staggerClass = `stagger-${Math.min(index + 1, 5)}`;
        const history = agent.history || [];
        const latestMessage = history.length > 0
          ? history[history.length - 1]
          : { content: agent.message, isTyping: agent.status === 'thinking' };

        return (
          <Card
            key={agent.id}
            hover
            className={`p-5 cursor-pointer ${staggerClass}`}
            onClick={() => toggleExpand(agent.id)}
          >
            <div className="flex items-start gap-3">
              <AgentAvatar agent={agent} size="md" className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-primary whitespace-nowrap">{agent.name}</h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                    style={{
                      backgroundColor: `${agent.color}15`,
                      color: agent.color
                    }}
                  >
                    {getStatusText(agent.status)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{agent.description}</p>

                {!isExpanded && (
                  <p className="text-sm text-gray-700 mt-3 line-clamp-2 leading-relaxed">
                    {latestMessage.isTyping ? (
                      <span className="text-gray-400">正在输入...</span>
                    ) : (
                      latestMessage.content
                    )}
                  </p>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500">对话历史</span>
                  <ChevronUp size={16} className="text-gray-400" />
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {history.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">暂无对话记录</p>
                  ) : (
                    history.map((msg, idx) => (
                      <AgentMessage
                        key={msg.id || idx}
                        agent={agent}
                        message={msg.content}
                        isTyping={msg.isTyping}
                      />
                    ))
                  )}
                </div>
              </div>
            )}

            {!isExpanded && (
              <div className="mt-3 flex justify-center">
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default AgentsPanel;
