"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import PomodoroTimer from '@/components/ui/timer';
import { callLLM } from '@/lib/worker';
import { UserButton, useUser } from '@stackframe/stack';
import { Node } from '@/components/Node';
import { EdgeLabel } from '@/components/EdgeLabel';
import { QueryInput } from '@/components/QueryInput';

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
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useUser({ or: 'redirect' });
  useEffect(() => {
    setAudio(new Audio('/sounds/click.wav'));
  }, []);

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

  const handleQuery = async (parentId: number | null = null, query: string) => {
    if (isLoading) return; // Prevent multiple requests
    try {
      setIsLoading(true);
      setError(null);
      const response = await callLLM(query);
      let newPosition: { x: number; y: number };

      if (parentId === null) {
        newPosition = snapToGrid(window.innerWidth / 2 - 150, 100); // Start at the top
      } else {
        const parentNode = nodes.find(node => node.id === parentId);
        if (parentNode) {
          const horizontalOffset = 100; // Add some horizontal offset
          const verticalSpacing = 300; // Increase vertical spacing
          newPosition = snapToGrid(
            parentNode.position.x + horizontalOffset,
            parentNode.position.y + verticalSpacing
          );
        } else {
          newPosition = snapToGrid(Math.random() * (window.innerWidth - 350), Math.random() * (window.innerHeight - 200));
        }
      }

      const newNode: Node = {
        id: Date.now(),
        text: response || '', // Use an empty string as fallback
        position: newPosition,
      };
      setNodes(prevNodes => [...prevNodes, newNode]);

      if (audio) {
        audio.currentTime = 0;
        audio.play();
      }

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
      console.error(err); // Log the error for debugging
    } finally {
      setIsLoading(false);
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
      <div className='absolute top-4 left-4'>
        <UserButton />
      </div>
      <div className="absolute top-4 right-4 z-10">
        <PomodoroTimer />
      </div>
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-3xl">
        <div className="flex flex-col items-center space-y-4">
          <QueryInput
            query={query}
            setQuery={setQuery}
            handleQuery={() => handleQuery(null, query)}
            handleDeleteSelected={handleDeleteSelected}
            selectedNodesCount={selectedNodes.length}
            isLoading={isLoading}
          />
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
          onQuery={(id: number, query: string) => handleQuery(id, query)}
          isSelected={selectedNodes.includes(node.id)}
          onSelect={handleNodeSelect}
        />
      ))}
    </div>
  );
}
