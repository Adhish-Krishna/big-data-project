import React from 'react';
import {
  Navigation,
  MapPin,
  Share2,
  BarChart3,
  Play,
  Pause,
  RefreshCw,
  Database,
  Layers,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'map' | 'rentals' | 'graph' | 'analytics';
  setActiveTab: (tab: 'map' | 'rentals' | 'graph' | 'analytics') => void;
  health: { mongodb: string; neo4j: string } | null;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onTickSimulation: () => void;
  vehicleCount: number;
  activeRentalsCount: number;
}

const tabs = [
  { key: 'map' as const, icon: MapPin, label: 'Live Fleet', hasCount: true },
  { key: 'rentals' as const, icon: Navigation, label: 'Route & Rentals', hasCount: true, countKey: 'rentals' },
  { key: 'graph' as const, icon: Share2, label: 'Neo4j Graph', hasCount: false },
  { key: 'analytics' as const, icon: BarChart3, label: 'Big Data Analytics', hasCount: false },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  health,
  isSimulating,
  onToggleSimulation,
  onTickSimulation,
  vehicleCount,
  activeRentalsCount,
}) => {
  const isMongoConnected = health?.mongodb?.includes('CONNECTED') || health?.mongodb?.includes('SIMULATED');
  const isNeo4jConnected = health?.neo4j?.includes('CONNECTED') || health?.neo4j?.includes('SIMULATED');

  return (
    <header
      style={{
        background: '#070707',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.8)',
      }}
    >
      {/* Royal Subtle Gold & White Accent Top Line */}
      <div
        style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.3) 25%, #ffffff 50%, rgba(201,168,76,0.3) 75%, transparent 100%)',
        }}
      />

      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'nowrap',
        }}
      >
        {/* ── Brand Area ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <img
              src="/logo_og.png?v=2"
              alt="SmartFleet Logo"
              style={{
                width: '78px',
                height: '78px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.25))',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              {/* Brand Header: Comfortaa, 22px, 700, -0.02em */}
              <h1
                style={{
                  fontFamily: "'Comfortaa', 'Outfit', sans-serif",
                  fontSize: '22px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                SmartFleet
              </h1>

              {/* <span
                style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  fontFamily: "'Inter', 'Outfit', sans-serif",
                }}
              >
                IoT INDIA
              </span> */}
            </div>

            {/* Brand Tagline: Inter/Outfit, 11px, 600, 0.2em, UPPERCASE */}
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.45)',
                fontFamily: "'Inter', 'Outfit', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>MongoDB</span>
              <span style={{ color: 'rgba(201,168,76,0.6)' }}>·</span>
              <span>Neo4j</span>
              <span style={{ color: 'rgba(201,168,76,0.6)' }}>·</span>
              <span>Polyglot Persistence</span>
            </p>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: '#111111',
            padding: '5px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {tabs.map(({ key, icon: Icon, label }) => {
            const isActive = activeTab === key;
            const count = key === 'map' ? vehicleCount : key === 'rentals' ? activeRentalsCount : 0;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 15px',
                  borderRadius: '9px',
                  fontFamily: "'Inter', 'Outfit', sans-serif",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  border: isActive ? '1px solid #ffffff' : '1px solid transparent',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                  boxShadow: isActive ? '0 2px 12px rgba(255, 255, 255, 0.15)' : 'none',
                  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.07)';
                    (e.currentTarget as HTMLElement).style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'rgba(255, 255, 255, 0.7)';
                  }
                }}
              >
                <Icon size={14} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{label}</span>
                {count > 0 && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      background: isActive ? '#000000' : 'rgba(255, 255, 255, 0.15)',
                      color: isActive ? '#ffffff' : '#ffffff',
                      fontWeight: 700,
                      fontFamily: "'Inter', 'Outfit', sans-serif",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Right Controls (DB Status & IoT Simulation) ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* DB Health Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* MongoDB */}
            <div
              title={health?.mongodb || 'MongoDB IoT Store'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 11px',
                borderRadius: '8px',
                background: '#121212',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.75)',
                fontFamily: "'Inter', 'Outfit', sans-serif",
                fontWeight: 500,
              }}
            >
              <Database size={13} style={{ color: '#ffffff' }} />
              <span>Mongo</span>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isMongoConnected ? '#22c55e' : '#ef4444',
                  boxShadow: isMongoConnected ? '0 0 8px #22c55e' : 'none',
                  display: 'inline-block',
                }}
              />
            </div>

            {/* Neo4j */}
            <div
              title={health?.neo4j || 'Neo4j Graph Database'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 11px',
                borderRadius: '8px',
                background: '#121212',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.75)',
                fontFamily: "'Inter', 'Outfit', sans-serif",
                fontWeight: 500,
              }}
            >
              <Layers size={13} style={{ color: '#c9a84c' }} />
              <span>Neo4j</span>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isNeo4jConnected ? '#22c55e' : '#ef4444',
                  boxShadow: isNeo4jConnected ? '0 0 8px #22c55e' : 'none',
                  display: 'inline-block',
                }}
              />
            </div>
          </div>

          {/* IoT Simulation Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#121212',
              padding: '4px',
              borderRadius: '9px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              onClick={onToggleSimulation}
              title={isSimulating ? 'Pause IoT Telemetry Stream' : 'Resume IoT Telemetry Stream'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: isSimulating ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.1)',
                fontFamily: "'Inter', 'Outfit', sans-serif",
                background: isSimulating ? '#1a1a1a' : '#0e0e0e',
                color: '#ffffff',
                transition: 'all 0.18s ease',
              }}
            >
              {isSimulating ? <Pause size={12} /> : <Play size={12} />}
              <span>{isSimulating ? 'Sim Live' : 'Paused'}</span>
              {isSimulating && (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 8px #22c55e',
                    display: 'inline-block',
                  }}
                />
              )}
            </button>

            <button
              onClick={onTickSimulation}
              title="Manual Telemetry Simulation Tick"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#ffffff';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(255, 255, 255, 0.6)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
