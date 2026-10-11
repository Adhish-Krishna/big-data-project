import React from 'react';
import { Vehicle, TelemetryPoint, Hub } from '../types';
import {
  X,
  Battery,
  Fuel,
  Gauge,
  Thermometer,
  Clock,
  Radio,
  Navigation,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface VehicleDrawerProps {
  vehicle: Vehicle | null;
  currentHub: Hub | null;
  telemetryHistory: TelemetryPoint[];
  onClose: () => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  AVAILABLE:   { label: 'Available',   color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)' },
  ON_RENT:     { label: 'On Rent',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)' },
  MAINTENANCE: { label: 'Maintenance', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)' },
  TRANSIT:     { label: 'In Transit',  color: '#c9a84c', bg: 'rgba(201,168,76,0.1)',  border: 'rgba(201,168,76,0.3)' },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: '#0a0a0a',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '11px',
          fontFamily: "'Inter', 'Outfit', sans-serif",
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
        }}
      >
        {payload.map((entry: any) => (
          <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color, display: 'inline-block' }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{entry.name}:</span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const VehicleDrawer: React.FC<VehicleDrawerProps> = ({
  vehicle,
  currentHub,
  telemetryHistory,
  onClose,
}) => {
  if (!vehicle) return null;

  const chartData = telemetryHistory.map((t) => ({
    time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    speed: t.speedKmH,
    battery: t.batteryPct,
    temp: t.engineTempC,
  }));

  const sc = statusConfig[vehicle.status] || statusConfig.AVAILABLE;
  const energyLevel = vehicle.type === 'ELECTRIC' ? vehicle.batteryPct : vehicle.fuelPct;
  const energyColor = energyLevel < 20 ? '#ef4444' : energyLevel < 50 ? '#f59e0b' : '#22c55e';

  const statCards = [
    {
      icon: Gauge,
      label: 'Speed',
      value: vehicle.speedKmH,
      unit: 'km/h',
      color: '#ffffff',
    },
    {
      icon: vehicle.type === 'ELECTRIC' ? Battery : Fuel,
      label: vehicle.type === 'ELECTRIC' ? 'Battery' : 'Fuel',
      value: energyLevel,
      unit: '%',
      color: energyColor,
      bar: true,
    },
    {
      icon: Thermometer,
      label: 'Engine Temp',
      value: vehicle.engineTempC,
      unit: '°C',
      color: vehicle.engineTempC > 105 ? '#ef4444' : '#ffffff',
    },
    {
      icon: Clock,
      label: 'Odometer',
      value: vehicle.odometerKm.toLocaleString(),
      unit: 'km',
      color: '#ffffff',
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: '0 0 0 auto',
        width: '100%',
        maxWidth: '460px',
        background: '#0c0c0c',
        borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '-12px 0 48px rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Outfit', sans-serif",
      }}
    >
      {/* Royal Gold Top Accent */}
      <div
        style={{
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #c9a84c, #ffffff, transparent)',
          flexShrink: 0,
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: '1.25rem 1.4rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#0f0f0f',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '10px',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: sc.bg,
                  color: sc.color,
                  border: `1px solid ${sc.border}`,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                ● {sc.label}
              </span>

              <span
                style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontFamily: "'Inter', 'Outfit', sans-serif",
                  fontWeight: 600,
                }}
              >
                {vehicle.licensePlate}
              </span>
            </div>

            <h2
              style={{
                margin: '4px 0 0',
                fontSize: '20px',
                fontWeight: 700,
                fontFamily: "'Outfit', 'Inter', sans-serif",
                color: '#ffffff',
                letterSpacing: '-0.01em',
              }}
            >
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>

            <p
              style={{
                margin: '2px 0 0',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.45)',
              }}
            >
              VIN: {vehicle.vin} · {vehicle.type}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#181818',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#ffffff';
              (e.currentTarget as HTMLElement).style.color = '#000000';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#181818';
              (e.currentTarget as HTMLElement).style.color = 'rgba(255, 255, 255, 0.7)';
            }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.2rem 1.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.1rem',
        }}
      >
        {/* Live Route Transit Progress */}
        {vehicle.status === 'ON_RENT' && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.28)',
              borderRadius: '12px',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Navigation size={13} style={{ color: '#f59e0b' }} />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#f59e0b',
                  }}
                >
                  Live Highway Journey
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                {vehicle.tripProgress || 45}% Completed
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${vehicle.tripProgress || 45}%`,
                  background: 'linear-gradient(90deg, #f59e0b, #22c55e)',
                  borderRadius: '3px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)' }}>
              <span>From: <strong style={{ color: '#ffffff' }}>{vehicle.routeOrigin ? vehicle.routeOrigin.split(' ')[0] : 'Origin Hub'}</strong></span>
              <span style={{ color: '#f59e0b' }}>➔</span>
              <span>To: <strong style={{ color: '#ffffff' }}>{vehicle.routeDestination ? vehicle.routeDestination.split(' ')[0] : 'Destination Hub'}</strong></span>
            </div>
          </div>
        )}

        {/* Real-time Diagnostics Grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Radio size={12} style={{ color: '#c9a84c' }} />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              Live IoT Diagnostics
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {statCards.map(({ icon: Icon, label, value, unit, color, bar }) => (
              <div
                key={label}
                style={{
                  background: '#121212',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                  <Icon size={13} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>{label}</span>
                </div>

                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color,
                    fontFamily: "'Outfit', 'Inter', sans-serif",
                    lineHeight: 1,
                  }}
                >
                  {value}
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.45)', marginLeft: '3px' }}>
                    {unit}
                  </span>
                </div>

                {bar && (
                  <div
                    style={{
                      marginTop: '8px',
                      height: '4px',
                      background: '#222222',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${value}%`,
                        background: color,
                        borderRadius: '2px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hub Assignment (Neo4j Graph) */}
        <div
          style={{
            background: '#111111',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '10px',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#c9a84c',
              }}
            >
              <Navigation size={12} /> Neo4j Station Node
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '5px',
                background: '#1d1d1d',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontWeight: 600,
              }}
            >
              {vehicle.currentHubId}
            </span>
          </div>

          <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
            {currentHub?.name || 'In Transit Between Hubs'}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '3px' }}>
            Coordinates: [{vehicle.currentLocation.coordinates[1].toFixed(4)}, {vehicle.currentLocation.coordinates[0].toFixed(4)}]
          </div>
        </div>

        {/* Telemetry Stream Chart (MongoDB Time-series) */}
        <div
          style={{
            background: '#111111',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '10px',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#ffffff',
              }}
            >
              <Radio size={12} /> MongoDB IoT Telemetry
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>
              {telemetryHistory.length} recorded points
            </span>
          </div>

          {chartData.length > 0 ? (
            <div style={{ height: '160px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="speed" stroke="#ffffff" strokeWidth={1.8} dot={false} name="Speed (km/h)" />
                  <Line type="monotone" dataKey="temp" stroke="#c9a84c" strokeWidth={1.5} dot={false} name="Temp (°C)" />
                  <Line type="monotone" dataKey="battery" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Battery %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px' }}>
              No telemetry data points available for this vehicle
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
