/**
 * @file WaveformChart - 信号波形组件
 * @description 基于 SVG 渲染电气工程信号波形，支持正弦、方波、三角、锯齿、冲激串的叠加显示
 *              设计系统：Refined Editorial Minimalism（黑白金极简）
 */
import { useMemo } from 'react';

// ===== 设计系统色板 =====
const COLORS = {
    PRIMARY: '#171717',
    GRID: '#e5e5e5',
    AXIS_LABEL: '#666'
};

// ===== 画布与布局常量 =====
const VIEW_WIDTH = 800;
const CHART_HEIGHT = 300;
const PADDING = { top: 16, right: 20, bottom: 52, left: 56 };

// ===== 默认配置 =====
const DEFAULT_DURATION = 0.01;
const DEFAULT_SAMPLES = 500;
const AMP_MARGIN_RATIO = 1.2;

// ===== 波形生成函数 =====

/**
 * 生成正弦波数据点
 * 公式：y = A * sin(2πft)
 * @param {number} frequency - 频率（Hz）
 * @param {number} amplitude - 振幅
 * @param {number} duration - 显示时长（s）
 * @param {number} samples - 采样点数
 * @returns {Array<{x:number,y:number}>} 点数组
 */
function generateSine(frequency, amplitude, duration, samples) {
    const points = [];
    const step = duration / samples;
    for (let i = 0; i <= samples; i++) {
        const t = i * step;
        const y = amplitude * Math.sin(2 * Math.PI * frequency * t);
        points.push({ x: t, y });
    }
    return points;
}

/**
 * 生成方波数据点
 * 公式：y = A * sign(sin(2πft))
 */
function generateSquare(frequency, amplitude, duration, samples) {
    const points = [];
    const step = duration / samples;
    for (let i = 0; i <= samples; i++) {
        const t = i * step;
        const y = amplitude * Math.sign(Math.sin(2 * Math.PI * frequency * t));
        points.push({ x: t, y });
    }
    return points;
}

/**
 * 生成三角波数据点
 * 公式：y = A * (2/π) * asin(sin(2πft))
 */
function generateTriangle(frequency, amplitude, duration, samples) {
    const points = [];
    const step = duration / samples;
    for (let i = 0; i <= samples; i++) {
        const t = i * step;
        const y = amplitude * (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t));
        points.push({ x: t, y });
    }
    return points;
}

/**
 * 生成锯齿波数据点
 * 公式：y = A * 2 * (ft - floor(ft + 0.5))
 */
function generateSawtooth(frequency, amplitude, duration, samples) {
    const points = [];
    const step = duration / samples;
    for (let i = 0; i <= samples; i++) {
        const t = i * step;
        const y = amplitude * 2 * ((frequency * t) - Math.floor(frequency * t + 0.5));
        points.push({ x: t, y });
    }
    return points;
}

/**
 * 生成冲激串数据点
 * 在 t = n/frequency 处产生 amplitude 冲激，其余为 0
 * 采用三点法（上升沿-顶点-下降沿）保证可视化效果
 */
function generateImpulse(frequency, amplitude, duration, samples) {
    const points = [];
    const step = duration / samples;
    const halfWidth = step / 2;
    const impulseCount = Math.floor(frequency * duration) + 1;
    for (let n = 0; n <= impulseCount; n++) {
        const t = n / frequency;
        if (t > duration) break;
        // 上升沿、顶点、下降沿构成一个冲激尖峰
        points.push({ x: Math.max(0, t - halfWidth), y: 0 });
        points.push({ x: t, y: amplitude });
        points.push({ x: Math.min(duration, t + halfWidth), y: 0 });
    }
    return points;
}

// 波形类型 -> 生成器映射表
const WAVE_GENERATORS = {
    sine: generateSine,
    square: generateSquare,
    triangle: generateTriangle,
    sawtooth: generateSawtooth,
    impulse: generateImpulse
};

// ===== 格式化辅助函数 =====

/**
 * 格式化时间刻度（自动选择 s/ms/µs 单位）
 */
function formatTime(t) {
    if (t >= 1) return t.toFixed(2) + ' s';
    if (t >= 0.001) return (t * 1000).toFixed(1) + ' ms';
    return (t * 1000000).toFixed(0) + ' µs';
}

/**
 * 格式化幅度刻度
 */
function formatAmp(a) {
    return a.toFixed(1);
}

/**
 * 将点数组转换为 SVG polyline points 字符串
 */
function toPolylinePoints(points, toSvgX, toSvgY) {
    return points
        .map((p) => `${toSvgX(p.x).toFixed(2)},${toSvgY(p.y).toFixed(2)}`)
        .join(' ');
}

