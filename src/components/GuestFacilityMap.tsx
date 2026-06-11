import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Shield, ShieldAlert, Crosshair, Layers, MapPin } from 'lucide-react';

interface GuestFacilityMapProps {
  activeCrisis?: any;
}

const ROOMS_DATA = [
  // Top Left (4 rooms)
  { id: '401', x: 270, y: 60 }, { id: '402', x: 370, y: 60 },
  { id: '403', x: 270, y: 140 }, { id: '404', x: 370, y: 140 },
  // Top Right (6 rooms)
  { id: '405', x: 550, y: 60 }, { id: '406', x: 650, y: 60 }, { id: '407', x: 750, y: 60 },
  { id: '408', x: 550, y: 140 }, { id: '409', x: 650, y: 140 }, { id: '410', x: 750, y: 140 },
  // Bottom Left (4 rooms)
  { id: '411', x: 270, y: 300 }, { id: '412', x: 370, y: 300 },
  { id: '413', x: 270, y: 380 }, { id: '414', x: 370, y: 380 },
  // Bottom Right (6 rooms)
  { id: '415', x: 550, y: 300 }, { id: '416', x: 650, y: 300 }, { id: '417', x: 750, y: 300 },
  { id: '418', x: 550, y: 380 }, { id: '419', x: 650, y: 380 }, { id: '420', x: 750, y: 380 },
];

