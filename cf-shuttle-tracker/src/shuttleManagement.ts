import { checkMethod, GeoLocation, getAuthToken, jsonResponse } from './utils';
import { v4 } from 'uuid';
import { Shuttle, ShuttleStatus } from './models/Shuttle';

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
    const { operation } = this.splitPath();

    switch (operation) {
      case 'add':
        return this.handleAddShuttleRequest();

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
      lastUpdated: Date.now(),
      location,
      status: ShuttleStatus.OUT_OF_SERVICE,
      stopName: null,
    };

    await SHUTTLES.put(newShuttleId, JSON.stringify(newShuttle));

    return jsonResponse(
      {
        createdAt: newShuttle.lastUpdated,
        id: newShuttleId,
        authorization: newShuttle.authorization,
      },
      201,
    );
  }

  private splitPath(): ShuttlePathProps {
    const { pathname } = new URL(this.event.request.url.substring(1));
    const split = pathname.split('/');

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
