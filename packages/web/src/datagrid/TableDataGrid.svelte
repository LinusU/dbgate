<script lang="ts">
  import {
    createGridCache,
    createGridConfig,
    runMacroOnChangeSet,
    TableFormViewDisplay,
    TableGridDisplay,
  } from 'dbgate-datalib';
  import { getFilterValueExpression } from 'dbgate-filterparser';
  import { findEngineDriver } from 'dbgate-tools';
  import _ from 'lodash';
  import { writable } from 'svelte/store';
  import VerticalSplitter from '../elements/VerticalSplitter.svelte';
  import { extensions } from '../stores';
  import stableStringify from 'json-stable-stringify';

  import { useConnectionInfo, useDatabaseInfo } from '../utility/metadataLoaders';

  import DataGrid from './DataGrid.svelte';
  import ReferenceHeader from './ReferenceHeader.svelte';
  import SqlDataGridCore from './SqlDataGridCore.svelte';
  import SqlFormView from '../formview/SqlFormView.svelte';
  import { getBoolSettingsValue } from '../settings/settingsTools';

  export let conid;
  export let database;
  export let schemaName;
  export let pureName;

  export let changeSetState;
  export let dispatchChangeSet;

  export let config;
  export let setConfig;

  export let cache;
  export let setCache;

  $: connection = useConnectionInfo({ conid });
  $: dbinfo = useDatabaseInfo({ conid, database });

  let myLoadedTime = 0;

  const childCache = writable(createGridCache());

  // $: console.log('display', display);

  $: display = connection
    ? new TableGridDisplay(
        { schemaName, pureName },
        findEngineDriver($connection, $extensions),
        config,
        setConfig,
        cache,
        setCache,
        $dbinfo,
        { showHintColumns: getBoolSettingsValue('dataGrid.showHintColumns', true) }
      )
    : null;

  $: formDisplay = connection
    ? new TableFormViewDisplay(
        { schemaName, pureName },
        findEngineDriver($connection, $extensions),
        config,
        setConfig,
        cache,
        setCache,
        $dbinfo,
        { showHintColumns: getBoolSettingsValue('dataGrid.showHintColumns', true) }
      )
    : null;

  const setChildConfig = (value, reference = undefined) => {
    if (_.isFunction(value)) {
      setConfig(x => ({
        ...x,
        childConfig: value(x.childConfig),
      }));
    } else {
      setConfig(x => ({
        ...x,
        childConfig: value,
        reference: reference === undefined ? x.reference : reference,
      }));
    }
  };

  const handleReferenceSourceChanged = (selectedRows, loadedTime) => {
    myLoadedTime = loadedTime;
    if (!reference) return;

    const filtersBase = display && display.isGrouped ? config.filters : childConfig.filters;

    const filters = {
      ...filtersBase,
      ..._.fromPairs(
        reference.columns.map(col => [
          col.refName,
          selectedRows.map(x => getFilterValueExpression(x[col.baseName], col.dataType)).join(', '),
        ])
      ),
    };
    if (stableStringify(filters) != stableStringify(childConfig.filters)) {
      setChildConfig(cfg => ({
        ...cfg,
        filters,
      }));
      childCache.update(ca => ({
        ...ca,
        refreshTime: new Date().getTime(),
      }));
    }
  };

  const handleCloseReference = () => {
    display.clearGrouping();
    setChildConfig(null, null);
  };

  function handleRunMacro(macro, params, cells) {
    const newChangeSet = runMacroOnChangeSet(macro, params, cells, changeSetState?.value, display);
    if (newChangeSet) {
      dispatchChangeSet({ type: 'set', value: newChangeSet });
    }
  }

  $: reference = config.reference;
  $: childConfig = config.childConfig;
</script>

<VerticalSplitter isSplitter={!!reference}>
  <svelte:fragment slot="1">
    <DataGrid
      {...$$props}
      gridCoreComponent={SqlDataGridCore}
      formViewComponent={SqlFormView}
      {display}
      {formDisplay}
      showReferences
      showMacros
      onRunMacro={handleRunMacro}
      macroCondition={macro => macro.type == 'transformValue'}
      onReferenceSourceChanged={reference ? handleReferenceSourceChanged : null}
      onReferenceClick={value => {
        if (value && value.referenceId && reference && reference.referenceId == value.referenceId) {
          // reference not changed
          return;
        }
        setChildConfig(createGridConfig(), value);
      }}
    />
  </svelte:fragment>
  <div slot="2" class="reference-container">
    {#if reference}
      <ReferenceHeader {reference} on:close={handleCloseReference} />
      <div class="detail">
        {#key `${reference.schemaName}.${reference.pureName}`}
          <svelte:self
            {...$$props}
            pureName={reference.pureName}
            schemaName={reference.schemaName}
            config={childConfig}
            setConfig={setChildConfig}
            cache={$childCache}
            setCache={childCache.update}
            masterLoadedTime={myLoadedTime}
            isDetailView
          />
        {/key}
      </div>
    {/if}
  </div>
</VerticalSplitter>

<style>
  .reference-container {
    position: absolute;
    display: flex;
    flex-direction: column;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .detail {
    position: relative;
    flex: 1;
  }
</style>
