<script>
    import { onMount } from "svelte";
    import { init, triggerHurricane, getReelSpinningState, getGameData } from "./game.js";
    let balance = 1000;
    let betAmount = 10;
    let canvasContainer;
    let isSpinning = false;
    let gameLoaded = false;
    let showLightning = false;
    let gameData = {
        totalWinnings: 0,
        hurricaneCategory: 0
    };
    
    onMount(() => {
        if (canvasContainer) {
            // Start with lightning effect after a brief delay
            setTimeout(() => {
                showLightning = true;
                
                // Lightning flashes for 2 seconds
                setTimeout(() => {
                    showLightning = false;
                    gameLoaded = true;
                    
                    // Initialize the game after lightning
                    init(canvasContainer);
                }, 2000);
            }, 500);
            
            // Start game state monitoring
            const updateGameState = () => {
                if (typeof getReelSpinningState === 'function') {
                    try {
                        isSpinning = getReelSpinningState();
                        
                        // Update game data
                        if (typeof getGameData === 'function') {
                            const data = getGameData();
                            gameData.totalWinnings = data.totalWinnings;
                            gameData.hurricaneCategory = data.hurricaneCategory || 0;
                        }
                    } catch (error) {
                        // Game not fully loaded yet
                        isSpinning = false;
                    }
                }
                requestAnimationFrame(updateGameState);
            };
            updateGameState();
        }
    });
    
    function handleSpin() {
        if (!isSpinning) {
            triggerHurricane();
        }
    }
    
    // Reactive computed balance
    $: currentBalance = balance + gameData.totalWinnings;
