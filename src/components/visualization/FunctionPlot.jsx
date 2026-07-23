/**
 * @file FunctionPlot - 函数图像组件
 * @description 基于 JSXGraph 渲染数学函数图像，支持多函数叠加、参数滑块、缩放平移
 *              设计系统：Refined Editorial Minimalism（黑白金极简）
 */
import { useEffect, useRef, useState, useId } from 'react';
import JXG from 'jsxgraph';
import 'jsxgraph/distrib/jsxgraph.css';

/** 默认颜色 - 黑白金极简设计系统 */
const DEFAULT_COLORS = ['#171717', '#c9a227', '#6b7280', '#9ca3af', '#374151'];

/** 需要映射到 Math 命名空间的数学函数 */
const MATH_FUNCTIONS = [
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
    'exp', 'log', 'sqrt', 'abs', 'floor', 'ceil', 'round'
];

/** 默认 x 轴范围 */
const DEFAULT_X_RANGE = [-10, 10];

/** 默认 y 轴范围（未显式指定时使用） */
const DEFAULT_Y_RANGE = [-5, 5];

/**
 * 将数学表达式转换为可执行的 JavaScript 代码
 * @param {string} expr - 原始表达式，如 "sin(x) + a*x^2"
 * @returns {string} 转换后代码，如 "Math.sin(x) + a*x**2"
 */
const transformExpression = (expr) => {
    let result = String(expr);
    // 幂运算符 ^ -> **（JS 中 ^ 是位异或，需转换为幂运算）
    result = result.replace(/\^/g, '**');
    // 数学函数映射：sin -> Math.sin 等
    MATH_FUNCTIONS.forEach((fn) => {
        const regex = new RegExp(`\\b${fn}\\b`, 'g');
        result = result.replace(regex, `Math.${fn}`);
    });
    // 数学常量
    result = result.replace(/\bpi\b/gi, 'Math.PI');
    result = result.replace(/\be\b/g, 'Math.E');
    return result;
};

/**
 * 根据表达式和参数名动态创建可执行函数
 * @param {string} expr - 原始表达式
 * @param {string[]} paramNames - 参数名列表
 * @returns {Function|null} 可执行函数，解析失败时返回 null
 */
const createFunction = (expr, paramNames) => {
    try {
        const transformed = transformExpression(expr);
        const body = `return ${transformed};`;
        // 表达式与参数均为动态输入，无法静态定义函数体
        return new Function('x', ...paramNames, body);
    } catch (error) {
        return null;
    }
};

/**
 * 初始化 JSXGraph board
 * @param {string} boardId - DOM 容器 ID
 * @param {number} xMin - x 轴最小值
 * @param {number} xMax - x 轴最大值
 * @param {number} yMin - y 轴最小值
 * @param {number} yMax - y 轴最大值
 * @returns {Object} JSXGraph board 实例
 */
const initBoard = (boardId, xMin, xMax, yMin, yMax) => {
    const board = JXG.JSXGraph.initBoard(boardId, {
        boundingbox: [xMin, yMax, xMax, yMin],
        axis: true,
        showCopyright: false,
        showNavigation: false,
        keepaspectratio: false,
        defaultAxes: {
            x: {
                strokeColor: '#171717',
                ticks: { strokeColor: '#9ca3af', majorHeight: 6, minorHeight: 3 }
            },
            y: {
                strokeColor: '#171717',
                ticks: { strokeColor: '#9ca3af', majorHeight: 6, minorHeight: 3 }
            }
        },
        grid: false
    });
    // 启用滚轮缩放与拖拽平移
    board.setAttribute({
        zoom: { wheel: true, needShift: false, factorX: 1.1, factorY: 1.1 },
        pan: { enabled: true, needShift: false }
    });
    return board;
};

/**
 * 在 board 上绘制所有函数曲线
 * @param {Object} board - JSXGraph board 实例
 * @param {Array} functions - 函数配置列表
 * @param {string[]} paramNames - 参数名列表
 * @param {Object} paramValues - 参数当前值
 * @param {number} xMin - x 轴最小值
 * @param {number} xMax - x 轴最大值
 * @returns {Object} { curves: Array, errors: Array }
 */
const drawFunctions = (board, functions, paramNames, paramValues, xMin, xMax) => {
    const args = paramNames.map((name) => paramValues[name] ?? 0);
    const curves = [];
    const errors = [];

    functions.forEach((func, index) => {
        const fn = createFunction(func.expr, paramNames);
        if (!fn) {
            errors.push(func.label || func.expr);
            return;
        }
        const color = func.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
        try {
            const curve = board.create('functiongraph', [
                (x) => {
                    try {
                        const value = fn(x, ...args);
                        return Number.isFinite(value) ? value : NaN;
                    } catch (err) {
                        return NaN;
                    }
                },
                xMin,
                xMax
            ], {
                strokeColor: color,
                strokeWidth: 2,
                highlight: false,
                name: func.label
            });
            curves.push(curve);
        } catch (err) {
            errors.push(func.label || func.expr);
        }
    });

    board.update();
    return { curves, errors };
};