// ===== 数据处理 =====

/**
 * 处理原始 data，生成可渲染的波形数据及坐标范围
 * @param {Object} data - 原始数据 { waves, duration, samples }
 * @returns {Object|null} 渲染数据 { renderedWaves, duration, maxAmp }，空数据返回 null
 */
function buildChartData(data) {
    if (!data || !Array.isArray(data.waves) || data.waves.length === 0) {
        return null;
    }
    const duration = data.duration ?? DEFAULT_DURATION;
    const samples = data.samples ?? DEFAULT_SAMPLES;
    const renderedWaves = [];
    for (const wave of data.waves) {
        const generator = WAVE_GENERATORS[wave.type];
        if (!generator) {
            console.warn(`WaveformChart: 未知波形类型 "${wave.type}"，已跳过`);
            continue;
        }
        const amplitude = wave.amplitude ?? 0;
        const frequency = wave.frequency ?? 0;
        const points = generator(frequency, amplitude, duration, samples);
        renderedWaves.push({
            color: wave.color || COLORS.PRIMARY,
            label: wave.label || wave.type,
            amplitude,
            points
        });
    }
    if (renderedWaves.length === 0) return null;
    // 最大振幅 = 所有波形 amplitude 最大值 * 1.2，振幅全 0 时取 1 避免除零
    const maxAmpRaw = Math.max(...renderedWaves.map((w) => Math.abs(w.amplitude)), 0);
    const maxAmp = (maxAmpRaw === 0 ? 1 : maxAmpRaw) * AMP_MARGIN_RATIO;
    return { renderedWaves, duration, maxAmp };
}

/**
 * 生成网格线定义（垂直时间线 + 水平幅度线）
 */
function buildGridLines(duration, maxAmp, plotWidth, plotHeight, toSvgX, toSvgY) {
    const lines = [];
    // 垂直网格线（时间轴，5 等分）
    const timeTicks = 5;
    for (let i = 0; i <= timeTicks; i++) {
        const t = (duration * i) / timeTicks;
        const x = toSvgX(t);
        lines.push({ x1: x, y1: PADDING.top, x2: x, y2: PADDING.top + plotHeight });
    }
    // 水平网格线（幅度轴，4 等分）
    const ampTicks = 4;
    for (let i = 0; i <= ampTicks; i++) {
        const a = -maxAmp + (2 * maxAmp * i) / ampTicks;
        const y = toSvgY(a);
        lines.push({ x1: PADDING.left, y1: y, x2: PADDING.left + plotWidth, y2: y });
    }
    return lines;
}

/**
 * 生成坐标轴刻度标签
 */
function buildAxisLabels(duration, maxAmp, plotHeight, toSvgX, toSvgY) {
    const labels = [];
    // X 轴时间标签
    const timeTicks = 5;
    for (let i = 0; i <= timeTicks; i++) {
        const t = (duration * i) / timeTicks;
        labels.push({
            x: toSvgX(t),
            y: PADDING.top + plotHeight + 16,
            text: formatTime(t),
            anchor: 'middle'
        });
    }
    // Y 轴幅度标签
    const ampTicks = 4;
    for (let i = 0; i <= ampTicks; i++) {
        const a = -maxAmp + (2 * maxAmp * i) / ampTicks;
        labels.push({
            x: PADDING.left - 8,
            y: toSvgY(a) + 3,
            text: formatAmp(a),
            anchor: 'end'
        });
    }
    return labels;
}

// ===== SVG 子组件 =====

/**
 * 空状态提示
 */
const EmptyState = () => (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/60 text-sm text-gray-500">
        暂无波形数据
    </div>
);

/**
 * 渲染网格线（浅灰虚线）
 */
const GridLines = ({ lines }) => (
    <>
        {lines.map((line, i) => (
            <line
                key={`grid-${i}`}
                x1={line.x1} y1={line.y1}
                x2={line.x2} y2={line.y2}
                stroke={COLORS.GRID}
                strokeWidth={0.5}
                strokeDasharray="2,2"
            />
        ))}
    </>
);

/**
 * 渲染坐标轴（轴线 + 刻度标签 + 轴标题）
 */
