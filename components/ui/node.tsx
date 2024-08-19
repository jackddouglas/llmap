import { useEffect, useRef, useState } from "react";
import { Input } from "./input";

export const Node = ({ id, text, position, onDrag, onQuery }: { id: number; text: string; position: { x: number; y: number; }; onDrag: any; onQuery: (id: number, query: string) => void; }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: any) => {
    setIsDragging(true);
    const rect = nodeRef.current?.getBoundingClientRect();
    if (rect) {
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: any) => {
    if (isDragging) {
      const newX = e.clientX - offset.x;
      const newY = e.clientY - offset.y;
      onDrag(id, newX, newY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
      className="absolute p-6 bg-white border border-gray-300 rounded-lg shadow-lg cursor-move"
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: '300px' }}
      onMouseDown={handleMouseDown}
    >
      <h3 className="text-lg font-semibold mb-3">{text}</h3>
      <Input
        type="text"
        placeholder="Ask a follow-up question"
        className="w-full mb-2"
        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            const input = e.target as HTMLInputElement;
            onQuery(id, input.value);
            input.value = '';
          }
        }}
      />
    </div>
  );
};