/**
 * 图例组件 - 展示函数颜色与标签
 * @param {Object} props
 * @param {Array} props.functions - 函数配置列表
 */
const FunctionLegend = ({ functions }) => (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {functions.map((func, index) => {
            const color = func.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
            return (
                <div key={`${func.label}-${index}`} className="flex items-center gap-1.5">
                    <span
                        className="inline-block w-3 h-3 rounded-sm"
                        style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-gray-600">{func.label || func.expr}</span>
                </div>
            );
        })}
    </div>
);

/**
 * 参数滑块组件 - 与 ProgressBar 风格一致的细线圆角样式
 * @param {Object} props
 * @param {Object} props.param - 参数配置
 * @param {number} props.value - 当前值
 * @param {Function} props.onChange - 值变化回调
 */
const ParameterSlider = ({ param, value, onChange }) => {
    const displayValue = value ?? param.default ?? param.min;
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700 font-medium">
                    {param.name}
                    <span className="text-gray-400 ml-2 font-normal">
                        {param.min} - {param.max}
                    </span>
                </span>
                <span className="text-gray-900 font-medium tabular-nums">
                    {Number(displayValue).toFixed(2)}
                </span>
            </div>
            <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={displayValue}
                onChange={(e) => onChange(param.name, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#171717]"
            />
        </div>
    );
};

/**
 * FunctionPlot - 函数图像组件
 * @param {Object} props
 * @param {Object} props.data - 数据配置
 * @param {Array} props.data.functions - 函数列表 [{ expr, color, label }]
 * @param {Array} [props.data.xRange] - x 轴范围，默认 [-10, 10]
 * @param {Array} [props.data.yRange] - y 轴范围，默认自动
 * @param {Array} [props.data.parameters] - 参数滑块配置 [{ name, min, max, step, default }]
 */
const FunctionPlot = ({ data }) => {
    const containerRef = useRef(null);
    const reactId = useId();
    // JSXGraph board id 必须符合 CSS 选择器规范，去掉 useId 中的特殊字符
    const boardId = `function-plot-${reactId.replace(/[^a-zA-Z0-9-]/g, '')}`;

    const { functions = [], xRange = DEFAULT_X_RANGE, yRange, parameters = [] } = data || {};
    // 拆解为基本类型作为 effect 依赖，避免数组引用变化导致重复重建
    const xMin = xRange[0];
    const xMax = xRange[1];
    const yMin = yRange ? yRange[0] : DEFAULT_Y_RANGE[0];
    const yMax = yRange ? yRange[1] : DEFAULT_Y_RANGE[1];

    // 参数滑块当前值（由滑块拖动驱动）
    const [paramValues, setParamValues] = useState(() => {
        const initial = {};
        parameters.forEach((p) => {
            initial[p.name] = p.default ?? p.min;
        });
        return initial;
    });
    // 函数解析错误信息
    const [error, setError] = useState(null);

    // 初始化 board 并绘制函数（数据或参数变化时重建）
    useEffect(() => {
        const container = containerRef.current;
        if (!container || functions.length === 0) {
            setError(null);
            return;
        }
        const board = initBoard(boardId, xMin, xMax, yMin, yMax);
        const currentParamNames = parameters.map((p) => p.name);
        const { errors } = drawFunctions(
            board, functions, currentParamNames, paramValues, xMin, xMax
        );
        setError(errors.length > 0 ? `解析失败：${errors.join('、')}` : null);

        return () => {
            // JSXGraph 无标准 destroy API，暂停更新并清空 DOM 即可
            try {
                board.suspendUpdate();
            } catch (err) {
                // 忽略销毁异常
            }
            container.innerHTML = '';
        };
    }, [boardId, functions, parameters, paramValues, xMin, xMax, yMin, yMax]);

    const handleSliderChange = (name, value) => {
        setParamValues((prev) => ({ ...prev, [name]: value }));
    };

    // 空状态：data 为空或无函数
    if (functions.length === 0) {
        return (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/60 text-sm text-gray-500">
                暂无函数数据
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* JSXGraph board 容器 - 移动端最小 250px，桌面端 320px */}
            <div
                ref={containerRef}
                id={boardId}
                className="w-full rounded-xl border border-gray-200/60 bg-white overflow-hidden min-h-[250px] sm:min-h-[320px]"
            />
            {/* 解析错误提示 - 与设计系统统一的 amber 风格 */}
            {error && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}
            {/* 图例 */}
            <FunctionLegend functions={functions} />
            {/* 参数滑块 */}
            {parameters.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {parameters.map((param) => (
                        <ParameterSlider
                            key={param.name}
                            param={param}
                            value={paramValues[param.name]}
                            onChange={handleSliderChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FunctionPlot;
