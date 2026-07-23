/**
 * @file VisualizationRenderer - 可视化渲染分发器
 * @description 根据 visualization.type 分发到对应可视化组件
 */
import FunctionPlot from './FunctionPlot.jsx';
import CircuitDiagram from './CircuitDiagram.jsx';
import WaveformChart from './WaveformChart.jsx';
import StepByStep from './StepByStep.jsx';

const VisualizationRenderer = ({ visualization }) => {
    if (!visualization || !visualization.type) {
        return null;
    }

    const { type, data, title } = visualization;

    const renderContent = () => {
        switch (type) {
            case 'function-plot':
                return <FunctionPlot data={data} />;
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
