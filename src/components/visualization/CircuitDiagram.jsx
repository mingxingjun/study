/**
 * @file CircuitDiagram - 电路图组件
 * @description 基于 SVG 组件化渲染电路图，支持电阻、电容、电感、电源等标准元件
 */

// 设计系统常量 - Refined Editorial Minimalism（黑白金极简）
const STROKE_COLOR = '#171717';
const STROKE_WIDTH = '1.5';
const TEXT_COLOR = '#171717';
const VALUE_COLOR = '#666';
const WIRE_COLOR = '#171717';

// 元件端点偏移量（相对元件中心，旋转前坐标）
// 每种元件类型定义其端点相对中心的位置
const ENDPOINT_OFFSETS = {
    resistor: { '1': { dx: -30, dy: 0 }, '2': { dx: 30, dy: 0 } },
    capacitor: { '1': { dx: -15, dy: 0 }, '2': { dx: 15, dy: 0 } },
    inductor: { '1': { dx: -30, dy: 0 }, '2': { dx: 30, dy: 0 } },
    voltageSource: { '+': { dx: 0, dy: -20 }, '-': { dx: 0, dy: 20 } },
    currentSource: { '1': { dx: 0, dy: -20 }, '2': { dx: 0, dy: 20 } },
    ground: { '1': { dx: 0, dy: -15 } },
    node: { default: { dx: 0, dy: 0 } }
};

/**
 * 解析端点字符串为元件 ID 和端点号
 * @param {string} endpoint - 端点字符串，如 "R1.1" 或 "N1"
 * @returns {{componentId: string, terminal: string|undefined}} 解析结果
 */
const parseEndpoint = (endpoint) => {
    const parts = endpoint.split('.');
    return { componentId: parts[0], terminal: parts[1] };
};

/**
 * 根据元件和端点号计算端点绝对坐标（考虑旋转）
 * @param {Object} component - 元件对象
 * @param {string|undefined} terminal - 端点号
 * @returns {{x: number, y: number}|null} 端点绝对坐标，解析失败返回 null
 */
const getEndpointPosition = (component, terminal) => {
    if (!component) return null;
    const offsets = ENDPOINT_OFFSETS[component.type];
    if (!offsets) return null;
    // 无端点号时使用中心（node 的 default 或其他元件的中心 {0,0}）
    const offset = terminal === undefined
        ? (offsets.default || { dx: 0, dy: 0 })
        : offsets[terminal];
    if (!offset) return null;
    // 应用旋转变换：旋转矩阵 [cos -sin; sin cos]
    const rotation = component.rotation || 0;
    const rad = (rotation * Math.PI) / 180;
    const rdx = offset.dx * Math.cos(rad) - offset.dy * Math.sin(rad);
    const rdy = offset.dx * Math.sin(rad) + offset.dy * Math.cos(rad);
    return { x: component.x + rdx, y: component.y + rdy };
};

// ============ 元件绘制子函数 ============

/** 绘制电阻（锯齿形符号） */
const renderResistor = () => (
    <>
        <line x1={-30} y1={0} x2={-20} y2={0} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
        <path d="M -20,0 L -15,-8 L -5,8 L 5,-8 L 15,8 L 20,0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} fill="none" />
        <line x1={20} y1={0} x2={30} y2={0} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    </>
);

/** 绘制电容（两条平行短线） */
const renderCapacitor = () => (
    <>
        <line x1={-30} y1={0} x2={-5} y2={0} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
        <line x1={-5} y1={-10} x2={-5} y2={10} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
        <line x1={5} y1={-10} x2={5} y2={10} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
        <line x1={5} y1={0} x2={30} y2={0} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    </>
);

/** 绘制电感（连续半圆弧） */
const renderInductor = () => (
    <>
        <line x1={-30} y1={0} x2={-20} y2={0} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
        <path d="M -20,0 A 5,5 0 0,1 -10,0 A 5,5 0 0,1 0,0 A 5,5 0 0,1 10,0 A 5,5 0 0,1 20,0" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} fill="none" />
        <line x1={20} y1={0} x2={30} y2={0} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    </>
);

/** 绘制电压源（圆圈内含 +/-） */
const renderVoltageSource = () => (
    <>
        <circle cx={0} cy={0} r={20} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} fill="white" />
        {/* + 符号 */}
        <line x1={-4} y1={-7} x2={4} y2={-7} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
        <line x1={0} y1={-11} x2={0} y2={-3} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
        {/* - 符号 */}
        <line x1={-4} y1={7} x2={4} y2={7} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    </>
);

