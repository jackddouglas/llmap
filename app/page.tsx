"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PomodoroTimer from '@/components/ui/timer';
import { callLLM } from '@/lib/worker';

interface NodeProps {
  id: number;
  text: string;
  position: { x: number; y: number };
  onDrag: (id: number, x: number, y: number) => void;
  onQuery: (id: number, query: string) => void;
  isSelected: boolean;
  onSelect: (id: number) => void;
}

const Node = ({ id, text, position, onDrag, onQuery, isSelected, onSelect }: NodeProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

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
      <div className="max-w-7xl">
        <h3 className="text-sm font-medium mb-3">{text}</h3>
      </div>
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

interface EdgeLabelProps {
  query: string;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
}

const EdgeLabel = ({ query, fromPosition, toPosition }: EdgeLabelProps) => {
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

interface Node {
  id: number;
  text: string;
  position: {
    x: number;
    y: number;
  };
}

interface Edge {
  from: number;
  to: number;
  query: string;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
}

interface GridPoint {
  x: number;
  y: number;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]);
  const [firstQuery, setFirstQuery] = useState<string | null>(null);
  const [gridPoints, setGridPoints] = useState<GridPoint[]>([]);

  const generateGrid = useCallback(() => {
    const gridSize = 50;
    const points: GridPoint[] = [];
    for (let x = 0; x < window.innerWidth; x += gridSize) {
      for (let y = 0; y < window.innerHeight; y += gridSize) {
        points.push({ x, y });
      }
    }
    setGridPoints(points);
  }, []);

  useEffect(() => {
    generateGrid();
    window.addEventListener('resize', generateGrid);
    return () => window.removeEventListener('resize', generateGrid);
  }, [generateGrid]);

  const snapToGrid = (x: number, y: number): GridPoint => {
    const gridSize = 50;
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  };

  const handleQuery = async (parentId: number | null = null) => {
    try {
      setError(null);
      const response = await callLLM(query);
      const newPosition = parentId === null
        ? snapToGrid(window.innerWidth / 2 - 150, window.innerHeight / 2 - 100)
        : snapToGrid(Math.random() * (window.innerWidth - 350), Math.random() * (window.innerHeight - 200));
      
      const newNode = {
        id: Date.now(),
        text: response,
        position: newPosition,
      };
      setNodes(prevNodes => [...prevNodes, newNode]);
      
      if (parentId !== null) {
        const parentNode = nodes.find(node => node.id === parentId);
        if (parentNode) {
          setEdges(prevEdges => [...prevEdges, {
            from: parentId,
            to: newNode.id,
            query,
            fromPosition: parentNode.position,
            toPosition: newPosition,
          }]);
        }
      } else {
        setFirstQuery(query);
      }
      setQuery('');
    } catch (err) {
      setError('Failed to get response from LLM. Please try again.');
    }
  };

  const handleDrag = (id: number, x: number, y: number) => {
    const snappedPosition = snapToGrid(x, y);

    setNodes(prevNodes => prevNodes.map(node =>
      node.id === id ? { ...node, position: snappedPosition } : node
    ));
    setEdges(prevEdges => prevEdges.map(edge => {
      if (edge.from === id) {
        return { ...edge, fromPosition: snappedPosition };
      }
      if (edge.to === id) {
        return { ...edge, toPosition: snappedPosition };
      }
      return edge;
    }));
  };

  const handleNodeSelect = (id: number) => {
    setSelectedNodes(prev => 
      prev.includes(id) ? prev.filter(nodeId => nodeId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    setNodes(nodes.filter(node => !selectedNodes.includes(node.id)));
    setEdges(edges.filter(edge => 
      !selectedNodes.includes(edge.from) && !selectedNodes.includes(edge.to)
    ));
    setSelectedNodes([]);
  };

  return (
    <div className="relative w-full h-screen p-4 overflow-hidden">
      {/* Render grid points */}
      {gridPoints.map((point, index) => (
        <div
          key={index}
          className="absolute w-1 h-1 bg-gray-200 rounded-full"
          style={{ left: `${point.x}px`, top: `${point.y}px` }}
        />
      ))}

      <div className="absolute top-4 right-4 z-10">
        <PomodoroTimer />
      </div>
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-3xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center w-full">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query"
              className="flex-grow mr-2"
            />
            <Button onClick={() => handleQuery()} className="mr-2">Submit Query</Button>
            <Button 
              onClick={handleDeleteSelected} 
              variant="destructive" 
              disabled={selectedNodes.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedNodes.length})
            </Button>
          </div>
          {firstQuery && (
            <div className="text-sm font-medium text-gray-500 text-center w-full">
              First Query: {firstQuery}
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7"
            refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#4a5568" />
          </marker>
        </defs>
        {edges.map((edge, index) => (
          <line
            key={index}
            x1={edge.fromPosition.x + 150}
            y1={edge.fromPosition.y + 50}
            x2={edge.toPosition.x + 150}
            y2={edge.toPosition.y + 50}
            stroke="#4a5568"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
        ))}
      </svg>

      {edges.map((edge, index) => (
        <EdgeLabel
          key={`label-${index}`}
          query={edge.query}
          fromPosition={edge.fromPosition}
          toPosition={edge.toPosition}
        />
      ))}

      {nodes.map(node => (
        <Node
          key={node.id}
          id={node.id}
          text={node.text}
          position={node.position}
          onDrag={handleDrag}
          onQuery={(id: number, query: string) => {
            setQuery(query);
            handleQuery(id);
          }}
          isSelected={selectedNodes.includes(node.id)}
          onSelect={handleNodeSelect}
        />
      ))}
    </div>
  );
}