'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html, useFont } from '@react-three/drei';
import * as THREE from 'three';

// Types
interface Session {
  id: string;
  label: string;
  status: string;
  capability?: string;
}

interface Agent {
  id: string;
  sessionId: string;
  label: string;
  status: 'working' | 'idle' | 'break' | 'meeting';
  position: [number, number, number];
  targetPosition: [number, number, number];
  color: string;
}

// Zone definitions
const ZONES = {
  desks: [
    { id: 'desk-1', position: [-4, 0, -2] as [number, number, number] },
    { id: 'desk-2', position: [0, 0, -2] as [number, number, number] },
    { id: 'desk-3', position: [4, 0, -2] as [number, number, number] },
    { id: 'desk-4', position: [-2, 0, 2] as [number, number, number] },
  ],
  boardroom: { position: [6, 0, 3] as [number, number, number], size: [3, 0.1, 2] as [number, number, number] },
  breakroom: { position: [-6, 0, 3] as [number, number, number], size: [2, 0.1, 2] as [number, number, number] },
};

const STATUS_COLORS = {
  working: '#3b82f6',  // blue
  idle: '#6b7280',     // gray
  break: '#f59e0b',    // amber
  meeting: '#8b5cf6',  // purple
};

// Mock session data generator
const generateMockSessions = (): Session[] => {
  const labels = [
    'Research Agent', 'Data Analyst', 'Code Reviewer', 'Test Runner',
    'Documentation Writer', 'DevOps Agent', 'Security Scanner', 'Performance Monitor'
  ];
  const statuses = ['active', 'idle', 'thinking', 'completed'];
  
  return Array.from({ length: 5 + Math.floor(Math.random() * 4) }, (_, i) => ({
    id: `session-${i + 1}`,
    label: labels[i % labels.length],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    capability: ['analysis', 'coding', 'testing', 'documentation'][Math.floor(Math.random() * 4)],
  }));
};

// Agent component
function Agent({ 
  agent, 
  onClick, 
  onHover 
}: { 
  agent: Agent; 
  onClick: (agent: Agent) => void;
  onHover: (agent: Agent | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Animate movement
  useFrame(() => {
    if (meshRef.current) {
      const [tx, ty, tz] = agent.targetPosition;
      meshRef.current.position.x += (tx - meshRef.current.position.x) * 0.05;
      meshRef.current.position.y += (ty - meshRef.current.position.y) * 0.05;
      meshRef.current.position.z += (tz - meshRef.current.position.z) * 0.05;
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={agent.position}
        onClick={(e) => {
          e.stopPropagation();
          onClick(agent);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(agent);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
        }}
      >
        <boxGeometry args={[0.6, 0.8, 0.6]} />
        <meshToonMaterial color={agent.color} />
      </mesh>
      
      {/* Status indicator */}
      <mesh position={[agent.position[0], agent.position[1] + 0.6, agent.position[2]]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color={agent.color} />
      </mesh>
      
      {/* Label */}
      <Text
        position={[agent.position[0], agent.position[1] + 1, agent.position[2]]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {agent.label.substring(0, 8)}
      </Text>
      
      {/* Hover tooltip */}
      {hovered && (
        <Html position={[agent.position[0], agent.position[1] + 1.3, agent.position[2]]} center>
          <div style={{
            background: 'rgba(0,0,0,0.85)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            border: `2px solid ${agent.color}`,
          }}>
            <div style={{ fontWeight: 'bold' }}>{agent.label}</div>
            <div style={{ color: agent.color, textTransform: 'capitalize' }}>{agent.status}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Desk component
function Desk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Desk top */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.2, 0.1, 0.8]} />
        <meshToonMaterial color="#8b4513" />
      </mesh>
      {/* Desk legs */}
      {[[-0.5, 0, -0.3], [0.5, 0, -0.3], [-0.5, 0, 0.3], [0.5, 0, 0.3]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshToonMaterial color="#5c3317" />
        </mesh>
      ))}
      {/* Computer monitor */}
      <mesh position={[0, 0.7, -0.2]}>
        <boxGeometry args={[0.5, 0.4, 0.05]} />
        <meshToonMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

// Boardroom component
function Boardroom() {
  return (
    <group position={ZONES.boardroom.position}>
      {/* Table */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[3, 0.1, 1.5]} />
        <meshToonMaterial color="#374151" />
      </mesh>
      {/* Chairs */}
      {[-1, 0, 1].map((x) => (
        <mesh key={x} position={[x, 0.3, -1]}>
          <boxGeometry args={[0.4, 0.3, 0.4]} />
          <meshToonMaterial color="#4b5563" />
        </mesh>
      ))}
      {/* Label */}
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.3}
        color="#8b5cf6"
        anchorX="center"
      >
        📋 Boardroom
      </Text>
    </group>
  );
}

// Breakroom component
function BreakRoom() {
  return (
    <group position={ZONES.breakroom.position}>
      {/* Counter */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.5, 0.6, 0.6]} />
        <meshToonMaterial color="#059669" />
      </mesh>
      {/* Coffee machine */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshToonMaterial color="#374151" />
      </mesh>
      {/* Label */}
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.3}
        color="#f59e0b"
        anchorX="center"
      >
        ☕ Break Room
      </Text>
    </group>
  );
}

// Floor component
function Floor() {
  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[16, 12]} />
        <meshToonMaterial color="#1e293b" />
      </mesh>
      
      {/* Grid lines */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={`h-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -6 + i * 1.5]}>
          <planeGeometry args={[16, 0.02]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={`v-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-8 + i * 1.5, 0.01, 0]}>
          <planeGeometry args={[0.02, 12]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
      ))}
      
      {/* Zone labels on floor */}
      <Text
        position={[-4, 0.02, 4]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.4}
        color="#475569"
        anchorX="center"
      >
        Work Area
      </Text>
    </group>
  );
}

// Isometric camera setup
function IsometricCamera() {
  const { camera } = useThree();
  
  useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      camera.zoom = 50;
      camera.updateProjectionMatrix();
    }
  }, [camera]);
  
  return null;
}

