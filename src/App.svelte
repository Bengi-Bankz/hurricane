<script>
    import { onMount } from "svelte";
    import { init, triggerHurricane } from "./game.js";
    let balance = 1000;
    let canvasContainer;
    
    onMount(() => {
        if (canvasContainer) {
            init(canvasContainer);
        }
    });
</script>

<div
    class="flex flex-col items-center justify-center min-h-screen bg-blue-900 text-white"
>
    <div class="text-lg font-bold mb-4">Balance: ${balance}</div>
    <div bind:this={canvasContainer}></div>
    <div class="mt-6 flex gap-4">
        <button
            on:click={triggerHurricane}
            class="bg-green-600 px-6 py-2 rounded shadow hover:bg-green-700"
            >Spin</button
        >
        <button
            class="bg-yellow-500 px-6 py-2 rounded shadow hover:bg-yellow-600"
            >Bonus Buy</button
        >
        <button class="bg-gray-700 px-6 py-2 rounded shadow hover:bg-gray-800"
            >Menu</button
        >
    </div>
</div>

<style>
    canvas {
        border: 2px solid white;
        margin-top: 16px;
    }
</style>
