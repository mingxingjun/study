import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { HelpCircle, BookOpen, Clock } from 'lucide-react';
import useReducedMotion from '../../hooks/useReducedMotion';

/**
 * Agent 头像组件
 * @param {Object} props
 * @param {Object} props.agent - Agent 对象
 * @param {string} props.agent.id - Agent ID
 * @param {string} props.agent.name - Agent 名称
 * @param {string} props.agent.color - Agent 主题色
 * @param {string} [props.agent.avatarEmoji] - Agent 头像 emoji
 * @param {string} [props.agent.role] - Agent 角色
 * @param {'idle'|'thinking'|'working'|'speaking'} [props.agent.status='idle'] - Agent 状态
 * @param {'sm'|'md'|'lg'} [props.size='md'] - 头像尺寸
 * @param {string} [props.className] - 额外的 CSS 类名
 */
const AgentAvatar = ({ agent, size = 'md', className = '' }) => {
  const { color, avatarEmoji, role, status = 'idle' } = agent;
  const reducedMotion = useReducedMotion();
  const avatarRef = useRef(null);

  const sizeConfig = {
    sm: { container: 'w-8 h-8', icon: 16, text: 'text-base' },
    md: { container: 'w-12 h-12', icon: 20, text: 'text-xl' },
    lg: { container: 'w-16 h-16', icon: 28, text: 'text-2xl' }
  };

  const config = sizeConfig[size];

  const getFallbackIcon = () => {
    switch (role) {
      case 'quizMaster':
        return HelpCircle;
      case 'explainer':
        return BookOpen;
      case 'supervisor':
        return Clock;
      default:
        return HelpCircle;
    }
  };

  const FallbackIcon = getFallbackIcon();

  const renderContent = () => {
    if (avatarEmoji) {
      return <span className="select-none">{avatarEmoji}</span>;
    }
    return <FallbackIcon size={config.icon} color={color} />;
  };

  /**
   * 根据状态应用 GSAP 微动画
   * thinking: 呼吸式缩放脉冲
   * speaking: 单次缩放强调
   */
  useGSAP(() => {
    if (!avatarRef.current || reducedMotion || status === 'idle' || status === 'working') {
      return;
    }

    if (status === 'thinking') {
      gsap.to(avatarRef.current, {
        scale: 1.08,
        opacity: 0.75,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      });
    } else if (status === 'speaking') {
      gsap.to(avatarRef.current, {
        scale: 1.08,
        duration: 0.35,
        repeat: 5,
        yoyo: true,
        ease: 'power1.inOut'
      });
    }
  }, [status, reducedMotion]);

  const getBaseStyles = () => {
    const base = {
      borderWidth: '2px',
      borderStyle: 'solid',
      transition: 'all 0.3s ease'
    };

    switch (status) {
      case 'thinking':
      case 'speaking':
        return {
          ...base,
          borderColor: color,
          boxShadow: `0 0 0 4px ${color}20`
        };
      case 'idle':
      default:
        return {
          ...base,
          borderColor: '#d1d5db'
        };
    }
  };

  if (status === 'working') {
    return (
      <div className={`relative rounded-full flex items-center justify-center ${config.container} ${className}`}>
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            border: '2px solid transparent',
            borderTopColor: color,
            borderRightColor: color
          }}
        />
        <div
          className={`${config.container} rounded-full flex items-center justify-center bg-white z-10 ${config.text}`}
          style={{ border: '2px solid #e5e7eb' }}
        >
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={avatarRef}
      className={`rounded-full flex items-center justify-center bg-white ${config.container} ${config.text} ${className}`}
      style={getBaseStyles()}
    >
      {renderContent()}
    </div>
  );
};

export default AgentAvatar;
