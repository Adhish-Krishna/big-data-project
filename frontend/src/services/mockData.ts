import {
  Vehicle,
  Hub,
  RoutePlan,
  Rental,
  GraphData,
  AnalyticsData,
  RebalancingItem,
  TelemetryPoint,
} from '../types';

// ── 10 Transportation Hubs Across India (Including Coimbatore) ──────────────
export const MOCK_HUBS: Hub[] = [
  {
    id: 'hub-cbe-central',
    name: 'Coimbatore Tidel Park & Tech Hub',
    city: 'Coimbatore',
    latitude: 11.0168,
    longitude: 76.9558,
    capacity: 32,
    type: 'CENTRAL',
  },
  {
    id: 'hub-mum-central',
    name: 'Mumbai Central Fleet Depot',
    city: 'Mumbai',
    latitude: 18.9696,
    longitude: 72.8194,
    capacity: 35,
    type: 'CENTRAL',
  },
  {
    id: 'hub-mum-bkc',
    name: 'Bandra Kurla Complex Hub',
    city: 'Mumbai',
    latitude: 19.0657,
    longitude: 72.8687,
    capacity: 30,
    type: 'SUBURB',
  },
  {
    id: 'hub-pune-depot',
    name: 'Pune Expressway Terminal',
    city: 'Pune',
    latitude: 18.5204,
    longitude: 73.8567,
    capacity: 25,
    type: 'CENTRAL',
  },
  {
    id: 'hub-blr-electronic',
    name: 'Bengaluru Electronic City Hub',
    city: 'Bengaluru',
    latitude: 12.8452,
    longitude: 77.6602,
    capacity: 40,
    type: 'CENTRAL',
  },
  {
    id: 'hub-blr-airport',
    name: "Kempegowda Int'l Airport Hub",
    city: 'Bengaluru',
    latitude: 13.1986,
    longitude: 77.7066,
    capacity: 50,
    type: 'AIRPORT',
  },
  {
    id: 'hub-del-connaught',
    name: 'Delhi Connaught Place Hub',
    city: 'New Delhi',
    latitude: 28.6315,
    longitude: 77.2167,
    capacity: 35,
    type: 'CENTRAL',
  },
  {
    id: 'hub-del-igi',
    name: 'IGI Airport Terminal 3 Hub',
    city: 'New Delhi',
    latitude: 28.5562,
    longitude: 77.1000,
    capacity: 45,
    type: 'AIRPORT',
  },
  {
    id: 'hub-hyd-hitech',
    name: 'Hyderabad HITEC City Station',
    city: 'Hyderabad',
    latitude: 17.4474,
    longitude: 78.3762,
    capacity: 30,
    type: 'SUBURB',
  },
  {
    id: 'hub-chn-port',
    name: 'Chennai Port Logistics Depot',
    city: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707,
    capacity: 28,
    type: 'PORT',
  },
];

// ── Indian Road Network Connections (Neo4j Graph) ──────────────────────────
export const MOCK_CONNECTIONS = [
  { from: 'hub-cbe-central', to: 'hub-blr-electronic', distanceKm: 362.0, durationMinutes: 340, tollFee: 6.00 }, // NH544 / NH44
  { from: 'hub-cbe-central', to: 'hub-chn-port', distanceKm: 505.0, durationMinutes: 460, tollFee: 9.50 }, // NH544 / NH48
  { from: 'hub-mum-central', to: 'hub-mum-bkc', distanceKm: 14.5, durationMinutes: 28, tollFee: 0 },
  { from: 'hub-mum-bkc', to: 'hub-pune-depot', distanceKm: 148.0, durationMinutes: 130, tollFee: 5.50 }, // Mumbai-Pune Expressway
  { from: 'hub-mum-central', to: 'hub-pune-depot', distanceKm: 152.0, durationMinutes: 140, tollFee: 5.50 },
  { from: 'hub-blr-electronic', to: 'hub-blr-airport', distanceKm: 52.0, durationMinutes: 58, tollFee: 2.00 }, // Airport Tollway
  { from: 'hub-blr-electronic', to: 'hub-chn-port', distanceKm: 345.0, durationMinutes: 330, tollFee: 7.20 }, // NH48
  { from: 'hub-blr-airport', to: 'hub-hyd-hitech', distanceKm: 540.0, durationMinutes: 470, tollFee: 11.50 }, // NH44
  { from: 'hub-del-connaught', to: 'hub-del-igi', distanceKm: 16.2, durationMinutes: 30, tollFee: 0 },
  { from: 'hub-mum-bkc', to: 'hub-hyd-hitech', distanceKm: 710.0, durationMinutes: 620, tollFee: 14.00 }, // NH65
];

