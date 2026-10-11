import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { FleetMapPage } from './pages/FleetMapPage';
import { RentalPlannerPage } from './pages/RentalPlannerPage';
import { Neo4jGraphPage } from './pages/Neo4jGraphPage';
import { AnalyticsDashboardPage } from './pages/AnalyticsDashboardPage';
import { VehicleDrawer } from './components/VehicleDrawer';
import { Vehicle, Hub, TelemetryPoint } from './types';
import { api } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'rentals' | 'graph' | 'analytics'>('map');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [health, setHealth] = useState<{ mongodb: string; neo4j: string } | null>(null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [activeRentalsCount, setActiveRentalsCount] = useState(0);

  // Selected vehicle for inspector drawer
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [drawerData, setDrawerData] = useState<{
    vehicle: Vehicle | null;
    currentHub: Hub | null;
    telemetryHistory: TelemetryPoint[];
  }>({
    vehicle: null,
    currentHub: null,
    telemetryHistory: [],
  });

  // Initial load
  const loadInitialData = useCallback(async () => {
    try {
      const [hRes, vList, hList, rList, simStatus] = await Promise.all([
        api.getHealth(),
        api.getVehicles(),
        api.getHubs(),
        api.getRentals('ACTIVE'),
        api.getSimulationStatus(),
      ]);
      setHealth(hRes.databases);
      setVehicles(vList);
      setHubs(hList);
      setActiveRentalsCount(rList.length);
      setIsSimulating(simStatus?.isRunning ?? true);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Periodic polling for live vehicle positions and telemetry
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const liveVehicles = await api.getLiveTelemetry();
        if (liveVehicles && liveVehicles.length > 0) {
          setVehicles((prev) => {
            const map = new Map(liveVehicles.map((v) => [v.vin, v]));
            return prev.map((v) => {
              const updated = map.get(v.vin);
              return updated ? { ...v, ...updated } : v;
            });
          });

          // Also update currently inspected vehicle if open
          if (selectedVehicle) {
            const updatedInspected = liveVehicles.find((v) => v.vin === selectedVehicle.vin);
            if (updatedInspected) {
              setSelectedVehicle((prev) => (prev ? { ...prev, ...updatedInspected } : null));
            }
          }
        }
      } catch (e) {
        // Silently ignore momentary network glitches
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [selectedVehicle]);

  // When vehicle selected, fetch detailed telemetry history
  const handleSelectVehicle = async (v: Vehicle) => {
    setSelectedVehicle(v);
    try {
      const details = await api.getVehicleDetails(v.vin);
      setDrawerData({
        vehicle: details.vehicle,
        currentHub: details.currentHub,
        telemetryHistory: details.telemetryHistory || [],
      });
    } catch (err) {
      console.error('Failed to load vehicle details:', err);
      setDrawerData({
        vehicle: v,
        currentHub: hubs.find((h) => h.id === v.currentHubId) || null,
        telemetryHistory: [],
      });
    }
  };

  const handleToggleSimulation = async () => {
    const nextState = !isSimulating;
    try {
      await api.toggleSimulation(nextState);
      setIsSimulating(nextState);
    } catch (err) {
      console.error('Failed to toggle simulation:', err);
    }
  };

  const handleTickSimulation = async () => {
    try {
      await api.triggerSimulationTick();
      const liveVehicles = await api.getLiveTelemetry();
      setVehicles((prev) => {
        const map = new Map(liveVehicles.map((v) => [v.vin, v]));
        return prev.map((v) => {
          const updated = map.get(v.vin);
          return updated ? { ...v, ...updated } : v;
        });
      });
    } catch (err) {
      console.error('Failed to tick simulation:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#070707', color: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        isSimulating={isSimulating}
        onToggleSimulation={handleToggleSimulation}
        onTickSimulation={handleTickSimulation}
        vehicleCount={vehicles.length}
        activeRentalsCount={activeRentalsCount}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1360px', width: '100%', margin: '0 auto', padding: '1.25rem 1.5rem' }}>
        {activeTab === 'map' && (
          <FleetMapPage
            vehicles={vehicles}
            hubs={hubs}
            onSelectVehicle={handleSelectVehicle}
            selectedVehicle={selectedVehicle}
          />
        )}

        {activeTab === 'rentals' && (
          <RentalPlannerPage
            hubs={hubs}
            vehicles={vehicles}
            onRefresh={loadInitialData}
          />
        )}

        {activeTab === 'graph' && <Neo4jGraphPage />}

        {activeTab === 'analytics' && <AnalyticsDashboardPage />}
      </main>

      {/* Vehicle Telemetry & Diagnostics Drawer */}
      {selectedVehicle && (
        <VehicleDrawer
          vehicle={drawerData.vehicle || selectedVehicle}
          currentHub={drawerData.currentHub}
          telemetryHistory={drawerData.telemetryHistory}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
}

export default App;
