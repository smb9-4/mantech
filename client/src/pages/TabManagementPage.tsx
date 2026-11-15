import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Tablet,
  Shield,
  Activity,
  Lock,
  BarChart3,
  Phone,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Wifi
} from 'lucide-react';
import {
  ADMIN_NAV_SECTIONS,
  AdminNavSection,
  ERPModuleId
} from '../tabManagement/erpNavConfig';
import AdminModuleView from '../tabManagement/AdminModuleView';
import AdminParentConnectSection from '../tabManagement/AdminParentConnectSection';
import { LIVE_100_STUDENT_TABLETS } from '../tabManagement/tabletIntelligenceData';
import { STUDENTS_100_ROSTER } from '../tabManagement/rosterData';

const ADMIN_ITEM_BADGES: Partial<Record<ERPModuleId, string>> = {
  adm_all_devices: '100',
  adm_battery_health: '7 ⚠',
  adm_connectivity: '6 ✕',
  adm_submissions: '14',
  adm_exam_incidents: '9',
  adm_app_usage: '3 ⚠',
  adm_os_updates: '9',
  adm_student_reports: '100',
  adm_maintenance: '4 ⚠',
  adm_parent_connect: '100',
};

const ADMIN_ITEM_DESCRIPTIONS: Partial<Record<ERPModuleId, string>> = {
  adm_all_devices: 'Monitor every registered student tablet in real-time.',
  adm_battery_health: 'Review battery percentage, health metrics and thermal alerts.',
  adm_device_inventory: 'Track tablet hardware assets, models and warranty.',
  adm_serial_specs: 'Review MAC addresses, serial numbers and chipset specifications.',
  adm_connectivity: 'Check WiFi status, signal strength and IP assignment.',
  adm_device_health: 'Review tablet diagnostic logs, storage and performance.',
  adm_live_monitoring: 'Watch active examination screens and live student progress.',
  adm_time_management: 'Manage exam session timers, schedules and extensions.',
  adm_submissions: 'Track completed exam answer sheets and pending submissions.',
  adm_exam_incidents: 'Review malpractice alerts and kiosk security breaches.',
  adm_app_usage: 'Analyze application screen-time across all student devices.',
  adm_tab_activity: 'Monitor browser navigation and tab switching frequency.',
  adm_block_access: 'Block specific applications or lock tablet kiosk immediately.',
  adm_send_notification: 'Broadcast push alerts or direct messages to student tablets.',
  adm_app_deployment: 'Remotely push and install approved educational APKs.',
  adm_os_updates: 'Coordinate firmware patches and security maintenance.',
  adm_audit_logs: 'Review immutable administrative actions and fleet history.',
  adm_overall_reports: 'Fleet-wide usage statistics, analytics and summaries.',
  adm_maintenance: 'Hardware servicing records and maintenance schedules.',
  adm_configuration: 'Global kiosk restrictions, URL whitelisting and MDM policies.',
  adm_parent_connect: 'Manage permitted calling hours, parent contacts & voice gateway.',
};

interface TabManagementPageProps {
  onExit?: () => void;
}

