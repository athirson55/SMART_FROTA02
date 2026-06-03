/**
 * GPS Tracking Service — Smart Frota
 *
 * Architecture: provider pattern.
 *
 * Current provider: SimulatedProvider (demo/PI)
 *   Returns static position data and active route from the database.
 *   Suitable for presentation and development.
 *
 * Future providers to swap in:
 *   - TraccarProvider   — open-source self-hosted (Traccar server)
 *   - OmnilinkProvider  — Brazilian IoT fleet telemetry
 *   - SascarProvider    — Brazilian fleet management API
 *   - GenericGPSProvider — Adapter for any REST GPS API
 *
 * To replace the simulated provider, implement the TrackingProvider interface
 * below and set VITE_TRACKING_PROVIDER=your-provider in .env.
 *
 * TrackingProvider interface:
 *   getLastPosition(vehicleId: string): Promise<Position | null>
 *   getActiveRoute(vehicleId: string): Promise<Route | null>
 *   isRealtime: boolean   // true if the provider streams live updates
 *
 * Position: { lat, lng, speed, heading, updatedAt, isLive }
 * Route:    { origem, destino, distanciaKm, dataInicio, motoristaNome }
 */

import { getRoutes } from "./routes.js";

// ─── Types (JSDoc only, no TypeScript dependency) ────────────────────────────

/**
 * @typedef {{ lat: number|null, lng: number|null, speed: number|null,
 *             heading: number|null, updatedAt: string|null, isLive: boolean }} Position
 *
 * @typedef {{ origem: string, destino: string, distanciaKm: number|null,
 *             dataInicio: string|null, motoristaNome: string|null }} ActiveRoute
 */

// ─── Simulated Provider ───────────────────────────────────────────────────────

/**
 * SimulatedProvider — used for PI demo.
 *
 * GPS coordinates are static / randomized; route data is fetched from the DB.
 * Replace this entire object to integrate a real telematics provider.
 */
const SimulatedProvider = {
  isRealtime: false,

  /** @returns {Promise<Position>} */
  async getLastPosition(_vehicleId) {
    return {
      lat: null,
      lng: null,
      speed: null,
      heading: null,
      updatedAt: null,
      isLive: false,
    };
  },

  /** @returns {Promise<ActiveRoute|null>} */
  async getActiveRoute(vehicleId) {
    try {
      const res = await getRoutes({ veiculoId: vehicleId, status: "EM_ANDAMENTO", limit: 1 });
      const route = (res.data?.data ?? [])[0] ?? null;
      if (!route) return null;
      return {
        origem: route.origem,
        destino: route.destino,
        distanciaKm: route.distanciaKm ?? null,
        dataInicio: route.dataInicio ?? null,
        motoristaNome: route.motorista?.nome ?? route.motoristaNome ?? null,
      };
    } catch {
      return null;
    }
  },
};

// ─── Future provider stub (example Traccar integration) ──────────────────────

// const TraccarProvider = {
//   isRealtime: true,
//   baseUrl: import.meta.env.VITE_TRACCAR_URL || "https://traccar.yourserver.com",
//   token:   import.meta.env.VITE_TRACCAR_TOKEN || "",
//
//   async getLastPosition(vehicleId) {
//     const res = await fetch(`${this.baseUrl}/api/positions?deviceId=${vehicleId}`, {
//       headers: { Authorization: `Bearer ${this.token}` },
//     });
//     const data = await res.json();
//     const pos = data[0];
//     if (!pos) return null;
//     return { lat: pos.latitude, lng: pos.longitude, speed: pos.speed,
//              heading: pos.course, updatedAt: pos.fixTime, isLive: true };
//   },
//
//   async getActiveRoute(vehicleId) {
//     return SimulatedProvider.getActiveRoute(vehicleId); // still DB-backed
//   },
// };

// ─── Active provider (swap here for production) ───────────────────────────────

const activeProvider = SimulatedProvider;
// const activeProvider = TraccarProvider;    // uncomment to use real GPS

// ─── Public API ──────────────────────────────────────────────────────────────

export const TrackingService = {
  /** Whether the current provider streams live updates */
  get isRealtime() {
    return activeProvider.isRealtime;
  },

  /** Get last known GPS position for a vehicle */
  getLastPosition: (vehicleId) => activeProvider.getLastPosition(vehicleId),

  /** Get the current active route for a vehicle (from DB) */
  getActiveRoute: (vehicleId) => activeProvider.getActiveRoute(vehicleId),
};
