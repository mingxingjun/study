import { useNavigate } from 'react-router-dom';
import { Upload, BookOpen, BookX, Clock, ArrowUpRight } from 'lucide-react';
import Card from '../../components/ui/Card';

const actions = [
  {
    id: 'upload',
    title: '上传资料',
    description: '导入复习材料',
    icon: Upload,
    path: '/upload'
  },
  {
    id: 'quiz',
    title: '开始刷题',
    description: '开始今日练习',
    icon: BookOpen,
    path: '/quiz'
  },
  {
    id: 'wrong-book',
    title: '错题本',
    description: '复习错题',
    icon: BookX,
    path: '/wrong-book'
  },
  {
    id: 'supervise',
    title: '督学中心',
    description: '查看学习计划',
    icon: Clock,
    path: '/supervise'
  }
];

/**
 * 快捷入口 - 编辑式编号 + 衬线大字
 */
const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-5">
        <h2 className="text-xl font-serif text-primary" style={{ fontWeight: 500 }}>
          快捷入口
        </h2>
        <span className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em]">
          Quick Actions
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.id}
              hover
              className="p-5 relative group"
              onClick={() => navigate(action.path)}
            >
              <ArrowUpRight className="absolute top-4 right-4 w-3.5 h-3.5 text-gray-300 group-hover:text-accent-dark transition-colors duration-200" />

              {/* 大号衬线编号 */}
              <span
                className="font-serif text-2xl text-gray-200 group-hover:text-accent/40 tabular-nums block mb-3 transition-colors duration-200"
                style={{ fontWeight: 400, lineHeight: 1, letterSpacing: '-0.04em' }}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>

              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center mb-3 border border-gray-200/60 group-hover:bg-primary group-hover:border-primary transition-all duration-200">
                <Icon className="w-4 h-4 text-gray-600 group-hover:text-accent transition-colors duration-200" strokeWidth={2} />
              </div>

              <h3 className="text-sm font-medium text-primary mb-0.5">
                {action.title}
              </h3>
              <p className="text-[11px] text-gray-500">{action.description}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
