/**
 * @file StepByStep - 解题步骤分步组件
 * @description 分步骤展示解题过程，支持逐步浏览、展开全部、公式渲染与嵌套可视化
 *              设计系统：Refined Editorial Minimalism（黑白金极简）
 */
import { useState, Component } from 'react';
import MathRenderer from '../MathRenderer';
import VisualizationRenderer from './VisualizationRenderer';
import Button from '../ui/Button';

/**
 * 嵌套可视化错误边界
 * 捕获子树渲染异常，避免单个可视化失败导致整个组件崩溃
 */
class VisualizationErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error) {
        console.error('嵌套可视化渲染失败:', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/60 text-xs text-amber-700">
                    可视化渲染失败，请检查数据格式
                </div>
            );
        }
        return this.props.children;
    }
}

/**
 * 嵌套可视化容器：用错误边界包裹 VisualizationRenderer
 * @param {Object} props
 * @param {Object} props.visualization - 可视化配置对象
 * @returns {React.ReactElement}
 */
const NestedVisualization = ({ visualization }) => (
    <div className="mt-3">
        <VisualizationErrorBoundary>
            <VisualizationRenderer visualization={visualization} />
        </VisualizationErrorBoundary>
    </div>
);

/**
 * 将公式文本包裹为块级公式（若未包裹则补 $$...$$）
 * @param {string} formula - 原始公式文本
 * @returns {string} 带 $$ 定界的块级公式
 */
const wrapFormula = (formula) => {
    const trimmed = formula.trim();
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
        return trimmed;
    }
    return `$$${trimmed}$$`;
};

/**
 * 步骤编号圆点：金色圆形背景 + 衬线数字（Fraunces）
 * @param {Object} props
 * @param {number} props.number - 步骤序号
 * @returns {React.ReactElement}
 */
const StepNumberCircle = ({ number }) => (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-gold">
        <span className="font-serif text-white text-sm font-semibold leading-none">
            {number}
        </span>
    </div>
);

/**
 * 顶部进度条：显示当前步骤 / 总步骤数
 * @param {Object} props
 * @param {number} props.current - 当前步骤索引（0-based）
 * @param {number} props.total - 总步骤数
 * @returns {React.ReactElement}
 */
