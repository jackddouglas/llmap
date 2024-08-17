"use client";

import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PomodoroTimer from '@/components/ui/timer';
import { callLLM } from '@/lib/worker';

const Node = ({ id, text, position, onDrag, onQuery }: { id: number; text: string; position: { x: number; y: number; }; onDrag: any; onQuery: any; }) => {
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

const QueryLabel = ({ query, x, y }: { query: any, x: any, y: any }) => {
  const labelRef = useRef<SVGTextElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (labelRef.current) {
      setDimensions({
        width: labelRef.current.getBBox().width,
        height: labelRef.current.getBBox().height
      });
    }
  }, [query]);

  return (
    <g>
      <rect
        x={x - dimensions.width / 2 - 10}
        y={y - dimensions.height / 2 - 5}
        width={dimensions.width + 20}
        height={dimensions.height + 10}
        fill="#4a5568"
        rx="15"
        ry="15"
      />
      <text
        ref={labelRef}
        x={x}
        y={y}
        fontSize="14"
        fill="white"
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {query}
      </text>
    </g>
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
}

function isNodeWithPosition(node: any): node is { position: { x: number; y: number } } {
  return node && typeof node.position === 'object' &&
    typeof node.position.x === 'number' &&
    typeof node.position.y === 'number';
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async (parentId = null) => {
    try {
      setError(null);
      const response = await callLLM(query);
      const newNode = {
        id: Date.now(),
        text: response,
        position: { x: Math.random() * (window.innerWidth - 350), y: Math.random() * (window.innerHeight - 200) },
      };
      setNodes([...nodes, newNode]);
      if (parentId !== null) {
        setEdges([...edges, { from: parentId, to: newNode.id, query }]);
      }
      setQuery('');
    } catch (err) {
      setError('Failed to get response from Claude API. Please try again.');
    }
  };

  const handleDrag = (id: number, x: number, y: number) => {
    setNodes(nodes.map(node =>
      node.id === id ? { ...node, position: { x, y } } : node
    ));
  };

  return (
    <div className="relative w-full h-screen p-4 overflow-hidden">
      <div className="absolute top-4 right-4 z-10">
        <PomodoroTimer />
      </div>
      <div className="mb-4">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query"
          className="mr-2"
        />
        <Button onClick={() => handleQuery()}>Submit Query</Button>
      </div>

      {error && (
        <Alert variant="destructive">
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
        {edges.map((edge, index) => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);

          if (isNodeWithPosition(fromNode) && isNodeWithPosition(toNode)) {
            const midX = (fromNode.position.x + toNode.position.x) / 2 + 150;
            const midY = (fromNode.position.y + toNode.position.y) / 2 + 50;
            return (
              <g key={index}>
                <line
                  x1={fromNode.position.x + 150}
                  y1={fromNode.position.y + 50}
                  x2={toNode.position.x + 150}
                  y2={toNode.position.y + 50}
                  stroke="#4a5568"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <QueryLabel query={edge.query} x={midX} y={midY} />
              </g>
            );
          } else {
            console.error('Could not find both nodes with valid positions for the edge:', edge);
          }
        })}
      </svg>

      {nodes.map(node => (
        <Node
          key={node.id}
          id={node.id}
          text={node.text}
          position={node.position}
          onDrag={handleDrag}
          onQuery={(id: any, query: string) => {
            setQuery(query);
            handleQuery(id);
          }}
        />
      ))}
    </div>
  );
};
