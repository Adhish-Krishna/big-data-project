import React, { useState, useEffect, useRef } from 'react';
import { GraphData, RebalancingItem } from '../types';
import { api } from '../services/api';
import {
  getMockGraphData,
  getMockRebalancing,
  getMockHubInventory,
} from '../services/mockData';
import {
  Share2,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';

interface SimulatedNode {
  id: string;
  label: string;
  type: 'Hub' | 'Vehicle' | 'Customer' | 'Technician';
  properties: Record<string, any>;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const nodeColorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  Hub: { bg: '#111111', border: '#c9a84c', text: '#c9a84c', icon: '🏢' },
  Vehicle: { bg: '#141414', border: '#ffffff', text: '#ffffff', icon: '🚗' },
  Customer: { bg: '#161616', border: '#38bdf8', text: '#38bdf8', icon: '👤' },
  Technician: { bg: '#161616', border: '#a855f7', text: '#a855f7', icon: '🔧' },
};

function computeInitialLayout(nodes: any[]): SimulatedNode[] {
  const width = 800;
  const height = 560;
  return nodes.map((n, i) => {
    const angle = (i / Math.max(1, nodes.length)) * 2 * Math.PI;
    const radius = n.type === 'Hub' ? 140 : n.type === 'Vehicle' ? 240 : 310;
    return {
      ...n,
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
    };
  });
}

const initialMockGraph = getMockGraphData(35);
const initialSimNodes = computeInitialLayout(initialMockGraph.nodes);

export const Neo4jGraphPage: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>(initialMockGraph);
  const [rebalancing, setRebalancing] = useState<RebalancingItem[]>(getMockRebalancing());
  const [hubStats, setHubStats] = useState<any[]>(getMockHubInventory());
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<SimulatedNode | null>(initialSimNodes[0] || null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [rebalanceSuccess, setRebalanceSuccess] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'graph' | 'inventory' | 'rebalance'>('graph');

  // Simulated node physics layout
  const [simNodes, setSimNodes] = useState<SimulatedNode[]>(initialSimNodes);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const [g, reb, inv] = await Promise.all([
        api.getNetworkGraph(35),
        api.getRebalancingRecommendations(),
        api.getHubInventory(),
      ]);
      setGraphData(g);
      setRebalancing(reb);
      setHubStats(inv);

      if (g.nodes && g.nodes.length > 0) {
        const initialized = computeInitialLayout(g.nodes);
        setSimNodes(initialized);
        if (!selectedNode && initialized.length > 0) {
          setSelectedNode(initialized[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load graph data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  // Stable organic spring force simulation loop with normalized physics & boundary protection
  useEffect(() => {
    if (simNodes.length === 0 || graphData.nodes.length === 0) return;

    let step = 0;
    const interval = setInterval(() => {
      if (step > 40) {
        clearInterval(interval);
        return;
      }
      step++;

      setSimNodes((prevNodes) => {
        const next = prevNodes.map((n) => ({ ...n }));
        const nodeMap = new Map(next.map((n) => [n.id, n]));

        // 1. Repulsion between all nodes (using unit vectors to avoid quadratic explosion)
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i];
            const b = next[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = 85;
            if (dist < minDist) {
              const force = Math.min(3, ((minDist - dist) / dist) * 0.9);
              const ux = dx / dist;
              const uy = dy / dist;
              a.vx -= ux * force * 3;
              a.vy -= uy * force * 3;
              b.vx += ux * force * 3;
              b.vy += uy * force * 3;
            }
          }
        }

        // 2. Attraction along graph edges (normalized unit vectors)
        graphData.edges.forEach((e: any) => {
          const fromId = e.from || e.source;
          const toId = e.to || e.target;
          const fromNode = nodeMap.get(fromId);
          const toNode = nodeMap.get(toId);
          if (fromNode && toNode) {
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const desiredDist = (e.type === 'CONNECTED_TO' || e.label === 'CONNECTED_TO') ? 160 : 110;
            const force = Math.max(-6, Math.min(6, (dist - desiredDist) * 0.05));
            const ux = dx / dist;
            const uy = dy / dist;
            fromNode.vx += ux * force * 2;
            fromNode.vy += uy * force * 2;
            toNode.vx -= ux * force * 2;
            toNode.vy -= uy * force * 2;
          }
        });

        // 3. Gentle center gravity pull to keep graph centered in viewport
        const centerX = 400;
        const centerY = 280;
        next.forEach((n) => {
          const cdx = centerX - (isNaN(n.x) ? centerX : n.x);
          const cdy = centerY - (isNaN(n.y) ? centerY : n.y);
          n.vx += cdx * 0.005;
          n.vy += cdy * 0.005;
        });

        // 4. Apply velocity damping, clamp speed, and keep within canvas bounds
        return next.map((n) => {
          const maxVel = 8;
          const rawVx = isNaN(n.vx) ? 0 : n.vx;
          const rawVy = isNaN(n.vy) ? 0 : n.vy;
          const vx = Math.max(-maxVel, Math.min(maxVel, rawVx * 0.72));
          const vy = Math.max(-maxVel, Math.min(maxVel, rawVy * 0.72));
          let nx = (isNaN(n.x) ? centerX : n.x) + vx;
          let ny = (isNaN(n.y) ? centerY : n.y) + vy;
          // Clamp within canvas boundaries
          nx = Math.max(50, Math.min(750, nx));
          ny = Math.max(50, Math.min(510, ny));
          return {
            ...n,
            x: nx,
            y: ny,
            vx,
            vy,
          };
        });
      });
    }, 40);

    return () => clearInterval(interval);
  }, [graphData.nodes.length, graphData.edges.length]);

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'graph-canvas') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleExecuteRebalance = (item: RebalancingItem) => {
    setRebalanceSuccess(
      `Rebalance order dispatched! Transferring ${item.recommendedTransfers} ${item.vehicleType} vehicles from ${item.sourceHub.name} to ${item.targetHub.name}.`
    );
    setTimeout(() => setRebalanceSuccess(null), 5000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '1.1rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              fontFamily: "'Outfit', 'Inter', sans-serif",
              letterSpacing: '-0.01em',
            }}
          >
            Neo4j Knowledge Graph Visualizer
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', margin: '3px 0 0' }}>
            Interactive Road Network Topology, Vehicle Allocations & Cypher Shortest Path Engine
          </p>
        </div>

        {/* Sub-Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              background: '#111111',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {[
              ['graph', 'Graph Visualizer'],
              ['inventory', 'Station Inventory'],
              ['rebalance', 'Fleet Rebalancing'],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setActiveSubTab(k as any)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeSubTab === k ? '#ffffff' : 'transparent',
                  color: activeSubTab === k ? '#000000' : 'rgba(255, 255, 255, 0.65)',
                  transition: 'all 0.18s ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={loadGraph}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              background: '#141414',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {rebalanceSuccess && (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            borderRadius: '10px',
            padding: '1rem',
            color: '#22c55e',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{rebalanceSuccess}</span>
        </div>
      )}

      {/* Sub-Tab 1: Graph Visualizer */}
      {activeSubTab === 'graph' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', height: '640px' }}>
          {/* SVG Force-Directed Canvas */}
          <div
            id="graph-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
              background: '#070707',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '14px',
              position: 'relative',
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            {/* Canvas Controls */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                zIndex: 10,
                display: 'flex',
                gap: '6px',
              }}
            >
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#161616',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#161616',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#161616',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Maximize2 size={14} />
              </button>
            </div>

            {/* Legend */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                zIndex: 10,
                background: 'rgba(10, 10, 10, 0.85)',
                backdropFilter: 'blur(12px)',
                padding: '8px 12px',
                borderRadius: '9px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                gap: '12px',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c9a84c' }} />
                <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>(:Hub)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff' }} />
                <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>(:Vehicle)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
                <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>(:Customer)</span>
              </div>
            </div>

            {/* SVG Interactive Canvas */}
            {(() => {
              // Pre-calculate relationship connections for selectedNode
              const connectedEdgeSet = new Set<string>();
              const connectedNeighborIds = new Set<string>();
              const activeRelationshipsList: any[] = [];

              if (selectedNode) {
                connectedNeighborIds.add(selectedNode.id);
                graphData.edges.forEach((edge: any) => {
                  const fromId = edge.from || edge.source;
                  const toId = edge.to || edge.target;
                  if (fromId === selectedNode.id || toId === selectedNode.id) {
                    const edgeKey = edge.id || `${fromId}-${toId}`;
                    connectedEdgeSet.add(edgeKey);
                    connectedNeighborIds.add(fromId);
                    connectedNeighborIds.add(toId);
                    activeRelationshipsList.push({
                      edgeKey,
                      fromId,
                      toId,
                      isOutgoing: fromId === selectedNode.id,
                      neighborId: fromId === selectedNode.id ? toId : fromId,
                      type: edge.type || edge.label || 'CONNECTED_TO',
                    });
                  }
                });
              }

              return (
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 800 560"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ display: 'block', overflow: 'visible', width: '100%', height: '100%' }}
                >
                  <defs>
                    {/* Glowing highlight filters */}
                    <filter id="glow-edge-rel" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="glow-node-rel" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="4.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    {/* Edges */}
                    {graphData.edges.map((edge: any) => {
                      const fromId = edge.from || edge.source;
                      const toId = edge.to || edge.target;
                      const sourceNode = simNodes.find((n) => n.id === fromId);
                      const targetNode = simNodes.find((n) => n.id === toId);
                      if (!sourceNode || !targetNode) return null;

                      const edgeKey = edge.id || `${fromId}-${toId}`;
                      const isConnected = selectedNode && (fromId === selectedNode.id || toId === selectedNode.id);
                      const isDimmed = selectedNode && !isConnected;

                      const relType = edge.type || edge.label || 'CONNECTED_TO';
                      const isHubRoad = relType === 'CONNECTED_TO';
                      const isRental = relType === 'RENTED';
                      const isStationed = relType === 'CURRENTLY_AT';

                      // Glowing colors when highlighted
                      let strokeColor = isHubRoad
                        ? '#c9a84c'
                        : isRental
                        ? '#38bdf8'
                        : isStationed
                        ? '#22c55e'
                        : 'rgba(255, 255, 255, 0.4)';

                      if (isConnected) {
                        strokeColor = isRental ? '#38bdf8' : isStationed ? '#22c55e' : '#c9a84c';
                      }

                      const strokeWidth = isConnected ? 3.5 : isHubRoad ? 2 : 1.2;
                      const strokeOpacity = isConnected ? 1.0 : isDimmed ? 0.08 : (isHubRoad ? 0.6 : 0.35);

                      const midX = (sourceNode.x + targetNode.x) / 2;
                      const midY = (sourceNode.y + targetNode.y) / 2;

                      return (
                        <g key={edgeKey}>
                          <line
                            x1={sourceNode.x}
                            y1={sourceNode.y}
                            x2={targetNode.x}
                            y2={targetNode.y}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={isConnected ? '6 4' : (isRental ? '4 4' : 'none')}
                            opacity={strokeOpacity}
                            filter={isConnected ? 'url(#glow-edge-rel)' : undefined}
                          />

                          {/* Floating Interactive Relationship Badge Pill when connected */}
                          {isConnected && (
                            <g transform={`translate(${midX}, ${midY})`}>
                              <rect
                                x="-45"
                                y="-11"
                                width="90"
                                height="22"
                                rx="11"
                                fill="#0a0a0a"
                                stroke={strokeColor}
                                strokeWidth="1.8"
                                filter="drop-shadow(0 2px 6px rgba(0,0,0,0.9))"
                              />
                              <text
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#ffffff"
                                fontSize="9"
                                fontWeight="700"
                                letterSpacing="0.04em"
                                fontFamily="'Inter', 'Outfit', sans-serif"
                              >
                                :{relType}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Nodes */}
                    {simNodes.map((node) => {
                      const cfg = nodeColorMap[node.type] || nodeColorMap.Hub;
                      const isSelected = selectedNode?.id === node.id;
                      const isNeighbor = selectedNode && connectedNeighborIds.has(node.id) && !isSelected;
                      const isNodeDimmed = selectedNode && !connectedNeighborIds.has(node.id);
                      const radius = node.type === 'Hub' ? 22 : node.type === 'Vehicle' ? 18 : 15;
                      const nodeOpacity = isNodeDimmed ? 0.22 : 1.0;

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${node.x}, ${node.y})`}
                          onClick={() => setSelectedNode(node)}
                          style={{
                            cursor: 'pointer',
                            opacity: nodeOpacity,
                            transition: 'opacity 0.2s ease',
                          }}
                        >
                          {/* Selection Glowing Outer Ring */}
                          {isSelected && (
                            <>
                              <circle
                                r={radius + 8}
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth="2.5"
                                opacity="0.9"
                                filter="url(#glow-node-rel)"
                              />
                              <circle
                                r={radius + 13}
                                fill="none"
                                stroke={cfg.border}
                                strokeWidth="1"
                                strokeDasharray="4 4"
                                opacity="0.6"
                              />
                            </>
                          )}

                          {/* Connected Neighbor Accent Ring */}
                          {isNeighbor && (
                            <circle
                              r={radius + 5}
                              fill="none"
                              stroke={cfg.border}
                              strokeWidth="1.8"
                              strokeDasharray="3 3"
                              opacity="0.85"
                            />
                          )}

                          {/* Main Node Circle */}
                          <circle
                            r={radius}
                            fill={cfg.bg}
                            stroke={isSelected ? '#ffffff' : cfg.border}
                            strokeWidth={isSelected ? '2.5' : isNeighbor ? '2' : '1.8'}
                            filter="drop-shadow(0 2px 8px rgba(0,0,0,0.8))"
                          />

                          {/* Icon inside */}
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={radius * 0.9}
                          >
                            {cfg.icon}
                          </text>

                          {/* Label underneath */}
                          <text
                            y={radius + 14}
                            textAnchor="middle"
                            fill={isSelected || isNeighbor ? '#ffffff' : 'rgba(255, 255, 255, 0.75)'}
                            fontSize="11"
                            fontWeight={isSelected || isNeighbor ? '700' : '600'}
                            fontFamily="'Inter', 'Outfit', sans-serif"
                          >
                            {node.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              );
            })()}
          </div>

          {/* Node Properties Inspector Panel */}
          <div
            style={{
              background: '#0a0a0a',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '14px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Share2 size={13} style={{ color: '#ffffff' }} />
              <span>Cypher Node Inspector</span>
            </div>

            {selectedNode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: nodeColorMap[selectedNode.type]?.border || '#ffffff',
                      fontWeight: 700,
                      border: `1px solid ${nodeColorMap[selectedNode.type]?.border || '#ffffff'}40`,
                    }}
                  >
                    :{selectedNode.type}
                  </span>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: '6px 0 2px' }}>
                    {selectedNode.label}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>
                    ID: {selectedNode.id}
                  </div>
                </div>

                {/* Direct Relationships Section */}
                <div>
                  {(() => {
                    const related = graphData.edges
                      .filter((e: any) => {
                        const fromId = e.from || e.source;
                        const toId = e.to || e.target;
                        return fromId === selectedNode.id || toId === selectedNode.id;
                      })
                      .map((e: any) => {
                        const fromId = e.from || e.source;
                        const toId = e.to || e.target;
                        const isOut = fromId === selectedNode.id;
                        const neighborId = isOut ? toId : fromId;
                        const neighbor = simNodes.find((n) => n.id === neighborId);
                        const relType = e.type || e.label || 'CONNECTED_TO';
                        const badgeColor =
                          relType === 'CURRENTLY_AT'
                            ? '#22c55e'
                            : relType === 'RENTED'
                            ? '#38bdf8'
                            : '#c9a84c';

                        return { edge: e, isOut, neighborId, neighbor, relType, badgeColor };
                      });

                    return (
                      <div>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'rgba(255, 255, 255, 0.65)',
                            marginBottom: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>Direct Relationships</span>
                          <span style={{ fontSize: '10px', color: '#c9a84c', fontWeight: 700 }}>
                            {related.length} active
                          </span>
                        </div>

                        {related.length === 0 ? (
                          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic' }}>
                            No active relationships linked to this node
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {related.map((item, idx) => (
                              <div
                                key={idx}
                                onClick={() => item.neighbor && setSelectedNode(item.neighbor)}
                                style={{
                                  padding: '8px 10px',
                                  background: '#121212',
                                  border: `1px solid ${item.badgeColor}35`,
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  transition: 'all 0.18s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = item.badgeColor)}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${item.badgeColor}35`)}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: item.badgeColor }}>
                                    {item.isOut ? `➔ [:${item.relType}] ➔` : `⬅ [:${item.relType}] ⬅`}
                                  </span>
                                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)' }}>
                                    :{item.neighbor?.type || 'Node'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                                  {item.neighbor?.label || item.neighborId}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Properties Table */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)', marginBottom: '6px' }}>
                    Cypher Properties
                  </div>
                  <div
                    style={{
                      background: '#121212',
                      padding: '10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                    }}
                  >
                    {Object.entries(selectedNode.properties || {}).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{k}:</span>
                        <span style={{ color: '#ffffff', fontWeight: 500 }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px' }}>
                Click any node on the graph to inspect Cypher properties
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Hub Station Inventory */}
      {activeSubTab === 'inventory' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {hubStats.map((h) => {
            const isDeficit = h.status === 'DEFICIT';
            const isSurplus = h.status === 'SURPLUS';
            const statusColor = isDeficit ? '#ef4444' : isSurplus ? '#f59e0b' : '#22c55e';

            return (
              <div
                key={h.hubId}
                style={{
                  background: '#0a0a0a',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: `${statusColor}18`,
                      color: statusColor,
                      border: `1px solid ${statusColor}40`,
                      fontWeight: 700,
                    }}
                  >
                    {h.status}
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>{h.city}</span>
                </div>

                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: 0 }}>{h.name}</h3>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>ID: {h.hubId}</div>
                </div>

                <div style={{ marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Station Occupancy</span>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>
                      {h.occupancy} / {h.capacity} ({h.occupancyPct}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#191919', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, h.occupancyPct)}%`,
                        background: statusColor,
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub-Tab 3: Fleet Rebalancing Engine */}
      {activeSubTab === 'rebalance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              padding: '1rem 1.25rem',
              background: '#111111',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            <TrendingUp size={18} style={{ color: '#c9a84c' }} />
            <span>
              Graph Rebalancing computes real-time vehicle transfer recommendations along the shortest path
              between surplus stations and deficit stations to optimize fleet distribution.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {rebalancing.map((item) => (
              <div
                key={item.recommendationId}
                style={{
                  background: '#0a0a0a',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#ffffff',
                        background: '#181818',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      Transfer {item.recommendedTransfers} {item.vehicleType} Vehicles
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: item.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(201, 168, 76, 0.15)',
                        color: item.priority === 'HIGH' ? '#ef4444' : '#c9a84c',
                        fontWeight: 700,
                      }}
                    >
                      {item.priority} PRIORITY
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0' }}>
                    <div style={{ padding: '8px 12px', background: '#141414', borderRadius: '7px', fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                      {item.sourceHub.name} (Surplus: +{item.sourceHub.surplus})
                    </div>
                    <ArrowRight size={15} style={{ color: '#ffffff' }} />
                    <div style={{ padding: '8px 12px', background: '#141414', borderRadius: '7px', fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                      {item.targetHub.name} (Deficit: -{item.targetHub.deficit})
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
                    {item.rationale}
                  </p>
                </div>

                <button
                  onClick={() => handleExecuteRebalance(item)}
                  style={{
                    padding: '8px',
                    background: '#ffffff',
                    color: '#000000',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#e5e5e5')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#ffffff')}
                >
                  Execute Transfer Order
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
