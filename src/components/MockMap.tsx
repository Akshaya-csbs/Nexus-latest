import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RoomStatus, CrisisEvent } from '../services/firebaseService';
import { cn } from '../lib/utils';
import { MapPin, Shield, AlertCircle, Users, Navigation } from 'lucide-react';

interface MockMapProps {
  rooms: RoomStatus[];
  crises: CrisisEvent[];
  className?: string;
  onRoomClick?: (roomNumber: string) => void;
  highlightRoom?: string;
}

export const MockMap: React.FC<MockMapProps> = ({ rooms, crises, className, onRoomClick, highlightRoom }) => {
  const [selectedFloor, setSelectedFloor] = useState<number>(4);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  // Generate a mock grid-based floor plan for the selected floor
  const grid = useMemo(() => {
    const layout = [];
    const cols = 8;
    const rows = 5;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Leave some gaps for hallways
        if (c === 3 || r === 2) continue;

        const roomIdx = (r * cols + c).toString().padStart(2, '0');
        const roomNumber = `${selectedFloor}${roomIdx}`;

        layout.push({
          x: c * 100,
          y: r * 100,
          w: 88,
          h: 88,
          id: roomNumber,
          wing: c < 3 ? (r < 2 ? 'ALPHA' : 'CHARLIE') : (r < 2 ? 'BRAVO' : 'DELTA')
        });
      }
    }
    return layout;
  }, [selectedFloor]);

  // Hovered room details
  const hoveredRoomDetails = useMemo(() => {
    if (!hoveredRoomId) return null;
    const roomData = rooms.find(r => r.roomNumber === hoveredRoomId);
    const crisis = crises.find(c => c.roomNumber === hoveredRoomId && c.status === 'active');
    return {
      id: hoveredRoomId,
      status: crisis ? 'Active Incident' : roomData?.occupancyStatus || 'unknown',
      occupants: roomData?.occupancyStatus === 'occupied' ? 4 : 0,
      severity: crisis?.severity || 'none',
      type: crisis?.crisisType || 'none'
    };
  }, [hoveredRoomId, rooms, crises]);

  return (
    <div className={cn("relative bg-[#0B1020] rounded-3xl overflow-hidden border border-white/10 flex flex-col h-full", className)}>
      {/* Map Control Bar (Floor Selector) */}
      <div className="absolute top-4 left-4 z-15 flex items-center gap-2 bg-[#111827] border border-white/10 p-1.5 rounded-xl shadow-lg">
        {[1, 2, 3, 4, 5].map((fl) => (
          <button
            key={fl}
            onClick={() => setSelectedFloor(fl)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider",
              selectedFloor === fl
                ? "bg-[#3B82F6] text-white"
                : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5"
            )}
          >
            L{fl}
          </button>
        ))}
        <span className="text-[10px] font-bold text-[#94A3B8] px-2 uppercase tracking-widest border-l border-white/10 ml-1">Floor Plan</span>
      </div>
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-6">
        <svg
          viewBox="-250 -20 1200 540"
          className="w-full h-full drop-shadow-2xl max-h-[380px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Main Grid Hallways */}
          {/* Vertical Hallway */}
          <rect x="300" y="0" width="100" height="500" className="fill-[#172033] stroke-white/5 stroke-1" />
          {/* Horizontal Hallway */}
          <rect x="-120" y="200" width="1028" height="100" className="fill-[#172033] stroke-white/5 stroke-1" />

          {/* Hallways / Infrastructure Labels */}
          <text x="350" y="255" className="fill-[#94A3B8]/20 font-sans font-bold text-lg uppercase tracking-[0.4em]" textAnchor="middle" dominantBaseline="middle">Main Junction</text>
          <text x="90" y="250" className="fill-[#94A3B8]/25 font-sans font-black text-xs uppercase tracking-[0.3em]" textAnchor="middle">West corridor</text>
          <text x="610" y="250" className="fill-[#94A3B8]/25 font-sans font-black text-xs uppercase tracking-[0.3em]" textAnchor="middle">East corridor</text>

          {/* Infrastructure elements */}
          {/* Elevator */}
          <g transform="translate(305, 10)">
            <rect width="90" height="80" rx="8" className="fill-[#111827] stroke-[#3B82F6]/30 stroke-1" />
            <text x="45" y="35" className="fill-[#3B82F6] font-sans font-bold text-[10px] uppercase tracking-wider" textAnchor="middle">ELEVATOR</text>
            <text x="45" y="55" className="fill-[#22C55E] font-mono text-[9px] uppercase tracking-widest" textAnchor="middle">NOMINAL</text>
          </g>

          {/* Stairwell 1 (Left) */}
          <g transform="translate(-105, 210)">
            <rect width="90" height="80" rx="8" className="fill-[#111827] stroke-[#94A3B8]/30 stroke-1" />
            <text x="45" y="30" className="fill-[#94A3B8] font-sans font-bold text-[11px] uppercase tracking-wider" textAnchor="middle">STAIRWELL 1</text>
            <text x="45" y="48" className="fill-[#22C55E] font-sans font-semibold text-[9px] uppercase tracking-widest" textAnchor="middle">EXIT ROUTE</text>
            <text x="45" y="62" className="fill-[#22C55E] font-sans font-semibold text-[9px] uppercase tracking-widest" textAnchor="middle">SIDE EXIT</text>
          </g>
          {/* Stairwell 1 Directional Arrow */}
          <g transform="translate(-60, 305)" className="fill-[#22C55E]">
            <path d="M5,-3 L5,3 L-5,0 Z" />
          </g>

          {/* Stairwell 2 (Right) */}
          <g transform="translate(803, 210)">
            <rect width="90" height="80" rx="8" className="fill-[#111827] stroke-[#94A3B8]/30 stroke-1" />
            <text x="45" y="30" className="fill-[#94A3B8] font-sans font-bold text-[11px] uppercase tracking-wider" textAnchor="middle">STAIRWELL 2</text>
            <text x="45" y="48" className="fill-[#22C55E] font-sans font-semibold text-[9px] uppercase tracking-widest" textAnchor="middle">EXIT ROUTE</text>
            <text x="45" y="62" className="fill-[#22C55E] font-sans font-semibold text-[9px] uppercase tracking-widest" textAnchor="middle">SIDE EXIT</text>
          </g>
          {/* Stairwell 2 Directional Arrow */}
          <g transform="translate(848, 305)" className="fill-[#22C55E]">
            <path d="M-5,-3 L-5,3 L5,0 Z" />
          </g>

          {/* Emergency Exits */}
          <g transform="translate(350, -5)" className="fill-[#22C55E]">
            <path d="M-5,0 L5,0 L0,-10 Z" />
            <text x="0" y="15" className="fill-[#22C55E] font-sans font-black text-[9px] uppercase tracking-wider" textAnchor="middle">NORTH EXIT</text>
          </g>
          {/* Wing Labels */}
          <text x="20" y="30" className="fill-[#94A3B8]/30 font-sans font-black text-[10px] uppercase tracking-widest text-left">SEC ALPHA</text>
          <text x="780" y="30" className="fill-[#94A3B8]/30 font-sans font-black text-[10px] uppercase tracking-widest text-right" textAnchor="end">SEC BRAVO</text>
          <text x="20" y="480" className="fill-[#94A3B8]/30 font-sans font-black text-[10px] uppercase tracking-widest text-left">SEC CHARLIE</text>
          <text x="780" y="480" className="fill-[#94A3B8]/30 font-sans font-black text-[10px] uppercase tracking-widest text-right" textAnchor="end">SEC DELTA</text>

          {/* Room Grid */}
          {grid.map((room) => {
            const roomData = rooms.find(r => r.roomNumber === room.id);
            const crisis = crises.find(c => c.roomNumber === room.id && c.status === 'active');
            const isHighlighted = highlightRoom === room.id;

            // SOC color mapping
            // Green = Safe (#22C55E)
            // Amber = Warning (#F59E0B)
            // Red = Active Incident (#EF4444)
            // Blue = Responder Present (#3B82F6)
            // Gray = Unknown (#4b5563)
            let fillColor = "#4b5563"; // Default Gray Unknown
            let strokeColor = "rgba(255, 255, 255, 0.15)";
            let textColor = "#CBD5E1";
            let strokeWidth = 1.5;

            if (crisis) {
              fillColor = "#EF4444"; // Red Danger
              strokeColor = "#EF4444";
              textColor = "#F8FAFC";
            } else if (roomData?.occupancyStatus === 'occupied') {
              fillColor = "#111827"; // Dark blue-gray for normal occupancy
              strokeColor = "#22C55E"; // Safe Green boundary
              textColor = "#22C55E";
            } else if (roomData?.occupancyStatus === 'evacuated') {
              fillColor = "#172033";
              strokeColor = "#3B82F6"; // Responder Present / Evacuated Info Blue
              textColor = "#3B82F6";
            } else if (room.id === '412') {
              // Special demo room defaults
              fillColor = "#111827";
              strokeColor = "#22C55E";
              textColor = "#22C55E";
            }

            if (isHighlighted) {
              strokeColor = "#F59E0B"; // Highlight Amber
              strokeWidth = 3;
            }

            return (
              <motion.g
                key={room.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => onRoomClick?.(room.id)}
                onPointerOver={() => setHoveredRoomId(room.id)}
                onPointerOut={() => setHoveredRoomId(null)}
              >
                <rect
                  x={room.x} y={room.y} width={room.w} height={room.h} rx="8"
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-300 fill-opacity-80"
                />

                {/* Pulse ring for active incidents */}
                {crisis && (
                  <motion.rect
                    x={room.x - 4} y={room.y - 4} width={room.w + 8} height={room.h + 8} rx="12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.4, 0], scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="2"
                  />
                )}

                {/* Room Label */}
                <text
                  x={room.x + room.w / 2}
                  y={room.y + room.h / 2 - 10}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={textColor}
                  className="font-sans font-black text-sm tracking-wider"
                >
                  {room.id}
                </text>

                {/* Occupancy Indicator */}
                {roomData?.occupancyStatus === 'occupied' && (
                  <g transform={`translate(${room.x + room.w / 2 - 14}, ${room.y + room.h / 2 + 10})`} className="opacity-80">
                    <circle cx="8" cy="8" r="4" fill="#22C55E" />
                    <text x="20" y="11" fill="#CBD5E1" className="font-mono text-[9px] font-bold">O:4</text>
                  </g>
                )}

                {/* Responder marker representation (mocked) */}
                {room.id === '415' && (
                  <g transform={`translate(${room.x + 10}, ${room.y + 10})`}>
                    <circle cx="6" cy="6" r="5" fill="#3B82F6" className="animate-pulse" />
                    <circle cx="6" cy="6" r="2" fill="#F8FAFC" />
                  </g>
                )}
              </motion.g>
            );
          })}
        </svg>

        {/* Floating Tooltip info */}
        <AnimatePresence>
          {hoveredRoomDetails && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 right-4 bg-[#111827] border border-white/10 p-4 rounded-xl shadow-2xl z-20 w-48 text-left space-y-2 pointer-events-none"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-[#F8FAFC] tracking-wider">ROOM {hoveredRoomDetails.id}</span>
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  hoveredRoomDetails.status === 'Active Incident' ? 'bg-[#EF4444]' :
                    hoveredRoomDetails.status === 'occupied' ? 'bg-[#22C55E]' :
                      'bg-[#94A3B8]'
                )} />
              </div>
              <div className="h-px bg-white/5" />
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-[#94A3B8] uppercase">STATUS</p>
                <p className="text-[11px] font-bold text-[#CBD5E1] uppercase tracking-wide">{hoveredRoomDetails.status}</p>
              </div>
              {hoveredRoomDetails.occupants > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-[#94A3B8] uppercase">EST. OCCUPANTS</p>
                  <p className="text-[11px] font-bold text-[#CBD5E1] tracking-wide">{hoveredRoomDetails.occupants} PERSONS</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info Strip */}
      <div className="bg-[#111827] border-t border-white/10 px-4 py-3 flex justify-between items-center text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22C55E]" /> SAFE</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EF4444]" /> DANGER</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#3B82F6]" /> RESPONDER</span>
        </div>
        <span>Level {selectedFloor} Grid Active</span>
      </div>
    </div>
  );
};

export default MockMap;
