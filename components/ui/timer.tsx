import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { FiMinimize, FiMaximize2 } from "react-icons/fi";
import { PiTimerBold } from "react-icons/pi";



const PomodoroTimer = () => {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [focus, setFocus] = useState('');
    const [isHovering, setIsHovering] = useState(false);
    const [activeDiv, setActiveDiv] = useState(-1);
    const [hoveredDiv, setHoveredDiv] = useState(-1);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const sliderRef = useRef<HTMLDivElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        if (isRunning && time > 0) {
            intervalRef.current = setInterval(() => {
                setTime((prevTime) => prevTime - 1);
            }, 1000);
        } else if (time === 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsRunning(false);
            playCompletionSound();
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
            const divIndex = Math.floor((x / rect.width) * 60);
            setActiveDiv(Math.min(Math.max(divIndex, 0), 59));
            setTime((divIndex + 1) * 60); // 60 seconds per div (1 minute)
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

    const playCompletionSound = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const context = audioContextRef.current;
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, context.currentTime); // 440 Hz - A4 note

        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, context.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.5);
    };

    const handleMinimizeToggle = () => {
        setIsMinimized(prev => !prev);
    };

    const handlePresetClick = (minutes: number) => {
        setTime(minutes * 60);
        setActiveDiv(minutes - 1);
    };

    if (isMinimized) {
        return (
            <Button
                variant="ghost"
                size="sm"
                className="fixed top-8 right-8"
                onClick={handleMinimizeToggle}
            >
                <PiTimerBold />
            </Button>
        );
    }

    return (
        <div
            className="bg-white p-4 rounded-lg shadow-md min-w-96 max-w-md mx-auto"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className="flex flex-row items-center justify-center mb-4 ">
                <Input
                    type="text"
                    placeholder="What's your focus?"
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    className="w-full"
                />
                <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={handleMinimizeToggle}
                >
                    <FiMinimize />
                </Button>
            </div>

            {(!isRunning || isHovering) && (
                <>
                    <div
                        ref={sliderRef}
                        className="flex mb-2 cursor-pointer"
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    >
                        {[...Array(60)].map((_, index) => (
                            <div
                                key={index}
                                className={`h-8 w-full mx-px ${index <= activeDiv ? 'bg-red-500' :
                                    index === hoveredDiv ? 'bg-red-300' : 'bg-gray-200'
                                    }`}
                                onMouseEnter={() => setHoveredDiv(index)}
                                onMouseLeave={() => setHoveredDiv(-1)}
                            />
                        ))}
                    </div>

                    <div className="flex justify-between items-center text-xs mb-4">
                        {isRunning ? (
                            <Button onClick={handleCancel} variant="ghost" size="sm">
                                Cancel
                            </Button>
                        ) : (
                            <div className="flex space-x-2">
                                <Button onClick={() => handlePresetClick(5)} variant="ghost" size="sm">
                                    5 min
                                </Button>
                                <Button onClick={() => handlePresetClick(10)} variant="ghost" size="sm">
                                    10 min
                                </Button>
                                <Button onClick={() => handlePresetClick(25)} variant="ghost" size="sm">
                                    25 min
                                </Button>
                            </div>
                        )}
                        <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                </>
            )}

            <div className="flex justify-between items-end">
                <Button onClick={handlePlayPause} variant="ghost" size="sm" className="">
                    {isRunning ? 'pause' : 'start'}
                </Button>
                <div className={`${isRunning && !isHovering ? 'text-3xl font-light' : 'text-3xl font-medium'}`}>
                    {formatTime(time)}
                </div>
            </div>
        </div>
    );
};

export default PomodoroTimer;