// ── Realistic Indian Fleet Vehicles (Including Coimbatore) ───────────────────
export let mockVehicles: Vehicle[] = [
  // Coimbatore Fleet
  {
    _id: 'veh-cbe-001',
    vin: 'IND-CBE-EV-7001',
    licensePlate: 'TN-38-EV-4410',
    make: 'Tata',
    model: 'Nexon EV Empowered',
    year: 2024,
    type: 'ELECTRIC',
    status: 'AVAILABLE',
    batteryPct: 96,
    fuelPct: 0,
    odometerKm: 9800,
    dailyRate: 46,
    currentHubId: 'hub-cbe-central',
    currentLocation: {
      type: 'Point',
      coordinates: [76.9565, 11.0175], // Coimbatore
    },
    speedKmH: 0,
    engineTempC: 35,
    lastSeen: new Date().toISOString(),
  },
  {
    _id: 'veh-cbe-002',
    vin: 'IND-CBE-SUV-7002',
    licensePlate: 'TN-37-CD-9901',
    make: 'Mahindra',
    model: 'Scorpio-N 4xplor',
    year: 2024,
    type: 'SUV',
    status: 'AVAILABLE',
    batteryPct: 0,
    fuelPct: 88,
    odometerKm: 14200,
    dailyRate: 54,
    currentHubId: 'hub-cbe-central',
    currentLocation: {
      type: 'Point',
      coordinates: [76.9580, 11.0185], // Coimbatore
    },
    speedKmH: 0,
    engineTempC: 38,
    lastSeen: new Date().toISOString(),
  },
  {
    _id: 'veh-cbe-003',
    vin: 'IND-CBE-SED-7003',
    licensePlate: 'TN-38-EV-8822',
    make: 'MG',
    model: 'Windsor EV Exclusive',
    year: 2024,
    type: 'ELECTRIC',
    status: 'ON_RENT',
    batteryPct: 78,
    fuelPct: 0,
    odometerKm: 11300,
    dailyRate: 44,
    currentHubId: 'hub-cbe-central',
    currentLocation: {
      type: 'Point',
      coordinates: [77.1000, 11.0800], // Coimbatore - Salem Highway
    },
    speedKmH: 76,
    engineTempC: 40,
    lastSeen: new Date().toISOString(),
    activeRentalId: 'RNT-IND-8825',
  },

  // Other India Fleet
  {
    _id: 'veh-001',
    vin: 'IND-MUM-EV-1001',
    licensePlate: 'MH-01-EV-1024',
    make: 'Tata',
    model: 'Nexon EV Max',
    year: 2024,
    type: 'ELECTRIC',
    status: 'AVAILABLE',
    batteryPct: 94,
    fuelPct: 0,
    odometerKm: 18450,
    dailyRate: 45,
    currentHubId: 'hub-mum-central',
    currentLocation: {
      type: 'Point',
      coordinates: [72.8220, 18.9710],
    },
    speedKmH: 0,
    engineTempC: 38,
    lastSeen: new Date().toISOString(),
  },
  {
    _id: 'veh-002',
    vin: 'IND-MUM-SUV-1002',
    licensePlate: 'MH-12-AB-4491',
    make: 'Mahindra',
    model: 'XUV700 AX7',
    year: 2024,
    type: 'SUV',
    status: 'ON_RENT',
    batteryPct: 0,
    fuelPct: 76,
    odometerKm: 29800,
    dailyRate: 58,
    currentHubId: 'hub-mum-bkc',
    currentLocation: {
      type: 'Point',
      coordinates: [73.2000, 18.7500],
    },
    speedKmH: 84,
    engineTempC: 92,
    lastSeen: new Date().toISOString(),
    activeRentalId: 'RNT-IND-8821',
  },
  {
    _id: 'veh-003',
    vin: 'IND-BLR-EV-2001',
    licensePlate: 'KA-01-EV-8821',
    make: 'MG',
    model: 'ZS EV Long Range',
    year: 2024,
    type: 'ELECTRIC',
    status: 'AVAILABLE',
    batteryPct: 88,
    fuelPct: 0,
    odometerKm: 14200,
    dailyRate: 52,
    currentHubId: 'hub-blr-electronic',
    currentLocation: {
      type: 'Point',
      coordinates: [77.6620, 12.8465],
    },
    speedKmH: 0,
    engineTempC: 36,
    lastSeen: new Date().toISOString(),
  },
  {
    _id: 'veh-004',
    vin: 'IND-BLR-EV-2002',
    licensePlate: 'KA-04-EV-9900',
    make: 'Hyundai',
    model: 'Ioniq 5 AWD',
    year: 2024,
    type: 'ELECTRIC',
    status: 'AVAILABLE',
    batteryPct: 96,
    fuelPct: 0,
    odometerKm: 8900,
    dailyRate: 78,
    currentHubId: 'hub-blr-airport',
    currentLocation: {
      type: 'Point',
      coordinates: [77.7080, 13.1995],
    },
    speedKmH: 0,
    engineTempC: 34,
    lastSeen: new Date().toISOString(),
  },
  {
    _id: 'veh-005',
    vin: 'IND-DEL-EV-3001',
    licensePlate: 'DL-1C-EV-3310',
    make: 'Tata',
    model: 'Tiago EV Tech',
    year: 2023,
    type: 'ELECTRIC',
    status: 'AVAILABLE',
    batteryPct: 82,
    fuelPct: 0,
    odometerKm: 22100,
    dailyRate: 34,
    currentHubId: 'hub-del-connaught',
    currentLocation: {
      type: 'Point',
      coordinates: [77.2180, 28.6325],
    },
    speedKmH: 0,
    engineTempC: 37,
    lastSeen: new Date().toISOString(),
  },
  {
    _id: 'veh-006',
    vin: 'IND-DEL-VAN-3002',
    licensePlate: 'DL-3C-TR-7721',
    make: 'Toyota',
    model: 'Innova HyCross Hybrid',
    year: 2024,
    type: 'VAN',
    status: 'ON_RENT',
    batteryPct: 65,
    fuelPct: 80,
    odometerKm: 34500,
    dailyRate: 68,
    currentHubId: 'hub-del-igi',
    currentLocation: {
      type: 'Point',
      coordinates: [77.1400, 28.5800],
    },
    speedKmH: 72,
    engineTempC: 88,
    lastSeen: new Date().toISOString(),
    activeRentalId: 'RNT-IND-8822',
  },
  {
    _id: 'veh-007',
    vin: 'IND-HYD-SUV-4001',
    licensePlate: 'TS-09-UB-5512',
    make: 'Mahindra',
    model: 'Scorpio-N Z8L',
    year: 2024,
    type: 'SUV',
    status: 'AVAILABLE',
    batteryPct: 0,
    fuelPct: 91,
    odometerKm: 16700,
    dailyRate: 55,
    currentHubId: 'hub-hyd-hitech',
    currentLocation: {
      type: 'Point',
      coordinates: [78.3780, 17.4485],
    },
    speedKmH: 0,
    engineTempC: 40,
    lastSeen: new Date().toISOString(),
  },
  {
    _id: 'veh-008',
    vin: 'IND-CHN-TRK-5001',
    licensePlate: 'TN-01-TR-9012',
    make: 'Ashok Leyland',
    model: 'Boss 1415 Heavy Cargo',
    year: 2023,
    type: 'TRUCK',
    status: 'ON_RENT',
    batteryPct: 0,
    fuelPct: 62,
    odometerKm: 58200,
    dailyRate: 95,
    currentHubId: 'hub-chn-port',
    currentLocation: {
      type: 'Point',
      coordinates: [80.1800, 13.0400],
    },
    speedKmH: 64,
    engineTempC: 96,
    lastSeen: new Date().toISOString(),
    activeRentalId: 'RNT-IND-8823',
  },
  {
    _id: 'veh-009',
    vin: 'IND-MUM-TRK-1003',
    licensePlate: 'MH-02-EV-6119',
    make: 'Tata',
    model: 'Ace EV Urban Carrier',
    year: 2024,
    type: 'ELECTRIC',
    status: 'AVAILABLE',
    batteryPct: 86,
    fuelPct: 0,
    odometerKm: 11400,
    dailyRate: 38,
    currentHubId: 'hub-mum-bkc',
    currentLocation: {
      type: 'Point',
      coordinates: [72.8700, 19.0670],
    },
    speedKmH: 0,
    engineTempC: 35,
    lastSeen: new Date().toISOString(),
  },
  {
    _id: 'veh-010',
    vin: 'IND-BLR-EV-2003',
    licensePlate: 'KA-05-EV-4412',
    make: 'BYD',
    model: 'Atto 3 Superior',
    year: 2024,
    type: 'ELECTRIC',
    status: 'ON_RENT',
    batteryPct: 73,
    fuelPct: 0,
    odometerKm: 19800,
    dailyRate: 64,
    currentHubId: 'hub-blr-electronic',
    currentLocation: {
      type: 'Point',
      coordinates: [77.6800, 13.0100],
    },
    speedKmH: 58,
    engineTempC: 41,
    lastSeen: new Date().toISOString(),
    activeRentalId: 'RNT-IND-8824',
  },
  {
    _id: 'veh-011',
    vin: 'IND-PUN-SUV-6001',
    licensePlate: 'MH-14-GH-2219',
    make: 'Maruti Suzuki',
    model: 'Grand Vitara Strong Hybrid',
    year: 2024,
    type: 'SUV',
    status: 'AVAILABLE',
    batteryPct: 78,
    fuelPct: 85,
    odometerKm: 15300,
    dailyRate: 48,
    currentHubId: 'hub-pune-depot',
    currentLocation: {
      type: 'Point',
      coordinates: [73.8580, 18.5220],
    },
    speedKmH: 0,
    engineTempC: 39,
    lastSeen: new Date().toISOString(),
  },
  {
    _id: 'veh-012',
    vin: 'IND-DEL-SUV-3003',
    licensePlate: 'DL-8C-AB-9912',
    make: 'Tata',
    model: 'Harrier Dark Edition',
    year: 2023,
    type: 'SUV',
    status: 'MAINTENANCE',
    batteryPct: 0,
    fuelPct: 44,
    odometerKm: 42100,
    dailyRate: 56,
    currentHubId: 'hub-del-igi',
    currentLocation: {
      type: 'Point',
      coordinates: [77.0980, 28.5540],
    },
    speedKmH: 0,
    engineTempC: 45,
    lastSeen: new Date().toISOString(),
  },
];

