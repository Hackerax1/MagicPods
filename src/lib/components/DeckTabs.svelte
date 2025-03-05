<script lang="ts">
  export let currentTab: string;
  export let tabs: { id: string; label: string }[] = [
    { id: 'builder', label: 'Builder' },
    { id: 'stats', label: 'Statistics' },
    { id: 'export', label: 'Export' }
  ];
</script>

<div class="flex border-b border-gray-200">
  {#each tabs as tab}
    <button 
      class={`px-4 py-2 font-medium text-sm flex-grow ${currentTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-indigo-500'}`} 
      on:click={() => currentTab = tab.id}
    >
      {tab.label}
    </button>
  {/each}
</div>