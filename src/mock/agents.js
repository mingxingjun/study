/**
 * Agent 配置文件
 * 定义三个AI学习助手的配置信息
 */

export const agents = [
  {
    id: 'quiz-master',
    name: '出题官',
    role: 'quizMaster',
    color: '#2c5282',
    avatarEmoji: '📝',
    description: '根据知识点生成题目，调整难度，给予答题反馈',
    status: 'idle',
    message: '准备好开始答题了吗？'
  },
  {
    id: 'explainer',
    name: '讲解师',
    role: 'explainer',
    color: '#276749',
    avatarEmoji: '📚',
    description: '错题详细解析，知识点串联，相似题推荐',
    status: 'idle',
    message: '有不会的题尽管问我！'
  },
  {
    id: 'supervisor',
    name: '督学员',
    role: 'supervisor',
    color: '#2d3748',
    avatarEmoji: '⏰',
    description: '制定计划，提醒复习，追踪进度，番茄钟管理',
    status: 'idle',
    message: '今天的学习计划准备好了！'
  }
];

export default agents;
