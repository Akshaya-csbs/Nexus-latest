/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  streamCrises, streamUnits, streamLogs, streamRooms, triggerCrisis, seedDatabase, 
  CrisisEvent, ResponderUnit, OperationalLog, RoomStatus, updateRoomStatus, clearAllCrises,
  auth, loginAdmin, logoutUser,
  streamInventory, updateInventoryCount, updateFloorInventory, FloorInventory
} from './services/firebaseService';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { generateEvacuationRoute, EvacuationStep } from './services/aiService';
import { 
  Shield, 
  AlertTriangle, 
  Layers, 
  Zap, 
  Map as MapIcon, 
  Users, 
  Cpu, 
  Bell, 
  Activity,
  ChevronRight,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Plus,
  ShieldAlert,
  Eye,
  Smartphone,
  CheckCircle,
  Navigation,
  Cloud,
  BookOpen,
  MapPin,
  Asterisk,
  Coffee,
  CloudSun,
  Utensils,
  Sun,
  Wind,
  Package,
  Box,
  Pill,
  Droplet,
  Menu,
  X
} from 'lucide-react';
import { cn } from './lib/utils';
import MockMap from './components/MockMap';
import GuestFacilityMap from './components/GuestFacilityMap';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// --- Types ---

type AdminSubView = 'dashboard' | 'incidents' | 'map' | 'units' | 'logs';
type GuestSubView = 'checkin' | 'dashboard' | 'map' | 'instructions' | 'sos';
type View = 'pitch' | 'admin' | 'guide' | 'simulation';
type Scene = 'problem' | 'activation' | 'pillars' | 'outcome' | 'gcp';

// --- Constants ---

const SCENE_DURATION = {
  problem: 5000,
  activation: 8000,
  pillars: 12000,
  outcome: 6000,
  gcp: 4000,
};

// --- Components ---

const SidebarContent = ({ currentView, currentSubView, setView, setSubView, activeCrisis, onClose }: { 
  currentView: View, 
  currentSubView: AdminSubView,
  setView: (v: View) => void,
  setSubView: (sv: AdminSubView) => void,
  activeCrisis?: CrisisEvent,
  onClose?: () => void
}) => {
  const isCrisisActive = !!activeCrisis;

  const toggleMockCrisis = () => {
    if (isCrisisActive) { clearAllCrises(); } 
    else {
      triggerCrisis({ crisisType: 'fire', floor: 4, roomNumber: '412', severity: 'critical', description: 'Mock emergency drill initiated.' });
    }
  };

  const handleNav = (view: View, sub?: AdminSubView) => {
    setView(view);
    if (sub) setSubView(sub);
    onClose?.();
  };

  return (
    <div className="flex flex-col bg-slate-950 text-secondary font-headline h-full w-72">
      <div className="p-8 flex flex-col gap-1 bg-slate-900/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-white">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black uppercase tracking-widest text-sm leading-tight">Sentinel Admin</span>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Vigilant Watch v42</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar font-headline font-bold text-sm tracking-wide">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Layers },
          { id: 'incidents', label: 'Active Incidents', icon: ShieldAlert },
          { id: 'map', label: 'Resource Map', icon: MapIcon },
          { id: 'units', label: 'Responder Units', icon: Users },
          { id: 'logs', label: 'System Logs', icon: Activity },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (currentView !== 'simulation') setView('admin');
              setSubView(item.id as AdminSubView);
            }}
            className={cn(
              "flex items-center gap-4 py-3 px-8 mx-2 transition-all rounded-lg",
              (currentView === 'admin' || currentView === 'simulation') && currentSubView === item.id 
                ? "bg-slate-800 text-secondary border-l-4 border-secondary translate-x-1" 
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/50"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
        
        <div className="mx-4 my-8 pt-4 border-t border-slate-800/30">
          <button 
            onClick={() => setView('guide')}
            className={cn(
              "w-full flex items-center gap-4 py-3 px-4 rounded-lg transition-all",
              currentView === 'guide' ? "bg-slate-800 text-secondary border-l-4 border-secondary" : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/50"
            )}
          >
            <Smartphone className="w-5 h-5" />
            <span>Guest Guide View</span>
          </button>
        </div>
      </nav>

      <div className="px-6 pb-6">
        <button 
          onClick={toggleMockCrisis}
          className={cn(
            "w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg transition-all active:scale-95",
            isCrisisActive 
              ? "bg-emerald-500 text-white shadow-emerald-500/20" 
              : "bg-[#c00000] text-white shadow-red-500/20"
          )}
        >
          {isCrisisActive ? 'End Mock Crisis' : 'Mock Crisis'}
        </button>
      </div>

      <div className="mt-auto pb-4 pt-2 border-t border-slate-800/50 flex flex-col gap-1 font-headline font-bold text-sm">
        <button className="flex items-center gap-4 text-slate-400 hover:text-slate-100 px-8 py-3 transition-colors">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
        <button onClick={async () => { await logoutUser(); setView('pitch'); }} className="flex items-center gap-4 text-slate-400 hover:text-slate-100 px-8 py-3 transition-colors border-t border-slate-800/30">
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ currentView, currentSubView, setView, setSubView, activeCrisis, mobileOpen, onMobileClose }: { 
  currentView: View, currentSubView: AdminSubView,
  setView: (v: View) => void, setSubView: (sv: AdminSubView) => void,
  activeCrisis?: CrisisEvent, mobileOpen: boolean, onMobileClose: () => void
}) => (
  <>
    {/* Desktop sidebar */}
    <aside className="hidden md:flex flex-col shadow-2xl fixed left-0 top-0 h-full w-72 z-50">
      <SidebarContent currentView={currentView} currentSubView={currentSubView} setView={setView} setSubView={setSubView} activeCrisis={activeCrisis} />
    </aside>
    {/* Mobile drawer overlay */}
    {mobileOpen && (
      <div className="md:hidden fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
        <div className="relative z-10 flex flex-col shadow-2xl w-72 max-w-[85vw]">
          <SidebarContent currentView={currentView} currentSubView={currentSubView} setView={setView} setSubView={setSubView} activeCrisis={activeCrisis} onClose={onMobileClose} />
        </div>
      </div>
    )}
  </>
);

