/**
 * GPS Tracking Service — Smart Frota
 *
 * Architecture: provider pattern.
 *   • Swap providers by changing `activeProvider` at the bottom of this file.
 *   • All providers must implement TrackingProvider interface below.
 *
 * Current state: NO GPS provider is configured.
 *   → Position data is unavailable until a real provider is connected.
 *   → Active route data is always fetched from the database (real).
 *
 * Supported providers (uncomment to activate):
 *   TraccarProvider  — open-source self-hosted telemetry (Traccar server)
 *   OmnilinkProvider — Brazilian IoT/fleet telemetry API
 *   SascarProvider   — Brazilian fleet management API
 *
 * Environment variables needed per provider:
 *   Traccar:  VITE_TRACCAR_URL, VITE_TRACCAR_TOKEN
 *   Omnilink: VITE_OMNILINK_URL, VITE_OMNILINK_TOKEN
 *   Sascar:   VITE_SASCAR_URL, VITE_SASCAR_TOKEN
 *
 * TrackingProvider interface:
 *   getLastPosition(vehicleId: string): Promise<Position | null>
 *   getActiveRoute(vehicleId: string):  Promise<ActiveRoute | null>
 *   isConnected: boolean   — true when a real device/API is available
 *
 * @typedef {{ lat: number, lng: number, speed: number, heading: number,
 *             updatedAt: string, deviceId: string }} Position
 *
 * @typedef {{ origem: string, destino: string, distanciaKm: number|null,
 *             dataInicio: string|null, motoristaNome: string|null }} ActiveRoute
 */

import { getRoutes } from "./routes.js";

// ─── No-device provider (default — honest "not connected" state) ─────────────

/**
 * NoDeviceProvider — used when no GPS hardware/API is configured.
 * Returns null position so the UI can show "Sem dispositivo GPS".
 * Route data is still real (from the database).
 */
const NoDeviceProvider = {
  isConnected: false,

  /** @returns {Promise<null>} */
  async getLastPosition(_vehicleId) {
    return null;
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

// ─── Traccar provider (activate when self-hosted Traccar server is available) ─

// const TraccarProvider = {
//   isConnected: true,
//   baseUrl: import.meta.env.VITE_TRACCAR_URL,
//   token:   import.meta.env.VITE_TRACCAR_TOKEN,
//
//   async getLastPosition(vehicleId) {
//     const res = await fetch(
//       `${this.baseUrl}/api/positions?deviceId=${vehicleId}`,
//       { headers: { Authorization: `Bearer ${this.token}` } },
//     );
//     const data = await res.json();
//     const pos = data[0];
//     if (!pos) return null;
//     return {
//       lat: pos.latitude, lng: pos.longitude,
//       speed: pos.speed, heading: pos.course,
//       updatedAt: pos.fixTime, deviceId: pos.deviceId,
//     };
//   },
//
//   async getActiveRoute(vehicleId) {
//     return NoDeviceProvider.getActiveRoute(vehicleId);
//   },
// };

// ─── Omnilink provider stub ───────────────────────────────────────────────────

// const OmnilinkProvider = { isConnected: true, ... };

// ─── Active provider ──────────────────────────────────────────────────────────
// Change this line to switch providers:

const activeProvider = NoDeviceProvider;
// const activeProvider = TraccarProvider;
// const activeProvider = OmnilinkProvider;

// ─── Public API ───────────────────────────────────────────────────────────────

export const TrackingService = {
  /** true when a real GPS provider is connected and sending data */
  get isConnected() {
    return activeProvider.isConnected;
  },

  /** Last known GPS position, or null if no device is connected */
  getLastPosition: (vehicleId) => activeProvider.getLastPosition(vehicleId),

  /** Active route from the database (always real data) */
  getActiveRoute: (vehicleId) => activeProvider.getActiveRoute(vehicleId),
};