// ── Initial Active Rentals (Including Coimbatore) ───────────────────────────
export let mockRentals: Rental[] = [
  {
    _id: 'rnt-cbe-1',
    rentalId: 'RNT-IND-8825',
    customerId: 'CUST-804',
    customerName: 'Kavitha Natarajan',
    customerPhone: '+91-98422-77889',
    vehicleVin: 'IND-CBE-SED-7003',
    vehicleModel: 'MG Windsor EV Exclusive',
    originHubId: 'hub-cbe-central',
    originHubName: 'Coimbatore Tidel Park & Tech Hub',
    destinationHubId: 'hub-blr-electronic',
    destinationHubName: 'Bengaluru Electronic City Hub',
    startDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    expectedEndDate: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
    status: 'ACTIVE',
    estimatedDistanceKm: 362,
    estimatedDurationMin: 340,
    routePath: ['hub-cbe-central', 'hub-blr-electronic'],
    dailyRate: 44,
    estimatedCost: 94.00,
    insuranceTier: 'PREMIUM',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    _id: 'rnt-1',
    rentalId: 'RNT-IND-8821',
    customerId: 'CUST-801',
    customerName: 'Aarav Mehta',
    customerPhone: '+91-98201-98765',
    vehicleVin: 'IND-MUM-SUV-1002',
    vehicleModel: 'Mahindra XUV700 AX7',
    originHubId: 'hub-mum-bkc',
    originHubName: 'Bandra Kurla Complex Hub',
    destinationHubId: 'hub-pune-depot',
    destinationHubName: 'Pune Expressway Terminal',
    startDate: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    expectedEndDate: new Date(Date.now() + 45 * 3600 * 1000).toISOString(),
    status: 'ACTIVE',
    estimatedDistanceKm: 148,
    estimatedDurationMin: 130,
    routePath: ['hub-mum-bkc', 'hub-pune-depot'],
    dailyRate: 58,
    estimatedCost: 121.50,
    insuranceTier: 'PREMIUM',
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    _id: 'rnt-2',
    rentalId: 'RNT-IND-8822',
    customerId: 'CUST-802',
    customerName: 'Pooja Sharma',
    customerPhone: '+91-98112-34567',
    vehicleVin: 'IND-DEL-VAN-3002',
    vehicleModel: 'Toyota Innova HyCross Hybrid',
    originHubId: 'hub-del-connaught',
    originHubName: 'Delhi Connaught Place Hub',
    destinationHubId: 'hub-del-igi',
    destinationHubName: 'IGI Airport Terminal 3 Hub',
    startDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    expectedEndDate: new Date(Date.now() + 22 * 3600 * 1000).toISOString(),
    status: 'ACTIVE',
    estimatedDistanceKm: 16.2,
    estimatedDurationMin: 30,
    routePath: ['hub-del-connaught', 'hub-del-igi'],
    dailyRate: 68,
    estimatedCost: 68,
    insuranceTier: 'BASIC',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    _id: 'rnt-3',
    rentalId: 'RNT-IND-8823',
    customerId: 'CUST-803',
    customerName: 'Rajesh Subramanian',
    customerPhone: '+91-94440-12345',
    vehicleVin: 'IND-CHN-TRK-5001',
    vehicleModel: 'Ashok Leyland Boss 1415 Heavy Cargo',
    originHubId: 'hub-chn-port',
    originHubName: 'Chennai Port Logistics Depot',
    destinationHubId: 'hub-blr-electronic',
    destinationHubName: 'Bengaluru Electronic City Hub',
    startDate: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    expectedEndDate: new Date(Date.now() + 42 * 3600 * 1000).toISOString(),
    status: 'ACTIVE',
    estimatedDistanceKm: 345,
    estimatedDurationMin: 330,
    routePath: ['hub-chn-port', 'hub-blr-electronic'],
    dailyRate: 95,
    estimatedCost: 197.20,
    insuranceTier: 'ENTERPRISE',
    createdAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
  },
];

