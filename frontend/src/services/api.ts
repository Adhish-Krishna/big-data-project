import {
  Vehicle,
  TelemetryPoint,
  Hub,
  RoutePlan,
  Rental,
  GraphData,
  AnalyticsData,
  RebalancingItem,
} from '../types';
import {
  MOCK_HUBS,
  mockVehicles,
  mockRentals,
  getMockGraphData,
  getMockHubInventory,
  getMockRebalancing,
  calculateMockRoute,
  getMockAnalytics,
  stepMockSimulation,
  getMockTelemetryHistory,
  rentalProgressMap,
} from './mockData';

const API_BASE = '/api';

// Helper with timeout to quickly fallback to mock if backend server is not running
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 1200): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export const api = {
  async getHealth() {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/health`);
      if (res.ok) return await res.json();
    } catch {
      // Backend offline: simulated mode
    }
    return {
      status: 'OK',
      databases: {
        mongodb: 'SIMULATED (India)',
        neo4j: 'SIMULATED (India)',
      },
    };
  },

  async getVehicles(filter?: { status?: string; type?: string; hubId?: string }): Promise<Vehicle[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.status) params.append('status', filter.status);
      if (filter?.type) params.append('type', filter.type);
      if (filter?.hubId) params.append('hubId', filter.hubId);

      const res = await fetchWithTimeout(`${API_BASE}/fleet?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) return data.data;
      }
    } catch {
      // Fallback
    }

    return mockVehicles.filter((v) => {
      if (filter?.status && filter.status !== 'ALL' && v.status !== filter.status) return false;
      if (filter?.type && filter.type !== 'ALL' && v.type !== filter.type) return false;
      if (filter?.hubId && v.currentHubId !== filter.hubId) return false;
      return true;
    });
  },

  async getVehicleDetails(vin: string): Promise<{
    vehicle: Vehicle;
    currentHub: Hub | null;
    telemetryHistory: TelemetryPoint[];
  }> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/fleet/${vin}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data) return data.data;
      }
    } catch {
      // Fallback
    }

    const vehicle = mockVehicles.find((v) => v.vin === vin) || mockVehicles[0];
    const currentHub = MOCK_HUBS.find((h) => h.id === vehicle.currentHubId) || null;
    const telemetryHistory = getMockTelemetryHistory(vin);

    return { vehicle, currentHub, telemetryHistory };
  },

  async getHubs(): Promise<Hub[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/graph/hubs`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) return data.data;
      }
    } catch {
      // Fallback
    }
    return MOCK_HUBS;
  },

  async calculateRoute(originId: string, destinationId: string): Promise<RoutePlan> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/graph/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originId, destinationId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) return data.data;
      }
    } catch {
      // Fallback
    }
    return calculateMockRoute(originId, destinationId);
  },

  async getNetworkGraph(limit = 40): Promise<GraphData> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/graph/network?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.nodes?.length > 0) {
          const normalizedEdges = (data.data.edges || []).map((e: any) => ({
            id: e.id || `e-${Math.random()}`,
            from: e.from || e.source,
            to: e.to || e.target,
            type: e.type || e.label || 'CONNECTED_TO',
            properties: e.properties || {},
          }));
          return {
            nodes: data.data.nodes,
            edges: normalizedEdges,
          };
        }
      }
    } catch {
      // Fallback
    }
    return getMockGraphData(limit);
  },

  async getHubInventory(): Promise<any[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/graph/inventory`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) return data.data;
      }
    } catch {
      // Fallback
    }
    return getMockHubInventory();
  },

  async getRebalancingRecommendations(): Promise<RebalancingItem[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/graph/rebalance`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) return data.data;
      }
    } catch {
      // Fallback
    }
    return getMockRebalancing();
  },

  async getRentals(status?: string): Promise<Rental[]> {
    try {
      const url = status ? `${API_BASE}/rentals?status=${status}` : `${API_BASE}/rentals`;
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) return data.data;
      }
    } catch {
      // Fallback
    }
    if (status) {
      return mockRentals.filter((r) => r.status === status);
    }
    return mockRentals;
  },

  async createRental(payload: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    vin: string;
    originHubId: string;
    destinationHubId: string;
    durationDays: number;
    insuranceTier: string;
  }): Promise<{ rental: Rental; routePlan: RoutePlan }> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/rentals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) return data.data;
      }
    } catch {
      // Fallback
    }

    const routePlan = calculateMockRoute(payload.originHubId, payload.destinationHubId);
    const vehicle = mockVehicles.find((v) => v.vin === payload.vin);
    const dailyRate = vehicle?.dailyRate || 50;
    const estimatedCost = dailyRate * payload.durationDays + routePlan.totalTollFee;

    const newRental: Rental = {
      _id: `rnt-${Date.now()}`,
      rentalId: `RNT-IND-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: payload.customerId,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      vehicleVin: payload.vin,
      vehicleModel: vehicle ? `${vehicle.make} ${vehicle.model}` : 'SmartFleet Vehicle',
      originHubId: payload.originHubId,
      originHubName: routePlan.origin.name,
      destinationHubId: payload.destinationHubId,
      destinationHubName: routePlan.destination.name,
      startDate: new Date().toISOString(),
      expectedEndDate: new Date(Date.now() + payload.durationDays * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      estimatedDistanceKm: routePlan.totalDistanceKm,
      estimatedDurationMin: routePlan.totalDurationMin,
      routePath: routePlan.path.map((h) => h.id),
      dailyRate,
      estimatedCost,
      insuranceTier: payload.insuranceTier as any,
      createdAt: new Date().toISOString(),
    };

    mockRentals.unshift(newRental);
    rentalProgressMap[newRental.rentalId] = 0.0;
    if (vehicle) {
      vehicle.status = 'ON_RENT';
      vehicle.activeRentalId = newRental.rentalId;
      vehicle.currentHubId = payload.originHubId;
      const originHub = MOCK_HUBS.find((h) => h.id === payload.originHubId);
      const destHub = MOCK_HUBS.find((h) => h.id === payload.destinationHubId);
      if (originHub) {
        vehicle.currentLocation = {
          type: 'Point',
          coordinates: [originHub.longitude, originHub.latitude],
        };
      }
      vehicle.tripProgress = 0;
      vehicle.routeOrigin = originHub?.name;
      vehicle.routeDestination = destHub?.name;
      vehicle.speedKmH = 72;
    }

    return { rental: newRental, routePlan };
  },

  async completeRental(rentalId: string) {
    delete rentalProgressMap[rentalId];
    try {
      const res = await fetchWithTimeout(`${API_BASE}/rentals/${rentalId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalMileageKm: 150 }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }

    const rental = mockRentals.find((r) => r.rentalId === rentalId || r._id === rentalId);
    if (rental) {
      rental.status = 'COMPLETED';
      rental.actualEndDate = new Date().toISOString();
      const vehicle = mockVehicles.find((v) => v.vin === rental.vehicleVin);
      if (vehicle) {
        vehicle.status = 'AVAILABLE';
        vehicle.activeRentalId = null;
        vehicle.currentHubId = rental.destinationHubId;
      }
    }
    return { success: true, data: rental };
  },

  async getLiveTelemetry(): Promise<Vehicle[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/telemetry/live`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) return data.data;
      }
    } catch {
      // Fallback
    }
    return stepMockSimulation();
  },

  async toggleSimulation(enable: boolean) {
    try {
      const action = enable ? 'start' : 'stop';
      await fetchWithTimeout(`${API_BASE}/telemetry/simulate/${action}`, { method: 'POST' });
    } catch {
      // Silently fall back
    }
  },

  async triggerSimulationTick() {
    try {
      await fetchWithTimeout(`${API_BASE}/telemetry/simulate/tick`, { method: 'POST' });
    } catch {
      // Fallback
    }
    return stepMockSimulation();
  },

  async getSimulationStatus() {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/telemetry/simulate/status`);
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch {
      // Fallback
    }
    return { isRunning: true, tickIntervalMs: 3000 };
  },

  async getAnalytics(): Promise<AnalyticsData> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/analytics`);
      if (res.ok) {
        const data = await res.json();
        if (
          data.data &&
          ((data.data.typeMetrics && data.data.typeMetrics.length > 0) ||
           (data.data.rentalRevenue && data.data.rentalRevenue.length > 0))
        ) {
          return data.data;
        }
      }
    } catch {
      // Fallback
    }
    return getMockAnalytics();
  },
};
