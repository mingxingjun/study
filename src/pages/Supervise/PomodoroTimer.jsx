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

  // 暖灰阶配色：专注模式金色进度环，休息模式温灰
  const ringColor = isFocusMode ? '#c9a227' : '#837b71';
  const bgRingColor = isFocusMode ? '#f4f2ef' : '#e8e5e0';

  return (
    <div className="flex flex-col items-center w-full relative">
      {/* 模式标签 - 金色 / 灰色对比 */}
      <div className="flex items-center gap-2.5 mb-8">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
            isFocusMode ? 'bg-accent' : 'bg-gray-400'
          } ${isRunning ? 'animate-pulse' : ''}`}
        />
        <span
          className={`text-[11px] font-mono tracking-[0.25em] uppercase transition-colors duration-300 ${
            isFocusMode ? 'text-accent-dark' : 'text-gray-500'
          }`}
        >
          {isFocusMode ? 'Focus Mode' : 'Break Mode'}
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-[11px] font-mono text-gray-400 tracking-[0.2em] uppercase">
          {isFocusMode ? '25 min' : '05 min'}
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
            strokeWidth="4"
          />
          {/* 进度圆环 - 专注时金色，休息时灰色 */}
          <circle
            ref={progressRef}
            cx="140"
            cy="140"
            r="120"
            fill="none"
            stroke={ringColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={targetOffset}
            style={isFocusMode ? { filter: 'drop-shadow(0 0 8px rgba(201, 162, 39, 0.25))' } : {}}
          />
        </svg>

        {/* 中心时间显示 - 大号衬线数字 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-serif text-primary tabular-nums"
            style={{
              fontWeight: 400,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              fontSize: 'clamp(3.5rem, 8vw, 5rem)'
            }}
          >
            {formatTime(timeLeft)}
          </span>
          <span className="mt-4 text-[10px] text-gray-400 font-mono tracking-[0.3em] uppercase">
            {isFocusMode ? 'Focus · 25 min' : 'Break · 05 min'}
          </span>
        </div>
      </div>

      {/* 控制按钮组 */}
      <div className="flex items-center gap-6">
        <button
          onClick={handleReset}
          aria-label="重置"
          className="w-11 h-11 rounded-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-100 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </button>

        <button
          onClick={handleStartPause}
          aria-label={isRunning ? '暂停' : '开始'}
          className="w-16 h-16 rounded-full bg-primary text-accent flex items-center justify-center hover:bg-secondary transition-all duration-200 active:scale-95 cursor-pointer shadow-md hover:shadow-lg"
        >
          {isRunning ? (
            <Pause className="w-6 h-6" fill="currentColor" strokeWidth={1.5} />
          ) : (
            <Play className="w-6 h-6 ml-0.5" fill="currentColor" strokeWidth={1.5} />
          )}
        </button>

        <button
          onClick={handleSkip}
          aria-label="跳过"
          className="w-11 h-11 rounded-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-100 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <SkipForward className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </button>
      </div>

      {/* 底部状态提示 */}
      <div className="mt-7 flex items-center gap-2.5 text-xs">
        <span
          className={`font-mono tracking-[0.15em] uppercase ${
            isRunning ? 'text-accent-dark' : 'text-gray-400'
          }`}
        >
          {isRunning ? 'Running' : 'Paused'}
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-gray-500 font-serif" style={{ fontWeight: 500 }}>
          {isFocusMode ? '保持专注' : '稍作休息'}
        </span>
      </div>
    </div>
  );
};

export default PomodoroTimer;