// ── Graph Nodes & Edges Generator (Neo4j) ───────────────────────────────────
export function getMockGraphData(limit = 50): GraphData {
  const nodes: GraphData['nodes'] = [];
  const edges: GraphData['edges'] = [];

  // 1. Hub Nodes
  MOCK_HUBS.forEach((hub) => {
    nodes.push({
      id: hub.id,
      label: hub.name,
      type: 'Hub',
      properties: {
        city: hub.city,
        capacity: hub.capacity,
        type: hub.type,
        coordinates: `[${hub.latitude}, ${hub.longitude}]`,
      },
    });
  });

  // 2. Hub-to-Hub Road Connections
  MOCK_CONNECTIONS.forEach((c) => {
    edges.push({
      id: `edge-${c.from}-${c.to}`,
      from: c.from,
      to: c.to,
      type: 'CONNECTED_TO',
      properties: {
        distanceKm: c.distanceKm,
        durationMin: c.durationMinutes,
        tollFee: `$${c.tollFee}`,
      },
    });
  });

  // 3. Vehicle Nodes & [:CURRENTLY_AT] Edges
  mockVehicles.slice(0, 15).forEach((v) => {
    nodes.push({
      id: v.vin,
      label: `${v.make} ${v.model}`,
      type: 'Vehicle',
      properties: {
        plate: v.licensePlate,
        type: v.type,
        status: v.status,
        rate: `$${v.dailyRate}/day`,
        battery: `${v.batteryPct}%`,
        speed: `${v.speedKmH} km/h`,
      },
    });

    if (v.currentHubId) {
      edges.push({
        id: `at-${v.vin}-${v.currentHubId}`,
        from: v.vin,
        to: v.currentHubId,
        type: 'CURRENTLY_AT',
        properties: { status: v.status },
      });
    }
  });

  // 4. Customer Nodes & [:RENTED] Edges
  mockRentals.forEach((r) => {
    nodes.push({
      id: r.customerId,
      label: r.customerName,
      type: 'Customer',
      properties: {
        phone: r.customerPhone,
        activeRental: r.rentalId,
        insurance: r.insuranceTier,
      },
    });

    edges.push({
      id: `rent-${r.customerId}-${r.vehicleVin}`,
      from: r.customerId,
      to: r.vehicleVin,
      type: 'RENTED',
      properties: {
        rentalId: r.rentalId,
        cost: `$${r.estimatedCost}`,
      },
    });
  });

  return { nodes: nodes.slice(0, limit), edges };
}

