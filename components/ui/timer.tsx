import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

const PomodoroTimer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [focus, setFocus] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const [activeDiv, setActiveDiv] = useState(-1);
  const [hoveredDiv, setHoveredDiv] = useState(-1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isRunning && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRunning(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, time]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return; // Only update when mouse button is pressed
    const rect = sliderRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const divIndex = Math.floor((x / rect.width) * 50);
      setActiveDiv(Math.min(Math.max(divIndex, 0), 49));
      setTime((divIndex + 1) * 72); // 72 seconds per div (3600 seconds / 50 divs)
    }
  };

  const handleMouseUp = () => {
    if (time > 0 && focus) {
      setIsRunning(true);
    }
  };

  const handlePlayPause = () => {
    setIsRunning(prevState => !prevState);
  };

  const handleRestart = () => {
    setIsRunning(false);
    setTime(0);
    setActiveDiv(-1);
  };

  const handleCancel = () => {
    setIsRunning(false);
    setTime(0);
    setFocus('');
    setActiveDiv(-1);
  };

  return (
    <div 
      className="bg-white p-4 rounded-lg shadow-md min-w-96 max-w-md mx-auto"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Input
        type="text"
        placeholder="What's your focus?"
        value={focus}
        onChange={(e) => setFocus(e.target.value)}
        className="w-full mb-4"
      />
      
      {(!isRunning || isHovering) && (
        <>
          <div 
            ref={sliderRef}
            className="flex mb-2 cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {[...Array(50)].map((_, index) => (
              <div 
                key={index}
                className={`h-8 w-full mx-px ${
                  index <= activeDiv ? 'bg-red-500' : 
                  index === hoveredDiv ? 'bg-red-300' : 'bg-gray-200'
                }`}
                onMouseEnter={() => setHoveredDiv(index)}
                onMouseLeave={() => setHoveredDiv(-1)}
              />
            ))}
          </div>
          
          <div className="flex justify-between items-center text-xs mb-4">
            <div className="flex space-x-2">
              <Button onClick={handleCancel} variant="ghost" size="sm">
                Cancel
              </Button>
              <Button onClick={handleRestart} variant="ghost" size="sm">
                Restart
              </Button>
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
      
      <div className="flex justify-between items-end">
        <Button onClick={handlePlayPause} variant="ghost" size="sm" className="mb-2">
          {isRunning ? 'pause' : 'play'}
        </Button>
        <div className={`${isRunning && !isHovering ? 'text-4xl font-normal' : 'text-6xl font-medium'}`}>
          {formatTime(time)}
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;