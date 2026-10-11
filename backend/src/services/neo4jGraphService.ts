import { runCypher } from '../config/database';
import {
  HubNode,
  GraphVisualNode,
  GraphVisualEdge,
  RoutePathResult,
  HubInventoryStats,
  RebalancingRecommendation,
} from '../models/neo4j.types';

export class Neo4jGraphService {
  /**
   * Fetch all Hub nodes
   */
  async getAllHubs(): Promise<HubNode[]> {
    const query = `
      MATCH (h:Hub)
      RETURN h.id AS id, h.name AS name, h.city AS city,
             h.latitude AS latitude, h.longitude AS longitude,
             h.capacity AS capacity, h.type AS type
      ORDER BY h.name ASC
    `;
    return runCypher<HubNode>(query);
  }

  /**
   * Get full network graph (Hubs, Vehicles, Customers, Connections) for the visual explorer
   */
  async getFullNetworkGraph(limitVehicles = 30): Promise<{
    nodes: GraphVisualNode[];
    edges: GraphVisualEdge[];
  }> {
    // 1. Hubs
    const hubRows = await runCypher<any>(`
      MATCH (h:Hub)
      RETURN h.id AS id, h.name AS name, h.city AS city,
             h.latitude AS lat, h.longitude AS lng,
             h.capacity AS capacity, h.type AS type
    `);

    // 2. Hub-to-Hub connections
    const edgeRows = await runCypher<any>(`
      MATCH (h1:Hub)-[r:CONNECTED_TO]->(h2:Hub)
      RETURN h1.id AS source, h2.id AS target,
             r.distanceKm AS distanceKm, r.durationMinutes AS durationMinutes,
             r.tollFee AS tollFee
    `);

    // 3. Vehicles and their Hubs
    const vehicleRows = await runCypher<any>(`
      MATCH (v:Vehicle)
      OPTIONAL MATCH (v)-[:CURRENTLY_AT]->(h:Hub)
      RETURN v.vin AS vin, v.licensePlate AS licensePlate,
             v.type AS type, v.status AS status, h.id AS hubId
      LIMIT toInteger($limit)
    `, { limit: limitVehicles });

    // 4. Customers and recent active rentals
    const rentalRows = await runCypher<any>(`
      MATCH (c:Customer)-[r:RENTED]->(v:Vehicle)
      RETURN c.id AS customerId, c.name AS customerName, c.riskScore AS riskScore,
             v.vin AS vin, r.rentalId AS rentalId, r.status AS rentalStatus
      LIMIT 20
    `);

    const nodes: GraphVisualNode[] = [];
    const edges: GraphVisualEdge[] = [];
    const seenNodes = new Set<string>();

    hubRows.forEach((h) => {
      seenNodes.add(h.id);
      nodes.push({
        id: h.id,
        label: h.name,
        type: 'Hub',
        properties: h,
      });
    });

    edgeRows.forEach((e, idx) => {
      edges.push({
        id: `e-hub-${idx}`,
        source: e.source,
        target: e.target,
        label: 'CONNECTED_TO',
        properties: {
          distanceKm: e.distanceKm,
          durationMinutes: e.durationMinutes,
          tollFee: e.tollFee,
        },
      });
    });

    vehicleRows.forEach((v) => {
      const vId = `vehicle-${v.vin}`;
      if (!seenNodes.has(vId)) {
        seenNodes.add(vId);
        nodes.push({
          id: vId,
          label: `${v.licensePlate} (${v.type})`,
          type: 'Vehicle',
          properties: v,
        });
      }
      if (v.hubId) {
        edges.push({
          id: `e-at-${v.vin}`,
          source: vId,
          target: v.hubId,
          label: 'CURRENTLY_AT',
        });
      }
    });

    rentalRows.forEach((r) => {
      const cId = `customer-${r.customerId}`;
      if (!seenNodes.has(cId)) {
        seenNodes.add(cId);
        nodes.push({
          id: cId,
          label: r.customerName,
          type: 'Customer',
          properties: {
            id: r.customerId,
            name: r.customerName,
            riskScore: r.riskScore,
          },
        });
      }
      edges.push({
        id: `e-rent-${r.rentalId}`,
        source: cId,
        target: `vehicle-${r.vin}`,
        label: 'RENTED',
        properties: {
          rentalId: r.rentalId,
          status: r.rentalStatus,
        },
      });
    });

    return { nodes, edges };
  }

