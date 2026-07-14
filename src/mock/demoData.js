import { sampleKnowledgePoints } from './sampleData';
import { sampleQuestions } from './questions';
import { getToday, formatDate } from '../utils/date';

const generateDemoData = () => {
    const today = new Date();
    const todayStr = getToday();

    const material = {
        id: 'mat-demo-001',
        name: '电路分析.docx',
        content: '《电路分析与仿真》课后练习题，涵盖数字电路、逻辑代数、磁路与变压器、低压电器等模块',
        uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const planKnowledgePoints = sampleKnowledgePoints.map((kp, idx) => {
        const daysToAdd = Math.floor(idx * (14 / sampleKnowledgePoints.length));
        const date = new Date(today);
        date.setDate(date.getDate() - 7 + daysToAdd);
        const masteryMap = {
            'kp-001': 75,
            'kp-002': 60,
            'kp-003': 40,
            'kp-004': 30,
            'kp-005': 20,
            'kp-006': 10,
            'kp-007': 45,
            'kp-008': 25,
            'kp-009': 0
        };
        return {
            ...kp,
            mastery: masteryMap[kp.id] || 0,
            scheduledDate: date.toISOString().split('T')[0]
        };
    });

    const plan = {
        id: 'plan-demo-001',
        title: '电路分析复习计划',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        knowledgePoints: planKnowledgePoints,
        estimatedDays: 14,
        totalMinutes: planKnowledgePoints.reduce((sum, kp) => sum + kp.estimatedTime, 0)
    };

    const answerRecords = [];
    const wrongQuestions = [];
    const demoAnswers = {
        'q-001': { correct: true, answer: 'A' },
        'q-002': { correct: true, answer: 'A' },
        'q-003': { correct: true, answer: 'A' },
        'q-004': { correct: false, answer: 'A' },
        'q-005': { correct: true, answer: 'BD' },
        'q-006': { correct: false, answer: 'AD' },
        'q-007': { correct: true, answer: 'BC' },
        'q-008': { correct: true, answer: 'false' },
        'q-009': { correct: true, answer: 'true' },
        'q-010': { correct: false, answer: '9.75; 11.4; 9.C' },
        'q-011': { correct: true, answer: '$A+B$' },
        'q-012': { correct: true, answer: '门电路；当前输入' },
        'q-013': { correct: true, answer: '近似为零' },
        'q-014': { correct: false, answer: '都是门电路组成' },
        'q-015': { correct: true, answer: '$A\\bar{B}+BC$' },
        'q-016': { correct: false, answer: '110V' }
    };

    Object.entries(demoAnswers).forEach(([qId, result], index) => {
        const question = sampleQuestions.find(q => q.id === qId);
        if (!question) return;

        const daysAgo = Math.floor(Math.random() * 6);
        const recordDate = new Date(today);
        recordDate.setDate(recordDate.getDate() - daysAgo);
        const dateStr = formatDate(recordDate);

        const record = {
            id: `ans-demo-${index + 1}`,
            questionId: qId,
            knowledgePointId: question.knowledgePointId,
            userAnswer: result.answer,
            isCorrect: result.correct,
            date: dateStr,
            answeredAt: recordDate.toISOString()
        };
        answerRecords.push(record);

        if (!result.correct) {
            wrongQuestions.push({
                id: `wq-demo-${wrongQuestions.length + 1}`,
                question: question,
                userAnswer: result.answer,
                wrongCount: 1 + Math.floor(Math.random() * 2),
                reviewed: Math.random() > 0.5,
                mastered: false,
                addedAt: recordDate.toISOString(),
                lastWrongAt: recordDate.toISOString()
            });
        }
    });

    const resourceLinks = [
        {
            id: 'res-demo-001',
            title: '数字电路基础与数制编码（B站）',
            url: 'https://www.bilibili.com/video/BV1Eb411u7Fw/',
            source: 'B站',
            type: 'video',
            knowledgePointId: 'kp-001'
        },
        {
            id: 'res-demo-002',
            title: '逻辑代数与卡诺图化简 - 中国大学MOOC',
            url: 'https://www.icourse163.org/course/TONGJI-53001',
            source: '中国大学MOOC',
            type: 'course',
            knowledgePointId: 'kp-003'
        },
        {
            id: 'res-demo-003',
            title: '组合逻辑电路设计实例（B站）',
            url: 'https://www.bilibili.com/video/BV1Gf4y1S7dR/',
            source: 'B站',
            type: 'video',
            knowledgePointId: 'kp-004'
        },
        {
            id: 'res-demo-004',
            title: '触发器与时序逻辑电路专题讲解',
            url: 'https://www.bilibili.com/video/BV1qW411N7FU/',
            source: 'B站',
            type: 'video',
            knowledgePointId: 'kp-005'
        },
        {
            id: 'res-demo-005',
            title: '磁路与变压器知识点总结',
            url: 'https://zhuanlan.zhihu.com/p/123456789',
            source: '知乎',
            type: 'article',
            knowledgePointId: 'kp-007'
        }
    ];

    const dailyRecords = {};
    const checkInDates = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);

        const questionsAnswered = Math.floor(Math.random() * 8) + 2;
        const focusMinutes = 25 + Math.floor(Math.random() * 4) * 25;
        const correctRate = 0.4 + Math.random() * 0.4;
        const isCheckInDay = i < 3;

        dailyRecords[dateStr] = {
            checkIn: isCheckInDay,
            questionsAnswered: i < 5 ? questionsAnswered : Math.floor(questionsAnswered / 2),
            correctCount: Math.floor(questionsAnswered * correctRate),
            focusMinutes: i < 5 ? focusMinutes : Math.floor(focusMinutes / 2)
        };
        if (isCheckInDay) {
            checkInDates.push(dateStr);
        }
    }

    const correctCount = answerRecords.filter(r => r.isCorrect).length;
    const totalQuestions = answerRecords.length;

    const stats = {
        totalQuestions,
        correctCount,
        studyDays: 5,
        streak: 3,
        currentStreak: 3,
        todayQuestions: answerRecords.filter(r => r.date === todayStr).length,
        todayCorrect: answerRecords.filter(r => r.date === todayStr && r.isCorrect).length,
        overallProgress: Math.round(planKnowledgePoints.reduce((sum, kp) => sum + kp.mastery, 0) / planKnowledgePoints.length),
        totalFocusMinutes: Object.values(dailyRecords).reduce((sum, d) => sum + (d.focusMinutes || 0), 0)
    };

    const examDate = new Date(today);
    examDate.setDate(examDate.getDate() + 7);

    return {
        materials: [material],
        plan,
        questions: sampleQuestions,
        answerRecords,
        wrongQuestions,
        resourceLinks,
        stats,
        dailyRecords,
        checkInDates,
        examDate: examDate.toISOString().split('T')[0]
    };
};

export const loadDemoData = () => {
    return generateDemoData();
};

export default loadDemoData;
