import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import ProgressBar from '../../components/ui/ProgressBar';
import AgentMessage from '../../components/agents/AgentMessage';

/** 文档解析各 Agent 协作阶段 */
const PARSE_STAGES = [
  { label: '文档解析中…', english: 'Parsing' },
  { label: '知识点提炼中…', english: 'Extracting' },
  { label: '题目生成中…', english: 'Generating' },
  { label: '难度评估中…', english: 'Evaluating' }
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
      {/* 解析进度 - 衬线标题 + mono 百分比 */}
      <div className="bg-gray-50/60 rounded-xl p-5 border border-gray-200/80">
        <div className="flex items-baseline justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-serif text-primary" style={{ fontWeight: 500 }}>解析进度</h3>
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Progress</span>
          </div>
          <span className="font-serif text-2xl text-primary tabular-nums" style={{ fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {Math.round(progress)}<span className="text-sm text-gray-400">%</span>
          </span>
        </div>
        <ProgressBar value={progress} size="md" />
      </div>

      {/* Agent 协作阶段 - 编号 + 衬线 */}
      <div className="bg-white rounded-xl p-5 border border-gray-200/80">
        <div className="flex items-baseline gap-2 mb-4">
          <h3 className="text-sm font-serif text-primary" style={{ fontWeight: 500 }}>Agent 协作阶段</h3>
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Pipeline</span>
        </div>
        <div className="space-y-3">
          {PARSE_STAGES.map((stage, idx) => {
            const done = isComplete || idx < activeStage;
            const active = idx === activeStage && !isComplete;

            return (
              <div key={stage.label} className="flex items-center gap-4">
                {/* 大号衬线编号 / 完成标记 */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-serif text-sm transition-colors duration-300 ${
                    done
                      ? 'bg-primary text-accent-light shadow-sm'
                      : active
                        ? 'bg-accent text-primary shadow-gold'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                  style={{ fontWeight: 400, letterSpacing: '-0.02em' }}
                >
                  {done ? (
                    <CheckCircle2 size={14} strokeWidth={2.2} />
                  ) : active ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    String(idx + 1).padStart(2, '0')
                  )}
                </div>
                <div className="flex-1 flex items-baseline justify-between">
                  <span
                    className={`text-sm transition-colors duration-300 font-serif ${active ? 'text-primary' : done ? 'text-gray-700' : 'text-gray-400'}`}
                    style={{ fontWeight: 500 }}
                  >
                    {stage.label}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider transition-colors duration-300 ${active ? 'text-accent-dark' : 'text-gray-300'}`}
                  >
                    {stage.english}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent 消息流 */}
      <div className="space-y-4">
        {visibleMessages.map((msg) => (
          <AgentMessage
            key={msg.id}
            agent={msg.agent}
            message={msg.content}
            className="animate-fade-in"
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

      {/* 完成卡片 - 金色强调 */}
      {isComplete && parseResult && (
        <div className="bg-primary rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-gold">
              <CheckCircle2 size={22} className="text-primary" strokeWidth={2.2} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-accent mb-1">
                Complete
              </p>
              <h3 className="text-base font-serif text-accent-light mb-1" style={{ fontWeight: 500 }}>解析完成</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                解析到
                <span className="font-serif text-2xl text-accent-light mx-2 tabular-nums" style={{ fontWeight: 400, letterSpacing: '-0.04em' }}>
                  {parseResult.totalCount}
                </span>
                题 / 成功入库
                <span className="font-serif text-2xl text-accent-light mx-2 tabular-nums" style={{ fontWeight: 400, letterSpacing: '-0.04em' }}>
                  {parseResult.successCount}
                </span>
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
