<script lang="ts">
  import registerCommand from '../commands/registerCommand';
  import FormButton from '../forms/FormButton.svelte';
  import FormProvider from '../forms/FormProvider.svelte';
  import FormSubmit from '../forms/FormSubmit.svelte';
  import FontIcon from '../icons/FontIcon.svelte';
  import axiosInstance from '../utility/axiosInstance';
  import TabControl from '../elements/TabControl.svelte';
  import ConnectionModalDriverFields from './ConnectionModalDriverFields.svelte';
  import ConnectionModalSshTunnelFields from './ConnectionModalSshTunnelFields.svelte';
  import ConnectionModalSslFields from './ConnectionModalSslFields.svelte';
  import FormFieldTemplateLarge from '../forms/FormFieldTemplateLarge.svelte';

  import ModalBase from './ModalBase.svelte';
  import { closeCurrentModal, closeModal } from './modalTools';
  import createRef from '../utility/createRef';

  export let connection;

  let isTesting;
  let sqlConnectResult;

  const testIdRef = createRef(0);

  async function handleTest(e) {
    isTesting = true;
    testIdRef.update(x => x + 1);
    const testid = testIdRef.get();
    const resp = await axiosInstance.post('connections/test', e.detail);
    if (testIdRef.get() != testid) return;

    isTesting = false;
    sqlConnectResult = resp.data;
  }

  function handleCancelTest() {
    testIdRef.update(x => x + 1); // invalidate current test
    isTesting = false;
  }

  async function handleSubmit(e) {
    axiosInstance.post('connections/save', e.detail);
    closeCurrentModal();
  }
</script>

<FormProvider
  template={FormFieldTemplateLarge}
  initialValues={connection || { server: 'localhost', engine: 'mssql@dbgate-plugin-mssql' }}
>
  <ModalBase {...$$restProps} noPadding>
    <div slot="header">Add connection</div>

    <TabControl
      isInline
      tabs={[
        {
          label: 'Main',
          component: ConnectionModalDriverFields,
        },
        {
          label: 'SSH Tunnel',
          component: ConnectionModalSshTunnelFields,
        },
        {
          label: 'SSL',
          component: ConnectionModalSslFields,
        },
      ]}
    />

    <div slot="footer" class="flex">
      <div class="buttons">
        {#if isTesting}
          <FormButton value="Cancel test" on:click={handleCancelTest} />
        {:else}
          <FormButton value="Test" on:click={handleTest} />
        {/if}
        <FormSubmit value="Save" on:click={handleSubmit} />
      </div>
      <div class="test-result">
        {#if !isTesting && sqlConnectResult && sqlConnectResult.msgtype == 'connected'}
          <div>
            Connected: <FontIcon icon="img ok" />
            {sqlConnectResult.version}
          </div>
        {/if}
        {#if !isTesting && sqlConnectResult && sqlConnectResult.msgtype == 'error'}
          <div class="error-result">
            Connect failed: <FontIcon icon="img error" />
            {sqlConnectResult.error}
          </div>
        {/if}
        {#if isTesting}
          <div>
            <FontIcon icon="icon loading" /> Testing connection
          </div>
        {/if}
      </div>
    </div>
  </ModalBase>
</FormProvider>

<style>
  .buttons {
    flex-shrink: 0;
  }

  .test-result {
    margin-left: 10px;
    align-self: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .error-result {
    white-space: normal;
  }
</style>