// ── Hub Station Inventory (Neo4j Aggregations) ──────────────────────────────
export function getMockHubInventory() {
  return MOCK_HUBS.map((hub) => {
    const atHub = mockVehicles.filter((v) => v.currentHubId === hub.id);
    const available = atHub.filter((v) => v.status === 'AVAILABLE').length;
    const occupancy = atHub.length;
    const occupancyPct = Math.round((occupancy / hub.capacity) * 100);
    const status =
      occupancyPct < 25 ? 'DEFICIT' : occupancyPct > 80 ? 'SURPLUS' : 'BALANCED';

    return {
      hubId: hub.id,
      name: hub.name,
      city: hub.city,
      capacity: hub.capacity,
      occupancy,
      availableCount: available,
      occupancyPct,
      status,
    };
  });
}

// ── Fleet Rebalancing Engine Recommendations ────────────────────────────────
export function getMockRebalancing(): RebalancingItem[] {
  return [
    {
      recommendationId: 'REBAL-CBE-BLR-01',
      sourceHub: {
        id: 'hub-cbe-central',
        name: 'Coimbatore Tidel Park & Tech Hub',
        city: 'Coimbatore',
        surplus: 5,
      },
      targetHub: {
        id: 'hub-blr-electronic',
        name: 'Bengaluru Electronic City Hub',
        city: 'Bengaluru',
        deficit: 4,
      },
      recommendedTransfers: 2,
      vehicleType: 'ELECTRIC',
      suggestedRoute: {
        distanceKm: 362,
        durationMinutes: 340,
        tollFee: 6.00,
      },
      priority: 'HIGH',
      rationale: 'High weekend rental return flow in Coimbatore. Electronic City hub requires additional electric fleet.',
    },
    {
      recommendationId: 'REBAL-MUM-PUN-02',
      sourceHub: {
        id: 'hub-mum-central',
        name: 'Mumbai Central Fleet Depot',
        city: 'Mumbai',
        surplus: 8,
      },
      targetHub: {
        id: 'hub-pune-depot',
        name: 'Pune Expressway Terminal',
        city: 'Pune',
        deficit: 5,
      },
      recommendedTransfers: 3,
      vehicleType: 'SUV',
      suggestedRoute: {
        distanceKm: 148,
        durationMinutes: 130,
        tollFee: 5.50,
      },
      priority: 'MEDIUM',
      rationale: 'Weekend leisure rentals spike towards Lonavala and Pune. Rebalance SUVs.',
    },
  ];
}

