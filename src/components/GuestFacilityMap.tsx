import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Shield, ShieldAlert, Crosshair, Layers, MapPin } from 'lucide-react';
import FacilityMap from './FacilityMap';

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
        <div className={`flex-grow w-full relative h-full overflow-hidden flex md:justify-center ${isLiveDemoMobile ? "items-start" : "items-center"}`}>
          <div className="w-full h-full absolute inset-0 rounded-[2.5rem] overflow-hidden">
            <FacilityMap 
              guestLocation={guestLocation}
              selectedRoomId={selectedRoomId}
              onRoomSelect={setSelectedRoomId}
              activeCrisis={activeCrisis}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestFacilityMap;


