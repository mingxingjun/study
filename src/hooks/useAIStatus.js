import { useEffect, useState } from 'react';
import { subscribeAIStatus, getLastAIStatus } from '../services/aiService';

/**
 * 订阅 AI 服务韧性状态（重试、JSON 修复等）
 * @returns {{message: string, type: string, timestamp: number}}
 */
export const useAIStatus = () => {
    const [status, setStatus] = useState(getLastAIStatus);

    useEffect(() => {
        return subscribeAIStatus(setStatus);
    }, []);

    return status;
};

export default useAIStatus;