// ── Pathfinding / Shortest Route Calculation (Neo4j Cypher shortestPath) ─────
export function calculateMockRoute(originId: string, destId: string): RoutePlan {
  const origin = MOCK_HUBS.find((h) => h.id === originId) || MOCK_HUBS[0];
  const destination = MOCK_HUBS.find((h) => h.id === destId) || MOCK_HUBS[1];

  // Direct connection check
  const direct = MOCK_CONNECTIONS.find(
    (c) => (c.from === originId && c.to === destId) || (c.from === destId && c.to === originId)
  );

  if (direct) {
    return {
      origin,
      destination,
      path: [origin, destination],
      totalDistanceKm: direct.distanceKm,
      totalDurationMin: direct.durationMinutes,
      totalTollFee: direct.tollFee,
      segments: [
        {
          from: origin.name,
          to: destination.name,
          distanceKm: direct.distanceKm,
          durationMinutes: direct.durationMinutes,
          tollFee: direct.tollFee,
        },
      ],
    };
  }

  // Multi-hop routing fallback calculation based on geodesic distance
  const dLat = destination.latitude - origin.latitude;
  const dLng = destination.longitude - origin.longitude;
  const approxDistance = Math.max(35, Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 111));
  const approxDuration = Math.round((approxDistance / 60) * 60);
  const approxTolls = Math.round((approxDistance / 80) * 3.5);

  return {
    origin,
    destination,
    path: [origin, destination],
    totalDistanceKm: approxDistance,
    totalDurationMin: approxDuration,
    totalTollFee: approxTolls,
    segments: [
      {
        from: origin.name,
        to: destination.name,
        distanceKm: approxDistance,
        durationMinutes: approxDuration,
        tollFee: approxTolls,
      },
    ],
  };
}

