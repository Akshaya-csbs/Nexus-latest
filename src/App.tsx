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
  X,
  AlertCircle
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

type AdminSubView = 'dashboard' | 'incidents' | 'map' | 'units' | 'logs' | 'settings';
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

const generateMockLogs = (): OperationalLog[] => {
  const events: Omit<OperationalLog, 'timestamp'>[] = [
    { event: 'Batch Inbound: 45 Guests', source: 'North Gate Hub', status: 'success', category: 'system' },
    { event: 'Sensor Latency Detected', source: 'South Wing Exit B', status: 'warning', category: 'hardware' },
    { event: 'Roster Sync Complete', source: 'Automated Task', status: 'success', category: 'system' },
    { event: 'Zone Cleared: Pool Side', source: 'Manual Patrol', status: 'success', category: 'security' },
    { event: 'Hardware Self-Test', source: 'Routine Check', status: 'success', category: 'hardware' },
    { event: 'Emergency Kit Audit', source: 'Inventory Bot', status: 'success', category: 'security' },
    { event: 'Encryption Handshake', source: 'Main Bridge', status: 'success', category: 'system' },
    { event: 'Low Battery: Unit 04', source: 'Sector B Hub', status: 'warning', category: 'hardware' },
    { event: 'Vulnerability Scan Complete', source: 'Sentinel Core', status: 'success', category: 'security' },
    { event: 'Patrol Route Updated', source: 'Manual Admin', status: 'success', category: 'security' },
    { event: 'Air Quality Nominal', source: 'Climate Control', status: 'success', category: 'system' },
    { event: 'CCTV Blindspot Warning', source: 'Visual Engine', status: 'warning', category: 'hardware' },
    { event: 'Resource Manifest Sync', source: 'Inventory Engine', status: 'success', category: 'system' },
    { event: 'Unauthorized Access Attempt', source: 'Server Room', status: 'warning', category: 'security' },
    { event: 'Cloud Backup Complete', source: 'Google Cloud Sync', status: 'success', category: 'system' }
  ];

  return events.map((ev, i) => ({
    ...ev,
    id: `mock-log-${i}`,
    timestamp: {
      toDate: () => new Date(Date.now() - i * 60000)
    }
  }));
};

// --- Components ---

