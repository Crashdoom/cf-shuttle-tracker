import CloudflareWorkerGlobalScope, {
  CloudflareWorkerKV,
} from 'types-cloudflare-worker';
import { Shuttle } from './models/Shuttle';
import { ShuttleManagement } from './shuttleManagement';
import {
  checkMethod,
  filterPublicShuttleAttributes,
  handleError,
  jsonResponse,
} from './utils';

declare var self: CloudflareWorkerGlobalScope;
declare global {
  const SHUTTLES: CloudflareWorkerKV;
  const STOPS: CloudflareWorkerKV;
  const CREATE_TOKEN: string;
}

export class Worker {
  public async handleRequest(event: FetchEvent): Promise<Response> {
    const { pathname } = new URL(event.request.url);
    const apiOperation = pathname.split('/')[1];

    switch (apiOperation) {
      case 'shuttles':
        checkMethod(event, 'GET');
        return this.handleShuttlesRequest(event);

      case 'shuttle':
        return new ShuttleManagement(event).handleRequest();

      default:
        return jsonResponse({ error: `Unknown path: ${pathname}` }, 404);
    }
  }

  private async handleShuttlesRequest(_: FetchEvent): Promise<Response> {
    const { keys } = await SHUTTLES.list();
    const shuttles = await Promise.all(
      keys.map(async ({ name }) =>
        filterPublicShuttleAttributes(
          (await SHUTTLES.get(name, 'json')) as Shuttle,
        ),
      ),
    );

    return jsonResponse({
      lastUpdated: Date.now(),
      shuttles,
    });
  }
}

self.addEventListener('fetch', (event: Event) => {
  const worker = new Worker();
  const fetchEvent = event as FetchEvent;
  fetchEvent.respondWith(worker.handleRequest(fetchEvent).catch(handleError));
});
