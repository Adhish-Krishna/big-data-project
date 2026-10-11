export interface Vehicle {
  _id: string;
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  type: 'SEDAN' | 'SUV' | 'ELECTRIC' | 'VAN' | 'TRUCK';
  status: 'AVAILABLE' | 'ON_RENT' | 'MAINTENANCE' | 'TRANSIT';
  batteryPct: number;
  fuelPct: number;
  odometerKm: number;
  dailyRate: number;
  currentHubId: string;
  currentLocation: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
  speedKmH: number;
  engineTempC: number;
  lastSeen: string;
  activeRentalId?: string | null;
  tripProgress?: number;
  routeOrigin?: string;
  routeDestination?: string;
}

export interface TelemetryPoint {
  _id: string;
  vin: string;
  timestamp: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  speedKmH: number;
  batteryPct: number;
  fuelPct: number;
  engineTempC: number;
  harshBraking: boolean;
  geofenceViolation: boolean;
  alertType?: string | null;
}

export interface Hub {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  capacity: number;
  type: string;
}

export interface RoutePlan {
  origin: Hub;
  destination: Hub;
  path: Hub[];
  totalDistanceKm: number;
  totalDurationMin: number;
  totalTollFee: number;
  segments: {
    from: string;
    to: string;
    distanceKm: number;
    durationMinutes: number;
    tollFee: number;
  }[];
}

export interface Rental {
  _id: string;
  rentalId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleVin: string;
  vehicleModel: string;
  originHubId: string;
  originHubName: string;
  destinationHubId: string;
  destinationHubName: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
  routePath: string[];
  dailyRate: number;
  estimatedCost: number;
  finalCost?: number;
  insuranceTier: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  createdAt: string;
}

export interface GraphData {
  nodes: {
    id: string;
    label: string;
    type: 'Hub' | 'Vehicle' | 'Customer' | 'Technician';
    properties: Record<string, any>;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    label: string;
    properties?: Record<string, any>;
  }[];
}

export interface AnalyticsData {
  statusCounts: { _id: string; count: number }[];
  typeMetrics: {
    _id: string;
    avgBattery: number;
    avgFuel: number;
    totalVehicles: number;
    avgMileage: number;
  }[];
  alertMetrics: {
    _id: { harshBraking: boolean; geofenceViolation: boolean };
    count: number;
  }[];
  rentalRevenue: {
    _id: string;
    totalRevenue: number;
    totalDistanceKm: number;
    count: number;
  }[];
  hubStats: {
    hubId: string;
    hubName: string;
    city: string;
    capacity: number;
    availableCount: number;
    occupancyPct: number;
    status: 'OPTIMAL' | 'SURPLUS' | 'DEFICIT';
  }[];
  recentAlerts: TelemetryPoint[];
}

export interface RebalancingItem {
  fromHubId: string;
  fromHubName: string;
  toHubId: string;
  toHubName: string;
  recommendedVehicles: number;
  distanceKm: number;
  reason: string;
}