const NavigationRail = ({ currentView, currentSubView, setView, setSubView, activeCrisis }: {
  currentView: View,
  currentSubView: AdminSubView,
  setView: (v: View) => void,
  setSubView: (sv: AdminSubView) => void,
  activeCrisis?: CrisisEvent
}) => {
  const isCrisisActive = !!activeCrisis;

  const toggleMockCrisis = () => {
    if (isCrisisActive) {
      clearAllCrises();
    } else {
      triggerCrisis({ crisisType: 'fire', floor: 4, roomNumber: '412', severity: 'critical', description: 'Mock emergency drill initiated.' });
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Operations', icon: Layers },
    { id: 'incidents', label: 'Active Incidents', icon: ShieldAlert, alert: isCrisisActive },
    { id: 'map', label: 'Resource Map', icon: MapIcon },
    { id: 'units', label: 'Responders', icon: Users },
    { id: 'logs', label: 'System Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col items-center bg-[#111827] border-r border-white/10 w-[72px] h-screen fixed left-0 top-0 z-50 py-6 justify-between">
      <div className="flex flex-col items-center gap-8 w-full">
        {/* Brand Shield Logo */}
        <div
          onClick={toggleMockCrisis}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border shadow-lg",
            isCrisisActive
              ? "bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444] animate-pulse"
              : "bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]"
          )}
          title={isCrisisActive ? "Click to suppress alert" : "Click to initiate mock crisis"}
        >
          <Shield className="w-5 h-5 fill-current" />
        </div>

        {/* Nav Items */}
        <div className="flex flex-col gap-3 w-full px-2">
          {navItems.map((item) => {
            const isActive = (currentView === 'admin' || currentView === 'simulation') && currentSubView === item.id;
            return (
              <button
                key={item.id}
                title={item.label}
                onClick={() => {
                  if (currentView !== 'simulation') setView('admin');
                  setSubView(item.id as AdminSubView);
                }}
                className={cn(
                  "relative group w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all",
                  isActive
                    ? "bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6]"
                    : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.alert && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                )}
                {/* Micro visual label beneath */}
                <span className="text-[7px] font-black uppercase tracking-widest mt-0.5 opacity-60 group-hover:opacity-100">{item.id.slice(0, 3)}</span>

                {/* Tooltip */}
                <div className="absolute left-16 bg-[#111827] border border-white/10 text-[#F8FAFC] text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 w-full px-2">
        {/* Guest View Toggle */}
        <button
          title="Guest View"
          onClick={() => setView('guide')}
          className={cn(
            "relative group w-12 h-12 rounded-xl flex items-center justify-center transition-all",
            currentView === 'guide'
              ? "bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6]"
              : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5"
          )}
        >
          <Smartphone className="w-5 h-5" />
          <span className="text-[7px] font-black uppercase tracking-widest mt-0.5 opacity-60">GST</span>
        </button>

        {/* Logout */}
        <button
          title="Log Out"
          onClick={async () => { await logoutUser(); setView('pitch'); }}
          className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-[#94A3B8] hover:text-[#EF4444] hover:bg-white/5 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[7px] font-black uppercase tracking-widest mt-0.5">OUT</span>
        </button>
      </div>
    </aside>
  );
};

const Sidebar = ({ currentView, currentSubView, setView, setSubView, activeCrisis, mobileOpen, onMobileClose }: {
  currentView: View,
  currentSubView: AdminSubView,
  setView: (v: View) => void,
  setSubView: (sv: AdminSubView) => void,
  activeCrisis?: CrisisEvent,
  mobileOpen: boolean,
  onMobileClose: () => void
}) => (
  <>
    <NavigationRail currentView={currentView} currentSubView={currentSubView} setView={setView} setSubView={setSubView} activeCrisis={activeCrisis} />
    {/* Mobile Drawer */}
    {mobileOpen && (
      <div className="md:hidden fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onMobileClose} />
        <div className="relative z-10 flex flex-col bg-[#111827] w-64 max-w-[85vw] p-6 justify-between border-r border-white/10">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EF4444]/15 flex items-center justify-center text-[#EF4444] border border-[#EF4444]/20"><Shield className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-black text-[#F8FAFC] tracking-wider leading-none">SENTINEL COMMAND</p>
                <p className="text-[9px] font-bold text-[#94A3B8] mt-1 uppercase">HQ Ops Portal</p>
              </div>
            </div>
            <nav className="flex flex-col gap-2">
              {[
                { id: 'dashboard', label: 'Operations', icon: Layers },
                { id: 'incidents', label: 'Active Incidents', icon: ShieldAlert },
                { id: 'map', label: 'Resource Map', icon: MapIcon },
                { id: 'units', label: 'Responders', icon: Users },
                { id: 'logs', label: 'System Logs', icon: Activity },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setView('admin'); setSubView(item.id as AdminSubView); onMobileClose(); }}
                  className={cn(
                    "flex items-center gap-4 py-3 px-4 rounded-xl text-left font-bold text-xs uppercase tracking-wider transition-all",
                    currentSubView === item.id ? "bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6]" : "text-[#CBD5E1] hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <button onClick={async () => { await logoutUser(); setView('pitch'); onMobileClose(); }} className="flex items-center gap-4 py-3 px-4 text-[#94A3B8] hover:text-[#EF4444] font-bold text-xs uppercase tracking-wider mt-auto border-t border-white/5 pt-4">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    )}
  </>
);

const TopBar = ({ view, setView, activeCrisis, onMenuOpen }: {
  view: View,
  setView: (v: View) => void,
  activeCrisis?: CrisisEvent,
  onMenuOpen?: () => void
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hasAlert = !!activeCrisis;

  return (
    <header className={cn(
      "fixed top-0 right-0 h-16 z-40 bg-[#111827] border-b border-white/10 flex items-center justify-between px-6 transition-all",
      view === 'pitch' ? "left-0" : "left-0 md:left-[72px]"
    )}>
      <div className="flex items-center gap-4">
        {view !== 'pitch' && (
          <button onClick={onMenuOpen} className="md:hidden p-2 rounded-lg text-[#CBD5E1] hover:bg-white/5 transition-all">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex flex-col">
          <span className="text-xs font-black text-[#F8FAFC] uppercase tracking-widest leading-none">SENTINEL OPERATIONS CENTER</span>
          <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider mt-1">FACILITY COMMAND HQ</span>
        </div>

        {/* Flashing alert indicator */}
        {hasAlert && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-lg text-[#EF4444] text-[9px] font-black uppercase tracking-widest animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            ACTIVE CRISIS PROTOCOL ENGAGED
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Global Search */}
        <div className="hidden lg:flex items-center gap-2 bg-[#0B1020] border border-white/10 px-4 py-2 rounded-xl text-xs text-[#94A3B8] w-64 focus-within:border-[#3B82F6]/50 transition-all">
          <Search className="w-4 h-4 text-[#94A3B8]" />
          <input type="text" placeholder="Search rooms, staff, assets..." className="bg-transparent border-none outline-none text-[#F8FAFC] w-full placeholder-[#94A3B8]/60" />
        </div>

        {/* Live ticking clock */}
        <div className="hidden sm:flex flex-col items-end font-mono">
          <span className="text-xs font-bold text-[#F8FAFC] leading-none">
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </span>
          <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest mt-1">
            {time.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
          </span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold text-[#F8FAFC] leading-none">Duty Commander</span>
            <span className="text-[9px] font-bold text-[#22C55E] uppercase tracking-widest mt-1">Online</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <img src="https://picsum.photos/seed/admin/100/100" alt="Commander Profile" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};


// --- Content Components ---

const AdminIncidents = () => {
  const [incidents, setIncidents] = useState<CrisisEvent[]>([]);
  useEffect(() => { return streamCrises(setIncidents); }, []);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-5xl font-headline font-black italic tracking-tighter uppercase mb-2 pt-2 leading-tight">Active Incidents</h2>
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Monitoring ongoing threats and suppression status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {incidents.length === 0 && <div className="col-span-3 py-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No active incidents. Sky is clear.</div>}
        {incidents.map((inc, i) => {
          const isCritical = inc.severity === 'critical' || inc.severity === 'high';
          const isWarning = inc.severity === 'medium';
          return (
            <div key={inc.id || i} className="bg-white/70 backdrop-blur-md border border-slate-200/60 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
              <div className="flex justify-between items-start">
                <div className={cn("p-4 rounded-2xl", isCritical ? 'bg-error/10 text-error' : isWarning ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500')}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">#{inc.id?.slice(0, 6).toUpperCase() || 'INC'}</span>
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
          )
        })}
      </div>
    </div>
  );
};

const AdminUnits = () => {
  const [units, setUnits] = useState<ResponderUnit[]>([]);
  useEffect(() => { return streamUnits(setUnits); }, []);

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'active') return 'bg-[#FEE2E2] text-[#DC2626]';
    if (s === 'evacuating') return 'bg-[#FED7AA] text-[#EA580C]';
    if (s === 'patrol') return 'bg-[#DBEAFE] text-[#2563EB]';
    return 'bg-[#E2E8F0] text-[#475569]'; // standby / fallback
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-5xl font-headline font-black italic tracking-tighter uppercase mb-2 pt-2 leading-tight">Responder Units</h2>
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Managing on-site security and emergency personnel.</p>
      </div>

      <div className="bg-[#B8B9BF] border border-slate-200/60 rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <table className="w-full text-left">
          <thead className="bg-[#FFFFFF] border-b border-[#FFFFFF]">
            <tr>
              <th className="px-8 py-4 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">Unit ID</th>
              <th className="px-8 py-4 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">Commander</th>
              <th className="px-8 py-4 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">Sector</th>
              <th className="px-8 py-4 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">Status</th>
              <th className="px-8 py-4 text-[10px] font-semibold uppercase tracking-widest text-[#475569]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#FFFFFF] bg-[#B8B9BF]">
            {units.length === 0 && (
              <tr><td colSpan={5} className="px-8 py-12 text-center text-[10px] font-semibold uppercase tracking-widest text-[#475569]">No units deployed.</td></tr>
            )}
            {units.map((u) => (
              <tr key={u.id || u.unitId} className="bg-[#B8B9BF] transition-all">
                <td className="px-8 py-6 font-mono text-xs font-semibold text-[#334155]">{u.unitId}</td>
                <td className="px-8 py-6 text-sm font-semibold text-[#1E293B]">{u.commander}</td>
                <td className="px-8 py-6 text-sm font-medium text-[#475569]">{u.sectorId}</td>
                <td className="px-8 py-6">
                  <span className={cn("px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase inline-block", getStatusBadgeClass(u.status))}>
                    {u.status}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <button className="text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-semibold text-[10px] uppercase tracking-widest transition-all">Connect Hub</button>
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

  const displayData = isDirty ? (Object.values(draft) as FloorInventory[]).sort((a, b) => a.floor - b.floor) : [...inventory].sort((a, b) => a.floor - b.floor);

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
      const promises = (Object.values(draft) as FloorInventory[]).map(floor => updateFloorInventory(floor.id!, floor));
      await Promise.all(promises);
      setIsDirty(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const exportManifest = () => {
    if (displayData.length === 0) return;
    const headers = ['Floor Level', ...resources.map(r => r.label), 'Status'];
    const rows = displayData.map(floor => {
      const rowData = [
        `Level ${floor.floor} (Sector ${String.fromCharCode(64 + floor.floor)})`,
        ...resources.map(r => String(floor[r.id] || 0)),
        'Nominal'
      ];
      return rowData.join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Nexus_Manifest_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-[3rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div className="p-10 border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <h2 className="text-5xl font-headline font-black italic tracking-tighter uppercase mb-2 pt-2 leading-tight text-[#0B101F]">Resource Inventory Engine</h2>
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
              <button onClick={exportManifest} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">Export Manifest</button>
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
  const [logs, setLogs] = useState<OperationalLog[]>(generateMockLogs());
  const [isSeeding, setIsSeeding] = useState(false);
  useEffect(() => {
    const unsub = streamLogs((dbLogs) => {
      const validLogs = dbLogs.filter(log => log && log.event);
      setLogs(validLogs.length > 0 ? validLogs.slice(0, 15) : generateMockLogs());
    });
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
        <div>
          <h2 className="text-5xl font-headline font-black italic tracking-tighter uppercase mb-2 pt-2 leading-tight">System Logs</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Complete transaction and activity history for NexusResponse Hub.</p>
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

      <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
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
                  <td className="px-8 py-6 font-mono text-[10px] font-bold text-[#64748B]">{t}</td>
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
          <h2 className="font-headline text-5xl font-extrabold tracking-tighter italic leading-none text-slate-900">Welcome<br />back.</h2>
          <p className="font-body text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 max-w-[240px] leading-relaxed mx-auto">
            Authorized Personnel Hub
          </p>
        </div>
      </header>

      <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 border-l-4 border-l-secondary p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 space-y-8 relative">
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
              { label: 'Room Service', icon: Utensils, sub: 'Dining', color: 'blue' },
              { label: 'Housekeeping', icon: Wind, sub: 'Clean', color: 'emerald' },
              { label: 'Concierge', icon: Smartphone, sub: 'Assistance', color: 'purple' },
              { label: 'Facility Map', icon: MapIcon, sub: 'Explore', color: 'amber', action: () => setSubView('map') },
            ].map((item, i) => {
              const themeStyles = {
                blue: { bg: 'bg-blue-50/40 border-blue-100/50', text: 'text-blue-600', iconBg: 'bg-blue-100/50' },
                emerald: { bg: 'bg-emerald-50/40 border-emerald-100/50', text: 'text-emerald-600', iconBg: 'bg-emerald-100/50' },
                purple: { bg: 'bg-purple-50/40 border-purple-100/50', text: 'text-purple-600', iconBg: 'bg-purple-100/50' },
                amber: { bg: 'bg-amber-50/40 border-amber-100/50', text: 'text-amber-600', iconBg: 'bg-amber-100/50' },
              }[item.color as 'blue' | 'emerald' | 'purple' | 'amber'];

              return (
                <button
                  key={i}
                  onClick={item.action}
                  className={cn(
                    "p-6 border rounded-[2.5rem] flex flex-col gap-4 text-left shadow-sm transition-all active:scale-95 group",
                    themeStyles.bg
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110", themeStyles.iconBg, themeStyles.text)}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-headline font-black text-slate-900 tracking-tight uppercase italic text-sm leading-none">{item.label}</h4>
                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{item.sub}</p>
                  </div>
                </button>
              );
            })}
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

const NewIncidentModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [crisisType, setCrisisType] = useState<CrisisEvent['crisisType']>('fire');
  const [severity, setSeverity] = useState<CrisisEvent['severity']>('high');
  const [floor, setFloor] = useState<number>(4);
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await triggerCrisis({
        crisisType,
        severity,
        floor,
        roomNumber,
        description
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111827] border border-white/10 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-white/10 bg-[#172033] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center border border-[#EF4444]/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg text-[#F8FAFC] uppercase tracking-wide">Report Incident</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8]">Initiate Crisis Protocol</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors"><X className="w-5 h-5 text-[#94A3B8] hover:text-[#F8FAFC]" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Crisis Type</label>
              <select value={crisisType} onChange={e => setCrisisType(e.target.value as any)} className="w-full p-3 bg-[#0B1020] border border-white/10 rounded-xl font-bold text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]/50 [&>option]:bg-[#111827]">
                <option value="fire">Fire</option>
                <option value="smoke">Smoke</option>
                <option value="intrusion">Intrusion</option>
                <option value="panic">Panic / Medical</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Severity</label>
              <select value={severity} onChange={e => setSeverity(e.target.value as any)} className="w-full p-3 bg-[#0B1020] border border-white/10 rounded-xl font-bold text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]/50 [&>option]:bg-[#111827]">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Floor Number</label>
              <input type="number" value={floor} onChange={e => setFloor(parseInt(e.target.value))} required min="1" className="w-full p-3 bg-[#0B1020] border border-white/10 rounded-xl font-bold text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Room / Zone</label>
              <input type="text" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required placeholder="e.g. 412" className="w-full p-3 bg-[#0B1020] border border-white/10 rounded-xl font-bold text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]/50 placeholder-[#94A3B8]/30" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Incident Details</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3} placeholder="Describe the situation..." className="w-full p-3 bg-[#0B1020] border border-white/10 rounded-xl font-bold text-sm text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]/50 resize-none placeholder-[#94A3B8]/30" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-xs uppercase tracking-widest text-[#CBD5E1] hover:bg-white/5 rounded-xl transition-all">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-[#EF4444] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 disabled:opacity-50">
              {isSubmitting ? 'Transmitting...' : 'Trigger Alert'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const AdminDashboard = ({ rooms, isCompact = false, setSubView }: { rooms: RoomStatus[], isCompact?: boolean, setSubView?: (v: AdminSubView) => void }) => {
  const [logs, setLogs] = useState<OperationalLog[]>(generateMockLogs());
  const [crises, setCrises] = useState<CrisisEvent[]>([]);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [responders, setResponders] = useState<ResponderUnit[]>([]);

  useEffect(() => {
    const unsubLogs = streamLogs((dbLogs) => {
      const validLogs = dbLogs.filter(log => log && log.event);
      setLogs(validLogs.length > 0 ? validLogs.slice(0, 20) : generateMockLogs());
    });
    const unsubCrises = streamCrises(setCrises);
    const unsubResponders = streamUnits(setResponders);
    return () => { unsubLogs(); unsubCrises(); unsubResponders(); };
  }, []);

  const activeAlerts = crises.filter(c => c.status === 'active').length;
  const safeRooms = rooms.filter(r => r.occupancyStatus === 'evacuated').length;
  const totalOccupants = rooms.filter(r => r.occupancyStatus === 'occupied').length * 4;

  return (
    <div className={cn("flex flex-col gap-6 w-full", isCompact ? "gap-4" : "gap-6")}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-[#EF4444]/15 border border-[#EF4444]/20 text-[#EF4444] text-[9px] font-bold uppercase rounded">HQ ACTIVE</span>
            {!isCompact && <span className="text-[#94A3B8] text-[10px] font-bold tracking-wider uppercase">Vigilant Watch Monitor</span>}
          </div>
          <h2 className={cn("font-sans font-black tracking-tight text-[#F8FAFC] uppercase", isCompact ? "text-2xl" : "text-4xl")}>Operational Command</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowIncidentModal(true)} className="flex items-center gap-2 bg-[#EF4444] hover:bg-red-600 transition-colors text-white px-5 py-2.5 rounded-xl shadow-lg active:scale-95 group cursor-pointer">
            <div className="p-0.5 bg-white/20 rounded-md group-hover:bg-white/30 transition-colors"><Plus className="w-4 h-4" /></div>
            <span className="text-[10px] font-black uppercase tracking-widest">New Incident</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Map on Left, Timeline on Right */}
      <div className="grid grid-cols-12 gap-6">
        <div className={cn("col-span-12", isCompact ? "lg:col-span-12" : "lg:col-span-8")}>
          {/* Facility Monitor Card */}
          <div className="bg-[#111827] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-[520px] relative shadow-xl">
            <div className="px-6 py-4 border-b border-white/10 bg-[#172033] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#F8FAFC]">Live Facility Monitor</span>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Building Layout Map</span>
            </div>
            <div className="flex-grow relative bg-[#0B1020] overflow-hidden">
              <MockMap rooms={rooms} crises={crises} className="h-full border-none rounded-none" />
            </div>
          </div>
        </div>

        {/* Incident Timeline / Activity Feed */}
        {!isCompact && (
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-[#111827] border border-white/10 rounded-[2rem] flex flex-col h-[520px] overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-white/10 bg-[#172033] flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#F8FAFC]">Incident Timeline</h3>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping" />
                  <span className="text-[9px] font-bold text-[#EF4444] uppercase tracking-widest">Live Feed</span>
                </div>
              </div>
              <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-3 bg-[#0B1020]/40">
                {/* Active crises shown first */}
                {crises.filter(c => c.status === 'active').map((c, i) => (
                  <div key={`crisis-${i}`} className="flex flex-col gap-2 p-4 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 relative overflow-hidden animate-pulse">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-[#F8FAFC] font-bold">JUST NOW</span>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-[#EF4444]/40 bg-[#EF4444]/15 text-[#EF4444]">CRITICAL</span>
                    </div>
                    <h4 className="text-xs font-black text-[#F8FAFC] uppercase tracking-wide">ACTIVE {c.crisisType} ALERT</h4>
                    <p className="text-[11px] text-[#CBD5E1] font-bold">{c.description || 'Crisis protocol initiated.'}</p>
                    <div className="flex justify-between items-center text-[9px] font-bold text-[#94A3B8] uppercase mt-1">
                      <span>Loc: Room {c.roomNumber} (Floor {c.floor})</span>
                      <span className="text-[#EF4444]">Status: ACTIVE</span>
                    </div>
                  </div>
                ))}

                {/* Log events */}
                {logs.length === 0 && crises.length === 0 && (
                  <div className="p-8 text-center text-[#94A3B8] font-bold uppercase tracking-widest text-xs">No active logs.</div>
                )}

                {logs.map((log, i) => {
                  const t = log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : 'Just now';
                  const isWarning = log.status === 'warning';
                  const isSuccess = log.status === 'success';
                  const severityText = isWarning ? 'Warning' : isSuccess ? 'Normal' : 'Critical';

                  return (
                    <div
                      key={`log-${i}`}
                      className="flex flex-col gap-2 p-4 rounded-xl border border-white/5 bg-[#172033]/40 hover:bg-[#172033]/80 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-[#CBD5E1] font-bold">{t}</span>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                          isWarning ? 'bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]' :
                            isSuccess ? 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]' :
                              'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]'
                        )}>
                          {severityText}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#F8FAFC]">{log.event}</h4>
                      <div className="flex justify-between items-center text-[9px] font-bold text-[#94A3B8] uppercase mt-1">
                        <span>Loc: {log.source}</span>
                        <span>Cat: {log.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setSubView?.('logs')}
                className="p-4 text-[10px] font-black uppercase tracking-widest text-[#CBD5E1] hover:text-[#F8FAFC] border-t border-white/10 bg-[#172033] hover:bg-[#111827] transition-all cursor-pointer text-center"
              >
                Access System Logs
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Strip */}
      <div className="w-full bg-[#111827] border border-white/10 p-4 rounded-2xl flex flex-wrap justify-between gap-6 items-center shadow-lg">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E]"><Users className="w-4 h-4" /></div>
            <div>
              <p className="text-[9px] font-bold text-[#94A3B8] uppercase leading-none">Safe Occupants</p>
              <p className="text-sm font-black text-[#F8FAFC] mt-1">{safeRooms * 4 || totalOccupants || 1214}</p>
            </div>
          </div>

          <div className="w-px h-8 bg-white/10" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]"><Navigation className="w-4 h-4" /></div>
            <div>
              <p className="text-[9px] font-bold text-[#94A3B8] uppercase leading-none">Evacuated</p>
              <p className="text-sm font-black text-[#F8FAFC] mt-1">{(crises.length > 0 ? 34 : 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="w-px h-8 bg-white/10" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444]"><AlertCircle className="w-4 h-4" /></div>
            <div>
              <p className="text-[9px] font-bold text-[#94A3B8] uppercase leading-none">Active Alerts</p>
              <p className="text-sm font-black text-[#F8FAFC] mt-1">{activeAlerts}</p>
            </div>
          </div>

          <div className="w-px h-8 bg-white/10" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]"><Users className="w-4 h-4" /></div>
            <div>
              <p className="text-[9px] font-bold text-[#94A3B8] uppercase leading-none">Responders Deployed</p>
              <p className="text-sm font-black text-[#F8FAFC] mt-1">{responders.length}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#0B1020] px-4 py-2 border border-white/10 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
          <span className="text-[9px] font-bold text-[#CBD5E1] uppercase">Est. Resolution Time:</span>
          <span className="text-xs font-black text-[#F8FAFC] font-mono">{activeAlerts > 0 ? "14m 20s" : "0m"}</span>
        </div>
      </div>

      <NewIncidentModal isOpen={showIncidentModal} onClose={() => setShowIncidentModal(false)} />
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
    <div className="flex-1 flex flex-col items-center justify-start p-4 md:p-8 relative overflow-hidden bg-[#0B1020]">
      {/* Immersive background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.06)_0%,_transparent_70%)] pointer-events-none" />

      {/* Enter Live Demo Button */}
      <div className="mb-6 z-20 flex justify-center">
        <button
          onClick={onComplete}
          className="px-8 py-3.5 bg-white text-black hover:bg-slate-100 rounded-[1.5rem] font-headline font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current text-amber-500 animate-pulse" />
          Enter Live Demo
        </button>
      </div>

      {/* Tactical Monitor Panel Frame */}
      <div className="w-full max-w-6xl border border-white/10 rounded-[2rem] bg-[#111827] p-8 md:p-12 shadow-2xl relative">
        <div className="absolute top-4 left-6 flex items-center gap-2 text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
          Command Feed // Presentation Node
        </div>
        <div className="absolute top-4 right-6 text-[8px] font-mono text-[#94A3B8] uppercase">
          Feed: SEC_PITCH_STATION
        </div>

        <div className="pt-4">
          <AnimatePresence mode="wait">
            {(scene === 'problem' || scene === 'activation') && (
              <motion.div
                key="floorplan" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                className="w-full flex flex-col gap-12"
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
                  <h2 className="text-3xl md:text-6xl font-headline font-black tracking-tighter text-white italic uppercase">
                    {scene === 'problem' ? "Chaos by Design." : "Intelligent Safety."}
                  </h2>
                  <p className="text-base md:text-xl text-[#CBD5E1] font-medium leading-relaxed">
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
                className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
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
                      <h3 className="text-xl font-headline font-black text-slate-950 tracking-tight leading-tight">{p.t}</h3>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">{p.d}</p>
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
                className="w-full flex flex-col gap-16"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Traditional System</span>
                    <div className="aspect-[16/10] rounded-[3rem] bg-slate-900 overflow-hidden relative group">
                      <img src="https://picsum.photos/seed/legacy/1200/800?grayscale" className="w-full h-full object-cover opacity-30" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 flex items-center justify-center text-error font-headline font-black text-4xl italic uppercase tracking-[0.2em] -rotate-12 border-4 border-error/30 m-12 rounded-[2rem]">Static Noise</div>
                    </div>
                    <p className="text-lg font-bold text-[#CBD5E1] italic">"Everyone runs. Nobody knows why."</p>
                  </div>
                  <div className="space-y-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">NexusResponse</span>
                    <div className="aspect-[16/10] rounded-[3rem] bg-secondary-container overflow-hidden relative shadow-2xl group">
                      <img src="https://picsum.photos/seed/future/1200/800" className="w-full h-full object-cover opacity-40 mix-blend-overlay" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 flex items-center justify-center text-white font-headline font-black text-4xl italic uppercase tracking-[0.2em] -rotate-6">Precision Ops</div>
                    </div>
                    <p className="text-lg font-bold text-white font-headline italic">"Every second is accounted for. Optimized for life."</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 text-center pb-20">
                  {[{ v: '50%', l: 'Reduction in Search Time' }, { v: '100Ms', l: 'Event Processing Latency' }, { v: 'ENTERPRISE', l: 'Built for Scale' }].map(s => (
                    <div key={s.l} className="space-y-1">
                      <p className="text-6xl font-headline font-black text-white italic tracking-tighter">{s.v}</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary">{s.l}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {scene === 'gcp' && (
              <motion.div
                key="gcp" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-full flex flex-col items-center gap-16 text-center"
              >
                <div className="space-y-6">
                  <h2 className="text-4xl md:text-7xl font-headline font-black tracking-tight text-white font-normal">Built on <span className="text-secondary italic">Google Cloud.</span></h2>
                  <p className="text-base md:text-xl text-[#CBD5E1] font-medium max-w-2xl mx-auto">Scales from 20 rooms to 2,000. Enterprise-grade security meets real-time AI logic at the edge.</p>
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
                        <p className="text-lg font-black text-slate-950 tracking-tight">{svc.n}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{svc.l}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    audioAlerts: true,
    autoDeploy: false,
    highContrast: false,
    autoClearLogs: true,
    smsNotifications: true,
    dronePatrols: false,
    aiInsights: true,
    guestAnnouncements: true,
    lockdownMode: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-5xl font-headline font-black italic tracking-tighter uppercase mb-2 pt-2 leading-tight">Settings</h2>
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Configure System Preferences and Alerts.</p>
      </div>

      <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-10">
        <div className="space-y-8">
          {[
            { id: 'audioAlerts', label: 'Enable Audio Alerts', desc: 'Play sounds for critical incidents and updates.' },
            { id: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive critical alerts via SMS to registered devices.' },
            { id: 'autoDeploy', label: 'Auto-Deploy Units', desc: 'Automatically assign nearest responder units to new incidents.' },
            { id: 'dronePatrols', label: 'Automated Drone Patrols', desc: 'Dispatch sentinel drones for automated perimeter checks.' },
            { id: 'aiInsights', label: 'AI Threat Insights', desc: 'Utilize Vertex AI to predict potential security vulnerabilities.' },
            { id: 'guestAnnouncements', label: 'Public Address Announcements', desc: 'Automatically broadcast synthesized voice warnings to affected zones.' },
            { id: 'lockdownMode', label: 'Strict Lockdown Mode', desc: 'Immediately secure all automated doors upon critical alert.' },
            { id: 'highContrast', label: 'High Contrast Mode', desc: 'Increase visual contrast across the dashboard.' },
            { id: 'autoClearLogs', label: 'Auto-Clear Logs', desc: 'Automatically archive resolved operational logs after 24 hours.' },
          ].map(feature => (
            <div key={feature.id} className="flex items-center justify-between border-b border-slate-100 pb-6 last:border-0 last:pb-0">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-black uppercase tracking-widest text-slate-900">{feature.label}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{feature.desc}</span>
              </div>
              <button
                onClick={() => toggleSetting(feature.id as keyof typeof settings)}
                className={cn("w-14 h-8 rounded-full transition-colors relative", settings[feature.id as keyof typeof settings] ? "bg-emerald-500" : "bg-slate-300")}
              >
                <div className={cn("w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow-sm", settings[feature.id as keyof typeof settings] ? "left-7" : "left-1")} />
              </button>
            </div>
          ))}
        </div>
      </div>
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
        view === 'pitch' ? "ml-0" : "md:ml-[72px]"
      )}>
        <TopBar
          view={view}
          setView={(v) => { setView(v); setMobileMenuOpen(false); }}
          activeCrisis={activeCrisis}
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
                    {adminView === 'dashboard' && <AdminDashboard rooms={rooms} setSubView={setAdminView} />}
                    {adminView === 'incidents' && <AdminIncidents />}
                    {adminView === 'units' && <AdminUnits />}
                    {adminView === 'map' && <ResourceInventoryDashboard />}
                    {adminView === 'logs' && <AdminLogs />}
                    {adminView === 'settings' && <AdminSettings />}
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
                      <GuestFacilityMap activeCrisis={activeCrisis} />
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
                    <p className="font-bold text-on-surface-variant text-center max-w-xs">Connecting to Sentinel Security Hub... <br />Stay calm, help is aware of your location.</p>
                  </div>
                )}
              </motion.div>
            )}
            {view === 'simulation' && (
              <motion.div key="sim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="flex-1 flex flex-col gap-4 w-full max-w-[1600px] mx-auto">
                {/* Mobile tab switcher */}
                <div className="flex lg:hidden items-center gap-2 bg-[#111827] border border-white/10 rounded-2xl p-1.5 self-start">
                  <button onClick={() => setSimTab('admin')} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", simTab === 'admin' ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30' : 'text-[#94A3B8]')}>Admin View</button>
                  <button onClick={() => setSimTab('guest')} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", simTab === 'guest' ? 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30' : 'text-[#94A3B8]')}>Guest App</button>
                </div>
                <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-8">
                  {/* Admin Side */}
                  <div className={cn("flex-[3] bg-[#111827] border border-white/10 rounded-[2rem] md:rounded-[3rem] p-5 md:p-10 overflow-y-auto custom-scrollbar relative shadow-xl min-h-[500px]", simTab === 'guest' ? 'hidden lg:block' : 'block')}>
                    <div className="absolute top-6 right-6 md:top-8 md:right-10 flex items-center gap-2 z-10">
                      <span className="px-3 py-1 bg-[#172033] border border-white/10 text-[#F8FAFC] text-[10px] uppercase font-black tracking-widest rounded-full">Admin View</span>
                    </div>
                    {adminView === 'dashboard' && <AdminDashboard rooms={rooms} isCompact={true} setSubView={setAdminView} />}
                    {adminView === 'incidents' && <AdminIncidents />}
                    {adminView === 'units' && <AdminUnits />}
                    {adminView === 'map' && <ResourceInventoryDashboard />}
                    {adminView === 'logs' && <AdminLogs />}
                    {adminView === 'settings' && <AdminSettings />}
                  </div>
                  {/* Guest Side (Mobile Mockup) */}
                  <div className={cn("flex-[2] lg:max-w-[480px] flex items-center justify-center bg-[#172033] rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 border border-white/10 relative shadow-inner min-h-[600px]", simTab === 'admin' ? 'hidden lg:flex' : 'flex')}>
                    <div className="absolute top-8 left-10 flex items-center gap-2 z-10">
                      <span className="px-3 py-1 bg-[#111827] text-[#F8FAFC] border border-white/10 text-[10px] uppercase font-black tracking-widest rounded-full shadow-sm">Guest App</span>
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
                              <GuestFacilityMap activeCrisis={activeCrisis} isLiveDemoMobile={true} />
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
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#475569] tracking-[0.2em]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> SYSTEM SECURED • ACTIVE
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#475569] tracking-[0.2em] border-l border-outline-variant/30 pl-4">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> AI CORE: ANALYZING
            </div>
          </div>
          <p className="text-[10px] font-bold text-[#475569] uppercase tracking-widest leading-none">© 2026 NexusResponse Hub • Google Cloud Partner <br /><span className="text-[8px] opacity-60">Authorized Personnel Only</span></p>
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
