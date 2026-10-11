import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Vehicle, Hub } from '../types';
import {
  Car,
  Battery,
  Fuel,
  Filter,
  Search,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  MapPin,
} from 'lucide-react';

// Fix Leaflet default icon issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom vehicle icons using Royal Black & White styling
function createVehicleIcon(status: string, type: string) {
  const statusColor =
    status === 'ON_RENT'
      ? '#f59e0b'
      : status === 'AVAILABLE'
      ? '#22c55e'
      : '#ef4444';

  const isOnRent = status === 'ON_RENT';
  const ring = isOnRent
    ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid ${statusColor};opacity:0.75;animation:pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite;"></div>`
    : '';

  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position:relative;width:34px;height:34px;">
        ${ring}
        <div style="
          background: #000000;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 2px solid ${statusColor};
          box-shadow: 0 4px 14px rgba(0,0,0,0.7), 0 0 10px ${statusColor}66;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 14px;
          position: relative;
          z-index: 1;
        ">
          ${type === 'TRUCK' ? '🚛' : type === 'VAN' ? '🚐' : '🚗'}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

// Custom Hub icon with Royal Gold styling
function createHubIcon() {
  return L.divIcon({
    className: 'custom-hub-marker',
    html: `
      <div style="
        background: #000000;
        width: 36px;
        height: 36px;
        border-radius: 9px;
        border: 2px solid #c9a84c;
        box-shadow: 0 4px 16px rgba(0,0,0,0.7), 0 0 12px rgba(201,168,76,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 16px;
      ">
        🏢
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

interface FleetMapPageProps {
  vehicles: Vehicle[];
  hubs: Hub[];
  onSelectVehicle: (v: Vehicle) => void;
  selectedVehicle: Vehicle | null;
}

export const FleetMapPage: React.FC<FleetMapPageProps> = ({
  vehicles,
  hubs,
  onSelectVehicle,
  selectedVehicle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || v.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const availableCount = vehicles.filter((v) => v.status === 'AVAILABLE').length;
  const onRentCount = vehicles.filter((v) => v.status === 'ON_RENT').length;
  const avgBattery = Math.round(
    vehicles.reduce((sum, v) => sum + (v.batteryPct || 0), 0) / (vehicles.length || 1)
  );

  const statCards = [
    { label: 'Total Fleet',      value: vehicles.length,  unit: 'units', Icon: Car },
    { label: 'Available Now',    value: availableCount,   unit: 'ready', Icon: ShieldCheck, statusColor: '#22c55e' },
    { label: 'On Active Rent',   value: onRentCount,      unit: 'in transit', Icon: Activity, statusColor: '#f59e0b' },
    { label: 'Avg Fleet Energy', value: avgBattery,       unit: '%', Icon: Zap, statusColor: '#c9a84c' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ── Fleet Top Overview KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {statCards.map(({ label, value, unit, Icon, statusColor }) => (
          <div
            key={label}
            style={{
              background: '#0e0e0e',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '12px',
              padding: '1.1rem 1.3rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'border-color 0.18s ease',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#161616',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: statusColor || '#ffffff',
                flexShrink: 0,
              }}
            >
              <Icon size={19} />
            </div>

            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontFamily: "'Inter', 'Outfit', sans-serif",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#ffffff',
                  lineHeight: 1.1,
                  fontFamily: "'Outfit', 'Inter', sans-serif",
                  marginTop: '2px',
                }}
              >
                {value}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.45)',
                    marginLeft: '5px',
                  }}
                >
                  {unit}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Map & Fleet Directory Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1rem', height: 'calc(100vh - 230px)', minHeight: '560px' }}>
        {/* Left Side: Fleet Filter & List */}
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '14px',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Filter size={13} style={{ color: '#ffffff' }} />
                <h2
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    fontFamily: "'Inter', 'Outfit', sans-serif",
                    margin: 0,
                  }}
                >
                  Fleet Directory
                </h2>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.45)',
                  fontFamily: "'Inter', 'Outfit', sans-serif",
                }}
              >
                {filteredVehicles.length} of {vehicles.length}
              </span>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '0.55rem' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '11px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.4)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search make, model, plate, VIN..."
                style={{
                  width: '100%',
                  paddingLeft: '34px',
                  paddingRight: '12px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  background: '#141414',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#ffffff',
                  fontFamily: "'Inter', 'Outfit', sans-serif",
                  outline: 'none',
                  transition: 'border-color 0.18s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#ffffff')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
              />
            </div>

            {/* Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '7px 8px',
                  background: '#141414',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '7px',
                  fontSize: '11px',
                  color: '#ffffff',
                  fontFamily: "'Inter', 'Outfit', sans-serif",
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ON_RENT">On Rent</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  padding: '7px 8px',
                  background: '#141414',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '7px',
                  fontSize: '11px',
                  color: '#ffffff',
                  fontFamily: "'Inter', 'Outfit', sans-serif",
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Types</option>
                <option value="ELECTRIC">Electric</option>
                <option value="SUV">SUV</option>
                <option value="SEDAN">Sedan</option>
                <option value="VAN">Van</option>
                <option value="TRUCK">Truck</option>
              </select>
            </div>
          </div>

          {/* Vehicle List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              paddingRight: '2px',
            }}
          >
            {filteredVehicles.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '13px',
                  fontFamily: "'Inter', 'Outfit', sans-serif",
                }}
              >
                No vehicles match current filters
              </div>
            )}

            {filteredVehicles.map((v) => {
              const isSelected = selectedVehicle?.vin === v.vin;
              const statusColor =
                v.status === 'AVAILABLE'
                  ? '#22c55e'
                  : v.status === 'ON_RENT'
                  ? '#f59e0b'
                  : '#ef4444';

              return (
                <div
                  key={v.vin}
                  onClick={() => onSelectVehicle(v)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '9px',
                    border: isSelected ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected ? '#1b1b1b' : '#111111',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected ? '0 2px 10px rgba(255,255,255,0.08)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.background = '#161616';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.18)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.background = '#111111';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: statusColor,
                            display: 'inline-block',
                            boxShadow: `0 0 6px ${statusColor}`,
                          }}
                        />
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#ffffff',
                            fontFamily: "'Inter', 'Outfit', sans-serif",
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {v.year} {v.make} {v.model}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontFamily: "'Inter', 'Outfit', sans-serif",
                        }}
                      >
                        {v.licensePlate} · {v.type}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#ffffff',
                          fontFamily: "'Outfit', 'Inter', sans-serif",
                        }}
                      >
                        ${v.dailyRate}/d
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'rgba(255, 255, 255, 0.45)',
                          fontFamily: "'Inter', 'Outfit', sans-serif",
                        }}
                      >
                        {v.status === 'ON_RENT' ? `${v.speedKmH} km/h` : 'Station'}
                      </div>
                    </div>
                  </div>

                  {v.status === 'ON_RENT' && (
                    <div style={{ marginTop: '7px', paddingTop: '7px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#f59e0b', fontWeight: 600, marginBottom: '3px' }}>
                        <span>Transit: {v.routeOrigin ? `${v.routeOrigin.split(' ')[0]} ➔ ${v.routeDestination?.split(' ')[0]}` : 'Highway Route'}</span>
                        <span>{v.tripProgress || 45}%</span>
                      </div>
                      <div style={{ height: '3px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${v.tripProgress || 45}%`, background: 'linear-gradient(90deg, #f59e0b, #22c55e)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontFamily: "'Inter', 'Outfit', sans-serif",
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {v.type === 'ELECTRIC' ? (
                          <Battery size={12} style={{ color: '#22c55e' }} />
                        ) : (
                          <Fuel size={12} style={{ color: '#f59e0b' }} />
                        )}
                        {v.type === 'ELECTRIC' ? v.batteryPct : v.fuelPct}%
                      </span>
                      <span>·</span>
                      <span style={{ fontSize: '10px' }}>{v.currentHubId}</span>
                    </div>

                    <ChevronRight
                      size={13}
                      style={{ color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.3)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: OpenStreetMap Leaflet Interactive Map */}
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '14px',
            position: 'relative',
            height: '100%',
            overflow: 'hidden',
            padding: '6px',
          }}
        >
          {/* Map Overlay Badge & Legend */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: selectedVehicle ? 50 : 400,
              background: 'rgba(10, 10, 10, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              padding: '11px 16px',
              borderRadius: '11px',
              fontSize: '11px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                marginBottom: '9px',
                fontWeight: 700,
                color: '#ffffff',
                fontFamily: "'Inter', 'Outfit', sans-serif",
                letterSpacing: '0.04em',
              }}
            >
              <Layers size={13} style={{ color: '#c9a84c' }} />
              <span>OSM INDIA LIVE MAP</span>
            </div>

            {[
              ['#22c55e', 'Available Fleet'],
              ['#f59e0b', 'On Rent / In-Motion'],
              ['#c9a84c', 'Transportation Hub'],
            ].map(([c, l]) => (
              <div
                key={l}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px',
                }}
              >
                <span
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: c,
                    boxShadow: `0 0 6px ${c}`,
                    display: 'inline-block',
                  }}
                />
                <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                  {l}
                </span>
              </div>
            ))}
          </div>

          {/* Leaflet Map: Default center on India (lat: 20.5937, lng: 78.9629, zoom: 5) */}
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%', borderRadius: '10px' }}
          >
            {/* OpenStreetMap Tiles (open-source) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Render Indian Transportation Hubs */}
            {hubs.map((hub) => (
              <Marker
                key={hub.id}
                position={[hub.latitude, hub.longitude]}
                icon={createHubIcon()}
              >
                <Popup>
                  <div style={{ padding: '4px', color: '#000000', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{hub.name}</div>
                    <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>
                      City: {hub.city} · Capacity: {hub.capacity}
                    </div>
                    <div style={{ fontSize: '10px', color: '#2563eb', fontWeight: 600, marginTop: '4px' }}>
                      ID: {hub.id}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Active Highway Route Polylines for In-Transit Fleet */}
            {vehicles
              .filter((v) => v.status === 'ON_RENT')
              .map((v) => {
                const [curLng, curLat] = v.currentLocation.coordinates;
                const isSelected = selectedVehicle?.vin === v.vin;
                const orig = hubs.find((h) => h.name === v.routeOrigin || h.id === v.currentHubId);
                const dest = hubs.find((h) => h.name === v.routeDestination);
                if (!orig && !dest) return null;

                const positions: [number, number][] = [];
                if (orig) positions.push([orig.latitude, orig.longitude]);
                positions.push([curLat, curLng]);
                if (dest) positions.push([dest.latitude, dest.longitude]);

                return (
                  <Polyline
                    key={`route-${v.vin}`}
                    positions={positions}
                    pathOptions={{
                      color: isSelected ? '#f59e0b' : 'rgba(245, 158, 11, 0.5)',
                      weight: isSelected ? 3.5 : 2,
                      dashArray: '6, 8',
                      opacity: isSelected ? 0.95 : 0.65,
                    }}
                  />
                );
              })}

            {/* Render Vehicle Markers */}
            {vehicles.map((vehicle) => {
              const [lng, lat] = vehicle.currentLocation.coordinates;
              return (
                <Marker
                  key={vehicle.vin}
                  position={[lat, lng]}
                  icon={createVehicleIcon(vehicle.status, vehicle.type)}
                  eventHandlers={{
                    click: () => onSelectVehicle(vehicle),
                  }}
                >
                  <Popup>
                    <div style={{ padding: '4px', color: '#000000', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
                      <div style={{ fontWeight: 700, fontSize: '13px' }}>
                        {vehicle.make} {vehicle.model}
                      </div>
                      <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>
                        Plate: {vehicle.licensePlate} · Status: {vehicle.status}
                      </div>
                      <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>
                        Speed: {vehicle.speedKmH} km/h · Battery: {vehicle.batteryPct}%
                      </div>
                      {vehicle.status === 'ON_RENT' && (
                        <div
                          style={{
                            marginTop: '6px',
                            padding: '5px 8px',
                            background: '#fef3c7',
                            borderRadius: '6px',
                            border: '1px solid #fcd34d',
                          }}
                        >
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309' }}>
                            🛣️ In Transit ({vehicle.tripProgress || 45}% of journey)
                          </div>
                          {vehicle.routeOrigin && vehicle.routeDestination && (
                            <div style={{ fontSize: '10px', color: '#78350f', marginTop: '2px', fontWeight: 600 }}>
                              {vehicle.routeOrigin.split(' ')[0]} ➔ {vehicle.routeDestination.split(' ')[0]}
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => onSelectVehicle(vehicle)}
                        style={{
                          marginTop: '6px',
                          fontSize: '11px',
                          padding: '4px 8px',
                          background: '#000000',
                          color: '#ffffff',
                          borderRadius: '5px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Inspect Telemetry
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
