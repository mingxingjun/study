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
 * 快捷操作组件
 */
const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 px-1">
        <h2 className="text-lg font-semibold text-primary">快捷入口</h2>
        <span className="font-mono text-xs text-gray-400">Quick Actions</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.id}
              hover
              className="p-6 relative group"
              onClick={() => navigate(action.path)}
            >
              <ArrowUpRight className="absolute top-4 right-4 w-4 h-4 text-gray-300 group-hover:text-secondary transition-colors duration-150" />

              <span className="font-mono text-[10px] text-gray-400 tracking-wider mb-3 block">
                {String(idx + 1).padStart(2, '0')}
              </span>

              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3 border border-gray-200 group-hover:bg-primary transition-colors duration-150">
                <Icon className="w-5 h-5 text-secondary group-hover:text-white transition-colors duration-150" />
              </div>

              <h3 className="text-sm font-semibold text-primary mb-0.5">
                {action.title}
              </h3>
              <p className="text-xs text-gray-500">{action.description}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