const ProgressHeader = ({ current, total }) => {
    const percentage = ((current + 1) / total) * 100;
    return (
        <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 tracking-widest uppercase">
                    解题步骤
                </span>
                <span className="text-xs numeric text-gray-700">
                    <span className="text-primary font-medium">{current + 1}</span>
                    <span className="text-gray-400 mx-0.5">/</span>
                    <span>{total}</span>
                </span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-accent rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

/**
 * 步骤时间线圆点链
 * 已完成=金色，当前=黑色（放大），未到=灰色；点击可跳转到对应步骤
 * @param {Object} props
 * @param {number} props.total - 总步骤数
 * @param {number} props.current - 当前步骤索引
 * @param {Function} props.onJump - 跳转回调，接收目标索引
 * @returns {React.ReactElement}
 */
const TimelineDots = ({ total, current, onJump }) => (
    <div className="flex items-center mb-6">
        {Array.from({ length: total }, (_, i) => {
            const isCompleted = i < current;
            const isCurrent = i === current;
            const dotClass = isCompleted
                ? 'bg-accent'
                : isCurrent
                    ? 'bg-primary'
                    : 'bg-gray-300 hover:bg-gray-400';
            return (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                    <button
                        type="button"
                        onClick={() => onJump(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 flex-shrink-0 ${dotClass} ${isCurrent ? 'scale-150' : 'hover:scale-125'}`}
                        aria-label={`跳转到步骤 ${i + 1}`}
                    />
                    {i < total - 1 && (
                        <div className={`flex-1 h-px mx-2 transition-colors duration-300 ${i < current ? 'bg-accent' : 'bg-gray-200'}`} />
                    )}
                </div>
            );
        })}
    </div>
);

/**
 * 单个步骤卡片
 * 包含：编号圆点、标题、文字说明、公式（带编号）、嵌套可视化
 * @param {Object} props
 * @param {Object} props.step - 步骤数据
 * @param {number} props.index - 步骤索引（0-based，显示为 index+1）
 * @param {boolean} props.animate - 是否启用入场动画（展开全部时使用 stagger）
 * @returns {React.ReactElement}
 */
const StepCard = ({ step, index, animate = false }) => {
    const animationStyle = animate
        ? { animation: `fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08}s both` }
        : undefined;

    return (
        <div
            className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm"
            style={animationStyle}
        >
            {/* 移动端：编号与内容垂直排列；桌面端：编号在左，内容在右 */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                <StepNumberCircle number={index + 1} />
                <div className="flex-1 min-w-0">
                    {step.title && (
                        <h4 className="text-base font-semibold text-primary mb-2 font-serif leading-snug">
                            {step.title}
                        </h4>
                    )}
                    {step.content && (
                        <div className="text-sm text-gray-600 leading-relaxed mb-3">
                            <MathRenderer text={step.content} />
                        </div>
                    )}
                    {step.formula && (
                        <div className="bg-gray-50 rounded-lg px-3 sm:px-4 py-3 my-3 border border-gray-100">
                            <MathRenderer
                                text={wrapFormula(step.formula)}
                                enableNumbering
                            />
                        </div>
                    )}
                    {step.visualization && (
                        <NestedVisualization visualization={step.visualization} />
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * 底部控制按钮组
 * 逐步模式：上一步 / 展开全部 / 下一步（最后一步为"完成"）
 * 展开模式：仅显示"收起"
 * @param {Object} props
 * @param {number} props.current - 当前步骤索引
 * @param {number} props.total - 总步骤数
 * @param {boolean} props.isExpanded - 是否展开全部
 * @param {Function} props.onPrev - 上一步回调
 * @param {Function} props.onNext - 下一步/完成回调
 * @param {Function} props.onToggleExpand - 切换展开/收起
 * @returns {React.ReactElement}
 */
const StepControls = ({ current, total, isExpanded, onPrev, onNext, onToggleExpand }) => {
    if (isExpanded) {
        return (
            <div className="flex justify-center mt-6">
                <Button variant="ghost" size="sm" onClick={onToggleExpand}>
                    收起
                </Button>
            </div>
        );
    }
    const isLast = current === total - 1;
    return (
        <div className="flex items-center justify-between gap-3 mt-6">
            <Button
                variant="secondary"
                size="sm"
                onClick={onPrev}
                disabled={current === 0}
            >
                上一步
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggleExpand}>
                展开全部
            </Button>
            <Button variant="primary" size="sm" onClick={onNext}>
                {isLast ? '完成' : '下一步'}
            </Button>
        </div>
    );
};

/**
 * 空状态提示
 * @returns {React.ReactElement}
 */
const EmptyState = () => (
    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200/60 text-sm text-gray-500 text-center">
        暂无解题步骤数据
    </div>
);

/**
 * 步骤主体内容：展开时列表展示（stagger 淡入），否则仅显示当前步（从下方淡入）
 * @param {Object} props
 * @param {Array} props.steps - 步骤数组
 * @param {number} props.current - 当前步骤索引
 * @param {boolean} props.isExpanded - 是否展开全部
 * @returns {React.ReactElement}
 */
const StepContent = ({ steps, current, isExpanded }) => {
    if (isExpanded) {
        return (
            <div className="space-y-4">
                {steps.map((step, index) => (
                    <StepCard key={index} step={step} index={index} animate />
                ))}
            </div>
        );
    }
    // key 随 currentStep 变化，触发 React 重新挂载以重放入场动画
    return (
        <div
            key={current}
            style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        >
            <StepCard step={steps[current]} index={current} />
        </div>
    );
};

/**
 * StepByStep 解题步骤分步组件
 * 支持：逐步浏览、展开全部、公式渲染、嵌套可视化、进度指示、平滑过渡动画
 * @param {Object} props
 * @param {Object} props.data - 步骤数据，含 steps 数组
 * @returns {React.ReactElement}
 */
const StepByStep = ({ data }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    // 空数据兜底：无 data 或 steps 为空时显示提示
    if (!data || !Array.isArray(data.steps) || data.steps.length === 0) {
        return <EmptyState />;
    }

    const total = data.steps.length;
    const safeCurrent = Math.min(currentStep, total - 1);

    /** 上一步：仅在非首步时回退 */
    const handlePrev = () => {
        if (safeCurrent > 0) setCurrentStep(safeCurrent - 1);
    };

    /** 下一步：未到最后一步则前进，最后一步点击"完成"则展开全部以便回顾 */
    const handleNext = () => {
        if (safeCurrent < total - 1) {
            setCurrentStep(safeCurrent + 1);
        } else {
            setIsExpanded(true);
        }
    };

    const handleJump = (index) => setCurrentStep(index);
    const handleToggleExpand = () => setIsExpanded((prev) => !prev);

    return (
        <div className="w-full">
            <ProgressHeader current={safeCurrent} total={total} />
            {!isExpanded && (
                <TimelineDots total={total} current={safeCurrent} onJump={handleJump} />
            )}
            <StepContent
                steps={data.steps}
                current={safeCurrent}
                isExpanded={isExpanded}
            />
            <StepControls
                current={safeCurrent}
                total={total}
                isExpanded={isExpanded}
                onPrev={handlePrev}
                onNext={handleNext}
                onToggleExpand={handleToggleExpand}
            />
        </div>
    );
};

export default StepByStep;
