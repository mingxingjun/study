import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { agents as mockAgents } from '../mock/agents';
import { useStudyContext } from '../context/StudyContext';
import { callAI, mockGetSuperviseMessage, getAgentOptions } from '../services/aiService';
import { agentPrompts } from '../config/agentPrompts';

/**
 * @typedef {Object} AgentMessage
 * @property {string} id
 * @property {string} agentId
 * @property {string} content
 * @property {boolean} isTyping
 * @property {string} timestamp
 */

/**
 * @typedef {Object} Agent
 * @property {string} id
 * @property {string} name
 * @property {string} role
 * @property {string} color
 * @property {string} avatarEmoji
 * @property {string} description
 * @property {'idle'|'thinking'|'working'|'speaking'} status
 * @property {string} message
 * @property {AgentMessage[]} history
 */

/**
 * useAgents - 管理 Agent 状态和对话队列的自定义 Hook
 * @returns {Object} { agents, setAgentStatus, sendMessage, thinkAndSay, thinkAndCallAI, callAgentAI, callMultipleAgents, clearHistory }
 */
export const useAgents = () => {
  const { state, updateAgentStatus } = useStudyContext();
  const mode = state.mode; // 'demo' or 'formal'
  const aiConfig = useMemo(() => state.aiConfig || {}, [state.aiConfig]);

  const [agents, setAgents] = useState(() =>
    mockAgents.map(agent => ({
      ...agent,
      status: 'idle',
      history: []
    }))
  );

  const messageQueue = useRef([]);
  const isProcessing = useRef(false);
  const timeoutsRef = useRef(new Map());
  const processQueueRef = useRef(null);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const setAgentStatusInternal = useCallback((agentId, status, message) => {
    setAgents(prev =>
      prev.map(a =>
        a.id === agentId
          ? { ...a, status, ...(message !== undefined ? { message } : {}) }
          : a
      )
    );
    updateAgentStatus({ id: agentId, status, ...(message !== undefined ? { message } : {}) });
  }, [updateAgentStatus]);

  const addMessageInternal = useCallback((agentId, content) => {
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      content,
      isTyping: false,
      timestamp: new Date().toISOString()
    };
    setAgents(prev =>
      prev.map(a =>
        a.id === agentId
          ? {
              ...a,
              status: 'speaking',
              history: [...a.history, newMessage],
              message: content
            }
          : a
      )
    );
    updateAgentStatus({ id: agentId, status: 'speaking', message: content });
    return newMessage;
  }, [updateAgentStatus]);

  processQueueRef.current = () => {
    if (isProcessing.current || messageQueue.current.length === 0) {
      return;
    }

    isProcessing.current = true;
    const nextTask = messageQueue.current.shift();

    if (!nextTask) {
      isProcessing.current = false;
      return;
    }

    const { agentId, message, delay, resolve } = nextTask;

    setAgentStatusInternal(agentId, 'thinking');

    const thinkingKey = `thinking-${agentId}`;
    if (timeoutsRef.current.has(thinkingKey)) {
      clearTimeout(timeoutsRef.current.get(thinkingKey));
    }

    const timeoutId = setTimeout(() => {
      addMessageInternal(agentId, message);

      const speakingKey = `speaking-${agentId}`;
      if (timeoutsRef.current.has(speakingKey)) {
        clearTimeout(timeoutsRef.current.get(speakingKey));
      }

      const speakingTimeout = setTimeout(() => {
        setAgentStatusInternal(agentId, 'idle', message);
        isProcessing.current = false;
        timeoutsRef.current.delete(thinkingKey);
        timeoutsRef.current.delete(speakingKey);
        resolve && resolve();
        if (processQueueRef.current) {
          processQueueRef.current();
        }
      }, 800);

      timeoutsRef.current.set(speakingKey, speakingTimeout);
    }, delay);

    timeoutsRef.current.set(thinkingKey, timeoutId);
  };

  /**
   * 设置 Agent 状态
   * @param {string} agentId - Agent ID
   * @param {'idle'|'thinking'|'working'|'speaking'} status - 新状态
   */
  const setAgentStatus = useCallback((agentId, status) => {
    setAgentStatusInternal(agentId, status);
  }, [setAgentStatusInternal]);

  /**
   * 发送消息（直接显示，不经过队列）
   * @param {string} agentId - Agent ID
   * @param {string} message - 消息内容
   */
  const sendMessage = useCallback((agentId, message) => {
    const thinkingKey = `thinking-${agentId}`;
    const speakingKey = `speaking-${agentId}`;

    if (timeoutsRef.current.has(thinkingKey)) {
      clearTimeout(timeoutsRef.current.get(thinkingKey));
      timeoutsRef.current.delete(thinkingKey);
    }

    addMessageInternal(agentId, message);

    if (timeoutsRef.current.has(speakingKey)) {
      clearTimeout(timeoutsRef.current.get(speakingKey));
    }

    const speakingTimeout = setTimeout(() => {
      setAgentStatusInternal(agentId, 'idle', message);
      timeoutsRef.current.delete(speakingKey);
    }, 800);

    timeoutsRef.current.set(speakingKey, speakingTimeout);
  }, [addMessageInternal, setAgentStatusInternal]);

  /**
   * 思考后说话（先显示 thinking，延迟后显示消息，支持队列）
   * @param {string} agentId - Agent ID
   * @param {string} message - 消息内容
   * @param {number} [delay=1000] - 思考延迟（毫秒）
   * @returns {Promise<void>}
   */
  const thinkAndSay = useCallback((agentId, message, delay = 1000) => {
    return new Promise((resolve) => {
      messageQueue.current.push({ agentId, message, delay, resolve });
      if (processQueueRef.current) {
        processQueueRef.current();
      }
    });
  }, []);

  /**
   * 清空指定 Agent 的对话历史
   * @param {string} [agentId] - Agent ID，不传则清空所有
   */
  const clearHistory = useCallback((agentId) => {
    setAgents(prev =>
      prev.map(a => {
        if (agentId && a.id !== agentId) return a;
        const originalAgent = mockAgents.find(m => m.id === a.id);
        return {
          ...a,
          history: [],
          message: originalAgent?.message || a.message,
          status: 'idle'
        };
      })
    );
  }, []);

  /**
   * 获取 Mock 响应（演示模式使用）
   * @param {string} agentId - Agent ID
   * @param {Object} context - 额外上下文
   * @returns {Promise<string>} Mock 响应文本
   */
  const getMockResponse = (agentId, context) => {
    // 根据 Agent 类型和上下文返回对应的 Mock 响应
    if (agentId === 'quiz-master') {
      return Promise.resolve('好的，我来为你出题！');
    } else if (agentId === 'explainer') {
      // 有题目上下文时，返回结构化错题分析
      if (context.question) {
        return Promise.resolve(JSON.stringify({
          isCorrect: false,
          score: 30,
          errorRootCause: '概念混淆：你可能混淆了相关知识点，导致选择了错误答案。建议回顾基础概念，理解各选项之间的本质区别后再做类似题目。',
          knowledgeReview: '本题考察的核心知识点需要结合理论理解和实际应用。建议从基础定义出发，理解每个概念的内涵与外延，逐步建立完整的知识体系。',
          stepByStep: '1. 审题：仔细阅读题干，明确题目在问什么，抓住关键信息。\n2. 分析选项：逐一分析每个选项，排除明显错误或与题干无关的选项。\n3. 对比验证：将剩余选项与已学知识进行对比，找到最符合题意的答案。\n4. 确认答案：用排除法和知识点验证确定最终答案。',
          metacognitivePrompt: '下次遇到类似题目，你会先从哪里入手分析？能否总结出一个通用的解题框架？',
          similarQuestion: {
            question: '这是一道与错题考察相同知识点的变式题，建议你尝试做一下以巩固理解。',
            options: ['A. 选项一', 'B. 选项二', 'C. 选项三', 'D. 选项四'],
            answer: 'B',
            explanation: '本题与错题考察相同知识点，通过变式练习可以加深对概念的理解，避免同类错误。'
          },
          tips: '1. 整理错题时，用不同颜色标注错误类型（概念不清/计算失误/审题偏差），方便针对性复习。\n2. 每周回顾一次错题本，重点关注反复出错的题型，做到举一反三。'
        }));
      }
      return Promise.resolve('让我来为你详细解析这道题。');
    } else if (agentId === 'supervisor') {
      return Promise.resolve(mockGetSuperviseMessage(context));
    }
    return Promise.resolve('收到！');
  };

  /**
   * 调用 AI（根据模式自动选择 Mock 或真实 AI）
   * @param {string} agentId - Agent ID
   * @param {string} userMessage - 用户消息/指令
   * @param {Object} [context] - 额外上下文 { question, userAnswer, knowledgePoint, etc }
   * @returns {Promise<string>} AI 响应文本
   */
  const callAgentAI = useCallback(async (agentId, userMessage, context = {}, customSystemPrompt, customOptions) => {
    // Demo mode: return mock response
    if (mode === 'demo') {
      return getMockResponse(agentId, context);
    }

    // Formal mode: call real AI
    const config = aiConfig[agentId];
    if (!config || !config.providerId || !config.apiKey) {
      throw new Error('AI 未配置，请先在设置页面配置');
    }

    const systemPrompt = customSystemPrompt || agentPrompts[agentId] || '你是一个学习助手。';
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    const options = customOptions || getAgentOptions(agentId);
    const response = await callAI(config, messages, options);
    return response;
  }, [mode, aiConfig]);

  /**
   * 思考后调用 AI（先显示 thinking，调用 AI，再显示结果）
   * @param {string} agentId - Agent ID
   * @param {string} userMessage - 用户消息
   * @param {Object} [context] - 额外上下文
   * @param {string} [customSystemPrompt] - 自定义系统提示词（可选，覆盖默认）
   * @param {Object} [customOptions] - 自定义生成参数（可选，覆盖默认 maxTokens/temperature）
   * @returns {Promise<string>} AI 响应
   */
  const thinkAndCallAI = useCallback(async (agentId, userMessage, context = {}, customSystemPrompt, customOptions) => {
    setAgentStatusInternal(agentId, 'thinking');

    try {
      const response = await callAgentAI(agentId, userMessage, context, customSystemPrompt, customOptions);
      addMessageInternal(agentId, response);

      // Auto return to idle after speaking
      setTimeout(() => {
        setAgentStatusInternal(agentId, 'idle', response);
      }, 800);

      return response;
    } catch (error) {
      const errorMsg = `AI 调用失败: ${error.message}`;
      addMessageInternal(agentId, errorMsg);
      setAgentStatusInternal(agentId, 'idle', errorMsg);
      return errorMsg;
    }
  }, [callAgentAI, setAgentStatusInternal, addMessageInternal]);

  /**
   * 并行调用多个 Agent
   * @param {Array<{agentId, userMessage, context}>} calls - 调用列表
   * @returns {Promise<Array<string>>} 每个调用的响应
   */
  const callMultipleAgents = useCallback(async (calls) => {
    // Set all agents to thinking
    calls.forEach(({ agentId }) => {
      setAgentStatusInternal(agentId, 'thinking');
    });

    // Parallel calls
    const results = await Promise.allSettled(
      calls.map(({ agentId, userMessage, context }) =>
        callAgentAI(agentId, userMessage, context)
      )
    );

    // Display results sequentially
    for (let i = 0; i < results.length; i++) {
      const { agentId } = calls[i];
      if (results[i].status === 'fulfilled') {
        addMessageInternal(agentId, results[i].value);
      } else {
        const errorMsg = `AI 调用失败: ${results[i].reason?.message || '未知错误'}`;
        addMessageInternal(agentId, errorMsg);
      }
    }

    // Return all to idle
    setTimeout(() => {
      calls.forEach(({ agentId }) => {
        setAgentStatusInternal(agentId, 'idle');
      });
    }, 800);

    return results.map(r => r.status === 'fulfilled' ? r.value : null);
  }, [callAgentAI, setAgentStatusInternal, addMessageInternal]);

  return {
    agents,
    setAgentStatus,
    sendMessage,
    thinkAndSay,      // 演示模式：使用预设消息+延迟
    thinkAndCallAI,   // 正式模式：思考后调用真实 AI
    callAgentAI,      // 直接调用 AI（按模式自动选择 Mock 或真实）
    callMultipleAgents, // 并行调用多个 Agent
    clearHistory
  };
};

export default useAgents;
