import { useNavigate } from 'react-router-dom';
import {
  Upload, Sparkles, BookOpen, BookX, Clock, Settings, ArrowRight,
  ShieldCheck, KeyRound, RefreshCw, Database, BookMarked, LayoutDashboard
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import SectionTitle from '../../components/ui/SectionTitle';
import usePageTitle from '../../hooks/usePageTitle';
import { useStudyContext } from '../../context/StudyContext';

const STEPS = [
  {
    index: '01',
    title: '上传资料',
    description: '支持 PDF / Word / TXT，把你的教材、笔记、讲义拖进来。',
    icon: Upload
  },
  {
    index: '02',
    title: 'AI 解析入库',
    description: '自动提取知识点与题目，解析结果可以逐条校对、修改后再入库。',
    icon: Sparkles
  },
  {
    index: '03',
    title: '开始刷题',
    description: '顺序、随机、按题型三种模式；AI 会批改、讲解、追问薄弱点。',
    icon: BookOpen
  },
  {
    index: '04',
    title: '错题与督学',
    description: '错题按遗忘曲线安排复习，番茄钟和打卡把节奏固定下来。',
    icon: BookX
  }
];

const FEATURES = [
  {
    title: '仪表盘',
    description: '掌握度、今日任务、薄弱知识点，一页看清复习进度。',
    icon: LayoutDashboard
  },
  {
    title: '上传解析',
    description: '教材 / 笔记转成专属题库，图片与公式也能识别。',
    icon: Upload
  },
  {
    title: '刷题',
    description: '单选、多选、判断、填空、简答、计算，AI 逐题讲解。',
    icon: BookOpen
  },
  {
    title: '题库管理',
    description: '按文档分库，搜索、编辑、手动添加，或让 AI 按知识点出题。',
    icon: BookMarked
  },
  {
    title: '错题本',
    description: '自动收录错题，按 1 / 2 / 4 / 7 天的节奏提醒复习。',
    icon: BookX
  },
  {
    title: '督学中心',
    description: '番茄钟、每日打卡、学习热力图，把专注变成习惯。',
    icon: Clock
  }
];

const SHOTS = [
  { src: '/guide/dashboard.png', title: '仪表盘', desc: '掌握度、今日任务与薄弱知识点' },
  { src: '/guide/upload.png', title: '上传解析', desc: '文档上传、考试日期与复习计划' },
  { src: '/guide/quiz.png', title: '刷题', desc: '选项、批改与 AI 讲解' },
  { src: '/guide/supervise.png', title: '督学中心', desc: '番茄钟、打卡与学习趋势' }
];

const FAQ = [
  {
    q: '我的数据存在哪里？',
    a: '全部保存在当前浏览器的 localStorage 和 IndexedDB 里，不上传服务器；换浏览器或清空站点数据后不会自动同步。'
  },
  {
    q: 'API Key 安全吗？',
    a: 'Key 只存在本机浏览器，请求由浏览器直接发往你选择的服务商，不经过任何中间服务器。请勿在公用电脑上保存 Key。'
  },
  {
    q: '模型列表会过时吗？',
    a: '设置页会从服务商的 /models 接口自动同步最新模型 ID，缓存 24 小时；也可以手动点「同步」强制刷新。不支持跨域的服务商会自动回退内置列表。'
  },
  {
    q: '怎么从示例数据回到自己的资料？',
    a: '在设置页填写并保存 AI 配置后会自动启用真实 AI，示例数据会被清空；也可以在本页点「进入正式工作台」。'
  },
  {
    q: '手机上能用吗？',
    a: '可以。侧栏会收起成顶部菜单，页面按 390px 宽度适配，刷题、错题、督学都能正常使用。'
  }
];

const Manual = () => {
  usePageTitle('使用手册');
  const navigate = useNavigate();
  const { state, loadDemoData, setMode } = useStudyContext();

  const aiReady = ['quiz-master', 'explainer', 'supervisor'].some((agentId) => {
    const config = state.aiConfig?.[agentId];
    return Boolean(config?.providerId && config?.modelId && config?.apiKey);
  });

  const handleLoadDemo = () => {
    loadDemoData();
    navigate('/');
  };

  const handleFormal = () => {
    setMode('formal');
    navigate('/');
  };

  return (
    <div className="page-fade-in max-w-5xl mx-auto">
      {/* 标题 */}
      <div className="mb-10">
        <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-gray-400">
          <span className="h-1.5 w-1.5 bg-accent" />
          Guide · 使用手册
        </p>
        <h1 className="mb-3 text-primary">
          从折角处，开始<span className="text-accent">.</span>
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-gray-500">
          三分钟了解折角怎么用；也可以直接载入示例数据，看看它如何陪你复习。
        </p>
      </div>

      {/* 行动区 */}
      <Card className="stripe-panel relative mb-12 overflow-hidden p-6 sm:p-8" elevated>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent-dark">
              <span className="h-1.5 w-1.5 bg-accent" />
              Try it first
            </p>
            <h2 className="mb-3 font-serif text-2xl text-primary">先看看效果，再决定怎么开始</h2>
            <p className="text-sm leading-relaxed text-gray-500">
              示例数据只存在本机，包含完整题库、错题和督学记录；随时可以清空，换上自己的资料。
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-3">
            <Button size="lg" onClick={handleLoadDemo}>
              载入示例数据
              <ArrowRight className="h-4 w-4" />
            </Button>
            {aiReady ? (
              <Button variant="secondary" size="lg" onClick={handleFormal}>
                进入正式工作台
              </Button>
            ) : (
              <Button variant="secondary" size="lg" onClick={() => navigate('/settings')}>
                去配置 AI
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 快速开始 */}
      <section className="mb-12">
        <SectionTitle title="三分钟上手" subtitle="Quick Start" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.index} className="card-hover p-6" elevated>
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center border-2 border-accent/25 bg-accent/10">
                    <Icon className="h-4 w-4 text-accent-dark" strokeWidth={2} />
                  </span>
                  <span className="font-serif text-3xl leading-none text-gray-200">{step.index}</span>
                </div>
                <h3 className="mb-2 font-serif text-lg text-primary">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{step.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 功能地图 */}
      <section className="mb-12">
        <SectionTitle title="功能地图" subtitle="Features" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="p-5" elevated>
                <div className="mb-3 flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-accent-dark" strokeWidth={2} />
                  <h3 className="font-serif text-base text-primary">{feature.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-gray-500">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 效果展示 */}
      <section className="mb-12">
        <SectionTitle title="效果展示" subtitle="Screens" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {SHOTS.map((shot) => (
            <figure key={shot.src} className="border-2 border-primary bg-white shadow-md">
              <img
                src={shot.src}
                alt={`${shot.title}界面预览`}
                width={1440}
                height={900}
                loading="lazy"
                className="block w-full border-b-2 border-primary"
              />
              <figcaption className="flex items-baseline justify-between gap-3 px-4 py-3">
                <span className="font-serif text-sm text-primary">{shot.title}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">
                  {shot.desc}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 设置与数据 */}
      <section className="mb-12">
        <SectionTitle title="设置与数据" subtitle="Settings & Data" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="p-5" elevated>
            <KeyRound className="mb-3 h-4 w-4 text-accent-dark" strokeWidth={2} />
            <h3 className="mb-2 font-serif text-base text-primary">API Key 只存本地</h3>
            <p className="text-sm leading-relaxed text-gray-500">
              浏览器直接请求服务商，不经过中间服务器；敏感信息仅保存在当前浏览器。
            </p>
          </Card>
          <Card className="p-5" elevated>
            <RefreshCw className="mb-3 h-4 w-4 text-accent-dark" strokeWidth={2} />
            <h3 className="mb-2 font-serif text-base text-primary">模型目录自动同步</h3>
            <p className="text-sm leading-relaxed text-gray-500">
              从服务商拉取最新模型 ID，缓存 24h，也可在设置里手动刷新；失败自动回退内置列表。
            </p>
          </Card>
          <Card className="p-5" elevated>
            <Database className="mb-3 h-4 w-4 text-accent-dark" strokeWidth={2} />
            <h3 className="mb-2 font-serif text-base text-primary">数据在本机</h3>
            <p className="text-sm leading-relaxed text-gray-500">
              工作区、题库、错题、打卡都存在浏览器里；换设备不会自动同步，请自行备份。
            </p>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <SectionTitle title="常见问题" subtitle="FAQ" />
        <div className="divide-y-2 divide-primary/10 border-y-2 border-primary bg-white">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-sm text-primary">
                {item.q}
                <span className="faq-plus font-mono text-gray-400">+</span>
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-500">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 底部 CTA */}
      <Card className="relative overflow-hidden p-6 sm:p-8" elevated>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-dark" strokeWidth={1.8} />
            <p className="max-w-xl text-sm leading-relaxed text-gray-600">
              所有内容都保存在本机浏览器；示例数据随时可以清空。准备好了，就上传第一份资料吧。
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-3">
            <Button onClick={() => navigate('/upload')}>
              <Upload className="h-4 w-4" />
              上传资料
            </Button>
            <Button variant="secondary" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4" />
              配置 AI
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Manual;
