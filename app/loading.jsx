"use client"
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AnimatedGraphLoading = () => {
  const [nodes, setNodes] = useState([{ x: 50, y: 50 }]);
  const [edges, setEdges] = useState([]);
  const maxNodes = 50;

  useEffect(() => {
    const interval = setInterval(() => {
      if (nodes.length < maxNodes) {
        const newNode = {
          x: Math.random() * 100,
          y: Math.random() * 100,
        };
        setNodes(prevNodes => [...prevNodes, newNode]);

        const newEdges = Array(Math.floor(Math.random() * 2) + 1).fill().map(() => ({
          start: nodes[Math.floor(Math.random() * nodes.length)],
          end: newNode,
        }));
        setEdges(prevEdges => [...prevEdges, ...newEdges]);
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nodes]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <svg className="w-full h-full">
        {edges.map((edge, index) => (
          <motion.line
            key={`edge-${index}`}
            x1={`${edge.start.x}%`}
            y1={`${edge.start.y}%`}
            x2={`${edge.end.x}%`}
            y2={`${edge.end.y}%`}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0.1 }}
            animate={{ pathLength: 1, opacity: 0.3 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        ))}
        {nodes.map((node, index) => (
          <motion.circle
            key={`node-${index}`}
            cx={`${node.x}%`}
            cy={`${node.y}%`}
            r="3"
            fill="white"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, type: 'spring', stiffness: 100, damping: 10 }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-4xl font-bold text-white bg-black bg-opacity-50 p-4 rounded">
          Loading...
        </div>
      </div>
    </div>
  );
};

export default AnimatedGraphLoading;