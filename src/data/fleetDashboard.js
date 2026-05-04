import { vehiclesData } from "./vehicles";

export const fleetVehicles = vehiclesData;

export function getFleetSummary(vehicles) {
  const pendingVehicles = vehicles.filter(
    (vehicle) => vehicle.pendencies.length > 0,
  ).length;

  const maintenancePending = vehicles.reduce(
    (count, vehicle) =>
      count +
      vehicle.pendencies.filter(
        (pending) =>
          pending.slug.includes("manutencao") || pending.slug.includes("troca"),
      ).length,
    0,
  );

  const documentsPending = vehicles.reduce(
    (count, vehicle) =>
      count +
      vehicle.pendencies.filter((pending) => pending.slug.includes("documento"))
        .length,
    0,
  );

  return {
    total: vehicles.length,
    withPendencies: pendingVehicles,
    maintenancePending,
    documentsPending,
  };
}

export function getPendingDetail(vehicleId, pendingSlug) {
  const vehicle = fleetVehicles.find((item) => item.id === vehicleId);

  if (!vehicle) {
    return null;
  }

  const pending = vehicle.pendencies.find((item) => item.slug === pendingSlug);

  if (!pending) {
    return { vehicle, pending: null };
  }

  return { vehicle, pending };
}