/** 绘制电流源（圆圈内含箭头） */
const renderCurrentSource = () => (
    <>
        <circle cx={0} cy={0} r={20} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} fill="white" />
        {/* 箭头主体 */}
        <line x1={0} y1={8} x2={0} y2={-8} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
        {/* 箭头头部 */}
        <line x1={0} y1={-8} x2={-4} y2={-2} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
        <line x1={0} y1={-8} x2={4} y2={-2} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    </>
);

/** 绘制接地符号（三横线递减） */
const renderGround = () => (
    <>
        <line x1={0} y1={-15} x2={0} y2={0} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
        <line x1={-15} y1={0} x2={15} y2={0} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
        <line x1={-9} y1={5} x2={9} y2={5} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
        <line x1={-3} y1={10} x2={3} y2={10} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} />
    </>
);

/** 绘制节点（实心小圆点） */
const renderNode = () => (
    <circle cx={0} cy={0} r={3} fill={STROKE_COLOR} />
);

/** 绘制未知元件（带问号的小方块） */
const renderUnknown = () => (
    <>
        <rect x={-10} y={-10} width={20} height={20} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} fill="white" />
        <text x={0} y={5} textAnchor="middle" fontSize={14} fill={STROKE_COLOR}>?</text>
    </>
);

// 元件类型到绘制函数的映射
const COMPONENT_RENDERERS = {
    resistor: renderResistor,
    capacitor: renderCapacitor,
    inductor: renderInductor,
    voltageSource: renderVoltageSource,
    currentSource: renderCurrentSource,
    ground: renderGround,
    node: renderNode
};

/**
 * 渲染单个元件（含定位、旋转、标签）
 * @param {Object} component - 元件对象
 * @returns {React.ReactElement} SVG group 元素
 */
const renderComponent = (component) => {
    const { type, id, value, x, y, rotation = 0 } = component;
    const renderer = COMPONENT_RENDERERS[type] || renderUnknown;
    return (
        <g key={id} transform={`translate(${x},${y})`}>
            {/* 元件图形（应用旋转） */}
            <g transform={`rotate(${rotation})`}>
                {renderer()}
            </g>
            {/* 元件标签（保持水平，不随元件旋转） */}
            <text x={0} y={-30} textAnchor="middle" fontSize={12} fill={TEXT_COLOR}>{id}</text>
            {value && (
                <text x={0} y={38} textAnchor="middle" fontSize={10} fill={VALUE_COLOR}>{value}</text>
            )}
        </g>
    );
};

/**
 * 渲染单条导线
 * @param {Object} wire - 导线对象 {from, to}
 * @param {Object} componentsMap - 元件 ID 到元件对象的映射
 * @param {number} index - 导线索引（用作 key）
 * @returns {React.ReactElement|null} SVG line 元素，解析失败返回 null
 */
const renderWire = (wire, componentsMap, index) => {
    if (!wire || !wire.from || !wire.to) return null;
    const from = parseEndpoint(wire.from);
    const to = parseEndpoint(wire.to);
    const fromPos = getEndpointPosition(componentsMap[from.componentId], from.terminal);
    const toPos = getEndpointPosition(componentsMap[to.componentId], to.terminal);
    // 端点解析失败时跳过该导线
    if (!fromPos || !toPos) return null;
    return (
        <line
            key={`wire-${index}`}
            x1={fromPos.x}
            y1={fromPos.y}
            x2={toPos.x}
            y2={toPos.y}
            stroke={WIRE_COLOR}
            strokeWidth={STROKE_WIDTH}
        />
    );
};

/**
 * 电路图组件
 * @param {Object} props
 * @param {Object} props.data - 电路数据，包含 components 和 wires 数组
 * @returns {React.ReactElement} 电路图 SVG
 */
const CircuitDiagram = ({ data }) => {
    const { components = [], wires = [] } = data || {};

    // 空状态提示
    if (!data || !components.length) {
        return (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/60 text-sm text-gray-500">
                暂无电路图数据
            </div>
        );
    }

    // 构建元件 ID 到元件对象的映射，便于导线端点查找
    const componentsMap = {};
    components.forEach((comp) => { componentsMap[comp.id] = comp; });

    return (
        <div className="p-3 sm:p-4 bg-white rounded-xl border border-gray-200/60">
            <svg
                viewBox="0 0 400 300"
                width="100%"
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* 导线先绘制，位于元件底层 */}
                {wires.map((wire, index) => renderWire(wire, componentsMap, index))}
                {/* 元件后绘制，覆盖在导线上方 */}
                {components.map(renderComponent)}
            </svg>
        </div>
    );
};

export default CircuitDiagram;
