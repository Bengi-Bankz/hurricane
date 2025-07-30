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

<div class="game-layout">
    <!-- Main game area -->
    <div class="game-main">
        <div class="text-lg font-bold mb-4 text-center">
            Balance: ${balance}
        </div>
        <div bind:this={canvasContainer} class="canvas-area"></div>
    </div>

    <!-- Fixed bottom control panel -->
    <div class="bottom-panel">
        <div class="game-info">
            <div class="info-item">
                <span class="label">Category</span>
                <span class="value">—</span>
            </div>
            <div class="info-item">
                <span class="label">Wins</span>
                <span class="value">$0</span>
            </div>
        </div>

        <div class="action-buttons">
            <button class="action-btn bonus"> 💰 Bonus Buy </button>
            <button class="action-btn menu"> ⚙️ Settings </button>
            <button class="action-btn info"> ℹ️ Paytable </button>
        </div>

        <div class="control-section">
            <button on:click={triggerHurricane} class="spin-btn">
                🌪️ SPIN
            </button>
        </div>
    </div>
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: linear-gradient(
            135deg,
            #1e293b 0%,
            #334155 50%,
            #475569 100%
        );
        font-family: "Arial", sans-serif;
        height: 100vh;
    }

    .game-layout {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100vw;
        color: white;
    }

    .game-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        min-height: 0; /* Allow shrinking */
    }

    .canvas-area {
        width: 100vw;
        height: calc(100vh - 120px); /* Full height minus bottom panel */
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }

    canvas {
        border: 2px solid #ffd700;
        border-radius: 10px;
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);
        max-width: 100%;
        max-height: 100%;
    }

    /* Fixed Bottom Panel */
    .bottom-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 120px;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border-top: 3px solid #ffd700;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 40px;
        box-shadow: 0 -5px 25px rgba(0, 0, 0, 0.5);
        z-index: 1000;
    }

    /* Control Sections */
    .control-section {
        display: flex;
        align-items: center;
        min-width: 200px;
        justify-content: flex-end;
    }

    .action-buttons {
        display: flex;
        gap: 15px;
        flex: 1;
        justify-content: center;
    }

    .game-info {
        display: flex;
        gap: 30px;
        min-width: 200px;
        justify-content: flex-start;
    }

    /* Spin Button */
    .spin-btn {
        width: 120px;
        height: 80px;
        background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
        border: 3px solid #ffd700;
        border-radius: 15px;
        color: white;
        font-size: 1.1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow:
            0 0 20px rgba(220, 38, 38, 0.4),
            inset 0 2px 10px rgba(255, 255, 255, 0.2);
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .spin-btn:hover {
        transform: translateY(-3px) scale(1.05);
        background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
        box-shadow:
            0 0 30px rgba(220, 38, 38, 0.6),
            0 5px 15px rgba(0, 0, 0, 0.3),
            inset 0 2px 10px rgba(255, 255, 255, 0.3);
    }

    .spin-btn:active {
        transform: translateY(-1px) scale(1.02);
    }

    /* Action Buttons */
    .action-btn {
        padding: 12px 20px;
        background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
        border: 2px solid rgba(255, 215, 0, 0.5);
        border-radius: 10px;
        color: white;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 120px;
    }

    .action-btn:hover {
        background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
        border-color: #ffd700;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .action-btn.bonus:hover {
        background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
    }

    .action-btn.menu:hover {
        background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
    }

    .action-btn.info:hover {
        background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
    }

    /* Game Info */
    .info-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
    }

    .info-item .label {
        font-size: 0.8rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .info-item .value {
        font-size: 1.1rem;
        font-weight: bold;
        color: #ffd700;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .bottom-panel {
            height: 100px;
            padding: 0 20px;
            flex-wrap: wrap;
        }

        .control-section {
            min-width: auto;
        }

        .action-buttons {
            gap: 10px;
        }

        .action-btn {
            padding: 8px 12px;
            font-size: 0.8rem;
            min-width: 80px;
        }

        .spin-btn {
            width: 100px;
            height: 60px;
            font-size: 0.9rem;
        }

        .game-info {
            gap: 15px;
            min-width: auto;
        }

        .info-item .value {
            font-size: 1rem;
        }
    }

    @media (max-width: 480px) {
        .bottom-panel {
            height: 80px;
            padding: 0 10px;
        }

        .action-buttons {
            gap: 5px;
        }

        .action-btn {
            padding: 6px 8px;
            font-size: 0.7rem;
            min-width: 60px;
        }

        .spin-btn {
            width: 80px;
            height: 50px;
            font-size: 0.8rem;
        }
    }
</style>
