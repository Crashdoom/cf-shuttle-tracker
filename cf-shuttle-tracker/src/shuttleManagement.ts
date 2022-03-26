import {
  checkMethod,
  filterPublicShuttleAttributes,
  GeoLocation,
  getAuthToken,
  happenedXSecondsAgo,
  jsonResponse,
  nearestStop,
} from './utils';
import { v4 } from 'uuid';
import { Shuttle, ShuttleStatus, ShuttleUpdate } from './models/Shuttle';

interface ShuttlePathProps {
  shuttleId: string | null;
  operation: string;
}

export class ShuttleManagement {
  private readonly event: FetchEvent;

  constructor(event: FetchEvent) {
    this.event = event;
  }

  public async handleRequest(): Promise<Response> {
    const { shuttleId, operation } = this.splitPath();

    switch (operation) {
      case 'add':
        return this.handleAddShuttleRequest();

      case 'update':
        return this.handleUpdateShuttleRequest(shuttleId!);

      default:
        return jsonResponse(
          { error: `Unknown path: ${this.event.request.url}` },
          404,
        );
    }
  }

  private async handleAddShuttleRequest(): Promise<Response> {
    checkMethod(this.event, 'POST');

    if (CREATE_TOKEN !== getAuthToken(this.event)) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    const location: GeoLocation = await this.event.request.json();

    if (!location.latitude || !location.longitude) {
      return jsonResponse({ error: 'Missing location' }, 400);
    }

    const newShuttleId = v4();
    const newShuttle: Shuttle = {
      authorization: v4(),
      lastUpdated: 0,
      location,
      status: ShuttleStatus.OUT_OF_SERVICE,
      stopName: null,
      stopArrivedAt: null,
    };

    await this.upsertShuttle(newShuttleId, newShuttle, {});

    return jsonResponse(
      {
        createdAt: newShuttle.lastUpdated,
        id: newShuttleId,
        authorization: newShuttle.authorization,
      },
      201,
    );
  }

  private async handleUpdateShuttleRequest(
    shuttleId: string,
  ): Promise<Response> {
    checkMethod(this.event, 'PATCH');

    let shuttle = (await SHUTTLES.get(shuttleId, 'json')) as Shuttle;
    if (!shuttle || shuttle.authorization !== getAuthToken(this.event)) {
      return jsonResponse({ error: 'Invalid token' }, 401);
    }

    const updateData: ShuttleUpdate = await this.event.request.json();
    const nearestShuttleStop = await nearestStop(updateData.location);

    // If the shuttle is out of service, don't allow automatic updates
    // unless there's a state change.
    if (shuttle.status === ShuttleStatus.OUT_OF_SERVICE && !updateData.status) {
      return jsonResponse({ error: 'Shuttle is out of service' }, 400);
    }

    if (updateData.status === ShuttleStatus.OUT_OF_SERVICE) {
      shuttle = await this.upsertShuttle(shuttleId, shuttle, {
        location: {
          latitude: 0,
          longitude: 0,
        },
        status: ShuttleStatus.OUT_OF_SERVICE,
        stopName: null,
        stopArrivedAt: null,
      });
      return jsonResponse({ message: 'Shuttle is now out of service' }, 200);
    }

    if (nearestShuttleStop == null) {
      // If the shuttle isn't near a stop, set it to IN_TRANSIT

      shuttle = await this.upsertShuttle(shuttleId, shuttle, {
        location: updateData.location,
        status: ShuttleStatus.IN_TRANSIT,
        stopName: null,
        stopArrivedAt: null,
      });
    } else if (nearestShuttleStop !== shuttle.stopName) {
      // If shuttle has just arrived at a stop, update the shuttle's stop info

      shuttle = await this.upsertShuttle(shuttleId, shuttle, {
        location: updateData.location,
        status: ShuttleStatus.ARRIVING_NOW,
        stopName: nearestShuttleStop,
        stopArrivedAt: Date.now(),
      });
    } else if (nearestShuttleStop === shuttle.stopName) {
      // If the shuttle is at the same stop...

      if (happenedXSecondsAgo(shuttle.stopArrivedAt!, 90)) {
        // and it arrived more than 90 seconds ago, set it to AT_STOP

        shuttle = await this.upsertShuttle(shuttleId, shuttle, {
          location: updateData.location,
          status: ShuttleStatus.AT_STOP,
        });
      }
    }

    return jsonResponse(
      {
        message: 'Shuttle updated',
        shuttle: filterPublicShuttleAttributes(shuttle),
        debug: {
          nearestShuttleStop,
          updateData,
        },
      },
      200,
    );
  }

  private async upsertShuttle(
    shuttleId: string,
    shuttle: Shuttle,
    updateData: Partial<Shuttle>,
  ): Promise<Shuttle> {
    const newShuttle: Shuttle = {
      ...shuttle,
      ...updateData,
      lastUpdated: Date.now(),
    };
    await SHUTTLES.put(shuttleId, JSON.stringify(newShuttle));
    return newShuttle;
  }

  private splitPath(): ShuttlePathProps {
    const { pathname } = new URL(this.event.request.url.substring(1));
    const split = pathname.substring(1).split('/');

    switch (split.length) {
      case 2:
        return { operation: split[1], shuttleId: null };

      case 3:
        return { operation: split[2], shuttleId: split[1] };

      default:
        return { operation: '', shuttleId: null };
    }
  }
}
