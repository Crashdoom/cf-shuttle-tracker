import { GeoLocation } from '../utils';

export enum ShuttleStatus {
  AT_STOP = 'at_stop',
  IN_TRANSIT = 'in_transit',
  ARRIVING_NOW = 'arriving_now',
  DELAYED_AT_STOP = 'delayed_at_stop',
  DELAYED_IN_TRANSIT = 'delayed_in_transit',
  OUT_OF_SERVICE = 'out_of_service',
}

export interface Shuttle {
  // Private
  authorization: string;

  // Public
  lastUpdated: number;
  location: GeoLocation;
  status: ShuttleStatus;
  stopName: string | null;
  stopArrivedAt: number | null;
}

export interface ShuttleUpdate {
  location: GeoLocation;
  status?: ShuttleStatus;
}
