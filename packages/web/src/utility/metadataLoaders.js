import useFetch from './useFetch';
import axios from './axios';
import { cacheGet, cacheSet, getCachedPromise } from './cache';
import stableStringify from 'json-stable-stringify';

const tableInfoLoader = ({ conid, database, schemaName, pureName }) => ({
  url: 'metadata/table-info',
  params: { conid, database, schemaName, pureName },
  reloadTrigger: `database-structure-changed-${conid}-${database}`,
});

const sqlObjectInfoLoader = ({ objectTypeField, conid, database, schemaName, pureName }) => ({
  url: 'metadata/sql-object-info',
  params: { objectTypeField, conid, database, schemaName, pureName },
  reloadTrigger: `database-structure-changed-${conid}-${database}`,
});

const connectionInfoLoader = ({ conid }) => ({
  url: 'connections/get',
  params: { conid },
  reloadTrigger: 'connection-list-changed',
});

const sqlObjectListLoader = ({ conid, database }) => ({
  url: 'metadata/list-objects',
  params: { conid, database },
  reloadTrigger: `database-structure-changed-${conid}-${database}`,
});

const databaseStatusLoader = ({ conid, database }) => ({
  url: 'database-connections/status',
  params: { conid, database },
  reloadTrigger: `database-status-changed-${conid}-${database}`,
});

const databaseListLoader = ({ conid }) => ({
  url: 'server-connections/list-databases',
  params: { conid },
  reloadTrigger: `database-list-changed-${conid}`,
});

const serverStatusLoader = () => ({
  url: 'server-connections/server-status',
  params: {},
  reloadTrigger: `server-status-changed`,
});

const connectionListLoader = () => ({
  url: 'connections/list',
  params: {},
  reloadTrigger: `connection-list-changed`,
});

async function getCore(loader, args) {
  const { url, params, reloadTrigger } = loader(args);
  const key = stableStringify({ url, ...params });

  async function doLoad() {
    const resp = await axios.request({
      method: 'get',
      url,
      params,
    });
    return resp.data;
  }

  const fromCache = cacheGet(key);
  if (fromCache) return fromCache;
  const res = await getCachedPromise(key, doLoad);

  cacheSet(key, res, reloadTrigger);
  return res;
}

function useCore(loader, args) {
  const { url, params, reloadTrigger } = loader(args);
  const cacheKey = stableStringify({ url, ...params });

  const res = useFetch({
    url,
    params,
    reloadTrigger,
    cacheKey,
  });

  return res;
}

/** @returns {Promise<import('@dbgate/types').TableInfo>} */
export function getTableInfo(args) {
  return getCore(tableInfoLoader, args);
}

/** @returns {import('@dbgate/types').TableInfo} */
export function useTableInfo(args) {
  return useCore(tableInfoLoader, args);
}

/** @returns {Promise<import('@dbgate/types').ViewInfo>} */
export function getViewInfo(args) {
  return getCore(sqlObjectInfoLoader, { ...args, objectTypeField: 'views' });
}

/** @returns {import('@dbgate/types').ViewInfo} */
export function useViewInfo(args) {
  return useCore(sqlObjectInfoLoader, { ...args, objectTypeField: 'views' });
}

export function getSqlObjectInfo(args) {
  return getCore(sqlObjectInfoLoader, args);
}

export function useSqlObjectInfo(args) {
  return useCore(sqlObjectInfoLoader, args);
}

/** @returns {Promise<import('@dbgate/types').StoredConnection>} */
export function getConnectionInfo(args) {
  return getCore(connectionInfoLoader, args);
}

/** @returns {import('@dbgate/types').StoredConnection} */
export function useConnectionInfo(args) {
  return useCore(connectionInfoLoader, args);
}

export function getSqlObjectList(args) {
  return getCore(sqlObjectListLoader, args);
}
export function useSqlObjectList(args) {
  return useCore(sqlObjectListLoader, args);
}

export function getDatabaseStatus(args) {
  return getCore(databaseStatusLoader, args);
}
export function useDatabaseStatus(args) {
  return useCore(databaseStatusLoader, args);
}

export function getDatabaseList(args) {
  return getCore(databaseListLoader, args);
}
export function useDatabaseList(args) {
  return useCore(databaseListLoader, args);
}

export function getServerStatus() {
  return getCore(serverStatusLoader, {});
}
export function useServerStatus() {
  return useCore(serverStatusLoader, {});
}

export function getConnectionList() {
  return getCore(connectionListLoader, {});
}
export function useConnectionList() {
  return useCore(connectionListLoader, {});
}