const ChartAxes = ({ plotWidth, centerY, axisBottomY, labels }) => (
    <>
        {/* Y 轴 */}
        <line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={axisBottomY}
            stroke={COLORS.PRIMARY} strokeWidth={1} />
        {/* X 轴（零幅度线） */}
        <line x1={PADDING.left} y1={centerY} x2={PADDING.left + plotWidth} y2={centerY}
            stroke={COLORS.PRIMARY} strokeWidth={1} />
        {/* 底部边框线 */}
        <line x1={PADDING.left} y1={axisBottomY} x2={PADDING.left + plotWidth} y2={axisBottomY}
            stroke={COLORS.PRIMARY} strokeWidth={1} />
        {/* 刻度标签 */}
        {labels.map((label, i) => (
            <text
                key={`label-${i}`}
                x={label.x} y={label.y}
                fontSize={10}
                fill={COLORS.AXIS_LABEL}
                textAnchor={label.anchor}
            >
                {label.text}
            </text>
        ))}
        {/* 轴标题 */}
        <text x={PADDING.left + plotWidth + 4} y={centerY - 4}
            fontSize={10} fill={COLORS.AXIS_LABEL}>
            t
        </text>
        <text x={PADDING.left + 4} y={PADDING.top + 10}
            fontSize={10} fill={COLORS.AXIS_LABEL}>
            A
        </text>
    </>
);

/**
 * 渲染波形曲线（每个波形一条 polyline）
 */
const WaveformLines = ({ waves, toSvgX, toSvgY }) => (
    <>
        {waves.map((wave, i) => (
            <polyline
                key={`wave-${i}`}
                points={toPolylinePoints(wave.points, toSvgX, toSvgY)}
                stroke={wave.color}
                strokeWidth={2}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        ))}
    </>
);

/**
 * 渲染图例（颜色线段 + 标签，水平居中布局）
 */
const ChartLegend = ({ waves, y, startX, itemWidth }) => (
    <>
        {waves.map((wave, i) => {
            const x = startX + i * itemWidth;
            return (
                <g key={`legend-${i}`}>
                    <line x1={x} y1={y} x2={x + 20} y2={y}
                        stroke={wave.color} strokeWidth={2} />
                    <text x={x + 26} y={y + 4}
                        fontSize={11} fill={COLORS.PRIMARY}>
                        {wave.label}
                    </text>
                </g>
            );
        })}
    </>
);

// ===== 主组件 =====

/**
 * WaveformChart - 信号波形组件
 * 基于 SVG 渲染多种信号波形的叠加显示，支持正弦、方波、三角、锯齿、冲激串
 * @param {Object} props - 组件属性
 * @param {Object} props.data - 波形数据 { waves, duration, samples }
 * @returns {React.ReactElement} 波形图 SVG
 */
const WaveformChart = ({ data }) => {
    const chartData = useMemo(() => buildChartData(data), [data]);

    // 空数据兜底
    if (!chartData) {
        return <EmptyState />;
    }

    const { renderedWaves, duration, maxAmp } = chartData;
    const plotWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
    const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

    // 坐标变换：时间 t -> SVG x，幅度 y -> SVG y（Y 轴翻转）
    const toSvgX = (t) => PADDING.left + (t / duration) * plotWidth;
    const toSvgY = (y) => PADDING.top + (1 - (y + maxAmp) / (2 * maxAmp)) * plotHeight;

    // 构建网格线与刻度标签
    const gridLines = buildGridLines(duration, maxAmp, plotWidth, plotHeight, toSvgX, toSvgY);
    const axisLabels = buildAxisLabels(duration, maxAmp, plotHeight, toSvgX, toSvgY);

    // 关键坐标
    const centerY = toSvgY(0);
    const axisBottomY = PADDING.top + plotHeight;
    const legendY = CHART_HEIGHT - 8;

    // 图例水平居中布局
    const legendItemWidth = 110;
    const legendTotalWidth = renderedWaves.length * legendItemWidth;
    const legendStartX = (VIEW_WIDTH - legendTotalWidth) / 2;

    return (
        <div className="p-3 sm:p-4 bg-white rounded-xl border border-gray-200/60">
            <svg
                viewBox={`0 0 ${VIEW_WIDTH} ${CHART_HEIGHT}`}
                width="100%"
                height={CHART_HEIGHT}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="信号波形图"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* 网格线（底层） */}
                <GridLines lines={gridLines} />
                {/* 坐标轴与刻度标签 */}
                <ChartAxes
                    plotWidth={plotWidth}
                    plotHeight={plotHeight}
                    centerY={centerY}
                    axisBottomY={axisBottomY}
                    labels={axisLabels}
                />
                {/* 波形曲线 */}
                <WaveformLines waves={renderedWaves} toSvgX={toSvgX} toSvgY={toSvgY} />
                {/* 底部图例 */}
                <ChartLegend
                    waves={renderedWaves}
                    y={legendY}
                    startX={legendStartX}
                    itemWidth={legendItemWidth}
                />
            </svg>
        </div>
    );
};

export default WaveformChart;
