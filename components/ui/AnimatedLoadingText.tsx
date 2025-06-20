
import React, { useState, useEffect } from 'react';

interface AnimatedLoadingTextProps {
  messages: string[];
  interval?: number;
  className?: string;
}

const AnimatedLoadingText: React.FC<AnimatedLoadingTextProps> = ({ 
    messages, 
    interval = 2000, 
    className = "text-[var(--color-primary)] opacity-90 text-sm" 
}) => {
    const [messageIndex, setMessageIndex] = useState(0);
    const [dots, setDots] = useState('');

    useEffect(() => {
        const messageIntervalId = setInterval(() => {
            setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
        }, interval); 

        const dotsIntervalId = setInterval(() => {
            setDots((prevDots) => (prevDots.length >= 3 ? '' : prevDots + '.'));
        }, 500); 

        return () => {
            clearInterval(messageIntervalId);
            clearInterval(dotsIntervalId);
        };
    }, [messages, interval]);

    if (!messages || messages.length === 0) {
        return <span className={className}>Carregando{dots}</span>;
    }

    return <span className={className}>{messages[messageIndex]}{dots}</span>;
};

export default AnimatedLoadingText;
