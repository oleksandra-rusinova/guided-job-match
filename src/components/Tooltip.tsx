import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  delay?: number;
  disabled?: boolean;
}

export default function Tooltip({ children, content, delay = 300, disabled = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (disabled || !content) return;
    
    timeoutRef.current = setTimeout(() => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top - 8,
          left: rect.left + rect.width / 2,
        });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
    setPosition(null);
  }, []);

  // Hide tooltip when content changes or becomes disabled/empty
  useEffect(() => {
    if (disabled || !content) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsVisible(false);
      setPosition(null);
    }
  }, [content, disabled]);

  // Hide tooltip when mouse leaves the document
  useEffect(() => {
    const handleMouseLeave = () => {
      hideTooltip();
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
      setPosition(null);
    };
  }, [hideTooltip]);

  return (
    <div
      ref={wrapperRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {isVisible && position && createPortal(
        <div
          className="fixed z-[9999] px-2 py-1 text-xs text-white bg-gray-600 rounded whitespace-nowrap pointer-events-none"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {content}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-600"
          />
        </div>,
        document.body
      )}
    </div>
  );
}

