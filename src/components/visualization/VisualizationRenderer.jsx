/**
 * @file VisualizationRenderer - 可视化渲染分发器
 * @description 根据 visualization.type 分发到对应可视化组件
 */
import { lazy, Suspense } from 'react';
import CircuitDiagram from './CircuitDiagram.jsx';
import WaveformChart from './WaveformChart.jsx';
import StepByStep from './StepByStep.jsx';

// jsxgraph 体积很大（压缩后仍近 1MB），只有函数图像用到，
// 改为按需加载：常规错题详情不会被它拖慢。
const FunctionPlot = lazy(() => import('./FunctionPlot.jsx'));

const PlotFallback = () => (
    <div className="flex h-[220px] items-center justify-center border-2 border-primary/15 bg-white">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">Loading plot…</span>
    </div>
);

const VisualizationRenderer = ({ visualization }) => {
    if (!visualization || !visualization.type) {
        return null;
    }

    const { type, data, title } = visualization;

    const renderContent = () => {
        switch (type) {
            case 'function-plot':
                return (
                    <Suspense fallback={<PlotFallback />}>
                        <FunctionPlot data={data} />
                    </Suspense>
                );
            case 'circuit':
                return <CircuitDiagram data={data} />;
            case 'waveform':
                return <WaveformChart data={data} />;
            case 'steps':
                return <StepByStep data={data} />;
            default:
                return (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/60 text-sm text-amber-700">
                        不支持的可视化类型：{type}
                    </div>
                );
        }
    };

    return (
        <div className="my-3">
            {title && (
                <p className="text-sm font-medium text-primary mb-2 font-serif">{title}</p>
            )}
            {renderContent()}
        </div>
    );
};

export default VisualizationRenderer;