// ── Big Data MongoDB IoT Aggregation Analytics ──────────────────────────────
export function getMockAnalytics(): AnalyticsData {
  return {
    typeMetrics: [
      {
        _id: 'ELECTRIC',
        count: 7,
        avgBattery: 88.5,
        avgFuel: 0,
        avgMileage: 14890,
        avgDailyRate: 51.5,
      },
      {
        _id: 'SUV',
        count: 5,
        avgBattery: 15.6,
        avgFuel: 76.5,
        avgMileage: 24200,
        avgDailyRate: 53.8,
      },
      {
        _id: 'VAN',
        count: 1,
        avgBattery: 65.0,
        avgFuel: 80.0,
        avgMileage: 34500,
        avgDailyRate: 68.0,
      },
      {
        _id: 'TRUCK',
        count: 2,
        avgBattery: 43.0,
        avgFuel: 31.0,
        avgMileage: 34800,
        avgDailyRate: 66.5,
      },
    ],
    rentalRevenue: [
      { _id: 'ELECTRIC', totalRevenue: 22450, totalDistanceKm: 17800, count: 34 },
      { _id: 'SUV',      totalRevenue: 21800, totalDistanceKm: 18200, count: 35 },
      { _id: 'VAN',      totalRevenue: 6420,  totalDistanceKm: 5400,  count: 9  },
      { _id: 'TRUCK',    totalRevenue: 8900,  totalDistanceKm: 6100,  count: 11 },
    ],
    anomalies: [
      {
        _id: 'anom-cbe-1',
        vin: 'IND-CBE-SED-7003',
        timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        location: { type: 'Point', coordinates: [77.1000, 11.0800] },
        speedKmH: 98,
        batteryPct: 78,
        fuelPct: 0,
        engineTempC: 44,
        harshBraking: true,
        geofenceViolation: false,
        alertType: 'HARSH_BRAKE_COIMBATORE_BYPASS',
      },
      {
        _id: 'anom-1',
        vin: 'IND-MUM-SUV-1002',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        location: { type: 'Point', coordinates: [73.2000, 18.7500] },
        speedKmH: 104,
        batteryPct: 0,
        fuelPct: 76,
        engineTempC: 98,
        harshBraking: true,
        geofenceViolation: false,
        alertType: 'HARSH_BRAKE_MUMBAI_PUNE_EXP',
      },
      {
        _id: 'anom-2',
        vin: 'IND-CHN-TRK-5001',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        location: { type: 'Point', coordinates: [80.1800, 13.0400] },
        speedKmH: 74,
        batteryPct: 0,
        fuelPct: 62,
        engineTempC: 106,
        harshBraking: false,
        geofenceViolation: true,
        alertType: 'GEOFENCE_EXIT_CHENNAI_PORT',
      },
    ],
  };
}

// ── Rental Progress Tracker (0.0 = at origin hub, 1.0 = arrived at dest hub) ──
export const rentalProgressMap: Record<string, number> = {
  'RNT-IND-8821': 0.50,
  'RNT-IND-8822': 0.35,
  'RNT-IND-8823': 0.65,
};

