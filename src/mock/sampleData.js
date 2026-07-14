/**
 * 示例知识点数据 - 电路分析
 * 基于《电路分析与仿真》课后练习题，涵盖数字电路、逻辑代数、磁路与变压器、低压电器等模块
 */

export const sampleKnowledgePoints = [
    {
        id: 'kp-001',
        name: '数字电路基础与数制编码',
        subject: '电路分析',
        description: '数字信号与模拟信号的区别、正逻辑与负逻辑、二进制/八进制/十六进制转换、8421BCD码、8位有符号数的原码/反码/补码表示',
        difficulty: 'easy',
        estimatedTime: 120,
        prerequisites: [],
        mastery: 0
    },
    {
        id: 'kp-002',
        name: '逻辑代数基础',
        subject: '电路分析',
        description: '与、或、非基本逻辑运算，逻辑代数基本定律（吸收律、分配律、摩根定律），反函数与对偶式，最小项与最大项的性质',
        difficulty: 'easy',
        estimatedTime: 120,
        prerequisites: ['kp-001'],
        mastery: 0
    },
    {
        id: 'kp-003',
        name: '逻辑函数的化简',
        subject: '电路分析',
        description: '公式法化简逻辑函数、卡诺图化简法、包围圈规则、相邻1方格的消去变量规律',
        difficulty: 'medium',
        estimatedTime: 150,
        prerequisites: ['kp-002'],
        mastery: 0
    },
    {
        id: 'kp-004',
        name: '组合逻辑电路',
        subject: '电路分析',
        description: '组合电路特点与分析设计步骤，编码器、译码器、数据选择器、表决器等典型电路的功能与应用',
        difficulty: 'medium',
        estimatedTime: 150,
        prerequisites: ['kp-003'],
        mastery: 0
    },
    {
        id: 'kp-005',
        name: '触发器与时序逻辑电路',
        subject: '电路分析',
        description: 'D触发器、JK触发器、T触发器的特性方程与触发方式，时序电路的分析步骤，同步/异步计数器、74161芯片功能',
        difficulty: 'medium',
        estimatedTime: 180,
        prerequisites: ['kp-002'],
        mastery: 0
    },
    {
        id: 'kp-006',
        name: '计数器与555定时器',
        subject: '电路分析',
        description: '同步/异步计数器的工作原理，74161/74160的功能特点，555定时器在波形产生与变换中的应用',
        difficulty: 'hard',
        estimatedTime: 180,
        prerequisites: ['kp-005'],
        mastery: 0
    },
    {
        id: 'kp-007',
        name: '磁路与变压器',
        subject: '电路分析',
        description: '磁路基本定律（基尔霍夫第二定律、磁路欧姆定律），变压器的电压比/电流比与匝数比关系，理想变压器特性',
        difficulty: 'medium',
        estimatedTime: 150,
        prerequisites: [],
        mastery: 0
    },
    {
        id: 'kp-008',
        name: '交流铁芯线圈与损耗',
        subject: '电路分析',
        description: '交流铁芯线圈的铜损与铁损，磁滞损耗与涡流损耗的产生原因及抑制方法，我国工频标准',
        difficulty: 'easy',
        estimatedTime: 90,
        prerequisites: ['kp-007'],
        mastery: 0
    },
    {
        id: 'kp-009',
        name: '低压电器与电机控制',
        subject: '电路分析',
        description: '低压电器的分类，交流接触器、熔断器、热继电器、中间继电器的功能，继电器与接触器的区别，电机控制基本电路',
        difficulty: 'easy',
        estimatedTime: 120,
        prerequisites: [],
        mastery: 0
    }
];

export default sampleKnowledgePoints;
