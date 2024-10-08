import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';

interface NodeProps {
  id: number;
  text: string;
  position: { x: number; y: number };
  onDrag: (id: number, x: number, y: number) => void;
  onQuery: (id: number, query: string) => void;
  isSelected: boolean;
  onSelect: (id: number) => void;
  selectedText: string;
  onTextSelect: (text: string) => void;
}

export const Node: React.FC<NodeProps> = ({ id, text, position, onDrag, onQuery, isSelected, onSelect, selectedText, onTextSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 100; // Set your desired max length here

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const rect = nodeRef.current?.getBoundingClientRect();
    if (rect) {
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - offset.x;
      const newY = e.clientY - offset.y;
      onDrag(id, newX, newY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      onTextSelect(selection.toString());
    }
  }, [onTextSelect]);

  const displayedText = isExpanded ? text : text.length > maxLength ? text.slice(0, maxLength) + '...' : text;

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={nodeRef}
      className={`max-w-96 absolute p-6 bg-white border ${isSelected ? 'border-blue-500' : 'border-gray-300'} rounded-lg shadow-lg cursor-move w-[80rem]`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseDown={handleMouseDown}
      onClick={() => onSelect(id)}
    >
      <div className="max-w-7xl" onMouseUp={handleTextSelection}>
        <ReactMarkdown className="prose">{displayedText}</ReactMarkdown>
        {text.length > maxLength && !isExpanded && (
          <button onClick={() => setIsExpanded(true)} className="text-blue-500">Read more</button>
        )}
        {isExpanded && (
          <button onClick={() => setIsExpanded(false)} className="text-blue-500">Read less</button>
        )}
      </div>
      <Input
        type="text"
        placeholder="Ask a follow-up question"
        className="w-full mt-4"
        onKeyPress={async (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            const input = e.target as HTMLInputElement;
            await onQuery(id, input.value);
            input.value = '';
          }
        }}
      />
      {selectedText && (
        <div className="mt-2 text-sm text-gray-500 opacity-75">
          &ldquo;{selectedText}&rdquo;
        </div>
      )}
    </div>
  );
};