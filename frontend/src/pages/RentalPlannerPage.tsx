import React, { useState, useEffect } from 'react';
import { Hub, Vehicle, RoutePlan, Rental } from '../types';
import { api } from '../services/api';
import { mockRentals } from '../services/mockData';
import {
  Navigation,
  MapPin,
  Car,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface RentalPlannerPageProps {
  hubs: Hub[];
  vehicles: Vehicle[];
  onRefresh: () => void;
}

export const RentalPlannerPage: React.FC<RentalPlannerPageProps> = ({
  hubs,
  vehicles,
  onRefresh,
}) => {
  const [originHubId, setOriginHubId] = useState<string>(hubs[0]?.id || 'hub-cbe-central');
  const [destHubId, setDestHubId] = useState<string>(hubs[1]?.id || 'hub-blr-electronic');
  const [selectedVin, setSelectedVin] = useState<string>('');
  const [customerName, setCustomerName] = useState('Devendra Sharma');
  const [customerPhone, setCustomerPhone] = useState('+91-98200-11223');
  const [durationDays, setDurationDays] = useState(2);
  const [insuranceTier, setInsuranceTier] = useState<'BASIC' | 'PREMIUM' | 'ENTERPRISE'>('PREMIUM');

  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const [rentals, setRentals] = useState<Rental[]>(mockRentals);
  const [activeTab, setActiveTab] = useState<'plan' | 'active'>('plan');

  // Load active rentals
  const loadRentals = async () => {
    try {
      const data = await api.getRentals();
      setRentals(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRentals();
  }, []);

  // Update origin/dest defaults when hubs prop updates
  useEffect(() => {
    if (hubs.length > 0) {
      if (!originHubId || !hubs.some((h) => h.id === originHubId)) {
        setOriginHubId(hubs[0].id);
      }
      if (!destHubId || !hubs.some((h) => h.id === destHubId)) {
        setDestHubId(hubs[1]?.id || hubs[0].id);
      }
    }
  }, [hubs]);

  // Compute Neo4j Shortest Route whenever origin or destination changes
  useEffect(() => {
    if (originHubId && destHubId) {
      setLoadingRoute(true);
      api
        .calculateRoute(originHubId, destHubId)
        .then((res) => {
          setRoutePlan(res);
        })
        .catch((err) => {
          console.error('Route calculation error:', err);
          setRoutePlan(null);
        })
        .finally(() => setLoadingRoute(false));
    }
  }, [originHubId, destHubId]);

  // Filter available vehicles at the chosen origin hub (or fallback to any available)
  const availableAtOrigin = vehicles.filter(
    (v) => v.status === 'AVAILABLE' && v.currentHubId === originHubId
  );
  const vehiclesToPickFrom = availableAtOrigin.length > 0 ? availableAtOrigin : vehicles.filter((v) => v.status === 'AVAILABLE');

  // Auto-select first available vehicle
  useEffect(() => {
    if (vehiclesToPickFrom.length > 0 && (!selectedVin || !vehiclesToPickFrom.some((v) => v.vin === selectedVin))) {
      setSelectedVin(vehiclesToPickFrom[0].vin);
    }
  }, [originHubId, vehiclesToPickFrom]);

  const chosenVehicle = vehicles.find((v) => v.vin === selectedVin);
  const estimatedVehicleCost = chosenVehicle ? chosenVehicle.dailyRate * durationDays : 0;
  const totalEstimatedCost = estimatedVehicleCost + (routePlan?.totalTollFee || 0);

  const handleBookRental = async () => {
    if (!chosenVehicle || !originHubId || !destHubId) return;

    setBookingLoading(true);
    try {
      const result = await api.createRental({
        customerId: `CUST-${Math.floor(100 + Math.random() * 900)}`,
        customerName,
        customerPhone,
        vin: chosenVehicle.vin,
        originHubId,
        destinationHubId: destHubId,
        durationDays,
        insuranceTier,
      });

      // Optimistically add to state and switch to active rentals tab
      setRentals((prev) => [result.rental, ...prev.filter((r) => r.rentalId !== result.rental.rentalId)]);
      setActiveTab('active');
      setBookingSuccess(
        `Rental ${result.rental.rentalId} confirmed! Created in MongoDB and mapped in Neo4j graph.`
      );

      // Refresh background data
      loadRentals();
      onRefresh();
      setTimeout(() => setBookingSuccess(null), 6000);
    } catch (err: any) {
      alert(`Booking failed: ${err.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCompleteRental = async (rentalId: string) => {
    if (!confirm('Confirm return and vehicle check-in?')) return;
    try {
      await api.completeRental(rentalId);
      setRentals((prev) =>
        prev.map((r) => (r.rentalId === rentalId ? { ...r, status: 'COMPLETED' } : r))
      );
      loadRentals();
      onRefresh();
    } catch (err: any) {
      alert(`Return failed: ${err.message}`);
    }
  };

  const activeRentals = rentals.filter((r) => r.status === 'ACTIVE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: "'Inter', 'Outfit', sans-serif" }}>
      {/* Header & Sub-Tab Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '1.1rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              fontFamily: "'Outfit', 'Inter', sans-serif",
              letterSpacing: '-0.01em',
            }}
          >
            Rental & Route Planner
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.5)',
              margin: '3px 0 0',
            }}
          >
            Dual-Write Polyglot Transactions: Neo4j Graph Pathfinding + MongoDB Rental Contracts
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: '#111111',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            onClick={() => setActiveTab('plan')}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'plan' ? '#ffffff' : 'transparent',
              color: activeTab === 'plan' ? '#000000' : 'rgba(255, 255, 255, 0.65)',
              transition: 'all 0.18s ease',
            }}
          >
            Plan & Book
          </button>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'active' ? '#ffffff' : 'transparent',
              color: activeTab === 'active' ? '#000000' : 'rgba(255, 255, 255, 0.65)',
              transition: 'all 0.18s ease',
            }}
          >
            <span>Active Rentals</span>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 7px',
                borderRadius: '999px',
                background: activeTab === 'active' ? '#000000' : 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              {activeRentals.length}
            </span>
          </button>
        </div>
      </div>

      {bookingSuccess && (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            color: '#22c55e',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(34, 197, 94, 0.15)',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{bookingSuccess}</span>
        </div>
      )}

      {activeTab === 'plan' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
            {/* Left Column: Route Configuration & Vehicle Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Origin & Destination Hub Selector */}
              <div
                style={{
                  background: '#0a0a0a',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Navigation size={13} style={{ color: '#ffffff' }} />
                  <span>Select Transportation Hubs</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Origin */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        marginBottom: '6px',
                      }}
                    >
                      Origin Hub (Pick-Up)
                    </label>
                    <select
                      value={originHubId}
                      onChange={(e) => setOriginHubId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: '#141414',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {hubs.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Destination */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        marginBottom: '6px',
                      }}
                    >
                      Destination Hub (Return)
                    </label>
                    <select
                      value={destHubId}
                      onChange={(e) => setDestHubId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: '#141414',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {hubs.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.city})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Neo4j Route Preview Box */}
                <div
                  style={{
                    marginTop: '1.2rem',
                    padding: '1rem',
                    background: '#121212',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#c9a84c',
                      }}
                    >
                      Neo4j Shortest Path Calculation
                    </span>
                    {loadingRoute && (
                      <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>Calculating...</span>
                    )}
                  </div>

                  {routePlan ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', margin: '8px 0' }}>
                        <div style={{ background: '#191919', padding: '8px', borderRadius: '7px' }}>
                          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)' }}>Distance</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                            {routePlan.totalDistanceKm} km
                          </div>
                        </div>
                        <div style={{ background: '#191919', padding: '8px', borderRadius: '7px' }}>
                          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)' }}>Duration</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                            {Math.floor(routePlan.totalDurationMin / 60)}h {routePlan.totalDurationMin % 60}m
                          </div>
                        </div>
                        <div style={{ background: '#191919', padding: '8px', borderRadius: '7px' }}>
                          <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)' }}>Bridge & Tolls</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
                            ${routePlan.totalTollFee.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {routePlan.segments?.length > 0 && (
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '6px' }}>
                          Via: {routePlan.segments.map((s) => `${s.from} → ${s.to}`).join(' · ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)' }}>
                      Select origin and destination to compute optimal graph path
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Selection List */}
              <div
                style={{
                  background: '#0a0a0a',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Car size={13} style={{ color: '#ffffff' }} />
                    <span>Choose Available Vehicle ({vehiclesToPickFrom.length})</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {vehiclesToPickFrom.map((v) => {
                    const isSelected = selectedVin === v.vin;
                    return (
                      <div
                        key={v.vin}
                        onClick={() => setSelectedVin(v.vin)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '9px',
                          border: isSelected ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
                          background: isSelected ? '#1b1b1b' : '#121212',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                            {v.make} {v.model}
                          </span>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#ffffff',
                              fontFamily: "'Outfit', 'Inter', sans-serif",
                            }}
                          >
                            ${v.dailyRate}/d
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.45)',
                            marginTop: '4px',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{v.licensePlate} · {v.type}</span>
                          <span>{v.type === 'ELECTRIC' ? `${v.batteryPct}% batt` : `${v.fuelPct}% fuel`}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Customer Details & Booking Confirmation */}
            <div
              style={{
                background: '#0a0a0a',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: '14px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: 'fit-content',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={13} style={{ color: '#c9a84c' }} />
                  <span>Customer & Contract Specs</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '5px' }}>
                      Customer Full Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#141414',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '5px' }}>
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#141414',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '5px' }}>
                        Duration (Days)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={durationDays}
                        onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: '#141414',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '5px' }}>
                        Insurance Tier
                      </label>
                      <select
                        value={insuranceTier}
                        onChange={(e: any) => setInsuranceTier(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: '#141414',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="BASIC">Basic ($0)</option>
                        <option value="PREMIUM">Premium ($15/d)</option>
                        <option value="ENTERPRISE">Enterprise ($30/d)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div
                  style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: '#111111',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '6px' }}>
                    <span>Vehicle Rate ({durationDays} days @ ${chosenVehicle?.dailyRate || 0}/d)</span>
                    <span>${estimatedVehicleCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
                    <span>Highway & Bridge Tolls</span>
                    <span>${(routePlan?.totalTollFee || 0).toFixed(2)}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Estimated Total</span>
                    <span
                      style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: '#ffffff',
                        fontFamily: "'Outfit', 'Inter', sans-serif",
                      }}
                    >
                      ${totalEstimatedCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBookRental}
                disabled={bookingLoading || !chosenVehicle}
                style={{
                  marginTop: '1.5rem',
                  width: '100%',
                  padding: '12px',
                  background: '#ffffff',
                  color: '#000000',
                  borderRadius: '9px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: bookingLoading || !chosenVehicle ? 'not-allowed' : 'pointer',
                  border: 'none',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  if (!bookingLoading && chosenVehicle) {
                    (e.currentTarget as HTMLElement).style.background = '#e5e5e5';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#ffffff';
                }}
              >
                {bookingLoading ? 'Processing Transaction...' : 'Confirm & Create Rental (Dual Write)'}
              </button>
            </div>
          </div>

          {/* Quick Active Rentals Section directly on Plan tab */}
          {activeRentals.length > 0 && (
            <div
              style={{
                marginTop: '1rem',
                background: '#0a0a0a',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: '14px',
                padding: '1.25rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#ffffff' }}>
                    Active Fleet Rentals ({activeRentals.length})
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('active')}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#ffffff',
                    background: '#161616',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    cursor: 'pointer',
                  }}
                >
                  Manage All Active Rentals →
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
                {activeRentals.slice(0, 3).map((r) => (
                  <div
                    key={r.rentalId}
                    style={{
                      background: '#111111',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{r.vehicleModel}</span>
                      <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700 }}>${r.estimatedCost}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      {r.originHubName.split(' ')[0]} → {r.destinationHubName.split(' ')[0]} · {r.customerName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Full Active Rentals Management Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeRentals.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                background: '#0a0a0a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                color: 'rgba(255, 255, 255, 0.45)',
                fontSize: '14px',
              }}
            >
              No active rental contracts currently in progress
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
              {activeRentals.map((r) => (
                <div
                  key={r.rentalId}
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#f59e0b',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          fontWeight: 700,
                        }}
                      >
                        ON RENT
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>{r.rentalId}</span>
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px' }}>
                      {r.vehicleModel}
                    </h3>
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '12px' }}>
                      Renter: {r.customerName} ({r.customerPhone})
                    </div>

                    <div
                      style={{
                        padding: '10px',
                        background: '#121212',
                        borderRadius: '8px',
                        fontSize: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Origin:</span>
                        <span style={{ color: '#ffffff' }}>{r.originHubName}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Destination:</span>
                        <span style={{ color: '#ffffff' }}>{r.destinationHubName}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Total Cost:</span>
                        <span style={{ color: '#ffffff', fontWeight: 700 }}>${r.estimatedCost}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCompleteRental(r.rentalId)}
                    style={{
                      marginTop: '1.2rem',
                      width: '100%',
                      padding: '8px',
                      background: '#161616',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#ffffff';
                      (e.currentTarget as HTMLElement).style.color = '#000000';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '#161616';
                      (e.currentTarget as HTMLElement).style.color = '#ffffff';
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>Complete Rental & Return Vehicle</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