</script><div class="game-layout">
    <!-- Main game area -->
    <div class="game-main">
        <div class="text-lg font-bold mb-4 text-center">
            Balance: ${currentBalance}
        </div>
        <div bind:this={canvasContainer} class="canvas-area"></div>
    </div>

    <!-- Fixed bottom control panel -->
    <div class="bottom-panel" class:lightning={showLightning} class:illuminated={gameLoaded}>
        <div class="game-info">
            <div class="info-item illuminated-info">
                <span class="label">Balance</span>
                <span class="value">${currentBalance}</span>
                <div class="info-light"></div>
            </div>
            <div class="info-item illuminated-info">
                <span class="label">Bet</span>
                <input type="number" class="bet-input illuminated-input" bind:value={betAmount} min="1" max="100" step="1" />
                <div class="info-light"></div>
            </div>
        </div>

        <div class="action-buttons">
            <div class="light-button">
                <button class="bt action-btn bonus">
                    <div class="light-holder">
                        <div class="dot"></div>
                        <div class="light"></div>
                    </div>
                    <div class="button-holder">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <p>Bonus</p>
                    </div>
                </button>
            </div>
            <div class="light-button">
                <button class="bt action-btn menu">
                    <div class="light-holder">
                        <div class="dot"></div>
                        <div class="light"></div>
                    </div>
                    <div class="button-holder">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                        <p>Settings</p>
                    </div>
                </button>
            </div>
            <div class="light-button">
                <button class="bt action-btn info">
                    <div class="light-holder">
                        <div class="dot"></div>
                        <div class="light"></div>
                    </div>
                    <div class="button-holder">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V9h-2v4z"/>
                        </svg>
                        <p>Paytable</p>
                    </div>
                </button>
            </div>
        </div>

        <div class="control-section">
            <div class="light-button spin-light-button">
                <button on:click={handleSpin} class="bt spin-btn" disabled={isSpinning}>
                    <div class="light-holder">
                        <div class="dot"></div>
                        <div class="light"></div>
                    </div>
                    <div class="button-holder spin-button-holder">
                        <div class="spin-image-container" class:spinning={isSpinning}>
                            <img src="/spin.png" alt="Spin" class="spin-image" />
                            <span class="spin-text">SPIN</span>
                        </div>
                    </div>
                </button>
            </div>
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

    /* Game Info Illumination */
    .game-info {
        display: flex;
        gap: 30px;
        min-width: 200px;
        justify-content: flex-start;
        align-items: flex-end;
        height: 120px;
    }

    .illuminated-info {
        position: relative;
        padding: 15px 20px;
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid #ffd700;
        border-radius: 8px;
        backdrop-filter: blur(5px);
    }

    .illuminated-info::before {
        content: '';
        position: absolute;
        top: -15px;
        left: 50%;
        transform: translateX(-50%);
        width: 8px;
        height: 8px;
        background: #ffd700;
        border-radius: 50%;
        box-shadow: 0 0 10px #ffd700;
    }

    .info-light {
        position: absolute;
        top: -15px;
        left: 50%;
        transform: translateX(-50%);
        width: 80px;
        height: 30px;
        background: linear-gradient(
            180deg,
            rgba(255, 215, 0, 0.6) 0%,
            rgba(255, 215, 0, 0.2) 50%,
            rgba(255, 255, 255, 0) 100%
        );
        clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        pointer-events: none;
    }

    .illuminated-input {
        background: rgba(0, 0, 0, 0.9) !important;
        border-color: #ffd700 !important;
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.3) !important;
    }

    .illuminated-input:focus {
        box-shadow: 0 0 25px rgba(255, 215, 0, 0.6) !important;
    }

    .bet-input {
        width: 80px;
        padding: 8px 12px;
        border: 2px solid #ffd700;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.8);
        color: #ffd700;
        font-size: 1rem;
        font-weight: bold;
        text-align: center;
        outline: none;
        transition: all 0.3s ease;
    }

    .bet-input:focus {
        border-color: #ffed4e;
        box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        background: rgba(0, 0, 0, 0.9);
    }

    .bet-input::-webkit-outer-spin-button,
    .bet-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .bet-input[type=number] {
        -moz-appearance: textfield;
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
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
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

    .spin-btn:disabled {
        opacity: 0.8;
        cursor: not-allowed;
        transform: none;
    }

    .spin-image-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s ease;
        position: relative;
    }

    .spin-image-container.spinning {
        animation: spin-clockwise 1s linear infinite;
    }

    .spin-image {
        width: 70px;
        height: 70px;
        object-fit: contain;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    }

    .spin-text {
        position: absolute;
        color: black;
        font-size: 1.4rem;
        font-weight: bold;
        text-shadow: 
            1px 1px 2px rgba(255, 255, 255, 0.8),
            0 0 4px rgba(255, 255, 255, 0.6);
        letter-spacing: 1px;
        pointer-events: none;
        z-index: 1;
    }

    @keyframes spin-clockwise {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    /* Lightning Startup Animation */
    .bottom-panel {
        transition: all 0.3s ease;
    }

    .bottom-panel:not(.lightning):not(.illuminated) {
        background: #000000;
        border-top-color: #333333;
    }

    .bottom-panel:not(.lightning):not(.illuminated) * {
        opacity: 0;
    }

    .bottom-panel.lightning {
        background: #000000;
        animation: lightning-flash 0.3s infinite;
    }

    .bottom-panel.lightning * {
        opacity: 0;
    }

    @keyframes lightning-flash {
        0%, 90% { background: #000000; }
        5%, 15%, 25%, 35%, 45% { 
            background: radial-gradient(circle, #ffffff 0%, #87ceeb 30%, #000000 70%);
            box-shadow: 0 0 50px rgba(135, 206, 235, 0.8);
        }
    }

    .bottom-panel.illuminated * {
        opacity: 1;
        transition: opacity 1s ease-in-out;
    }

    /* Light Button Styling */
    .light-button {
        position: relative;
        display: inline-block;
    }

    .light-button button.bt {
        position: relative;
        height: 120px;
        width: 80px;
        display: flex;
        align-items: flex-end;
        outline: none;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
    }

    .light-button button.bt .button-holder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 60px;
        width: 80px;
        background-color: #0a0a0a;
        border-radius: 8px;
        color: #666666;
        font-weight: 700;
        transition: all 200ms ease;
        outline: #333333 1px solid;
        outline-offset: 1px;
        border: 2px solid #ffd700;
    }

    .light-button button.bt .button-holder svg {
        height: 24px;
        width: 24px;
        fill: #666666;
        transition: fill 200ms ease;
    }

    .light-button button.bt .button-holder p {
        margin: 4px 0 0 0;
        font-size: 0.7rem;
        font-weight: bold;
    }

    .light-button button.bt .light-holder {
        position: absolute;
        height: 120px;
        width: 80px;
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
    }

    .light-button button.bt .light-holder .dot {
        position: absolute;
        top: 0;
        width: 6px;
        height: 6px;
        background-color: #ffd700;
        border-radius: 50%;
        z-index: 2;
    }

    .light-button button.bt .light-holder .light {
        position: absolute;
        top: 0;
        width: 100px;
        height: 100px;
        clip-path: polygon(50% 0%, 30% 100%, 70% 100%);
        background: transparent;
        transition: background 200ms ease;
    }

    .light-button button.bt:hover .button-holder svg {
        fill: #666666;
    }

    .light-button button.bt:hover .button-holder {
        color: #666666;
        outline: #333333 1px solid;
        outline-offset: 1px;
        background-color: #0a0a0a;
    }

    .light-button button.bt:hover .light-holder .light {
        background: linear-gradient(
            to bottom,
            rgba(255, 215, 0, 0.4) 0%,
            rgba(255, 215, 0, 0.2) 50%,
            rgba(255, 215, 0, 0) 100%
        );
    }

    /* Spin Button Special Styling */
    .spin-light-button button.bt {
        height: 140px;
    }

    .spin-light-button button.bt .button-holder.spin-button-holder {
        height: 80px;
        width: 120px;
        background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
        border: 3px solid #ffd700;
        color: white;
    }

    .spin-light-button button.bt .light-holder {
        width: 120px;
        height: 140px;
    }

    .spin-light-button button.bt .light-holder .light {
        width: 160px;
        height: 140px;
    }

    .spin-light-button button.bt:hover .button-holder.spin-button-holder {
        background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
        transform: translateY(-3px) scale(1.05);
        box-shadow: 
            0 0 30px rgba(220, 38, 38, 0.6),
            0 5px 15px rgba(0, 0, 0, 0.3);
    }

    .spin-light-button button.bt:disabled {
        opacity: 0.8;
        cursor: not-allowed;
    }

    .spin-light-button button.bt:disabled .button-holder.spin-button-holder {
        transform: none;
    }

    /* Action Buttons Layout Update */
    .action-buttons {
        display: flex;
        gap: 20px;
        flex: 1;
        justify-content: center;
        align-items: flex-end;
        height: 120px;
    }

    /* Control Section Update */
    .control-section {
        display: flex;
        align-items: flex-end;
        min-width: 200px;
        justify-content: flex-end;
        height: 120px;
    }    /* Action Buttons */
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
        /* Remove colored background - uses light-button hover instead */
    }

    .action-btn.menu:hover {
        /* Remove colored background - uses light-button hover instead */
    }

    .action-btn.info:hover {
        /* Remove colored background - uses light-button hover instead */
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
