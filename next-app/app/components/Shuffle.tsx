import React, { useEffect, useRef, useState } from 'react';

interface ShuffleProps {
  text: string;
  shuffleDirection?: 'left' | 'right';
  duration?: number;
  animationMode?: 'sequential' | 'evenodd';
  shuffleTimes?: number;
  ease?: string;
  stagger?: number;
  threshold?: number;
  triggerOnce?: boolean;
  triggerOnHover?: boolean;
  respectReducedMotion?: boolean;
  loop?: boolean;
  loopDelay?: number;
  className?: string;
}

const CHARS = '!<>-_\\/[]{}—=+*^?#0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const Shuffle: React.FC<ShuffleProps> = ({
  text,
  duration = 0.35,
  animationMode = 'evenodd',
  stagger = 0.03,
  triggerOnHover = true,
  className = ''
}) => {
  const [displayChars, setDisplayChars] = useState<string[]>(() => text.split(''));
  const isAnimating = useRef(false);

  const triggerShuffle = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const chars = text.split('');
    const totalChars = chars.length;
    const order: number[] = [];

    if (animationMode === 'evenodd') {
      for (let i = 0; i < totalChars; i += 2) order.push(i);
      for (let i = 1; i < totalChars; i += 2) order.push(i);
    } else {
      for (let i = 0; i < totalChars; i++) order.push(i);
    }

    const currentDisplay = [...chars];
    let completed = 0;
    const activeCount = order.filter(idx => chars[idx] !== ' ').length;

    order.forEach((index, step) => {
      if (chars[index] === ' ') return;

      const delay = step * stagger * 1000;
      const totalTicks = 5;
      let tick = 0;

      setTimeout(() => {
        const interval = setInterval(() => {
          if (tick < totalTicks - 1) {
            currentDisplay[index] = CHARS[Math.floor(Math.random() * CHARS.length)];
            setDisplayChars([...currentDisplay]);
            tick++;
          } else {
            currentDisplay[index] = chars[index];
            setDisplayChars([...currentDisplay]);
            clearInterval(interval);
            completed++;
            if (completed >= activeCount) {
              isAnimating.current = false;
            }
          }
        }, (duration * 1000) / totalTicks);
      }, delay);
    });
  };

  useEffect(() => {
    triggerShuffle();
  }, [text]);

  return (
    <span
      className={`inline-flex select-none ${className}`}
      onMouseEnter={triggerOnHover ? triggerShuffle : undefined}
    >
      {displayChars.map((c, i) => (
        <span key={i} className="inline-block">
          {c === ' ' ? '\u00A0' : c}
        </span>
      ))}
    </span>
  );
};

export default Shuffle;