// Main scene
function Scene({ 
  agents, 
  onAgentClick, 
  onAgentHover 
}: { 
  agents: Agent[];
  onAgentClick: (agent: Agent) => void;
  onAgentHover: (agent: Agent | null) => void;
}) {
  return (
    <>
      <IsometricCamera />
      <OrbitControls 
        enableRotate={false} 
        enableZoom={true} 
        enablePan={true}
        minZoom={30}
        maxZoom={100}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.4} color="#3b82f6" />
      
      {/* Floor */}
      <Floor />
      
      {/* Desks */}
      {ZONES.desks.map((desk) => (
        <Desk key={desk.id} position={desk.position} />
      ))}
      
      {/* Boardroom */}
      <Boardroom />
      
      {/* Breakroom */}
      <BreakRoom />
      
      {/* Agents */}
      {agents.map((agent) => (
        <Agent
          key={agent.id}
          agent={agent}
          onClick={onAgentClick}
          onHover={onAgentHover}
        />
      ))}
    </>
  );
}

// Main page component
export default function CEOHeadquarters() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<Agent | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Initialize and update sessions
  useEffect(() => {
    const initialSessions = generateMockSessions();
    setSessions(initialSessions);
    updateAgentsFromSessions(initialSessions);
  }, []);

  // Periodic updates (simulate real-time)
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update some session statuses
      setSessions(prev => {
        const updated = [...prev];
        updated.forEach(session => {
          if (Math.random() > 0.7) {
            session.status = ['active', 'idle', 'thinking', 'completed'][Math.floor(Math.random() * 4)];
          }
        });
        setLastUpdate(new Date());
        updateAgentsFromSessions(updated);
        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateAgentsFromSessions = (sessionList: Session[]) => {
    const newAgents: Agent[] = sessionList.map((session, index) => {
      // Determine agent status from session state
      let status: Agent['status'] = 'idle';
      if (session.status === 'active' || session.status === 'thinking') {
        status = 'working';
      } else if (session.status === 'idle') {
        status = Math.random() > 0.5 ? 'idle' : 'break';
      } else {
        status = Math.random() > 0.5 ? 'meeting' : 'idle';
      }
      
      // Assign to zone based on status
      let targetPos: [number, number, number];
      if (status === 'meeting') {
        const boardroomOffset = [(index % 3) - 1, 0, -0.8] as [number, number, number];
        targetPos = [
          ZONES.boardroom.position[0] + boardroomOffset[0],
          0.8,
          ZONES.boardroom.position[2] + boardroomOffset[2]
        ];
      } else if (status === 'break') {
        targetPos = [
          ZONES.breakroom.position[0] + (Math.random() - 0.5),
          0.8,
          ZONES.breakroom.position[2] + (Math.random() - 0.5)
        ];
      } else {
        // Working - assign to desk
        const deskIndex = index % ZONES.desks.length;
        targetPos = [
          ZONES.desks[deskIndex].position[0],
          0.8,
          ZONES.desks[deskIndex].position[2]
        ];
      }
      
      return {
        id: `agent-${session.id}`,
        sessionId: session.id,
        label: session.label,
        status,
        position: targetPos, // Start at target for initial render
        targetPosition: targetPos,
        color: STATUS_COLORS[status],
      };
    });
    
    setAgents(newAgents);
  };

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleAgentHover = (agent: Agent | null) => {
    setHoveredAgent(agent);
  };

  // Get status counts
  const statusCounts = useMemo(() => {
    const counts = { working: 0, idle: 0, break: 0, meeting: 0 };
    agents.forEach(agent => {
      counts[agent.status]++;
    });
    return counts;
  }, [agents]);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#0f172a',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px 30px',
        background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0) 100%)',
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '28px', 
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🏢 Live AI CEO Headquarters
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
            Real-time agent management dashboard
          </p>
        </div>
        
        {/* Status summary */}
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
              {statusCounts.working}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
              Working
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6b7280' }}>
              {statusCounts.idle}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
              Idle
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
              {statusCounts.break}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
              Break
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
              {statusCounts.meeting}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
              Meeting
            </div>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        orthographic
        camera={{ position: [10, 10, 10], zoom: 50, near: 0.1, far: 1000 }}
        style={{ background: '#0f172a' }}
      >
        <Scene
          agents={agents}
          onAgentClick={handleAgentClick}
          onAgentHover={handleAgentHover}
        />
      </Canvas>

      {/* Footer info */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '15px 30px',
        background: 'linear-gradient(0deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0) 100%)',
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ color: '#475569', fontSize: '12px' }}>
          Total Agents: <span style={{ color: '#fff', fontWeight: 'bold' }}>{agents.length}</span>
          {' • '}
          Last Update: <span style={{ color: '#fff' }}>{lastUpdate.toLocaleTimeString()}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', fontSize: '11px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
            Working
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6b7280' }} />
            Idle
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
            Break
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }} />
            Meeting
          </span>
        </div>
      </div>

      {/* Selected agent popup */}
      {selectedAgent && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(30, 41, 59, 0.95)',
          border: `2px solid ${selectedAgent.color}`,
          borderRadius: '12px',
          padding: '24px',
          minWidth: '280px',
          zIndex: 100,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>{selectedAgent.label}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>ID: {selectedAgent.sessionId}</p>
            </div>
            <button
              onClick={() => setSelectedAgent(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0',
              }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Status</span>
              <span style={{ 
                color: selectedAgent.color, 
                fontSize: '13px', 
                fontWeight: 'bold',
                textTransform: 'capitalize',
              }}>
                {selectedAgent.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Location</span>
              <span style={{ color: '#fff', fontSize: '13px', textTransform: 'capitalize' }}>
                {selectedAgent.status === 'meeting' ? 'Boardroom' : 
                 selectedAgent.status === 'break' ? 'Break Room' : 'Desk'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Color</span>
              <span style={{ 
                color: selectedAgent.color, 
                fontSize: '13px',
              }}>
                ● {selectedAgent.color}
              </span>
            </div>
          </div>
          
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
            <button
              style={{
                width: '100%',
                padding: '10px',
                background: selectedAgent.color,
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedAgent(null)}
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Hover indicator */}
      {hoveredAgent && !selectedAgent && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(30, 41, 59, 0.9)',
          border: `1px solid ${hoveredAgent.color}`,
          borderRadius: '8px',
          padding: '10px 16px',
          zIndex: 50,
        }}>
          <span style={{ color: '#fff', fontSize: '13px' }}>
            Click on <strong style={{ color: hoveredAgent.color }}>{hoveredAgent.label}</strong> for more info
          </span>
        </div>
      )}
    </div>
  );
}
