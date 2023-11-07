import serverListRaw from "../servers.json" assert { type: "json" };
import { ISafeServers, IServerInfo } from "../types/servers.js";

/**
 * The list of servers in `servers.json`.
 */
const serverList: IServerInfo[] = serverListRaw;

/**
 * Servers that are pinned to the top. Sorted by whatever comes first.
 */
const pinnedServers = serverList.filter(serverItem => serverItem.pinned);

/**
 * Servers that are not pinned to the top. Sorted alphabetically.
 */
const notPinnedServers = serverList.filter(serverItem => !serverItem.pinned).sort((serverA, serverB) => serverA.name.localeCompare(serverB.name));

export const appServers = pinnedServers.concat(notPinnedServers);
export const appSafeServers: ISafeServers[] = appServers.map(({ endpoint, substitutions, overrides, disabled, ...rest }) => rest);

// The default no-id endpoint always exists, trust me!
export const appMainEndpoint = appServers.find(serverItem => !serverItem.id)!.endpoint; // boomlings.com unless changed in fork