const TopBar = ({ title, view, setView, onMenuOpen }: { title: string, view: View, setView: (v: View) => void, onMenuOpen?: () => void }) => (
  <header className={cn(
    "fixed top-0 right-0 h-16 z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 flex items-center justify-between px-4 md:px-8 transition-all",
    view === 'pitch' ? "left-0" : "left-0 md:left-72"
  )}>
    <div className="flex items-center gap-3">
      {/* Mobile hamburger — shown only in non-pitch views */}
      {view !== 'pitch' && (
        <button onClick={onMenuOpen} className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-slate-100 transition-all">
          <Menu className="w-5 h-5" />
        </button>
      )}
      <span className="text-sm md:text-lg font-bold text-on-surface uppercase tracking-widest font-body truncate max-w-[160px] md:max-w-none">{title}</span>
    </div>

    <div className="flex items-center gap-2 md:gap-4">
      {/* Mobile view switcher pills */}
      <div className="flex md:hidden items-center gap-1">
        <button onClick={() => setView('pitch')} className={cn("px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all", view === 'pitch' ? 'bg-secondary text-white' : 'text-slate-400')}>
          Pitch
        </button>
        <button onClick={() => setView('admin')} className={cn("px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all", view === 'admin' ? 'bg-secondary text-white' : 'text-slate-400')}>
          Ops
        </button>
        <button onClick={() => setView('simulation')} className={cn("px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all", view === 'simulation' ? 'bg-error text-white' : 'text-slate-400')}>
          Demo
        </button>
        <button onClick={() => setView('guide')} className={cn("px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all", view === 'guide' ? 'bg-slate-900 text-white' : 'text-slate-400')}>
          Guest
        </button>
      </div>

      {/* Desktop nav */}
      <nav className="hidden lg:flex items-center gap-6 mr-6 border-r border-outline-variant/20 pr-6">
        <button onClick={() => setView('pitch')} className={cn("text-xs font-bold uppercase tracking-widest transition-all", view === 'pitch' ? 'text-secondary' : 'text-slate-500 hover:text-on-surface')}>Visual Pitch</button>
        <button onClick={() => setView('admin')} className={cn("text-xs font-bold uppercase tracking-widest transition-all", view === 'admin' ? 'text-secondary' : 'text-slate-500 hover:text-on-surface')}>Operations</button>
        <button onClick={() => setView('simulation')} className={cn("text-xs font-bold uppercase tracking-widest transition-all px-4 py-1.5 rounded-full border", view === 'simulation' ? 'border-error text-error bg-error/10' : 'border-transparent text-slate-500 hover:text-on-surface')}>
          <div className={cn("inline-block w-2 h-2 rounded-full mr-2", view === 'simulation' ? 'bg-error animate-pulse' : 'bg-slate-400')} />Live Demo
        </button>
      </nav>

      {view !== 'pitch' && (
        <div className="hidden md:flex items-center gap-4">
          <button className="p-2 text-on-surface-variant hover:bg-slate-100 rounded-full transition-all"><Bell className="w-5 h-5" /></button>
          <div className="w-8 h-8 rounded-full bg-slate-300 overflow-hidden border border-outline-variant/30">
            <img src="https://picsum.photos/seed/admin/100/100" alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </div>
      )}
    </div>
  </header>
);

// --- Content Components ---

