import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { saveData, loadData } from '../services/storageService';
import { sampleKnowledgePoints } from '../mock/sampleData';
import { agents as mockAgents } from '../mock/agents';
import { loadDemoData } from '../mock/demoData';
import { getToday, formatDate } from '../utils/date';
import { calculateOverallProgress, calculateTodayStats } from '../utils/progress';
import { getDueReviews } from '../utils/reviewSchedule';
import { defaultConfig } from '../config/aiProviders';

const STORAGE_KEY = 'study-buddy-state';

const calculateCurrentStreak = (checkInDates) => {
  if (!checkInDates || checkInDates.length === 0) return 0;
  
  const sortedDates = [...checkInDates].sort().reverse();
  const today = getToday();
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  
  let streak = 0;
  let currentDate = new Date();
  
  if (sortedDates[0] === today) {
    streak = 1;
    currentDate.setDate(currentDate.getDate() - 1);
  } else if (sortedDates[0] === yesterday) {
    streak = 1;
    currentDate.setDate(currentDate.getDate() - 2);
  } else {
    return 0;
  }
  
  for (let i = 1; i < sortedDates.length; i++) {
    const expectedDate = formatDate(currentDate);
    if (sortedDates[i] === expectedDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

/**
 * @typedef {Object} Material
 * @property {string} id
 * @property {string} name
 * @property {string} content
 * @property {string} uploadedAt
 */

/**
 * @typedef {Object} Plan
 * @property {string} id
 * @property {string} title
 * @property {Array} knowledgePoints
 * @property {string} createdAt
 */

/**
 * @typedef {Object} AnswerRecord
 * @property {string} id
 * @property {string} questionId
 * @property {string} knowledgePointId
 * @property {string} userAnswer
 * @property {boolean} isCorrect
 * @property {string} date
 * @property {string} answeredAt
 */

/**
 * @typedef {Object} WrongQuestion
 * @property {string} id
 * @property {Object} question
 * @property {string} userAnswer
 * @property {number} wrongCount
 * @property {boolean} reviewed
 * @property {boolean} mastered
 * @property {string} addedAt
 * @property {string} lastWrongAt
 */

/**
 * @typedef {Object} ResourceLink
 * @property {string} id
 * @property {string} title
 * @property {string} url
 * @property {string} source
 * @property {string} type
 * @property {string} knowledgePointId
 */

/**
 * @typedef {Object} AgentStatus
 * @property {string} id
 * @property {string} status
 * @property {string} message
 */

/**
 * @typedef {Object} StudyState
 * @property {Material[]} materials
 * @property {Plan|null} plan
 * @property {Array} questions
 * @property {AnswerRecord[]} answerRecords
 * @property {WrongQuestion[]} wrongQuestions
 * @property {ResourceLink[]} resourceLinks
 * @property {Object} stats
 * @property {AgentStatus[]} agents
 * @property {string[]} checkInDates
 * @property {string|null} examDate
 */

/** @type {StudyState} */
const initialState = {
  materials: [],
  plan: null,
  questions: [],
  answerRecords: [],
  wrongQuestions: [],
  resourceLinks: [],
  stats: {
    totalQuestions: 0,
    correctCount: 0,
    studyDays: 0,
    streak: 0,
    currentStreak: 0,
    todayQuestions: 0,
    todayCorrect: 0,
    overallProgress: 0,
    totalFocusMinutes: 0
  },
  dailyRecords: {},
  agents: mockAgents.map(a => ({
    id: a.id,
    status: 'idle',
    message: a.message
  })),
  checkInDates: [],
  examDate: null,
  isDemo: false,
  /** 运行模式：'demo' 演示模式（使用 mock 数据）/ 'formal' 正式模式（使用真实 AI） */
  mode: 'demo',
  /** 各 Agent 的 AI 服务商配置，初始为空配置，由用户在设置页填写 */
  aiConfig: {
    'quiz-master': { providerId: '', modelId: '', apiKey: '' },
    'explainer': { providerId: '', modelId: '', apiKey: '' },
    'supervisor': { providerId: '', modelId: '', apiKey: '' }
  }
};

/**
 * Reducer 处理所有状态更新
 * @param {StudyState} state
 * @param {Object} action
 * @returns {StudyState}
 */
const studyReducer = (state, action) => {
  switch (action.type) {
    case 'UPLOAD_MATERIAL':
      return {
        ...state,
        materials: [...state.materials, action.payload]
      };

    case 'DELETE_MATERIAL': {
      const materialId = action.payload;
      const questionsToRemove = state.questions
        .filter(q => q.materialId === materialId)
        .map(q => q.id);
      return {
        ...state,
        materials: state.materials.filter(m => m.id !== materialId),
        questions: state.questions.filter(q => q.materialId !== materialId),
        wrongQuestions: state.wrongQuestions.filter(
          wq => !questionsToRemove.includes(wq.question.id)
        ),
        answerRecords: state.answerRecords.filter(
          r => !questionsToRemove.includes(r.questionId)
        )
      };
    }

    case 'SET_PLAN':
      return {
        ...state,
        plan: action.payload
      };

    case 'ADD_ANSWER': {
      const newRecord = action.payload;
      const newRecords = [...state.answerRecords, newRecord];
      const today = getToday();
      const todayStats = calculateTodayStats(newRecords, today);
      const kpMap = new Map();
      if (state.plan) {
        state.plan.knowledgePoints.forEach(kp => kpMap.set(kp.id, { ...kp }));
      } else {
        sampleKnowledgePoints.forEach(kp => kpMap.set(kp.id, { ...kp }));
      }
      const recordsByKp = {};
      newRecords.forEach(r => {
        if (!recordsByKp[r.knowledgePointId]) recordsByKp[r.knowledgePointId] = [];
        recordsByKp[r.knowledgePointId].push(r);
      });
      kpMap.forEach((kp, id) => {
        const records = recordsByKp[id] || [];
        if (records.length > 0) {
          const correct = records.filter(r => r.isCorrect).length;
          kp.mastery = Math.min(100, Math.round((correct / records.length) * 100));
        }
      });
      const updatedPlan = state.plan ? {
        ...state.plan,
        knowledgePoints: Array.from(kpMap.values())
      } : null;
      
      return {
        ...state,
        answerRecords: newRecords,
        plan: updatedPlan,
        stats: {
          ...state.stats,
          totalQuestions: newRecords.length,
          correctCount: newRecords.filter(r => r.isCorrect).length,
          todayQuestions: todayStats.totalQuestions,
          todayCorrect: todayStats.correctCount,
          overallProgress: calculateOverallProgress(updatedPlan ? updatedPlan.knowledgePoints : [])
        }
      };
    }

    case 'ADD_WRONG_QUESTION': {
      const existingIndex = state.wrongQuestions.findIndex(
        wq => wq.question.id === action.payload.question.id
      );
      const now = new Date().toISOString();
      
      if (existingIndex >= 0) {
        const updated = [...state.wrongQuestions];
        updated[existingIndex] = {
          ...updated[existingIndex],
          wrongCount: updated[existingIndex].wrongCount + 1,
          reviewed: false,
          mastered: false,
          lastWrongAt: now,
          userAnswer: action.payload.userAnswer
        };
        return { ...state, wrongQuestions: updated };
      }
      
      return {
        ...state,
        wrongQuestions: [...state.wrongQuestions, {
          ...action.payload,
          id: `wq-${Date.now()}`,
          wrongCount: 1,
          reviewed: false,
          mastered: false,
          addedAt: now,
          lastWrongAt: now
        }]
      };
    }

    case 'MARK_WRONG_QUESTION_MASTERED': {
      return {
        ...state,
        wrongQuestions: state.wrongQuestions.map(wq =>
          wq.id === action.payload
            ? { ...wq, mastered: true }
            : wq
        )
      };
    }

    case 'MARK_MASTERED': {
      if (!state.plan) return state;
      
      const updatedKps = state.plan.knowledgePoints.map(kp => 
        kp.id === action.payload.knowledgePointId 
          ? { ...kp, mastery: 100 }
          : kp
      );
      
      return {
        ...state,
        plan: {
          ...state.plan,
          knowledgePoints: updatedKps
        },
        stats: {
          ...state.stats,
          overallProgress: calculateOverallProgress(updatedKps)
        }
      };
    }

    case 'SET_QUESTIONS':
      return {
        ...state,
        questions: action.payload
      };

    case 'ADD_QUESTION':
      return {
        ...state,
        questions: [...state.questions, action.payload]
      };

    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map(q =>
          q.id === action.payload.id ? { ...q, ...action.payload } : q
        )
      };

    case 'DELETE_QUESTION':
      return {
        ...state,
        questions: state.questions.filter(q => q.id !== action.payload),
        wrongQuestions: state.wrongQuestions.filter(wq => wq.question.id !== action.payload)
      };

    case 'SET_EXAM_DATE':
      return {
        ...state,
        examDate: action.payload
      };

    case 'ADD_RESOURCE_LINK':
      return {
        ...state,
        resourceLinks: [...state.resourceLinks, {
          ...action.payload,
          id: `res-${Date.now()}`
        }]
      };

    case 'DELETE_RESOURCE_LINK':
      return {
        ...state,
        resourceLinks: state.resourceLinks.filter(r => r.id !== action.payload)
      };

    case 'UPDATE_AGENT_STATUS':
      return {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.payload.id
            ? { ...agent, ...action.payload }
            : agent
        )
      };

    case 'CHECK_IN': {
      const today = getToday();
      if (state.checkInDates.includes(today)) {
        return state;
      }
      const newCheckInDates = [...state.checkInDates, today];
      const newStreak = calculateCurrentStreak(newCheckInDates);
      const newDailyRecords = {
        ...state.dailyRecords,
        [today]: {
          ...(state.dailyRecords[today] || {}),
          checkIn: true
        }
      };
      return {
        ...state,
        checkInDates: newCheckInDates,
        dailyRecords: newDailyRecords,
        stats: {
          ...state.stats,
          studyDays: state.stats.studyDays + 1,
          currentStreak: newStreak,
          streak: Math.max(state.stats.streak, newStreak)
        }
      };
    }

    case 'RECORD_FOCUS_TIME': {
      const today = getToday();
      const minutes = action.payload;
      const todayRecord = state.dailyRecords[today] || {};
      const currentFocus = todayRecord.focusMinutes || 0;
      const newFocus = currentFocus + minutes;
      return {
        ...state,
        dailyRecords: {
          ...state.dailyRecords,
          [today]: {
            ...todayRecord,
            focusMinutes: newFocus
          }
        },
        stats: {
          ...state.stats,
          totalFocusMinutes: state.stats.totalFocusMinutes + minutes
        }
      };
    }

    case 'UPDATE_STATS':
      return {
        ...state,
        stats: { ...state.stats, ...action.payload }
      };

    case 'LOAD_STATE':
      return {
        ...initialState,
        ...action.payload,
        aiConfig: { ...initialState.aiConfig, ...(action.payload.aiConfig || {}) }
      };

    case 'LOAD_DEMO_DATA': {
      const demo = loadDemoData();
      const calculatedStreak = calculateCurrentStreak(demo.checkInDates || []);
      return {
        ...initialState,
        ...demo,
        isDemo: true,
        mode: 'demo',
        stats: {
          ...demo.stats,
          currentStreak: calculatedStreak
        },
        agents: mockAgents.map(a => ({
          id: a.id,
          status: 'idle',
          message: a.message
        }))
      };
    }

    /**
     * 切换运行模式（demo 演示 / formal 正式）
     * @param {string} action.payload - 目标模式 'demo' 或 'formal'
     */
    case 'SET_MODE': {
      if (action.payload === 'formal') {
        // 切换到正式模式时清空所有演示/mock 学习数据，避免示例题库干扰真实学习流程
        // 保留 aiConfig，避免用户重复填写 API 配置
        return {
          ...state,
          mode: 'formal',
          isDemo: false,
          materials: [],
          plan: null,
          questions: [],
          answerRecords: [],
          wrongQuestions: [],
          resourceLinks: [],
          dailyRecords: {},
          checkInDates: [],
          stats: {
            totalQuestions: 0,
            correctCount: 0,
            studyDays: 0,
            streak: 0,
            currentStreak: 0,
            todayQuestions: 0,
            todayCorrect: 0,
            overallProgress: 0,
            totalFocusMinutes: 0
          }
        };
      }
      return {
        ...state,
        mode: action.payload
      };
    }

    /**
     * 设置单个 Agent 的 AI 配置
     * @param {Object} action.payload - 必须包含 agentId 与 config 字段
     * @param {string} action.payload.agentId - Agent 标识（quiz-master/explainer/supervisor）
     * @param {AgentConfig} action.payload.config - 该 Agent 的新配置
     */
    case 'SET_AI_CONFIG':
      return {
        ...state,
        aiConfig: {
          ...state.aiConfig,
          [action.payload.agentId]: action.payload.config
        }
      };

    /**
     * 整体替换 aiConfig（用于加载预设方案或外部持久化数据）
     * @param {Object.<string, AgentConfig>} action.payload - 新的完整 aiConfig 对象
     */
    case 'SET_ALL_AI_CONFIG':
      return {
        ...state,
        aiConfig: action.payload
      };

    /**
     * 重置 aiConfig 为默认空配置（敏感信息清空，避免泄露）
     */
    case 'RESET_AI_CONFIG':
      return {
        ...state,
        aiConfig: defaultConfig
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
};

const StudyContext = createContext(null);

/**
 * StudyProvider 组件 - 提供全局状态管理
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export const StudyProvider = ({ children }) => {
  const [state, dispatch] = useReducer(studyReducer, initialState, (initial) => {
    const saved = loadData(STORAGE_KEY, null);
    if (saved) {
      const merged = { ...initial, ...saved };
      merged.stats = { ...initial.stats, ...(saved.stats || {}) };
      merged.stats.currentStreak = calculateCurrentStreak(merged.checkInDates || []);
      return merged;
    }
    return initial;
  });

  useEffect(() => {
    saveData(STORAGE_KEY, state);
  }, [state]);

  useEffect(() => {
    const today = getToday();
    if (!state.checkInDates.includes(today) && state.answerRecords.some(r => r.date === today)) {
      dispatch({ type: 'CHECK_IN' });
    }
  }, [state.answerRecords, state.checkInDates]);

  const uploadMaterial = useCallback(
    (material) => dispatch({ type: 'UPLOAD_MATERIAL', payload: material }),
    []
  );
  const deleteMaterial = useCallback(
    (materialId) => dispatch({ type: 'DELETE_MATERIAL', payload: materialId }),
    []
  );
  const setPlan = useCallback(
    (plan) => dispatch({ type: 'SET_PLAN', payload: plan }),
    []
  );
  const setQuestions = useCallback(
    (questions) => dispatch({ type: 'SET_QUESTIONS', payload: questions }),
    []
  );
  const addQuestion = useCallback(
    (question) => dispatch({ type: 'ADD_QUESTION', payload: question }),
    []
  );
  const updateQuestion = useCallback(
    (question) => dispatch({ type: 'UPDATE_QUESTION', payload: question }),
    []
  );
  const deleteQuestion = useCallback(
    (id) => dispatch({ type: 'DELETE_QUESTION', payload: id }),
    []
  );
  const setExamDate = useCallback(
    (date) => dispatch({ type: 'SET_EXAM_DATE', payload: date }),
    []
  );
  const addAnswer = useCallback(
    (record) => dispatch({ type: 'ADD_ANSWER', payload: record }),
    []
  );
  const addWrongQuestion = useCallback(
    (wrongQuestion) => dispatch({ type: 'ADD_WRONG_QUESTION', payload: wrongQuestion }),
    []
  );
  const markWrongQuestionMastered = useCallback(
    (id) => dispatch({ type: 'MARK_WRONG_QUESTION_MASTERED', payload: id }),
    []
  );
  const markMastered = useCallback(
    (knowledgePointId) => dispatch({ type: 'MARK_MASTERED', payload: { knowledgePointId } }),
    []
  );
  const addResourceLink = useCallback(
    (link) => dispatch({ type: 'ADD_RESOURCE_LINK', payload: link }),
    []
  );
  const deleteResourceLink = useCallback(
    (id) => dispatch({ type: 'DELETE_RESOURCE_LINK', payload: id }),
    []
  );
  const updateAgentStatus = useCallback(
    (status) => dispatch({ type: 'UPDATE_AGENT_STATUS', payload: status }),
    []
  );
  const checkIn = useCallback(
    () => dispatch({ type: 'CHECK_IN' }),
    []
  );
  const recordFocusTime = useCallback(
    (minutes) => dispatch({ type: 'RECORD_FOCUS_TIME', payload: minutes }),
    []
  );
  const updateStats = useCallback(
    (stats) => dispatch({ type: 'UPDATE_STATS', payload: stats }),
    []
  );
  const loadDemoDataAction = useCallback(
    () => dispatch({ type: 'LOAD_DEMO_DATA' }),
    []
  );
  const resetState = useCallback(
    () => dispatch({ type: 'RESET_STATE' }),
    []
  );
  /** 切换运行模式：'demo' 演示模式 / 'formal' 正式模式 */
  const setMode = useCallback(
    (mode) => dispatch({ type: 'SET_MODE', payload: mode }),
    []
  );
  /** 设置单个 Agent 的 AI 配置（agentId 对应 quiz-master/explainer/supervisor） */
  const setAIConfig = useCallback(
    (agentId, config) => dispatch({ type: 'SET_AI_CONFIG', payload: { agentId, config } }),
    []
  );
  /** 整体替换 aiConfig（用于加载预设方案或持久化数据恢复） */
  const setAllAIConfig = useCallback(
    (config) => dispatch({ type: 'SET_ALL_AI_CONFIG', payload: config }),
    []
  );
  /** 重置 aiConfig 为默认空配置（清空敏感的 apiKey 等信息） */
  const resetAIConfig = useCallback(
    () => dispatch({ type: 'RESET_AI_CONFIG' }),
    []
  );

  const dueReviewQuestions = useMemo(() => {
    return getDueReviews(state.answerRecords, state.wrongQuestions);
  }, [state.answerRecords, state.wrongQuestions]);

  const value = {
    state,
    dispatch,
    uploadMaterial,
    deleteMaterial,
    setPlan,
    setQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    setExamDate,
    addAnswer,
    addWrongQuestion,
    markWrongQuestionMastered,
    markMastered,
    addResourceLink,
    deleteResourceLink,
    updateAgentStatus,
    checkIn,
    recordFocusTime,
    updateStats,
    loadDemoData: loadDemoDataAction,
    resetState,
    setMode,
    setAIConfig,
    setAllAIConfig,
    resetAIConfig,
    dueReviewQuestions
  };

  return (
    <StudyContext.Provider value={value}>
      {children}
    </StudyContext.Provider>
  );
};

/**
 * 自定义 Hook - 使用 StudyContext
 * @returns {Object} { state, dispatch, ...actions }
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useStudyContext = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudyContext must be used within a StudyProvider');
  }
  return context;
};

export default StudyContext;