  /**
   * Find shortest path between two hubs using Cypher path traversal
   */
  async findShortestRoute(originId: string, destId: string): Promise<RoutePathResult> {
    if (originId === destId) {
      const hubs = await runCypher<any>(
        'MATCH (h:Hub {id: $id}) RETURN h.id as id, h.name as name, h.city as city, h.latitude as latitude, h.longitude as longitude, h.capacity as capacity, h.type as type',
        { id: originId }
      );
      const hub = hubs[0];
      return {
        origin: hub,
        destination: hub,
        path: [hub],
        totalDistanceKm: 0,
        totalDurationMin: 0,
        totalTollFee: 0,
        segments: [],
      };
    }

    const query = `
      MATCH (start:Hub {id: $originId}), (target:Hub {id: $destId})
      MATCH p = shortestPath((start)-[:CONNECTED_TO*..8]-(target))
      RETURN [n in nodes(p) | {
        id: n.id,
        name: n.name,
        city: n.city,
        latitude: n.latitude,
        longitude: n.longitude,
        capacity: n.capacity,
        type: n.type
      }] AS pathNodes,
      [r in relationships(p) | {
        distanceKm: r.distanceKm,
        durationMinutes: r.durationMinutes,
        tollFee: r.tollFee
      }] AS pathRels
    `;

    const records = await runCypher<any>(query, { originId, destId });

    if (!records || records.length === 0) {
      throw new Error(`No route found between hub ${originId} and ${destId}`);
    }

    const pathNodes: HubNode[] = records[0].pathNodes;
    const pathRels: any[] = records[0].pathRels;

    let totalDistanceKm = 0;
    let totalDurationMin = 0;
    let totalTollFee = 0;

    const segments = pathRels.map((rel, i) => {
      totalDistanceKm += rel.distanceKm || 0;
      totalDurationMin += rel.durationMinutes || 0;
      totalTollFee += rel.tollFee || 0;

      return {
        from: pathNodes[i]?.name || '',
        to: pathNodes[i + 1]?.name || '',
        distanceKm: rel.distanceKm || 0,
        durationMinutes: rel.durationMinutes || 0,
        tollFee: rel.tollFee || 0,
      };
    });

    return {
      origin: pathNodes[0],
      destination: pathNodes[pathNodes.length - 1],
      path: pathNodes,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalDurationMin: Math.round(totalDurationMin),
      totalTollFee: Math.round(totalTollFee * 100) / 100,
      segments,
    };
  }

  /**
   * Calculate inventory and occupancy statistics for all hubs
   */
  async getHubInventoryStats(): Promise<HubInventoryStats[]> {
    const query = `
      MATCH (h:Hub)
      OPTIONAL MATCH (v:Vehicle)-[:CURRENTLY_AT]->(h)
      RETURN h.id AS hubId, h.name AS hubName, h.city AS city,
             h.capacity AS capacity, count(v) AS availableCount
      ORDER BY h.name ASC
    `;

    const records = await runCypher<any>(query);
    return records.map((r) => {
      const capacity = r.capacity || 10;
      const count = r.availableCount || 0;
      const pct = Math.round((count / capacity) * 100);
      let status: 'OPTIMAL' | 'SURPLUS' | 'DEFICIT' = 'OPTIMAL';
      if (pct > 75) status = 'SURPLUS';
      else if (pct < 30) status = 'DEFICIT';

      return {
        hubId: r.hubId,
        hubName: r.hubName,
        city: r.city,
        capacity,
        availableCount: count,
        occupancyPct: pct,
        status,
      };
    });
  }