// ── Single Simulation Step Tick (Moves Vehicles Along Real Indian Routes) ──
export function stepMockSimulation() {
  mockVehicles = mockVehicles.map((v) => {
    if (v.status === 'ON_RENT') {
      const rental = mockRentals.find(
        (r) => r.rentalId === v.activeRentalId || r.vehicleVin === v.vin
      );
      const originHub = MOCK_HUBS.find((h) => h.id === rental?.originHubId);
      const destHub = MOCK_HUBS.find((h) => h.id === rental?.destinationHubId);

      let curLng = v.currentLocation.coordinates[0];
      let curLat = v.currentLocation.coordinates[1];
      let newSpeed = Math.floor(68 + Math.random() * 22);
      let tripProg = v.tripProgress || 0;

      if (originHub && destHub && originHub.id !== destHub.id) {
        const rentalKey = rental?.rentalId || v.vin;
        let progress = rentalProgressMap[rentalKey] ?? (v.tripProgress ? v.tripProgress / 100 : 0.05);

        // Advance 2% along highway route on each tick (~40-50 ticks for full journey)
        progress += 0.02;

        if (progress >= 1.0) {
          // Trip Complete! Arrived at destination hub
          progress = 1.0;
          curLng = destHub.longitude;
          curLat = destHub.latitude;
          tripProg = 100;
          newSpeed = 0;
          rentalProgressMap[rentalKey] = 1.0;

          return {
            ...v,
            status: 'AVAILABLE',
            currentHubId: destHub.id,
            activeRentalId: null,
            tripProgress: 100,
            routeOrigin: originHub.name,
            routeDestination: destHub.name,
            currentLocation: {
              type: 'Point',
              coordinates: [Number(curLng.toFixed(5)), Number(curLat.toFixed(5))],
            },
            speedKmH: 0,
            odometerKm: v.odometerKm + 5,
            lastSeen: new Date().toISOString(),
          };
        } else {
          // Interpolate GPS along highway route trajectory with subtle natural curve
          const bend = Math.sin(progress * Math.PI) * 0.035;
          const curveDir = destHub.latitude > originHub.latitude ? 1 : -1;
          curLng = originHub.longitude + (destHub.longitude - originHub.longitude) * progress + bend * curveDir;
          curLat = originHub.latitude + (destHub.latitude - originHub.latitude) * progress + bend * 0.4;
          tripProg = Math.round(progress * 100);
          rentalProgressMap[rentalKey] = progress;
        }
      } else {
        curLng += (Math.random() - 0.48) * 0.003;
        curLat += (Math.random() - 0.48) * 0.003;
      }

      const newBattery = v.type === 'ELECTRIC' ? Math.max(12, Math.round(v.batteryPct - 0.25)) : 0;
      const newFuel = v.type !== 'ELECTRIC' ? Math.max(10, Math.round(v.fuelPct - 0.2)) : 0;
      const newTemp = Math.floor(84 + Math.random() * 10);

      return {
        ...v,
        tripProgress: tripProg,
        routeOrigin: originHub?.name || v.routeOrigin,
        routeDestination: destHub?.name || v.routeDestination,
        currentLocation: {
          type: 'Point',
          coordinates: [Number(curLng.toFixed(5)), Number(curLat.toFixed(5))],
        },
        speedKmH: newSpeed,
        batteryPct: newBattery,
        fuelPct: newFuel,
        engineTempC: newTemp,
        odometerKm: v.odometerKm + 2,
        lastSeen: new Date().toISOString(),
      };
    }
    return v;
  });
  return mockVehicles;
}

// ── Telemetry History Generator For Any Vehicle ─────────────────────────────
export function getMockTelemetryHistory(vin: string): TelemetryPoint[] {
  const v = mockVehicles.find((m) => m.vin === vin);
  const pts: TelemetryPoint[] = [];
  const baseLng = v?.currentLocation.coordinates[0] || 76.9565;
  const baseLat = v?.currentLocation.coordinates[1] || 11.0175;
  const baseSpeed = v?.speedKmH || 65;
  const baseBattery = v?.batteryPct || 85;

  for (let i = 15; i >= 0; i--) {
    pts.push({
      _id: `pt-${vin}-${i}`,
      vin,
      timestamp: new Date(Date.now() - i * 45 * 1000).toISOString(),
      location: {
        type: 'Point',
        coordinates: [
          Number((baseLng - i * 0.0012).toFixed(5)),
          Number((baseLat - i * 0.0010).toFixed(5)),
        ],
      },
      speedKmH: Math.max(0, Math.floor(baseSpeed + (Math.random() - 0.5) * 18)),
      batteryPct: Math.max(10, Math.floor(baseBattery + (15 - i) * 0.2)),
      fuelPct: v?.fuelPct || 80,
      engineTempC: Math.floor(84 + Math.random() * 12),
      harshBraking: i === 3,
      geofenceViolation: false,
    });
  }

  return pts;
}
