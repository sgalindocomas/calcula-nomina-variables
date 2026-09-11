<script>
import { toastState } from '../lib/alert.svelte.js';
import { fly } from 'svelte/transition';
</script>

{#if toastState.visible}
    <div class="toast" transition:fly={{ y: -50, duration: 300 }}>
        {toastState.message}
    </div>
{/if}