  /**
   * Recommend fleet rebalancing based on surplus and deficit hubs
   */
  async getRebalancingRecommendations(): Promise<RebalancingRecommendation[]> {
    const stats = await this.getHubInventoryStats();
    const surplus = stats.filter((s) => s.status === 'SURPLUS');
    const deficit = stats.filter((s) => s.status === 'DEFICIT');

    const recommendations: RebalancingRecommendation[] = [];

    for (const d of deficit) {
      if (surplus.length === 0) break;
      // Pair with first surplus hub
      const s = surplus[0];
      try {
        const route = await this.findShortestRoute(s.hubId, d.hubId);
        const needed = Math.min(3, Math.max(1, Math.floor(d.capacity * 0.4 - d.availableCount)));
        recommendations.push({
          fromHubId: s.hubId,
          fromHubName: s.hubName,
          toHubId: d.hubId,
          toHubName: d.hubName,
          recommendedVehicles: needed,
          distanceKm: route.totalDistanceKm,
          reason: `${s.hubName} is at ${s.occupancyPct}% capacity while ${d.hubName} is starved at ${d.occupancyPct}% capacity.`,
        });
      } catch (e) {
        // Skip if no route
      }
    }

    return recommendations;
  }

  /**
   * Sync vehicle location and status in Neo4j
   */
  async syncVehicleInNeo4j(vehicle: {
    vin: string;
    licensePlate: string;
    type: string;
    status: string;
    hubId?: string;
  }): Promise<void> {
    const query = `
      MERGE (v:Vehicle {vin: $vin})
      SET v.licensePlate = $licensePlate,
          v.type = $type,
          v.status = $status
      WITH v
      MATCH (v)-[r:CURRENTLY_AT]->()
      DELETE r
      WITH v
      WHERE $hubId IS NOT NULL
      MATCH (h:Hub {id: $hubId})
      MERGE (v)-[:CURRENTLY_AT]->(h)
    `;
    await runCypher(query, {
      vin: vehicle.vin,
      licensePlate: vehicle.licensePlate,
      type: vehicle.type,
      status: vehicle.status,
      hubId: vehicle.hubId || null,
    });
  }

  /**
   * Record a new rental relationship in Neo4j
   */
  async recordRentalInNeo4j(data: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerRiskScore: number;
    vin: string;
    rentalId: string;
    startDate: string;
  }): Promise<void> {
    const query = `
      MERGE (c:Customer {id: $customerId})
      SET c.name = $customerName,
          c.phone = $customerPhone,
          c.riskScore = $customerRiskScore
      MERGE (v:Vehicle {vin: $vin})
      SET v.status = 'ON_RENT'
      WITH c, v
      OPTIONAL MATCH (v)-[oldRel:CURRENTLY_AT]->()
      DELETE oldRel
      CREATE (c)-[:RENTED {
        rentalId: $rentalId,
        startDate: $startDate,
        status: 'ACTIVE'
      }]->(v)
    `;
    await runCypher(query, data);
  }

  /**
   * Complete rental in Neo4j: link vehicle to return hub and mark relationship
   */
  async completeRentalInNeo4j(data: {
    rentalId: string;
    vin: string;
    returnHubId: string;
    completedDate: string;
  }): Promise<void> {
    const query = `
      MATCH (v:Vehicle {vin: $vin})
      SET v.status = 'AVAILABLE'
      WITH v
      MATCH (c:Customer)-[r:RENTED {rentalId: $rentalId}]->(v)
      SET r.status = 'COMPLETED', r.returnDate = $completedDate
      WITH v
      MATCH (h:Hub {id: $returnHubId})
      MERGE (v)-[:CURRENTLY_AT]->(h)
    `;
    await runCypher(query, data);
  }
}

export const neo4jGraphService = new Neo4jGraphService();
