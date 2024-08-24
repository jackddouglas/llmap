import React from 'react';

interface EdgeLabelProps {
  query: string;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
}

export const EdgeLabel: React.FC<EdgeLabelProps> = ({ query, fromPosition, toPosition }) => {
  const midX = (fromPosition.x + toPosition.x) / 2;
  const midY = (fromPosition.y + toPosition.y) / 2;

  return (
    <div
      className="absolute bg-gray-800 text-white px-2 py-1 rounded-md text-sm"
      style={{
        left: `${midX}px`,
        top: `${midY}px`,
        transform: 'translate(-50%, -50%)',
        maxWidth: '200px',
        wordWrap: 'break-word',
      }}
    >
      {query}
    </div>
  );
};