const GuestFacilityMap: React.FC<GuestFacilityMapProps> = ({ activeCrisis, isLiveDemoMobile }) => {
  const [guestLocation] = React.useState(() => ROOMS_DATA[Math.floor(Math.random() * ROOMS_DATA.length)].id);
  const [selectedRoomId, setSelectedRoomId] = React.useState<string | null>(null);
  const routeTargetRoomId = selectedRoomId || guestLocation;

  const getRoute = () => {
    const targetRoom = ROOMS_DATA.find(r => r.id === routeTargetRoomId);
    if (!targetRoom || !activeCrisis) return null;

    const startX = targetRoom.x + 40;
    const startY = targetRoom.y + 35;
    const isTop = targetRoom.y < 250;
    const isLeftBlock = targetRoom.x < 500;
    const corridorY = 250;
    
    const targetX = isLeftBlock ? 260 : 840;
    const isInnerRow = isTop ? targetRoom.y === 140 : targetRoom.y === 300;
    
    let path = `M ${startX} ${startY}`;
    let svgDistance = 0;
    
    if (isInnerRow) {
      path += ` L ${startX} ${corridorY} L ${targetX} ${corridorY}`;
      svgDistance = Math.abs(corridorY - startY) + Math.abs(targetX - startX);
    } else {
      const subCorridorY = isTop ? 135 : 375;
      path += ` L ${startX} ${subCorridorY} L ${targetX} ${subCorridorY} L ${targetX} ${corridorY}`;
      svgDistance = Math.abs(subCorridorY - startY) + Math.abs(targetX - startX) + Math.abs(corridorY - subCorridorY);
    }
    
    // Convert SVG units to real-world feet (approx 0.6 ft per unit)
    const distanceFt = Math.round(svgDistance * 0.6);
    // Average emergency walking speed ~ 4 ft/sec
    const timeSec = Math.round(distanceFt / 4);
    
    return { path, targetX, distanceFt, timeSec };
  };

  const route = getRoute();

  return (
    <div className={`flex flex-col items-center w-full h-full max-w-7xl mx-auto ${isLiveDemoMobile ? "gap-0" : "gap-6"}`}>
      {/* Status Banner */}
      {activeCrisis ? (
        <div className={`relative z-10 w-full bg-[#c62828] text-white rounded-2xl p-4 md:p-6 shadow-md flex justify-between gap-4 ${isLiveDemoMobile ? "flex-col items-center" : "flex-col md:flex-row items-center"}`}>
          <div className={`flex items-center gap-4 ${isLiveDemoMobile ? "w-full justify-center text-center" : "w-full md:w-auto"}`}>
            <div className={`bg-white/10 p-3 rounded-full flex-shrink-0 border border-white/20 animate-pulse ${isLiveDemoMobile ? "hidden" : "block"}`}>
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="font-headline font-black text-xl md:text-2xl tracking-tight uppercase">Evacuate Immediately</h1>
              {!isLiveDemoMobile && (
                <p className="font-body text-sm md:text-base font-medium text-white/90">Follow the marked route to the nearest exit.</p>
              )}
            </div>
          </div>
          
          {route && (
            <div className={`flex items-center bg-black/15 rounded-xl p-3 px-5 md:px-6 justify-center border border-white/5 ${isLiveDemoMobile ? "w-full" : "w-full md:w-auto md:justify-end"}`}>
              <div className="flex flex-col items-center pr-4 md:pr-6">
                <span className="font-headline font-black text-lg md:text-2xl leading-none">{route.distanceFt} ft</span>
                <span className="font-body text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/70 mt-1">Distance</span>
              </div>
              <div className="w-px h-10 bg-white/15 mx-2 md:mx-0"></div>
              <div className="flex flex-col items-center pl-4 md:pl-6">
                <span className="font-headline font-black text-lg md:text-2xl leading-none">{route.timeSec} sec</span>
                <span className="font-body text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/70 mt-1">Est. Time</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative z-10 w-full bg-slate-900 text-white rounded-xl p-4 md:p-6 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-headline font-bold text-sm tracking-widest uppercase">System Secure</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Standard Operations</span>
        </div>
      )}
      
      {/* Map Container */}
      <div className={`w-full flex-1 bg-[#f8f9fa] border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col relative min-h-[500px] ${isLiveDemoMobile ? "-mt-12 z-0" : ""}`}>
        {/* Contextual Map Tools */}
        <div className={`absolute right-6 z-10 flex flex-col gap-2 ${isLiveDemoMobile ? "top-16" : "top-6"}`}>
          <button className="bg-white/90 backdrop-blur-md text-slate-700 p-3 rounded-xl shadow-sm hover:bg-slate-50 transition-colors border border-slate-200">
            <Crosshair className="w-5 h-5" />
          </button>
          <button className="bg-white/90 backdrop-blur-md text-slate-700 p-3 rounded-xl shadow-sm hover:bg-slate-50 transition-colors border border-slate-200">
            <Layers className="w-5 h-5" />
          </button>
        </div>

        {/* The Map Graphic */}
        <div className={`flex-grow w-full relative h-full overflow-auto custom-scrollbar flex md:justify-center ${isLiveDemoMobile ? "items-start" : "items-center"}`}>
          <div className={`w-[600px] md:w-full h-auto md:h-full flex justify-center shrink-0 mx-auto ${isLiveDemoMobile ? "items-start" : "items-center"}`}>
            <svg className="w-full h-auto md:h-full drop-shadow-xl" viewBox={isLiveDemoMobile ? "200 55 700 375" : "200 10 700 450"} preserveAspectRatio="xMidYMid meet">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
              </pattern>
            </defs>

            {/* Background Grid */}
            <rect width="1000" height="500" fill="url(#grid)" rx="24" className="stroke-slate-200 stroke-2" />

            {/* Horizontal Main Corridor */}
            <rect x="210" y="220" width="680" height="60" fill="#e2e8f0" />

            {/* Vertical Intersecting Corridor */}
            <rect x="470" y="60" width="60" height="380" fill="#e2e8f0" />

            {/* Corridor Text */}
            <text x="500" y="258" textAnchor="middle" className="font-headline font-black text-2xl md:text-3xl uppercase tracking-[0.3em] fill-slate-500 stroke-[#f8f9fa] stroke-[6px] pointer-events-none" style={{ paintOrder: 'stroke fill' }}>Main Corridor</text>
            
            {/* Elevator Block */}
            <g transform="translate(470, 20)">
              <rect width="60" height="40" rx="8" className="fill-slate-300 stroke-slate-400 stroke-2" />
              <text x="30" y="20" textAnchor="middle" dominantBaseline="middle" className="font-bold text-[10px] uppercase fill-slate-700 tracking-wider">Elevator</text>
            </g>

            {/* Left Stairs */}
            <g transform="translate(210, 210)">
              <rect width="40" height="80" rx="8" className="fill-emerald-100 stroke-emerald-300 stroke-2" />
              <text x="20" y="20" textAnchor="middle" className="font-bold text-[8px] uppercase fill-emerald-800 tracking-wider">Exit</text>
              <path d="M 10 30 L 30 30 M 10 40 L 30 40 M 10 50 L 30 50 M 10 60 L 30 60 M 10 70 L 30 70" className="stroke-emerald-300 stroke-2" />
            </g>

            {/* Right Stairs */}
            <g transform="translate(850, 210)">
              <rect width="40" height="80" rx="8" className="fill-emerald-100 stroke-emerald-300 stroke-2" />
              <text x="20" y="20" textAnchor="middle" className="font-bold text-[8px] uppercase fill-emerald-800 tracking-wider">Exit</text>
              <path d="M 10 30 L 30 30 M 10 40 L 30 40 M 10 50 L 30 50 M 10 60 L 30 60 M 10 70 L 30 70" className="stroke-emerald-300 stroke-2" />
            </g>

            {/* Rooms */}
            {ROOMS_DATA.map((room) => {
              const isCurrentLocation = room.id === guestLocation;
              const isCrisis = activeCrisis && activeCrisis.roomNumber === room.id;
              const isSafe = !isCrisis;

              let fillClass = "fill-[#fcfdff]";
              let strokeClass = "stroke-slate-300 stroke-[1.5px]";
              let textClass = "fill-slate-800";
              let doorClass = "fill-slate-300";

              if (isSafe) {
                fillClass = "fill-emerald-50/70";
                strokeClass = "stroke-emerald-200 stroke-[1.5px]";
                textClass = "fill-emerald-900";
                doorClass = "fill-emerald-200";
              }
              if (isCrisis) {
                fillClass = "fill-error/10";
                strokeClass = "stroke-error stroke-2";
                textClass = "fill-error";
                doorClass = "fill-error/50";
              }

              return (
                <g 
                  key={room.id} 
                  transform={`translate(${room.x}, ${room.y})`}
                  onClick={() => setSelectedRoomId(room.id)}
                  className="cursor-pointer group"
                >
                  <rect 
                    width="80" height="70" rx="12" 
                    className={cn("transition-colors duration-500", fillClass, strokeClass)} 
                  />
                  {isCrisis && (
                    <rect 
                      width="90" height="80" x="-5" y="-5" rx="16" 
                      className="fill-error/20 stroke-error/40 stroke-2 animate-ping pointer-events-none" 
                    />
                  )}
                  <text 
                    x="40" y="40" 
                    textAnchor="middle" dominantBaseline="middle" 
                    className={cn("font-headline font-black text-xl italic transition-colors duration-500", textClass)}
                  >
                    {room.id}
                  </text>
                  
                  {/* Door cutout indicator */}
                  {room.y < 250 ? (
                    <path d="M 35 70 L 40 60 L 45 70 Z" className={cn("transition-colors duration-500", doorClass)} />
                  ) : (
                    <path d="M 35 0 L 40 10 L 45 0 Z" className={cn("transition-colors duration-500", doorClass)} />
                  )}

                  {/* YOU ARE HERE Marker */}
                  {isCurrentLocation && (
                    <g transform="translate(40, 10)">
                      <text y="-15" textAnchor="middle" className="font-black text-[8px] uppercase tracking-widest fill-emerald-600">You Are</text>
                      <text y="-5" textAnchor="middle" className="font-black text-[8px] uppercase tracking-widest fill-emerald-600">Here</text>
                      <path d="M -8 10 C -8 4 8 4 8 10 C 8 16 0 24 0 24 C 0 24 -8 16 -8 10 Z" className="fill-emerald-500 stroke-white stroke-2 drop-shadow-md" />
                      <circle cx="0" cy="10" r="3" fill="white" />
                    </g>
                  )}
                </g>
              );
            })}

            {/* Evacuation Route */}
            {activeCrisis && route && (
              <g className="pointer-events-none">
                <path 
                  d={route.path} 
                  className="fill-none stroke-error stroke-[4px] opacity-30" 
                  strokeLinecap="round" strokeLinejoin="round" 
                />
                <path 
                  d={route.path} 
                  className="fill-none stroke-error stroke-[4px] animate-[dash_2s_linear_infinite]" 
                  strokeDasharray="12,12" 
                  strokeLinecap="round" strokeLinejoin="round" 
                />
                {/* Route Destination Node at the Exit */}
                <circle 
                  cx={route.targetX} 
                  cy="250" 
                  r="6" 
                  className="fill-error stroke-white stroke-[1.5px] drop-shadow-sm" 
                />
              </g>
            )}
          </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestFacilityMap;


