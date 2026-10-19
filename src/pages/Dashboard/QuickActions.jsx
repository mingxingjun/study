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
      <div className="mb-5 flex items-center gap-3">
        <span className="h-2.5 w-2.5 shrink-0 bg-accent" />
        <h2 className="font-serif text-[22px] leading-none text-primary">快捷入口</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-400">
          Quick Actions
        </span>
        <span className="ml-2 h-px flex-1 bg-primary/15" />
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
              <ArrowUpRight className="absolute right-4 top-4 h-3.5 w-3.5 text-gray-300 transition-all duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />

              {/* 大号展示编号 */}
              <span className="mb-3 block font-serif text-2xl tabular-nums text-gray-200 transition-colors duration-150 group-hover:text-accent">
                {String(idx + 1).padStart(2, '0')}
              </span>

              <div className="mb-3 flex h-9 w-9 items-center justify-center border border-primary/15 bg-gray-50 transition-colors duration-150 group-hover:border-primary group-hover:bg-accent">
                <Icon className="h-4 w-4 text-gray-600 transition-colors duration-150 group-hover:text-black" strokeWidth={2} />
              </div>

              <h3 className="mb-0.5 text-sm font-semibold text-primary">
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
