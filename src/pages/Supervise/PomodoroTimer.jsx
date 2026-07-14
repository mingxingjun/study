import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { useStudyContext } from '../../context/StudyContext';
import useReducedMotion from '../../hooks/useReducedMotion';

const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

const PomodoroTimer = ({ onFocusComplete }) => {
  const { recordFocusTime } = useStudyContext();
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(true);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const progressRef = useRef(null);
  const reducedMotion = useReducedMotion();

  const playBeep = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // 音频播放失败时静默忽略，避免打断番茄钟流程
    }
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      playBeep();
      if (isFocusMode) {
        recordFocusTime(25);
        onFocusComplete && onFocusComplete();
        setIsFocusMode(false);
        setTimeLeft(BREAK_DURATION);
      } else {
        setIsFocusMode(true);
        setTimeLeft(FOCUS_DURATION);
      }
      setIsRunning(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, isFocusMode, recordFocusTime, onFocusComplete, playBeep]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const totalDuration = isFocusMode ? FOCUS_DURATION : BREAK_DURATION;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
  const circumference = 2 * Math.PI * 120;
  const targetOffset = circumference - (progress / 100) * circumference;

  /**
   * 使用 GSAP 驱动圆形进度条 stroke-dashoffset 平滑过渡
   * 减少动画偏好时直接设置目标值
   */
  useEffect(() => {
    if (!progressRef.current) {
      return;
    }

    if (reducedMotion) {
      progressRef.current.style.strokeDashoffset = targetOffset;
      return;
    }

    gsap.to(progressRef.current, {
      strokeDashoffset: targetOffset,
      duration: 0.6,
      ease: 'power2.out'
    });
  }, [targetOffset, reducedMotion]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFocusMode(true);
    setTimeLeft(FOCUS_DURATION);
  };

  const handleSkip = () => {
    if (isFocusMode && isRunning) {
      const elapsedMinutes = Math.round((FOCUS_DURATION - timeLeft) / 60);
      if (elapsedMinutes > 0) {
        recordFocusTime(elapsedMinutes);
      }
    }
    setIsRunning(false);
    if (isFocusMode) {
      setIsFocusMode(false);
      setTimeLeft(BREAK_DURATION);
    } else {
      setIsFocusMode(true);
      setTimeLeft(FOCUS_DURATION);
    }
  };

  // 暖灰阶配色：专注模式深墨色，休息模式温灰
  const ringColor = isFocusMode ? '#1a1815' : '#837b71';
  const bgRingColor = isFocusMode ? '#f4f2ef' : '#e8e5e0';

  return (
    <div className="flex flex-col items-center w-full">
      {/* 模式标签 */}
      <div className="flex items-center gap-2 mb-6">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
            isFocusMode ? 'bg-gray-900' : 'bg-gray-400'
          } ${isRunning ? 'animate-pulse' : ''}`}
        />
        <span
          className={`text-xs font-mono tracking-[0.2em] uppercase transition-colors duration-300 ${
            isFocusMode ? 'text-gray-700' : 'text-gray-500'
          }`}
        >
          {isFocusMode ? 'Focus' : 'Break'}
        </span>
      </div>

      {/* 圆形进度环 + 时间显示 */}
      <div className="relative w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] lg:w-[320px] lg:h-[320px] mb-10">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 280 280">
          {/* 背景圆环 */}
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke={bgRingColor}
            strokeWidth="6"
          />
          {/* 进度圆环 */}
          <circle
            ref={progressRef}
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke={ringColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={targetOffset}
          />
        </svg>

        {/* 中心时间显示 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl sm:text-6xl lg:text-7xl font-mono font-light text-gray-900 tracking-tight leading-none tabular-nums"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatTime(timeLeft)}
          </span>
          <span className="mt-3 text-xs text-gray-400 font-mono tracking-[0.25em] uppercase">
            {isFocusMode ? '25 / 25 MIN' : '05 / 05 MIN'}
          </span>
        </div>
      </div>

      {/* 控制按钮组 */}
      <div className="flex items-center gap-5">
        <button
          onClick={handleReset}
          aria-label="重置"
          className="w-11 h-11 rounded-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors duration-200 active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-[18px] h-[18px]" />
        </button>

        <button
          onClick={handleStartPause}
          aria-label={isRunning ? '暂停' : '开始'}
          className="w-16 h-16 rounded-full bg-primary text-gray-50 flex items-center justify-center hover:bg-secondary transition-colors duration-200 active:scale-95 cursor-pointer"
        >
          {isRunning ? (
            <Pause className="w-6 h-6" fill="currentColor" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
          )}
        </button>

        <button
          onClick={handleSkip}
          aria-label="跳过"
          className="w-11 h-11 rounded-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors duration-200 active:scale-95 cursor-pointer"
        >
          <SkipForward className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* 底部状态提示 */}
      <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
        <span className="font-mono tracking-wider">
          {isRunning ? '进行中' : '已暂停'}
        </span>
        <span className="text-gray-300">·</span>
        <span className="font-sans">
          {isFocusMode ? '保持专注' : '稍作休息'}
        </span>
      </div>
    </div>
  );
};

export default PomodoroTimer;
