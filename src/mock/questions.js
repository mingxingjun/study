/**
 * 示例题库 - 电路分析
 * 题目类型包含单选、多选、判断、填空、简答、计算，覆盖数字电路、逻辑代数、磁路与变压器、低压电器等知识点
 */

export const sampleQuestions = [
    {
        id: 'q-001',
        knowledgePointId: 'kp-001',
        materialId: 'mat-demo-001',
        type: 'single',
        question: '十进制数 16 的 8421BCD 码是？',
        options: ['A. 00010110', 'B. 10000', 'C. 10110', 'D. 10010'],
        answer: 'A',
        explanation: '8421BCD 码用 4 位二进制表示 1 位十进制数，16 逐位转换：1→0001，6→0110，组合为 00010110。',
        difficulty: 'easy'
    },
    {
        id: 'q-002',
        knowledgePointId: 'kp-002',
        materialId: 'mat-demo-001',
        type: 'single',
        question: '逻辑代数中，吸收律 $A + \\bar{A}B = $？',
        options: ['A. $A+B$', 'B. $AB$', 'C. $A$', 'D. $B$'],
        answer: 'A',
        explanation: '由吸收律 $A + \\bar{A}B = A + B$，即“有 A 时结果由 A 决定；无 A 时由 B 决定”。',
        difficulty: 'easy'
    },
    {
        id: 'q-003',
        knowledgePointId: 'kp-005',
        materialId: 'mat-demo-001',
        type: 'single',
        question: 'D 触发器的特性方程为？',
        options: ['A. $Q^{n+1}=D$', 'B. $Q^{n+1}=JQ^n+\\bar{K}Q^n$', 'C. $Q^{n+1}=\\bar{Q}^n$', 'D. $Q^{n+1}=T\\oplus Q^n$'],
        answer: 'A',
        explanation: 'D 触发器在有效时钟沿将输入 D 传送到输出，特性方程为 $Q^{n+1}=D$。',
        difficulty: 'easy'
    },
    {
        id: 'q-004',
        knowledgePointId: 'kp-007',
        materialId: 'mat-demo-001',
        type: 'single',
        question: '理想变压器的电压比 $U_1/U_2$ 与匝数比的关系为？',
        options: ['A. $N_2/N_1$', 'B. $N_1/N_2$', 'C. $N_1 \\cdot N_2$', 'D. 1'],
        answer: 'B',
        explanation: '理想变压器电压比等于匝数比：$U_1/U_2 = N_1/N_2$。',
        difficulty: 'easy'
    },
    {
        id: 'q-005',
        knowledgePointId: 'kp-001',
        materialId: 'mat-demo-001',
        type: 'multiple',
        question: '与模拟信号相比，数字信号具有哪些特征？',
        options: ['A. 时间连续', 'B. 时间离散', 'C. 数值连续', 'D. 数值离散'],
        answer: 'BD',
        explanation: '数字信号在时间和数值上都是离散的；模拟信号在时间和数值上都是连续的。',
        difficulty: 'easy'
    },
    {
        id: 'q-006',
        knowledgePointId: 'kp-004',
        materialId: 'mat-demo-001',
        type: 'multiple',
        question: '下列电路中，属于组合逻辑电路的是？',
        options: ['A. 触发器', 'B. 编码器', 'C. 数据选择器', 'D. 计数器'],
        answer: 'BC',
        explanation: '组合逻辑电路的输出仅取决于当前输入，典型单元包括编码器、译码器、数据选择器等；触发器和计数器属于时序逻辑电路。',
        difficulty: 'medium'
    },
    {
        id: 'q-007',
        knowledgePointId: 'kp-008',
        materialId: 'mat-demo-001',
        type: 'multiple',
        question: '交流铁芯线圈中铁损主要包括？',
        options: ['A. 铜损', 'B. 磁滞损耗', 'C. 涡流损耗', 'D. 铁芯发热'],
        answer: 'BC',
        explanation: '铁损是铁芯中的功率损耗，由磁滞损耗与涡流损耗两部分组成；铜损发生在导线电阻上，不属于铁损。',
        difficulty: 'medium'
    },
    {
        id: 'q-008',
        knowledgePointId: 'kp-001',
        materialId: 'mat-demo-001',
        type: 'truefalse',
        question: '8421BCD 码是一种无权码。',
        options: [],
        answer: 'false',
        explanation: '8421BCD 码是有权码，4 位二进制各位的权值分别为 8、4、2、1。',
        difficulty: 'easy'
    },
    {
        id: 'q-009',
        knowledgePointId: 'kp-005',
        materialId: 'mat-demo-001',
        type: 'truefalse',
        question: '同步计数器中，所有触发器的时钟端接在同一时钟信号上。',
        options: [],
        answer: 'true',
        explanation: '同步计数器的所有触发器由同一时钟脉冲控制，状态更新同步；异步计数器则逐级触发。',
        difficulty: 'easy'
    },
    {
        id: 'q-010',
        knowledgePointId: 'kp-001',
        materialId: 'mat-demo-001',
        type: 'fillblank',
        question: '二进制数 $(1001.11)_2$ 转换成十进制数____，八进制数____，十六进制数____。',
        options: [],
        answer: '9.75; 11.6; 9.C',
        explanation: '按权展开：$1\\times 2^3+1\\times 2^0+1\\times 2^{-1}+1\\times 2^{-2}=9.75$；整数 1001 对应八进制 11、十六进制 9，小数 .11 对应八进制 .6、十六进制 .C。',
        difficulty: 'medium'
    },
    {
        id: 'q-011',
        knowledgePointId: 'kp-002',
        materialId: 'mat-demo-001',
        type: 'fillblank',
        question: '逻辑代数中，吸收律 $A + \\bar{A}B = $____。',
        options: [],
        answer: '$A+B$',
        explanation: '吸收律表明 $A + \\bar{A}B = A + B$，可用来化简逻辑函数。',
        difficulty: 'easy'
    },
    {
        id: 'q-012',
        knowledgePointId: 'kp-004',
        materialId: 'mat-demo-001',
        type: 'fillblank',
        question: '组合逻辑电路的基本单元是____，输出仅取决于____。',
        options: [],
        answer: '门电路；当前输入',
        explanation: '组合逻辑电路无记忆功能，由门电路组成，输出只与当前输入有关。',
        difficulty: 'easy'
    },
    {
        id: 'q-013',
        knowledgePointId: 'kp-007',
        materialId: 'mat-demo-001',
        type: 'fillblank',
        question: '理想变压器空载运行时，原边电流____。',
        options: [],
        answer: '近似为零',
        explanation: '理想变压器空载时副边电流为零，原边仅产生很小的励磁电流，工程上可近似认为原边电流为零。',
        difficulty: 'easy'
    },
    {
        id: 'q-014',
        knowledgePointId: 'kp-004',
        materialId: 'mat-demo-001',
        type: 'essay',
        question: '简述组合逻辑电路与时序逻辑电路的主要区别。',
        options: [],
        answer: '组合逻辑电路无记忆功能，输出仅取决于当前输入，基本单元是门电路；时序逻辑电路具有记忆功能，输出取决于当前输入和历史状态，基本单元是触发器。',
        explanation: '组合电路与时序电路的核心差异在于是否具有记忆功能，以及基本组成单元不同。',
        difficulty: 'medium'
    },
    {
        id: 'q-015',
        knowledgePointId: 'kp-003',
        materialId: 'mat-demo-001',
        type: 'calculation',
        question: '使用公式法化简逻辑函数 $Y = A\\bar{B}C + \\bar{A}BC + ABC + A\\bar{B}\\bar{C}$。',
        options: [],
        answer: '$A\\bar{B}+BC$',
        explanation: '分组化简：$A\\bar{B}C + A\\bar{B}\\bar{C} = A\\bar{B}$，$\\bar{A}BC + ABC = BC$，因此 $Y = A\\bar{B} + BC$。',
        difficulty: 'medium'
    },
    {
        id: 'q-016',
        knowledgePointId: 'kp-007',
        materialId: 'mat-demo-001',
        type: 'calculation',
        question: '某变压器原边匝数 $N_1=2200$，副边匝数 $N_2=110$，原边电压 $U_1=220\\ \text{V}$，求副边电压 $U_2$。',
        options: [],
        answer: '$11\\ \text{V}$',
        explanation: '由理想变压器电压比公式 $U_1/U_2=N_1/N_2$，得 $U_2 = U_1 \\cdot N_2/N_1 = 220 \\times 110/2200 = 11\\ \text{V}$。',
        difficulty: 'easy'
    }
];

export default sampleQuestions;
