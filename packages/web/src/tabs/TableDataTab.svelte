<script lang="ts" context="module">
  const getCurrentEditor = () => getActiveComponent('TableDataTab');

  registerCommand({
    id: 'tableData.save',
    group: 'save',
    category: 'Table data',
    name: 'Save',
    // keyText: 'Ctrl+S',
    toolbar: true,
    icon: 'icon save',
    testEnabled: () => getCurrentEditor()?.canSave(),
    onClick: () => getCurrentEditor().save(),
  });

  export const matchingProps = ['conid', 'database', 'schemaName', 'pureName'];
  export const allowAddToFavorites = props => true;
</script>

<script lang="ts">
  import App from '../App.svelte';
  import TableDataGrid from '../datagrid/TableDataGrid.svelte';
  import useGridConfig from '../utility/useGridConfig';
  import {
    changeSetContainsChanges,
    changeSetToSql,
    createChangeSet,
    createGridCache,
    createGridConfig,
    TableFormViewDisplay,
    TableGridDisplay,
  } from 'dbgate-datalib';
  import { findEngineDriver } from 'dbgate-tools';
  import { reloadDataCacheFunc } from 'dbgate-datalib';
  import { writable } from 'svelte/store';
  import createUndoReducer from '../utility/createUndoReducer';
  import invalidateCommands from '../commands/invalidateCommands';
  import axiosInstance from '../utility/axiosInstance';
  import { showModal } from '../modals/modalTools';
  import ErrorMessageModal from '../modals/ErrorMessageModal.svelte';
  import { useConnectionInfo, useDatabaseInfo } from '../utility/metadataLoaders';
  import { scriptToSql } from 'dbgate-sqltree';
  import { extensions } from '../stores';
  import ConfirmSqlModal from '../modals/ConfirmSqlModal.svelte';
  import createActivator, { getActiveComponent } from '../utility/createActivator';
  import registerCommand from '../commands/registerCommand';
  import { registerMenu } from '../utility/contextMenu';

  export let tabid;
  export let conid;
  export let database;
  export let schemaName;
  export let pureName;

  export const activator = createActivator('TableDataTab', true);

  const config = useGridConfig(tabid);
  const cache = writable(createGridCache());
  const dbinfo = useDatabaseInfo({ conid, database });
  $: connection = useConnectionInfo({ conid });

  const [changeSetStore, dispatchChangeSet] = createUndoReducer(createChangeSet());

  async function handleConfirmSql(sql) {
    const resp = await axiosInstance.request({
      url: 'database-connections/query-data',
      method: 'post',
      params: {
        conid,
        database,
      },
      data: { sql },
    });
    const { errorMessage } = resp.data || {};
    if (errorMessage) {
      showModal(ErrorMessageModal, { title: 'Error when saving', message: errorMessage });
    } else {
      dispatchChangeSet({ type: 'reset', value: createChangeSet() });
      cache.update(reloadDataCacheFunc);
    }
  }

  export function save() {
    const driver = findEngineDriver($connection, $extensions);
    const script = changeSetToSql($changeSetStore?.value, $dbinfo);
    const sql = scriptToSql(driver, script);
    showModal(ConfirmSqlModal, {
      sql,
      onConfirm: () => handleConfirmSql(sql),
      engine: driver.engine,
    });
  }

  export function canSave() {
    return changeSetContainsChanges($changeSetStore?.value);
  }

  $: {
    $changeSetStore;
    invalidateCommands();
  }

  registerMenu({ command: 'tableData.save', tag: 'save' });
</script>

<TableDataGrid
  {...$$props}
  config={$config}
  setConfig={config.update}
  cache={$cache}
  setCache={cache.update}
  changeSetState={$changeSetStore}
  focusOnVisible
  {changeSetStore}
  {dispatchChangeSet}
/>
