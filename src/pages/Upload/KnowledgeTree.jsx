import { useState } from 'react';
import { ChevronRight, ChevronDown, BookOpen } from 'lucide-react';

const KnowledgeTree = ({ knowledgePoints }) => {
  const [expandedIds, setExpandedIds] = useState(new Set(knowledgePoints.map(kp => kp.id)));

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getDifficultyStyle = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-gray-100 text-gray-600';
      case 'medium': return 'bg-gray-200 text-gray-700';
      case 'hard': return 'bg-primary text-gray-50';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '未知';
    }
  };

  const getWeightStars = (estimatedTime) => {
    if (estimatedTime >= 180) return 3;
    if (estimatedTime >= 150) return 2;
    return 1;
  };

  const Star = ({ filled }) => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      className={filled ? 'text-gray-900' : 'text-gray-300'}
      fill="currentColor"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );

  return (
    <div className="space-y-2">
      {knowledgePoints.map((kp) => {
        const isExpanded = expandedIds.has(kp.id);
        const stars = getWeightStars(kp.estimatedTime);
        const prerequisites = kp.prerequisites || [];
        const prerequisiteNames = prerequisites.map(
          preId => knowledgePoints.find(k => k.id === preId)?.name
        ).filter(Boolean);

        return (
          <div
            key={kp.id}
            className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200/60 card-hover"
          >
            <button
              onClick={() => toggleExpand(kp.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-100/70 transition-colors cursor-pointer"
            >
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-500" />
                ) : (
                  <ChevronRight size={16} className="text-gray-500" />
                )}
              </div>
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200/60">
                <BookOpen size={17} className="text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-sm font-mono font-medium text-primary truncate">{kp.name}</h4>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${getDifficultyStyle(kp.difficulty)}`}>
                    {getDifficultyLabel(kp.difficulty)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map(i => (
                      <Star key={i} filled={i <= stars} />
                    ))}
                  </div>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-500 font-mono">{kp.estimatedTime} min</span>
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="ml-[68px] mr-4 mb-4 pl-4 border-l-2 border-gray-200">
                <p className="text-sm text-gray-600 leading-relaxed py-2">
                  {kp.description}
                </p>
                {prerequisiteNames.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <span className="text-xs text-gray-500">前置知识</span>
                    {prerequisiteNames.map((name, idx) => (
                      <span key={idx} className="text-xs bg-white px-2.5 py-1 rounded-lg text-gray-700 border border-gray-200/60">
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default KnowledgeTree;
