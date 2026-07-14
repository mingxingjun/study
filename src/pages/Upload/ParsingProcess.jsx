import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import ProgressBar from '../../components/ui/ProgressBar';
import AgentMessage from '../../components/agents/AgentMessage';

/** 文档解析各 Agent 协作阶段 */
const PARSE_STAGES = [
  { label: '文档解析中…' },
  { label: '知识点提炼中…' },
  { label: '题目生成中…' },
  { label: '难度评估中…' }
];

/**
 * 根据进度和完成状态推断当前活跃阶段
 * @param {number} progress - 解析进度 0-100
 * @param {boolean} isComplete - 是否已完成
 * @returns {number} 当前阶段索引，-1 表示未开始
 */
const getActiveStage = (progress, isComplete) => {
  if (isComplete) return PARSE_STAGES.length;
  if (progress <= 0) return -1;
  if (progress < 25) return 0;
  if (progress < 50) return 1;
  if (progress < 80) return 2;
  return 3;
};

const ParsingProcess = ({
  agents,
  progress,
  parseResult,
  isComplete
}) => {
  const [visibleMessages, setVisibleMessages] = useState([]);

  useEffect(() => {
    const allMessages = [];
    agents.forEach(agent => {
      agent.history.forEach(msg => {
        allMessages.push({
          ...msg,
          agent
        });
      });
    });
    setVisibleMessages(allMessages);
  }, [agents]);

  const activeStage = useMemo(
    () => getActiveStage(progress, isComplete),
    [progress, isComplete]
  );

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/60">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-mono font-medium text-primary">解析进度</h3>
          <span className="text-sm font-mono font-medium text-gray-700 tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>
        <ProgressBar value={progress} size="lg" />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-200">
        <h3 className="text-sm font-mono font-medium text-primary mb-4">Agent 协作阶段</h3>
        <div className="space-y-3">
          {PARSE_STAGES.map((stage, idx) => {
            const done = isComplete || idx < activeStage;
            const active = idx === activeStage && !isComplete;

            return (
              <div key={stage.label} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors duration-150 ${
                    done
                      ? 'bg-primary text-white'
                      : active
                        ? 'bg-accent text-primary'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 size={14} />
                  ) : active ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-sm transition-colors duration-150 ${
                    active ? 'text-primary font-medium' : done ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {visibleMessages.map((msg) => (
          <AgentMessage
            key={msg.id}
            agent={msg.agent}
            message={msg.content}
            className="animate-fadeIn"
          />
        ))}

        {agents.some(a => a.status === 'thinking') && (
          <div className="flex items-start gap-3">
            {agents.filter(a => a.status === 'thinking').map(agent => (
              <AgentMessage
                key={`thinking-${agent.id}`}
                agent={agent}
                isTyping
              />
            ))}
          </div>
        )}
      </div>

      {isComplete && parseResult && (
        <div className="bg-primary rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={20} className="text-gray-50" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-mono font-medium text-gray-50">解析完成</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                解析到
                <span className="font-mono text-gray-100 mx-1">{parseResult.totalCount}</span>
                题 / 成功入库
                <span className="font-mono text-gray-100 mx-1">{parseResult.successCount}</span>
                题
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParsingProcess;