export const TabManagementPage: React.FC<TabManagementPageProps> = ({ onExit }) => {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<ERPModuleId | 'dashboard'>('dashboard');
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  const [hoveredModuleId, setHoveredModuleId] = useState<ERPModuleId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const activeSection = ADMIN_NAV_SECTIONS.find((s) => s.sectionId === activeSectionId);

  // Quick stats computed from live data
  const totalTablets = LIVE_100_STUDENT_TABLETS.length;
  const activeTablets = LIVE_100_STUDENT_TABLETS.filter(t => t.deviceStatus === 'Active').length;
  const lowBatteryCount = LIVE_100_STUDENT_TABLETS.filter(t => t.batteryPercentage < 25).length;
  const kioskStrictCount = LIVE_100_STUDENT_TABLETS.filter(t => t.screenStatus.includes('Kiosk')).length;

  const handleSelectSection = (sectionId: string) => {
    if (sectionId === 'parent_connect') {
      setActiveSectionId('parent_connect');
      setActiveModule('adm_parent_connect');
      return;
    }
    setActiveSectionId(sectionId);
    setActiveModule('dashboard');
  };

  const handleSelectModule = (moduleId: ERPModuleId) => {
    setActiveModule(moduleId);
  };

  const handleBackToSections = () => {
    setActiveSectionId(null);
    setActiveModule('dashboard');
  };

  const handleBackToSectionModules = () => {
    if (activeSectionId === 'parent_connect') {
      setActiveSectionId(null);
    }
    setActiveModule('dashboard');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 select-none">
      {/* ── Top Header Bar (Only visible on main Tab Management dashboard) ── */}
      {activeModule === 'dashboard' && !activeSectionId && (
        <div
          className="rounded-2xl p-6 text-white shadow-md relative overflow-hidden"
          style={{ backgroundColor: '#8C1118' }}
        >
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {onExit && (
                  <button
                    type="button"
                    onClick={onExit}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur border border-white/20 transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Back to ERP
                  </button>
                )}
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#FFE59A] text-[#8C1118] uppercase tracking-wider">
                  Campus Admin MDM
                </span>
                <span className="text-xs text-white/80 font-medium">
                  • 100 Enrolled Student Tablets
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                SIR MV PU COLLEGE — <span className="text-[#F3DCAE]">Tab Management & MDM</span>
              </h1>

              <p className="text-xs text-white/85 max-w-3xl leading-relaxed">
                Centralized fleet intelligence for student tablets, real-time examination kiosk lockdowns, app governance, tamper security, and parent connect communication gateway.
              </p>
            </div>

            {/* Fleet Status Snapshot */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 bg-black/25 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
              <div className="text-center px-2">
                <span className="text-[10px] uppercase font-bold text-white/70 block">Fleet</span>
                <span className="text-lg font-black text-emerald-400">{activeTablets}/{totalTablets}</span>
                <span className="text-[10px] text-white/60 block">Online</span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-center px-2">
                <span className="text-[10px] uppercase font-bold text-white/70 block">Kiosk</span>
                <span className="text-lg font-black text-[#FFE59A]">{kioskStrictCount}</span>
                <span className="text-[10px] text-white/60 block">Strict Mode</span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-center px-2">
                <span className="text-[10px] uppercase font-bold text-white/70 block">Alerts</span>
                <span className="text-lg font-black text-amber-300">{lowBatteryCount}</span>
                <span className="text-[10px] text-white/60 block">Low Bat</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}

      {/* VIEW 1: Active Sub-Module View (e.g. Live Monitoring, All Devices, App Usage, etc.) */}
      {activeModule !== 'dashboard' && (
        <div className="space-y-4">
          {/* Parent Connect Calling Gateway View */}
          {activeModule === 'adm_parent_connect' && (
            <AdminParentConnectSection onBack={handleBackToSections} sidebarWidth={80} />
          )}

          {/* Any other Admin Module View */}
          {activeModule.startsWith('adm_') && activeModule !== 'adm_parent_connect' && (
            <AdminModuleView
              moduleId={activeModule}
              onBack={handleBackToSectionModules}
              sidebarWidth={80}
            />
          )}
        </div>
      )}

      {/* VIEW 2: Specific Section Opened (shows its sub-modules) */}
      {activeModule === 'dashboard' && activeSection && (
        activeSectionId === 'parent_connect' ? (
          <AdminParentConnectSection onBack={handleBackToSections} sidebarWidth={80} />
        ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBackToSections}
                aria-label="All Sections"
                title="All Sections"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition hover:border-[#8C1118] hover:bg-red-50 hover:text-[#8C1118]"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: activeSection.sectionColor }}>
                  Section {activeSection.sectionNumber} MDM Module
                </p>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 flex items-center gap-3">
                  <img src={activeSection.sectionIconSrc} alt="" className="w-8 h-8 object-contain" />
                  {activeSection.sectionLabel}
                </h1>
              </div>
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-full text-white self-start sm:self-auto" style={{ backgroundColor: activeSection.sectionColor }}>
              {activeSection.items.length} Sub-modules Available
            </span>
          </div>

          {/* Section Items Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeSection.items.map((item) => {
              const ItemIcon = item.icon;
              const badge = ADMIN_ITEM_BADGES[item.id] ?? item.badge;
              const isHovered = hoveredModuleId === item.id;

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  data-dashboard-card="admin-module"
                  onPointerEnter={() => setHoveredModuleId(item.id)}
                  onPointerLeave={() => setHoveredModuleId((cur) => cur === item.id ? null : cur)}
                  onFocus={() => setHoveredModuleId(item.id)}
                  onBlur={() => setHoveredModuleId((cur) => cur === item.id ? null : cur)}
                  onClick={() => handleSelectModule(item.id)}
                  animate={{
                    y: isHovered ? -5 : 0,
                    scale: isHovered ? 1.02 : 1,
                    boxShadow: isHovered
                      ? '0 20px 36px -20px rgba(15,23,42,0.35)'
                      : '0 2px 6px -2px rgba(15,23,42,0.12)',
                  }}
                  transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                  className="group relative flex min-h-36 flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white p-5 pb-12 text-left shadow-sm transition-colors hover:border-stone-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8C1118] cursor-pointer"
                >
                  <span className="mb-3.5 flex min-h-11 w-full items-start justify-between">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#8C1118] shadow-xs transition-[filter] ${
                        isHovered ? 'drop-shadow-[0_0_16px_#E6C28F]' : ''
                      }`}
                      style={{ color: item.colorAccent ?? activeSection.sectionColor }}
                    >
                      <ItemIcon size={32} />
                    </span>
                    {badge && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold text-white ${
                          badge === 'LIVE' ? 'animate-pulse bg-red-600' : ''
                        }`}
                        style={badge === 'LIVE' ? undefined : { backgroundColor: activeSection.sectionColor }}
                      >
                        {badge}
                      </span>
                    )}
                  </span>

                  <span className={`mt-2 font-black text-sm transition-colors ${
                    isHovered ? 'text-[#8C1118]' : 'text-stone-900'
                  }`}>
                    {item.label}
                  </span>

                  <span className="mt-1 text-[11px] leading-relaxed text-stone-500">
                    {ADMIN_ITEM_DESCRIPTIONS[item.id] || 'Inspect and configure device telemetry.'}
                  </span>

                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: '#8C1118' }}
                    className={`absolute inset-x-0 bottom-0 flex h-10 items-center justify-center gap-2 text-xs font-black text-white transition-transform duration-300 ease-out ${
                      isHovered ? 'translate-y-0' : 'translate-y-full'
                    }`}
                  >
                    <span>Open Module</span>
                    <ArrowRight size={15} className={`transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
        )
      )}

      {/* VIEW 3: Main Sections Dashboard (6 Interactive MDM Section Cards) */}
      {activeModule === 'dashboard' && !activeSection && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-lg font-bold text-stone-900 font-heading">
                6 MDM Fleet Control Sections
              </h2>
              <p className="text-xs text-stone-500">
                Click any section card to enter its monitoring matrix and controls.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#fbf6ec] text-[#8a561f] border border-[#f5e8cc]">
              Complete SIR MV Tab Software Stack
            </span>
          </div>

          {/* 6 Interactive Section Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {ADMIN_NAV_SECTIONS.map((section) => {
              const isHovered = hoveredSectionId === section.sectionId;

              return (
                <motion.button
                  key={section.sectionId}
                  type="button"
                  aria-label={`Open ${section.sectionLabel} page`}
                  onPointerEnter={() => setHoveredSectionId(section.sectionId)}
                  onPointerLeave={() => setHoveredSectionId((cur) => cur === section.sectionId ? null : cur)}
                  onFocus={() => setHoveredSectionId(section.sectionId)}
                  onBlur={() => setHoveredSectionId((cur) => cur === section.sectionId ? null : cur)}
                  onClick={() => handleSelectSection(section.sectionId)}
                  animate={{
                    borderColor: isHovered ? '#E5BD55' : '#E7E5E4',
                    boxShadow: isHovered
                      ? '0 16px 30px -8px rgba(101, 0, 0, 0.16), 0 4px 18px rgba(229, 189, 85, 0.2)'
                      : '0 2px 6px rgba(31, 41, 55, 0.04)',
                    y: isHovered ? -3 : 0,
                  }}
                  transition={{
                    borderColor: { duration: 0.2 },
                    boxShadow: { duration: 0.2 },
                    y: { duration: 0.18, ease: 'easeOut' },
                  }}
                  className="group relative flex h-full min-h-[220px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 pb-14 text-center shadow-sm cursor-pointer transition-colors"
                >
                  {/* Icon with glowing animation */}
                  <motion.div
                    animate={{
                      y: isHovered ? [0, -3, 0] : 0,
                      scale: isHovered ? [1, 1.05, 1] : 1,
                    }}
                    transition={{
                      y: { duration: 0.5, repeat: isHovered ? Infinity : 0, repeatDelay: 0.26, ease: 'easeOut' },
                      scale: { duration: 0.5, repeat: isHovered ? Infinity : 0, repeatDelay: 0.26, ease: 'easeOut' },
                    }}
                    className="mb-4 flex h-20 w-20 items-center justify-center"
                  >
                    <img
                      src={section.sectionIconSrc}
                      alt={section.sectionLabel}
                      className="h-full w-full object-contain transition-[filter] duration-300"
                      style={{
                        filter: isHovered
                          ? 'drop-shadow(0 0 14px rgba(229, 189, 85, 0.75))'
                          : undefined,
                      }}
                    />
                  </motion.div>

                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: section.sectionColor }}>
                      Section {section.sectionNumber}
                    </span>
                    <h3 className={`font-black text-base uppercase tracking-wide transition-colors duration-300 ${
                      isHovered ? 'text-[#8C1118]' : 'text-stone-900'
                    }`}>
                      {section.sectionLabel}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium max-w-[240px]">
                      {section.items.map(i => i.label).join(' • ')}
                    </p>
                  </div>

                  {/* Open Bar slide-up */}
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: '#8C1118' }}
                    className={`absolute inset-x-0 bottom-0 flex h-11 items-center justify-center gap-2 text-xs font-black text-white transition-transform duration-300 ease-out ${
                      isHovered ? 'translate-y-0' : 'translate-y-full'
                    }`}
                  >
                    <span>Open Section</span>
                    <ArrowRight size={15} className={`transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TabManagementPage;
