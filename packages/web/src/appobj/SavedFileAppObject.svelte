<script lang="ts" context="module">
  interface FileTypeHandler {
    icon: string;
    format: string;
    tabComponent: string;
    folder: string;
    currentConnection: boolean;
  }

  const sql: FileTypeHandler = {
    icon: 'img sql-file',
    format: 'text',
    tabComponent: 'QueryTab',
    folder: 'sql',
    currentConnection: true,
  };

  const shell: FileTypeHandler = {
    icon: 'img shell',
    format: 'text',
    tabComponent: 'ShellTab',
    folder: 'shell',
    currentConnection: false,
  };

  const markdown: FileTypeHandler = {
    icon: 'img markdown',
    format: 'text',
    tabComponent: 'MarkdownEditorTab',
    folder: 'markdown',
    currentConnection: false,
  };

  const charts: FileTypeHandler = {
    icon: 'img chart',
    format: 'json',
    tabComponent: 'ChartTab',
    folder: 'charts',
    currentConnection: true,
  };

  const query: FileTypeHandler = {
    icon: 'img query-design',
    format: 'json',
    tabComponent: 'QueryDesignTab',
    folder: 'query',
    currentConnection: true,
  };

  const HANDLERS = {
    sql,
    shell,
    markdown,
    charts,
    query,
  };

  export const extractKey = data => data.file;
</script>

<script lang="ts">
  import _ from 'lodash';
  import ConfirmModal from '../modals/ConfirmModal.svelte';
  import InputTextModal from '../modals/InputTextModal.svelte';
  import { showModal } from '../modals/modalTools';

  import { currentDatabase } from '../stores';

  import axiosInstance from '../utility/axiosInstance';
  import hasPermission from '../utility/hasPermission';
  import openNewTab from '../utility/openNewTab';

  import AppObjectCore from './AppObjectCore.svelte';

  export let data;

  $: folder = data?.folder;
  $: handler = HANDLERS[folder] as FileTypeHandler;

  const showMarkdownPage = () => {
    openNewTab({
      title: data.file,
      icon: 'img markdown',
      tabComponent: 'MarkdownViewTab',
      props: {
        savedFile: data.file,
        savedFolder: 'markdown',
        savedFormat: 'text',
      },
    });
  };

  function createMenu() {
    return [
      { text: 'Open', onClick: openTab },
      hasPermission(`files/${data.folder}/write`) && { text: 'Rename', onClick: handleRename },
      hasPermission(`files/${data.folder}/write`) && { text: 'Delete', onClick: handleDelete },
      folder == 'markdown' && { text: 'Show page', onClick: showMarkdownPage },
    ];
  }

  const handleDelete = () => {
    showModal(ConfirmModal, {
      message: `Really delete file ${data.file}?`,
      onConfirm: () => {
        axiosInstance.post('files/delete', data);
      },
    });
  };

  const handleRename = () => {
    showModal(InputTextModal, {
      value: data.file,
      label: 'New file name',
      header: 'Rename file',
      onConfirm: newFile => {
        axiosInstance.post('files/rename', { ...data, newFile });
      },
    });
  };

  async function openTab() {
    const resp = await axiosInstance.post('files/load', { folder, file: data.file, format: handler.format });

    const connProps: any = {};
    let tooltip = undefined;

    if (handler.currentConnection) {
      const connection = _.get($currentDatabase, 'connection') || {};
      const database = _.get($currentDatabase, 'name');
      connProps.conid = connection._id;
      connProps.database = database;
      tooltip = `${connection.displayName || connection.server}\n${database}`;
    }

    openNewTab(
      {
        title: data.file,
        icon: handler.icon,
        tabComponent: handler.tabComponent,
        tooltip,
        props: {
          savedFile: data.file,
          savedFolder: handler.folder,
          savedFormat: handler.format,
          ...connProps,
        },
      },
      { editor: resp.data }
    );
  }
</script>

<AppObjectCore {...$$restProps} {data} icon={handler?.icon} title={data?.file} menu={createMenu()} on:click={openTab} />