const AdminIncidents = () => {
  const [incidents, setIncidents] = useState<CrisisEvent[]>([]);
  useEffect(() => { return streamCrises(setIncidents); }, []);

  return (
  <div className="space-y-10">
    <div className="flex flex-col gap-2">
      <h2 className="text-5xl font-headline font-extrabold tracking-tight text-on-surface">Active Incidents</h2>
      <p className="text-on-surface-variant font-medium">Monitoring ongoing threats and suppression status.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {incidents.length === 0 && <div className="col-span-3 py-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No active incidents. Sky is clear.</div>}
      {incidents.map((inc, i) => {
        const isCritical = inc.severity === 'critical' || inc.severity === 'high';
        const isWarning = inc.severity === 'medium';
        return (
        <div key={inc.id || i} className="bg-white p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div className={cn("p-4 rounded-2xl", isCritical ? 'bg-error/10 text-error' : isWarning ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500')}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">#{inc.id?.slice(0,6).toUpperCase() || 'INC'}</span>
          </div>
          <div>
            <h3 className="text-xl font-headline font-bold text-on-surface mb-1 capitalize">{inc.crisisType} Alert</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">Room {inc.roomNumber} (Floor {inc.floor})</p>
          </div>
          <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
             <span className={cn("px-2 py-1 rounded text-[10px] font-black uppercase", isCritical ? 'bg-error text-white' : 'bg-slate-200 text-slate-700')}>{inc.severity}</span>
             <button className="text-[10px] font-black uppercase tracking-widest text-secondary">Deploy Units</button>
          </div>
        </div>
      )})}
    </div>
  </div>
);
};

const AdminUnits = () => {
  const [units, setUnits] = useState<ResponderUnit[]>([]);
  useEffect(() => { return streamUnits(setUnits); }, []);
  return (
  <div className="space-y-10">
    <div className="flex flex-col gap-2">
      <h2 className="text-5xl font-headline font-extrabold tracking-tight text-on-surface">Responder Units</h2>
      <p className="text-on-surface-variant font-medium">Managing on-site security and emergency personnel.</p>
    </div>

    <div className="bg-white rounded-[2.5rem] overflow-hidden border border-outline-variant/20 shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Unit ID</th>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Commander</th>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Sector</th>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {units.length === 0 && (
             <tr><td colSpan={5} className="px-8 py-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">No units deployed.</td></tr>
          )}
          {units.map((u) => (
            <tr key={u.id || u.unitId} className="hover:bg-slate-50/50 transition-all">
              <td className="px-8 py-6 font-mono text-xs font-bold">{u.unitId}</td>
              <td className="px-8 py-6 text-sm font-bold">{u.commander}</td>
              <td className="px-8 py-6 text-sm font-medium text-slate-500">{u.sectorId}</td>
              <td className="px-8 py-6">
                <span className={cn("px-2 py-1 rounded text-[10px] font-black uppercase", u.status === 'active' || u.status === 'evacuating' ? 'bg-error/10 text-error' : 'bg-tertiary-fixed-dim/10 text-on-tertiary-container')}>
                  {u.status}
                </span>
              </td>
              <td className="px-8 py-6">
                <button className="text-secondary font-black text-[10px] uppercase tracking-widest">Connect Hub</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
};

const ResourceInventoryDashboard = () => {
  const [inventory, setInventory] = useState<FloorInventory[]>([]);
  const [draft, setDraft] = useState<Record<string, FloorInventory>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return streamInventory(setInventory);
  }, []);

  useEffect(() => {
    if (!isDirty && inventory.length > 0) {
      const initialDraft = inventory.reduce((acc, curr) => ({ ...acc, [curr.id!]: { ...curr } }), {} as Record<string, FloorInventory>);
      setDraft(initialDraft);
    }
  }, [inventory, isDirty]);

  const displayData = isDirty ? Object.values(draft).sort((a, b) => a.floor - b.floor) : [...inventory].sort((a, b) => a.floor - b.floor);

  const resources: Array<{ id: keyof Omit<FloorInventory, 'id' | 'floor'>, label: string, icon: any, color: string, bg: string }> = [
    { id: 'linens', label: 'Linens', icon: Wind, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'safety', label: 'Safety Kits', icon: Shield, color: 'text-error', bg: 'bg-error/10' },
    { id: 'supplies', label: 'Guest Supplies', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'medical', label: 'Medical', icon: Pill, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'water', label: 'Water', icon: Droplet, color: 'text-sky-500', bg: 'bg-sky-50' },
  ];

  const totals = displayData.reduce((acc, curr) => {
    resources.forEach(r => acc[r.id] = (acc[r.id] || 0) + (curr[r.id] || 0));
    return acc;
  }, {} as Record<string, number>);

  const handleDraftUpdate = (floorId: string, resource: keyof Omit<FloorInventory, 'id' | 'floor'>, newValue: number) => {
    if (isNaN(newValue)) return;
    setIsDirty(true);
    setDraft(prev => ({
      ...prev,
      [floorId]: {
        ...prev[floorId],
        [resource]: Math.max(0, newValue)
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promises = Object.values(draft).map(floor => updateFloorInventory(floor.id!, floor));
      await Promise.all(promises);
      setIsDirty(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[3rem] overflow-hidden border border-slate-200 shadow-sm">
      <div className="p-10 border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <h2 className="text-4xl font-headline font-black italic tracking-tighter uppercase mb-2">Resource Inventory Engine</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Facility-Wide Sentinel Tracking</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {resources.map(res => (
              <div key={res.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center gap-2 min-w-[100px]">
                <res.icon className={cn("w-5 h-5", res.color)} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{res.label}</span>
                <span className="text-lg font-black text-slate-900">{totals[res.id] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 border-l-4 border-slate-900 pl-4">Floor-Wise Allocation</h3>
              <div className="flex gap-2">
                 <button onClick={() => seedDatabase()} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest mr-2">Reset Data</button>
                 <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Export Manifest</button>
              </div>
           </div>
           
           <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50/50 border-b border-slate-100">
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Floor Level</th>
                   {resources.map(res => (
                     <th key={res.id} className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{res.label}</th>
                   ))}
                   <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {displayData.length === 0 && (
                   <tr><td colSpan={7} className="px-8 py-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">No inventory data. Please reset data.</td></tr>
                 )}
                 {displayData.map(floor => (
                   <tr key={floor.id} className="hover:bg-slate-50/30 transition-all group">
                     <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black">L{floor.floor}</div>
                         <span className="font-bold text-slate-900 uppercase text-xs tracking-widest">Sector {String.fromCharCode(64 + floor.floor)}</span>
                       </div>
                     </td>
                     {resources.map(res => {
                       const count = floor[res.id] || 0;
                       return (
                         <td key={res.id} className="px-8 py-6">
                           <div className="flex flex-col gap-2">
                             <div className="flex items-center justify-between">
                               <button 
                                 onClick={() => handleDraftUpdate(floor.id!, res.id, count - 1)}
                                 className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 transition-all font-bold text-xs"
                               >
                                 -
                               </button>
                               <input 
                                 type="number"
                                 value={count}
                                 onChange={(e) => handleDraftUpdate(floor.id!, res.id, parseInt(e.target.value) || 0)}
                                 className="w-12 text-sm font-black text-slate-900 font-mono text-center bg-transparent focus:bg-slate-100 rounded focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [appearance:textfield]"
                               />
                               <button 
                                 onClick={() => handleDraftUpdate(floor.id!, res.id, count + 1)}
                                 className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-900 transition-all font-bold text-xs"
                               >
                                 +
                               </button>
                             </div>
                             <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={cn("h-full rounded-full transition-all duration-300", res.color.replace('text-', 'bg-'))} 
                                  style={{ width: `${Math.min(100, (count / 300) * 100)}%` }} 
                                />
                             </div>
                           </div>
                         </td>
                       );
                     })}
                     <td className="px-8 py-6">
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-widest">Nominal</span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
           <AnimatePresence>
             {isDirty && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 20 }}
                 className="mt-8 flex justify-end"
               >
                 <button 
                   onClick={handleSave} 
                   disabled={isSaving}
                   className="px-10 py-4 bg-[#c00000] text-white rounded-[2rem] font-headline font-black text-lg uppercase tracking-widest shadow-2xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 italic"
                 >
                   {isSaving ? 'Syncing...' : 'Save Changes'}
                 </button>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const AdminLogs = () => {
  const [logs, setLogs] = useState<OperationalLog[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  useEffect(() => { 
    const unsub = streamLogs(setLogs);
    return () => unsub();
  }, []);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedDatabase();
    } catch (err) {
      console.error("Manual seed failed:", err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
  <div className="space-y-10">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-5xl font-headline font-extrabold tracking-tight text-on-surface uppercase italic">System Logs</h2>
        <p className="text-on-surface-variant font-medium">Complete transaction and activity history for NexusResponse Hub.</p>
      </div>
      {logs.length === 0 && (
         <button 
           onClick={handleSeed} 
           disabled={isSeeding}
           className={cn(
             "bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl transition-all",
             isSeeding ? "opacity-50 cursor-wait scale-95" : "hover:scale-105 active:scale-95"
           )}
         >
           {isSeeding ? 'Seeding Data...' : 'Seed Activity Logs'}
         </button>
      )}
    </div>

    <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Timestamp</th>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Event</th>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Source</th>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Category</th>
            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {logs.length === 0 && (
             <tr><td colSpan={5} className="px-8 py-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">No logs detected.</td></tr>
          )}
          {logs.map((log, i) => {
            const t = log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now';
            return (
              <tr key={log.id || i} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-8 py-6 font-mono text-[10px] font-bold text-slate-400">{t}</td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        log.status === 'warning' ? "bg-amber-100 text-amber-600" :
                        log.status === 'success' ? "bg-emerald-100 text-emerald-600" :
                        "bg-slate-100 text-slate-500"
                      )}>
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-bold text-slate-900">{log.event}</span>
                   </div>
                </td>
                <td className="px-8 py-6 text-xs text-slate-500 uppercase font-black tracking-widest">{log.source}</td>
                <td className="px-8 py-6">
                   <span className="text-[10px] font-black uppercase tracking-widest py-1 px-2 bg-slate-100 text-slate-600 rounded">{log.category}</span>
                </td>
                <td className="px-8 py-6">
                   <span className={cn(
                     "px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-sm",
                     log.status === 'warning' ? "bg-amber-500 text-white" :
                     log.status === 'success' ? "bg-emerald-500 text-white" :
                     "bg-slate-100 text-slate-500"
                   )}>
                     {log.status}
                   </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
};

const GuestCheckIn = ({ onLogin, onNavigate }: { onLogin: () => void, onNavigate: (v: GuestSubView) => void }) => (
  <div className="flex-1 flex flex-col items-center justify-start pt-24 p-8 relative overflow-hidden bg-surface">
    <div className="absolute top-[-10%] right-[-10%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-surface-container-low/50 via-surface/10 to-surface pointer-events-none -z-10" />
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-12">
      <header className="flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-3 text-on-surface">
          <Shield className="w-10 h-10 text-secondary" />
          <h1 className="font-headline font-black text-3xl tracking-tight uppercase italic">SafeStay</h1>
        </div>
        <div className="space-y-3">
          <h2 className="font-headline text-5xl font-extrabold tracking-tighter italic leading-none text-slate-900">Welcome<br/>back.</h2>
          <p className="font-body text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 max-w-[240px] leading-relaxed mx-auto">
            Authorized Personnel Hub
          </p>
        </div>
      </header>
      
      <div className="bg-white border border-slate-100 p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 space-y-8 relative">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary/5 rounded-full blur-3xl" />
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Room Number</label>
            <input 
              type="text" 
              placeholder="e.g. 402" 
              className="w-full bg-slate-100 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-secondary/20 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Access Key</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full bg-slate-100 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-secondary/20 transition-all"
            />
          </div>
        </div>
        <button 
          onClick={onLogin}
          className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-headline font-black text-lg uppercase tracking-widest shadow-2xl hover:bg-slate-800 active:scale-95 transition-all italic tracking-tighter"
        >
          Check In
        </button>
      </div>
    </motion.div>
  </div>
);

const GuestDashboard = ({ setSubView, activeCrisis }: { setSubView: (sv: GuestSubView) => void, activeCrisis?: CrisisEvent }) => {
  if (!activeCrisis) {
    return (
      <div className="flex-1 flex flex-col px-6 py-8 overflow-y-auto custom-scrollbar gap-8 bg-white">
        <div className="flex justify-between items-start pt-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Welcome back,</p>
            <h2 className="text-3xl font-headline font-black tracking-tight italic text-slate-900">MR. ANDERSON</h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
             <CloudSun className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group overflow-hidden relative">
            <div className="relative z-10 space-y-2">
               <div className="flex items-center gap-2 text-emerald-600">
                 <CheckCircle className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Sentinel Secured</span>
               </div>
               <p className="text-lg font-bold text-slate-800 leading-tight">Everything is exactly as it should be.</p>
            </div>
            <Shield className="w-16 h-16 text-slate-200 absolute -right-4 -bottom-4 rotate-12" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Room Service', icon: Utensils, sub: 'Dining' },
              { label: 'Housekeeping', icon: Wind, sub: 'Clean' },
              { label: 'Concierge', icon: Smartphone, sub: 'Assistance' },
              { label: 'Facility Map', icon: MapIcon, sub: 'Explore', action: () => setSubView('map') },
            ].map((item, i) => (
              <button 
                key={i}
                onClick={item.action}
                className="p-6 bg-white border border-slate-100 rounded-[2.5rem] flex flex-col gap-4 text-left shadow-sm hover:border-slate-300 transition-all active:scale-95"
              >
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-all">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-headline font-black text-slate-900 tracking-tight uppercase italic text-sm leading-none">{item.label}</h4>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{item.sub}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white flex flex-col items-center text-center gap-4 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
             <Coffee className="w-8 h-8 text-secondary mb-2" />
             <h3 className="text-xl font-headline font-black uppercase italic tracking-tighter relative z-10">Morning Selection</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Premium beans from Ethiopia now available at the lobby bar.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="flex-1 flex flex-col px-6 py-8 overflow-y-auto custom-scrollbar gap-8 bg-[#fcfdff]">
    <div className="text-center space-y-2 pt-4">
      <h2 className="text-4xl font-headline font-black tracking-tight italic uppercase text-red-600">Sentinel Hub</h2>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Room 412 • Sector Alpha • Secure</p>
    </div>

    <div className="grid grid-cols-1 gap-4">
      <button 
        onClick={() => setSubView('instructions')}
        className="w-full p-8 bg-[#c00000] rounded-[2.5rem] text-white flex flex-col gap-4 text-left relative overflow-hidden shadow-2xl shadow-red-500/30 group active:scale-95 transition-all text-center items-center"
      >
        <div className="absolute top-0 right-0 p-8 opacity-20"><AlertTriangle className="w-24 h-24" /></div>
        <div className="flex items-center gap-3 relative z-10">
          <Zap className="w-6 h-6 text-white fill-white animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-white/80">E-Guide Active</span>
        </div>
        <h3 className="text-4xl font-headline font-black italic tracking-tighter uppercase leading-none relative z-10">GET OUT NOW</h3>
        <p className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-6 py-2 rounded-full relative z-10 mt-2">Start Evacuation &rarr;</p>
      </button>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setSubView('map')}
          className="p-8 bg-white border border-slate-100 rounded-[2.5rem] flex flex-col gap-4 text-left shadow-sm group active:scale-95 transition-all"
        >
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-slate-950 group-hover:text-white transition-all">
            <MapIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-headline font-black text-slate-900 tracking-tight uppercase italic text-lg leading-none">Map</h4>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Facility</p>
          </div>
        </button>
        <button 
          onClick={() => setSubView('sos')}
          className="p-8 bg-white border border-slate-100 rounded-[2.5rem] flex flex-col gap-4 text-left shadow-sm group active:scale-95 transition-all"
        >
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-[#c00000] group-hover:text-white transition-all">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-headline font-black text-slate-900 tracking-tight uppercase italic text-lg leading-none">SOS</h4>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Security</p>
          </div>
        </button>
      </div>

      <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 flex flex-col gap-2 items-center text-center">
        <div className="flex items-center gap-2 text-red-600">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Emergency Broadcast</span>
        </div>
        <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase tracking-wide">Crisis detected at Sector Alpha. Automatic evacuation protocols have been engaged. Follow the e-guide.</p>
      </div>
    </div>
  </div>
);
};

const AdminDashboard = ({ rooms, isCompact = false }: { rooms: RoomStatus[], isCompact?: boolean }) => {
  const [logs, setLogs] = useState<OperationalLog[]>([]);
  const [crises, setCrises] = useState<CrisisEvent[]>([]);
  
  useEffect(() => {
    const unsubLogs = streamLogs(setLogs);
    const unsubCrises = streamCrises(setCrises);
    return () => { unsubLogs(); unsubCrises(); };
  }, []);
  
  const activeAlerts = crises.filter(c => c.status === 'active').length;

  return (
  <div className={cn("flex flex-col gap-8", isCompact ? "space-y-0 gap-6" : "space-y-0")}>
    {/* Page Header */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold uppercase rounded">Operational</span>
          {!isCompact && <span className="text-on-surface-variant text-[11px] font-medium">100% Core Services Active</span>}
        </div>
        <h2 className={cn("font-headline font-black tracking-tight text-on-surface uppercase italic leading-none", isCompact ? "text-3xl" : "text-5xl")}>Real-Time Operations</h2>
      </div>
      <div className="flex items-center gap-3">
        {crises.length === 0 && (
          <button onClick={() => seedDatabase()} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-600 transition-colors">
            Seed Data
          </button>
        )}
        <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-[10px] font-label font-medium text-slate-700 shadow-sm">
          <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        {!isCompact && (
          <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-colors">
            <Plus className="w-4 h-4" />
            New Task
          </button>
        )}
      </div>
    </div>

    {/* Metric Grid */}
    <div className="grid grid-cols-12 gap-6">
      <div className={cn("col-span-12 space-y-6", isCompact ? "lg:col-span-12" : "lg:col-span-8")}>
        <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-6", isCompact && "sm:grid-cols-3")}>
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 font-label text-[10px] font-black uppercase tracking-[0.2em]">Guests</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn("font-headline font-black text-slate-900", isCompact ? "text-3xl" : "text-5xl")}>1,248</span>
              <span className="text-[10px] font-bold text-emerald-600">+12%</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 font-label text-[10px] font-black uppercase tracking-[0.2em]">In-Zone Status</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn("font-headline font-black text-slate-900", isCompact ? "text-3xl" : "text-5xl")}>98.2<span className="text-xl">%</span></span>
            </div>
          </div>
          <div className={cn("bg-slate-900 text-white rounded-[2rem] p-6 shadow-2xl flex flex-col gap-3 border-l-8 transition-all", activeAlerts > 0 ? "border-error" : "border-secondary")}>
            <div className="flex justify-between items-start">
              <span className="text-secondary/80 font-label text-[10px] font-black uppercase tracking-[0.2em]">Pending Alerts</span>
              <AlertTriangle className={cn("w-4 h-4", activeAlerts > 0 ? "text-error animate-pulse" : "text-secondary")} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn("font-headline font-black text-white", isCompact ? "text-3xl" : "text-5xl")}>{activeAlerts.toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* Action Panel or Map */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col h-[400px] relative">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 italic">Facility Monitor</span>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              </div>
            </div>
          </div>
          <div className="flex-1 relative bg-slate-50 overflow-hidden">
            <MockMap rooms={rooms} crises={crises} className="h-full border-none rounded-none" />
          </div>
        </div>
      </div>

      {/* Sidebar Activity (Hidden if compact on extra small but visible here) */}
      {!isCompact && (
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col h-[500px] overflow-hidden">
             <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">System Activity</h3>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-on-surface uppercase tracking-widest">Live Feed</span>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
               {logs.length === 0 && <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No logs found.</div>}
               {logs.slice(0, 5).map((log, i) => {
                 const t = log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : 'Just now';
                 let Icon = Activity;
                 if (log.category === 'security') Icon = Shield;
                 if (log.category === 'hardware') Icon = Settings;
                 
                 return (
                 <div key={i} className="flex gap-4 p-5 hover:bg-slate-50 transition-all rounded-[1.5rem] group cursor-pointer">
                   <div className={cn(
                     "w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110",
                     log.status === 'warning' ? "bg-secondary/10 text-secondary" :
                     log.status === 'success' ? "bg-emerald-500/10 text-emerald-600" :
                     "bg-slate-100 text-slate-500"
                   )}>
                     <Icon className="w-5 h-5" />
                   </div>
                   <div className="flex-1">
                     <div className="flex justify-between items-start">
                       <h4 className="text-sm font-bold text-on-surface">{log.event}</h4>
                       <span className="font-mono text-[9px] text-slate-400 font-bold">{t}</span>
                     </div>
                     <p className="text-[11px] font-medium text-slate-500 mt-0.5">{log.source}</p>
                   </div>
                 </div>
               )})}
             </div>
             <button className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface border-t border-slate-100 hover:bg-slate-50 transition-colors">
               Access Transaction Logs
             </button>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

const GuestGuide = ({ onBack, onNavigate, activeCrisis, roomNumber, floorNumber }: { onBack: () => void, onNavigate: (v: GuestSubView) => void, activeCrisis?: CrisisEvent, roomNumber: string, floorNumber: number }) => {
  const [steps, setSteps] = useState<EvacuationStep[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadRoute = async () => {
      if (!activeCrisis) {
        setSteps([{ id: 1, title: 'Safe Zone', sub: 'Monitoring all blocks. No active alerts for your sector.' }]);
        setIsLoading(false);
        return;
      }
      
      const context = `${activeCrisis.crisisType} reported at Floor ${activeCrisis.floor || 'Unknown'}, Area ${activeCrisis.roomNumber || 'Unknown'}. Severity: ${activeCrisis.severity}.`;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const routeSteps = await generateEvacuationRoute(roomNumber, floorNumber, context);
        if (isMounted) {
          setSteps(routeSteps);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to generate route:", err);
        if (isMounted) {
          setError("Offline Protocol Active");
          setSteps([
            { id: 1, title: 'Exit room', sub: 'Move quickly but calmly towards the main hallway door.' },
            { id: 2, title: 'Proceed 15 feet', sub: 'Follow the wall to your left until you reach the marked intersection.' },
            { id: 3, title: 'Continue straight', sub: 'Head towards the primary stairwell. Do not use elevators.' }
          ]);
          setIsLoading(false);
        }
      }
    };

    loadRoute();
    return () => { isMounted = false; };
  }, [activeCrisis?.id, activeCrisis?.status, roomNumber, floorNumber]);

  return (
    <div className="flex-1 flex flex-col bg-[#fcfdff] h-full text-slate-900 font-sans overflow-hidden">
      <div className="flex-1 flex flex-col px-6 py-8 overflow-y-auto custom-scrollbar gap-8">
        {/* Urgent Instruction */}
        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <div className="p-4 rounded-full">
            <AlertTriangle className="w-16 h-16 text-[#c00000] fill-[#c00000]/10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tight text-[#c00000] italic leading-none">
              {isLoading ? "Calculating..." : (steps?.[1]?.title || "Stay Alert")}
            </h1>
            <p className="text-lg font-black text-[#a66a00] uppercase tracking-wider">
              {isLoading ? "Analyzing Spatial Data" : "in 15 feet"}
            </p>
          </div>
        </div>

        {/* Route Container */}
        <div className="bg-[#eff4ff]/60 rounded-[2.5rem] p-4 flex flex-col gap-4">
          <div className="px-6 py-2 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-[#002868]">
            <span>Evacuation Route</span>
            <span className="px-3 py-1 bg-[#dbe8ff] text-[#002868] rounded-full text-[8px] font-black tracking-widest">Active</span>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="p-12 flex flex-col items-center gap-4 text-[#002868] opacity-40">
                <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Optimizing Exit Vector...</span>
              </div>
            ) : (
              (steps || []).slice(0, 3).map((step, index) => {
                const active = index === 1; // Simulation: let's make the second one active for the "Turn left" visual
                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "bg-white p-6 rounded-[2rem] flex gap-5 items-start relative overflow-hidden transition-all shadow-sm",
                      active ? "border-l-[6px] border-[#c00000]" : "opacity-60"
                    )}
                  >
                    <div className={cn(
                      "min-w-12 h-12 rounded-full flex items-center justify-center transition-all",
                      active ? "bg-red-50" : "bg-slate-50"
                    )}>
                      {active ? (
                        <div className="p-2 rounded-full bg-red-100 rotate-[-90deg]">
                           <Navigation className="w-5 h-5 text-[#c00000] fill-[#c00000]" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                           <span className="font-headline font-black text-sm italic text-slate-400">{index + 1}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className={cn(
                        "font-black text-lg italic tracking-tighter leading-tight uppercase",
                        active ? "text-[#c00000]" : "text-[#002868]"
                      )}>
                        {step.title}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-500 leading-snug">
                        {step.sub}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={async () => { 
            await updateRoomStatus(roomNumber, { occupancyStatus: 'evacuated' }); 
            await clearAllCrises();
            onBack(); 
          }}
          className="mt-4 w-full py-6 bg-[#001c10] text-[#10b981] rounded-[2rem] font-headline font-black text-xl tracking-tighter italic flex items-center justify-center gap-4 hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-emerald-950/20"
        >
          <CheckCircle className="w-6 h-6" />
          I AM SAFE
        </button>
      </div>
    </div>
  );
};

const VisualPitch = ({ onComplete }: { onComplete: () => void; key?: string }) => {
  const [scene, setScene] = useState<Scene>('problem');

  // Sequence simulation
  useEffect(() => {
    const timer1 = setTimeout(() => setScene('activation'), SCENE_DURATION.problem);
    const timer2 = setTimeout(() => setScene('pillars'), SCENE_DURATION.problem + SCENE_DURATION.activation);
    const timer3 = setTimeout(() => setScene('outcome'), SCENE_DURATION.problem + SCENE_DURATION.activation + SCENE_DURATION.pillars);
    const timer4 = setTimeout(() => setScene('gcp'), SCENE_DURATION.problem + SCENE_DURATION.activation + SCENE_DURATION.pillars + SCENE_DURATION.outcome);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 relative overflow-hidden">
      {/* Immersive background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_rgba(0,212,255,0.1)_0%,_transparent_70%)] pointer-events-none" />

      <AnimatePresence mode="wait">
        {(scene === 'problem' || scene === 'activation') && (
          <motion.div 
            key="floorplan" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
            className="w-full max-w-5xl flex flex-col gap-12"
          >
            <div className="aspect-video rounded-[3rem] bg-slate-100 border border-slate-200 shadow-2xl overflow-hidden relative group">
              <img src="https://picsum.photos/seed/evacuation/1200/800?grayscale" className="w-full h-full object-cover opacity-10 mix-blend-multiply" referrerPolicy="no-referrer" />
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-2/3 h-2/3">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-[0.05] pointer-events-none">
                    {Array.from({ length: 144 }).map((_, i) => <div key={i} className="border border-slate-900" />)}
                  </div>
                  
                  {/* Room Nodes */}
                  <motion.div 
                    layoutId="node-412"
                    initial={{ scale: 1 }}
                    animate={scene === 'problem' ? { scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={cn(
                      "absolute top-1/3 left-1/2 w-32 h-20 rounded-xl flex items-center justify-center font-black text-xl italic transition-colors shadow-2xl",
                      scene === 'problem' ? "bg-error text-white" : "bg-emerald-500 text-white"
                    )}
                  >
                    412
                  </motion.div>
                </div>
              </div>

              <div className="absolute top-12 left-12">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-2xl">
                   {scene === 'problem' ? "CRITICAL ALERT DETECTED" : "NEXUS RESPONSE ACTIVE"}
                </div>
              </div>
            </div>

            <div className="text-center max-w-2xl mx-auto space-y-4 px-4">
              <h2 className="text-3xl md:text-6xl font-headline font-black tracking-tighter text-on-surface italic uppercase">
                {scene === 'problem' ? "Chaos by Design." : "Intelligent Safety."}
              </h2>
              <p className="text-base md:text-xl text-on-surface-variant font-medium leading-relaxed">
                {scene === 'problem' 
                  ? "Standard systems offer noise, not directions. Seconds cost lives."
                  : "A neural safety mesh powered by Google Cloud Platform, guiding every guest individually."}
              </p>
            </div>
          </motion.div>
        )}

        {scene === 'pillars' && (
          <motion.div 
            key="pillars" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }}
            className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { t: 'Smart Detection', d: 'Cloud Pub/Sub ingests thousands of sensor events per second.', i: Eye, c: 'text-secondary bg-secondary/10' },
              { t: 'Contextual Alerting', d: 'Room-specific messaging via FCM replaces generic sirens.', i: Bell, c: 'text-amber-600 bg-amber-100' },
              { t: 'Adaptive Wayfinding', d: 'Vertex AI recalculates optimal paths as hazards shift.', i: Navigation, c: 'text-blue-600 bg-blue-100' },
              { t: 'Rescue Intelligence', d: 'Real-time responder HUD with room-level occupancy.', i: Users, c: 'text-emerald-700 bg-emerald-100' },
            ].map((p, i) => (
              <motion.div 
                key={p.t} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[2.5rem] bg-white shadow-xl flex flex-col gap-6 group hover:scale-[1.02] transition-transform cursor-default"
              >
                <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center", p.c)}>
                  <p.i className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-headline font-black text-on-surface tracking-tight leading-tight">{p.t}</h3>
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed">{p.d}</p>
                </div>
                <div className="mt-auto pt-6 border-t border-slate-50 flex justify-end">
                   <div className="w-8 h-1 bg-slate-200 rounded-full group-hover:bg-secondary group-hover:w-full transition-all duration-500" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {scene === 'outcome' && (
          <motion.div 
            key="outcome" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.1, opacity: 0 }}
            className="w-full max-w-6xl flex flex-col gap-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-6">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Traditional System</span>
                <div className="aspect-[16/10] rounded-[3rem] bg-slate-900 overflow-hidden relative group">
                   <img src="https://picsum.photos/seed/legacy/1200/800?grayscale" className="w-full h-full object-cover opacity-30" referrerPolicy="no-referrer" />
                   <div className="absolute inset-0 flex items-center justify-center text-error font-headline font-black text-4xl italic uppercase tracking-[0.2em] -rotate-12 border-4 border-error/30 m-12 rounded-[2rem]">Static Noise</div>
                </div>
                <p className="text-lg font-bold text-on-surface-variant italic">"Everyone runs. Nobody knows why."</p>
              </div>
              <div className="space-y-6">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">NexusResponse</span>
                <div className="aspect-[16/10] rounded-[3rem] bg-secondary-container overflow-hidden relative shadow-2xl group">
                   <img src="https://picsum.photos/seed/future/1200/800" className="w-full h-full object-cover opacity-40 mix-blend-overlay" referrerPolicy="no-referrer" />
                   <div className="absolute inset-0 flex items-center justify-center text-white font-headline font-black text-4xl italic uppercase tracking-[0.2em] -rotate-6">Precision Ops</div>
                </div>
                <p className="text-lg font-bold text-on-surface font-headline italic">"Every second is accounted for. Optimized for life."</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 text-center pb-20">
               {[ {v: '50%', l: 'Reduction in Search Time'}, {v: '100Ms', l: 'Event Processing Latency'}, {v: 'ENTERPRISE', l: 'Built for Scale'} ].map(s => (
                 <div key={s.l} className="space-y-1">
                   <p className="text-6xl font-headline font-black text-on-surface italic tracking-tighter">{s.v}</p>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary">{s.l}</p>
                 </div>
               ))}
            </div>
          </motion.div>
        )}

        {scene === 'gcp' && (
          <motion.div 
             key="gcp" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
             className="w-full max-w-4xl flex flex-col items-center gap-16 text-center"
          >
            <div className="space-y-6">
              <h2 className="text-4xl md:text-7xl font-headline font-black tracking-tight text-on-surface">Built on <span className="text-secondary italic">Google Cloud.</span></h2>
              <p className="text-base md:text-xl text-on-surface-variant font-medium max-w-2xl mx-auto">Scales from 20 rooms to 2,000. Enterprise-grade security meets real-time AI logic at the edge.</p>
            </div>
            
            <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-8">
               {[
                 { n: 'Pub/Sub', i: Activity, l: 'Event Bus' },
                 { n: 'Vertex AI', i: Cpu, l: 'Logic Engine' },
                 { n: 'Firebase', i: Zap, l: 'Realtime Data' },
                 { n: 'Maps JS', i: MapIcon, l: 'Spatial Viz' },
               ].map((svc, i) => (
                 <motion.div 
                   key={svc.n} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                   className="group p-8 rounded-[2.5rem] bg-white border border-slate-50 shadow-lg hover:shadow-2xl hover:bg-slate-50 transition-all flex flex-col items-center gap-6"
                 >
                    <div className="w-20 h-20 rounded-[1.75rem] bg-slate-900 flex items-center justify-center text-white group-hover:bg-secondary group-hover:scale-110 transition-all shadow-xl">
                      <svc.i className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-black text-on-surface tracking-tight">{svc.n}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{svc.l}</p>
                    </div>
                 </motion.div>
               ))}
            </div>

            <div className="flex gap-4">
               <button onClick={onComplete} className="px-10 py-5 bg-on-surface text-surface rounded-[1.75rem] font-headline font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3"><Zap className="w-5 h-5"/> Enter Live Demo</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminLogin = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginAdmin(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl" />
        <div className="flex flex-col gap-2 mb-8 relative z-10 text-center items-center">
           <Shield className="w-12 h-12 text-secondary mb-2" />
           <h2 className="text-3xl font-headline font-black italic uppercase tracking-tighter text-slate-900">Admin Portal</h2>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Authorized Personnel Only</p>
        </div>
        
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className={cn("w-full py-4 bg-slate-950 text-white rounded-[2rem] font-headline font-black text-lg uppercase tracking-widest shadow-xl transition-all italic tracking-tighter", loading ? "opacity-50" : "hover:scale-105 active:scale-95")}
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [view, setView] = useState<View>('pitch');
  const [adminView, setAdminView] = useState<AdminSubView>('dashboard');
  const [guestView, setGuestView] = useState<GuestSubView>('checkin');
  const [crises, setCrises] = useState<CrisisEvent[]>([]);
  const [rooms, setRooms] = useState<RoomStatus[]>([]);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [simTab, setSimTab] = useState<'admin' | 'guest'>('admin');
  
  useEffect(() => { 
    // Secure Session Initialization
    signInAnonymously(auth).catch(err => {
      if (err.code !== 'auth/admin-restricted-operation') {
        console.error("Session Auth failed:", err);
      }
    });
    const unsubAuth = onAuthStateChanged(auth, setUser);

    const unsubCrises = streamCrises(setCrises);
    const unsubRooms = streamRooms(setRooms);
    return () => { 
      unsubAuth();
      unsubCrises(); 
      unsubRooms(); 
    };
  }, []);
  const activeCrisis = crises.find(c => c.status === 'active');

  return (
    <div className="min-h-screen bg-surface selection:bg-secondary-container transition-all duration-500 overflow-x-hidden">
      {view !== 'pitch' && (
        <Sidebar 
          currentView={view} 
          currentSubView={adminView}
          setView={setView} 
          setSubView={setAdminView}
          activeCrisis={activeCrisis}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      )}
      
      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-700 ease-in-out relative",
        view === 'pitch' ? "ml-0" : "md:ml-72"
      )}>
        <TopBar 
          title={view === 'pitch' ? "NexusResponse" : view === 'admin' ? `Sentinel • ${adminView.charAt(0).toUpperCase() + adminView.slice(1)}` : view === 'simulation' ? 'Live Demo' : "SafeStay Guest"} 
          view={view} 
          setView={(v) => { setView(v); setMobileMenuOpen(false); }} 
          onMenuOpen={() => setMobileMenuOpen(true)}
        />
        
        <main className={cn(
          "flex-1 flex flex-col pt-16 relative",
          view !== 'pitch' && view !== 'simulation' && "px-4 py-6 md:p-12 max-w-7xl mx-auto w-full",
          view === 'simulation' && "p-3 md:p-6"
        )}>
          <AnimatePresence mode="wait">
            {view === 'pitch' && <VisualPitch key="pitch" onComplete={() => setView('simulation')} />}
            
            {view === 'admin' && (
              <motion.div key={adminView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}>
                {user && !user.isAnonymous ? (
                  <>
                    {adminView === 'dashboard' && <AdminDashboard rooms={rooms} />}
                    {adminView === 'incidents' && <AdminIncidents />}
                    {adminView === 'units' && <AdminUnits />}
                    {adminView === 'map' && <ResourceInventoryDashboard />}
                    {adminView === 'logs' && <AdminLogs />}
                  </>
                ) : (
                  <AdminLogin onLoginSuccess={() => setAdminView('dashboard')} />
                )}
              </motion.div>
            )}

            {view === 'guide' && (
              <motion.div key={guestView} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                {guestView === 'checkin' && <GuestCheckIn onLogin={() => setGuestView('dashboard')} onNavigate={setGuestView} />}
                {guestView === 'dashboard' && <GuestDashboard setSubView={setGuestView} activeCrisis={activeCrisis} />}
                {guestView === 'instructions' && <GuestGuide onBack={() => setGuestView('dashboard')} onNavigate={setGuestView} activeCrisis={activeCrisis} roomNumber="412" floorNumber={4} />}
                {guestView === 'map' && (
                   <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                         <button onClick={() => setGuestView('dashboard')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Back</button>
                         <span className="text-xs font-black uppercase tracking-widest italic">Facility Guide</span>
                         <MapIcon className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="flex-1 p-4 overflow-y-auto">
                         <GuestFacilityMap />
                      </div>
                   </div>
                )}
                {guestView === 'sos' && (
                   <div className="flex-1 flex flex-col gap-12 items-center justify-center">
                      <button onClick={() => setGuestView('dashboard')} className="text-[10px] font-black uppercase tracking-widest text-slate-400">Back to Hub</button>
                      <div className="relative">
                        <div className="absolute inset-0 bg-error/20 rounded-full animate-ping" />
                        <button className="relative w-40 h-40 bg-error rounded-full flex flex-col items-center justify-center text-white shadow-2xl shadow-error/40 font-black italic text-4xl">SOS</button>
                      </div>
                      <p className="font-bold text-on-surface-variant text-center max-w-xs">Connecting to Sentinel Security Hub... <br/>Stay calm, help is aware of your location.</p>
                   </div>
                )}
              </motion.div>
            )}
            {view === 'simulation' && (
              <motion.div key="sim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="flex-1 flex flex-col gap-4 w-full max-w-[1600px] mx-auto">
                {/* Mobile tab switcher */}
                <div className="flex lg:hidden items-center gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 self-start">
                  <button onClick={() => setSimTab('admin')} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", simTab === 'admin' ? 'bg-slate-900 text-white' : 'text-slate-400')}>Admin View</button>
                  <button onClick={() => setSimTab('guest')} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", simTab === 'guest' ? 'bg-slate-900 text-white' : 'text-slate-400')}>Guest App</button>
                </div>
                <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-8">
                {/* Admin Side */}
                <div className={cn("flex-[3] bg-white border border-slate-200 rounded-[2rem] md:rounded-[3rem] p-5 md:p-10 overflow-y-auto custom-scrollbar relative shadow-xl min-h-[500px]", simTab === 'guest' ? 'hidden lg:block' : 'block')}>
                  <div className="absolute top-6 right-6 md:top-8 md:right-10 flex items-center gap-2 z-10">
                     <span className="px-3 py-1 bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest rounded-full">Admin View</span>
                  </div>
                  {adminView === 'dashboard' && <AdminDashboard rooms={rooms} isCompact={true} />}
                  {adminView === 'incidents' && <AdminIncidents />}
                  {adminView === 'units' && <AdminUnits />}
                  {adminView === 'map' && <ResourceInventoryDashboard />}
                  {adminView === 'logs' && <AdminLogs />}
                </div>
                {/* Guest Side (Mobile Mockup) */}
                <div className={cn("flex-[2] lg:max-w-[480px] flex items-center justify-center bg-slate-100 rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 border border-slate-200 relative shadow-inner min-h-[600px]", simTab === 'admin' ? 'hidden lg:flex' : 'flex')}>
                  <div className="absolute top-8 left-10 flex items-center gap-2 z-10">
                     <span className="px-3 py-1 bg-white text-slate-900 border border-slate-200 text-[10px] uppercase font-black tracking-widest rounded-full shadow-sm">Guest App</span>
                  </div>
                  <div className="w-full max-w-[340px] aspect-[9/19.5] bg-surface rounded-[3.5rem] border-[12px] border-slate-950 shadow-2xl relative overflow-hidden flex flex-col ring-4 ring-slate-900/5">
                    {/* Device Polish */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-950 rounded-b-3xl z-50"></div>
                    <div className="flex-1 overflow-hidden relative flex flex-col bg-[#fcfdff]">
                      {guestView !== 'checkin' && (
                        <div className="px-6 py-4 flex justify-between items-center bg-white border-b border-slate-100 sticky top-0 z-20 shrink-0">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 fill-slate-900" />
                            <span className="font-headline font-black text-lg tracking-tighter uppercase italic">Sentinel Guide</span>
                          </div>
                          <div className="relative">
                             <Asterisk className="w-5 h-5 text-red-600 fill-red-600" />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
                        {guestView === 'checkin' && <GuestCheckIn onLogin={() => setGuestView('dashboard')} onNavigate={setGuestView} />}
                        {guestView === 'dashboard' && <GuestDashboard setSubView={setGuestView} activeCrisis={activeCrisis} />}
                        {guestView === 'instructions' && <GuestGuide onBack={() => setGuestView('dashboard')} onNavigate={setGuestView} activeCrisis={activeCrisis} roomNumber="412" floorNumber={4} />}
                        {guestView === 'map' && (
                           <div className="flex-1 p-4 bg-[#fcfdff] overflow-y-auto custom-scrollbar">
                              <GuestFacilityMap />
                           </div>
                        )}
                        {guestView === 'sos' && (
                           <div className="flex-1 p-8 flex flex-col items-center justify-center text-center gap-6 bg-[#fcfdff]">
                              <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center text-red-600 animate-pulse">
                                 <Zap className="w-12 h-12 fill-red-600" />
                              </div>
                              <h2 className="text-3xl font-headline font-black italic uppercase italic tracking-tighter">Emergency Hub</h2>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Connecting you directly to campus security and emergency response teams.</p>
                              <button className="px-8 py-4 bg-[#c00000] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-500/20">Call Backup</button>
                           </div>
                        )}
                      </div>

                      {guestView !== 'checkin' && (
                         <div className="h-24 bg-white border-t border-slate-100 flex justify-around items-center px-4 shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
                           <button onClick={() => setGuestView('dashboard')} className={cn("flex flex-col items-center gap-1.5 transition-all group", guestView === 'dashboard' ? "opacity-100" : "opacity-30")}>
                             <Smartphone className="w-6 h-6 text-slate-900 group-hover:scale-110" />
                             <span className={cn("text-[8px] font-black uppercase tracking-widest text-slate-900", guestView === 'dashboard' ? "visible" : "invisible")}>Hub</span>
                           </button>
                           
                           <button onClick={() => setGuestView('map')} className={cn("flex flex-col items-center gap-1.5 transition-all group", guestView === 'map' ? "opacity-100" : "opacity-30")}>
                             <MapIcon className="w-6 h-6 text-slate-900 group-hover:scale-110" />
                             <span className={cn("text-[8px] font-black uppercase tracking-widest text-slate-900", guestView === 'map' ? "visible" : "invisible")}>Map</span>
                           </button>

                           <button onClick={() => setGuestView('instructions')} className={cn("flex flex-col items-center gap-1.5 transition-all group", guestView === 'instructions' ? "opacity-100" : "opacity-30")}>
                             <div className={cn("p-2 rounded-xl transition-all", guestView === 'instructions' && "bg-red-50")}>
                               <BookOpen className={cn("w-6 h-6", guestView === 'instructions' ? "text-[#c00000]" : "text-slate-900")} />
                             </div>
                             <span className={cn("text-[8px] font-black uppercase tracking-widest text-[#c00000]", guestView === 'instructions' ? "visible" : "invisible")}>Guide</span>
                           </button>
                           
                           <button onClick={() => setGuestView('sos')} className={cn("flex flex-col items-center gap-1.5 transition-all group", guestView === 'sos' ? "opacity-100" : "opacity-30")}>
                             <div className="relative">
                               <MapPin className="w-6 h-6 text-slate-900 group-hover:scale-110" />
                               <div className="absolute top-0 right-0 p-0.5 bg-slate-900 rounded-full border border-white">
                                  <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                               </div>
                             </div>
                             <span className={cn("text-[8px] font-black uppercase tracking-widest text-slate-900", guestView === 'sos' ? "visible" : "invisible")}>SOS Help</span>
                           </button>
                         </div>
                      )}
                    </div>
                  </div>
                </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="py-6 px-4 md:py-8 md:px-12 border-t border-outline-variant/10 flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center bg-slate-50/50 backdrop-blur-md">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> SYSTEM SECURED • ACTIVE
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] border-l border-outline-variant/30 pl-4">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> AI CORE: ANALYZING
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">© 2026 NexusResponse Hub • Google Cloud Partner <br/><span className="text-[8px] opacity-60">Authorized Personnel Only</span></p>
        </footer>
      </div>

      {/* Global Style Inject for Layout Spacing */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(11, 28, 48, 0.1); 
          border-radius: 4px; 
        }
        ::selection {
          background-color: #ffdbca;
          color: #341100;
        }
      `}</style>
    </div>
  );
}
