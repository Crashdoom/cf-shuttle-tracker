import { Shuttle } from '../models/Shuttle';

export class MethodNotAllowedError extends Error {
  constructor(method: string) {
    super(`Method not allowed: ${method}`);
  }
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export function jsonResponse(json: object, status: number = 200) {
  const response = new Response(JSON.stringify(json), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });

  return response;
}

export function checkMethod(event: FetchEvent, method: string) {
  if (event.request.method !== method) {
    throw new MethodNotAllowedError(event.request.method);
  }
}

export function handleError(error: Error) {
  if (error instanceof MethodNotAllowedError) {
    return jsonResponse({ error: error.message }, 405);
  }

  return jsonResponse({ error: error.message }, 500);
}

export function getAuthToken(event: FetchEvent): string {
  const authHeader = event.request.headers.get('Authorization');
  const authToken = authHeader ? authHeader.split('Bearer ')[1] : '';

  return authToken;
}

function degToRad(deg: number): number {
  return (deg / 180) * Math.PI;
}

export function sphericalDistance(pos1: GeoLocation, pos2: GeoLocation) {
  const φ1 = degToRad(pos1.latitude);
  const φ2 = degToRad(pos2.latitude);
  // tslint:disable-next-line: variable-name
  const Δφ2 = degToRad(pos2.latitude - pos1.latitude) / 2;
  // tslint:disable-next-line: variable-name
  const Δλ2 = degToRad(pos2.longitude - pos1.longitude) / 2;

  const a =
    Math.sin(Δφ2) * Math.sin(Δφ2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ2) * Math.sin(Δλ2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return 6371 * c;
}

export function convertToGeoLocation(value: string): GeoLocation {
  const [latitude, longitude] = value.split(',').map((s) => parseFloat(s));
  return { latitude, longitude };
}

export async function nearestStop(
  shuttle: GeoLocation,
): Promise<string | null> {
  const { keys: stops } = await STOPS.list();

  if (!stops.length) {
    return null;
  }

  const distances = stops.map(({ name: stop }) =>
    sphericalDistance(convertToGeoLocation(stop), shuttle),
  );
  const minDistance = Math.min(...distances);

  if (minDistance > 0.15) {
    return null;
  }

  const minIndex = distances.indexOf(minDistance);

  return STOPS.get(stops[minIndex].name, 'text');
}

export function happenedXSecondsAgo(
  previousTime: number,
  seconds: number,
): boolean {
  const now = Date.now();
  const timeDifference = now - previousTime;

  return timeDifference > seconds * 1000;
}

export function filterPublicShuttleAttributes(
  shuttle: Shuttle,
): Partial<Shuttle> {
  return {
    ...shuttle,
    authorization: undefined,
  };
}
