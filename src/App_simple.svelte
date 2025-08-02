<script>
    import { onMount } from "svelte";
    import { init } from "./game.js";
    let canvasContainer;

    onMount(() => {
        if (canvasContainer) {
            init(canvasContainer);
        }
    });
</script>

<div bind:this={canvasContainer} class="w-full h-screen"></div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        background: #000;
    }
</style>
