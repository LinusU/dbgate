<script context="module">
  function makeBulletString(value) {
    return _.pad('', value.length, '•');
  }

  function highlightSpecialCharacters(value) {
    value = value.replace(/\n/g, '↲');
    value = value.replace(/\r/g, '');
    value = value.replace(/^(\s+)/, makeBulletString);
    value = value.replace(/(\s+)$/, makeBulletString);
    value = value.replace(/(\s\s+)/g, makeBulletString);
    return value;
  }

  const dateTimeRegex = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d\d\d)?Z?$/;
</script>

<script lang="ts">
  import moment from 'moment';
  import _ from 'lodash';
  import { isTypeLogical } from 'dbgate-tools';
  import ShowFormButton from '../formview/ShowFormButton.svelte';

  export let rowIndex;
  export let col;
  export let rowData;
  export let colIndex = undefined;
  export let allowHintField = false;

  export let isSelected = false;
  export let isFrameSelected = false;
  export let isModifiedRow = false;
  export let isModifiedCell = false;
  export let isInserted = false;
  export let isDeleted = false;
  export let isAutofillSelected = false;
  export let isFocusedColumn = false;
  export let domCell = undefined;
  export let hideContent = false;
  export let onSetFormView;
  export let isDynamicStructure = false;
  export let isAutoFillMarker = false;

  $: value = col.isStructured ? _.get(rowData || {}, col.uniquePath) : (rowData || {})[col.uniqueName];
</script>

<td
  bind:this={domCell}
  data-row={rowIndex}
  data-col={colIndex == null ? col.colIndex : colIndex}
  class:isSelected
  class:isFrameSelected
  class:isModifiedRow
  class:isModifiedCell
  class:isInserted
  class:isDeleted
  class:isAutofillSelected
  class:isFocusedColumn
  style={`width:${col.width}px; min-width:${col.width}px; max-width:${col.width}px`}
>
  {#if hideContent}
    <slot />
  {:else}
    {#if value === null}
      <span class="null">(NULL)</span>
    {:else if value === undefined}
      <span class="null">(No field)</span>
    {:else if _.isDate(value)}
      {moment(value).format('YYYY-MM-DD HH:mm:ss')}
    {:else if value === true}
      {#if isDynamicStructure}
        <span class="value">true</span>
      {:else}
        1
      {/if}
    {:else if value === false}
      {#if isDynamicStructure}
        <span class="value">false</span>
      {:else}
        0
      {/if}
    {:else if _.isNumber(value)}
      {#if value >= 10000 || value <= -10000}
        {#if isDynamicStructure}
          <span class="value">{value.toLocaleString()}</span>
        {:else}
          {value.toLocaleString()}
        {/if}
      {:else if isDynamicStructure}
        <span class="value">{value.toString()}</span>
      {:else}
        {value.toString()}
      {/if}
    {:else if _.isString(value)}
      {#if dateTimeRegex.test(value)}
        {moment(value).format('YYYY-MM-DD HH:mm:ss')}
      {:else}
        {highlightSpecialCharacters(value)}
      {/if}
    {:else if value.type == 'Buffer' && _.isArray(value.data)}
      <span class="null">({value.data.length} bytes)</span>
    {:else if _.isPlainObject(value)}
      <span class="null">(JSON)</span>
    {:else if _.isArray(value)}
      <span class="null">[{value.length} items]</span>
    {:else}
      {value.toString()}
    {/if}

    {#if allowHintField && rowData && rowData[col.hintColumnName]}
      <span class="hint">{rowData[col.hintColumnName]}</span>
    {/if}

    {#if col.foreignKey && rowData && rowData[col.uniqueName]}
      <ShowFormButton on:click={() => onSetFormView(rowData, col)} />
    {/if}
  {/if}

  {#if isAutoFillMarker}
    <div class="autoFillMarker autofillHandleMarker" />
  {/if}
</td>

<!-- {#if _.isArray(value.data)}
{#if value.data.length == 1 && isTypeLogical(col.dataType)}
  {value.data[0]}
{:else}
  <span class="null">({value.data.length} bytes)</span>
{/if}
{:else}
<span class="null">(RAW)</span>
{/if} -->
<style>
  td {
    font-weight: normal;
    border: 1px solid var(--theme-border);
    padding: 2px;
    white-space: nowrap;
    position: relative;
    overflow: hidden;
  }
  td.isFrameSelected {
    outline: 3px solid var(--theme-bg-selected);
    outline-offset: -3px;
  }
  td.isAutofillSelected {
    outline: 3px solid var(--theme-bg-selected);
    outline-offset: -3px;
  }
  td.isFocusedColumn {
    background: var(--theme-bg-alt);
  }
  td.isModifiedRow {
    background: var(--theme-bg-gold);
  }
  td.isModifiedCell {
    background: var(--theme-bg-orange);
  }
  td.isInserted {
    background: var(--theme-bg-green);
  }
  td.isDeleted {
    background: var(--theme-bg-volcano);
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAEElEQVQImWNgIAX8x4KJBAD+agT8INXz9wAAAABJRU5ErkJggg==');
    background-repeat: repeat-x;
    background-position: 50% 50%;
  }
  td.isSelected {
    background: var(--theme-bg-selected);
  }

  .hint {
    color: var(--theme-font-3);
    margin-left: 5px;
  }
  .null {
    color: var(--theme-font-3);
    font-style: italic;
  }
  .value {
    color: var(--theme-icon-green);
  }

  .autoFillMarker {
    width: 8px;
    height: 8px;
    background: var(--theme-bg-selected-point);
    position: absolute;
    right: 0px;
    bottom: 0px;
    overflow: visible;
    cursor: crosshair;
  }
</style>
