<script>
    import { onMount } from "svelte";
    import { init, triggerHurricane, getReelSpinningState, getGameData } from "./game.js";
    let balance = 1000;
    let betAmount = 10;
    let canvasContainer;
    let isSpinning = false;
    let gameLoaded = false;
    let showLightning = false;
    let showGameInfo = false;
    let gameData = {
        totalWinnings: 0,
        hurricaneCategory: 0
    };
    
    // Game info data
    let gameName = "Hurricane Chase";
    let tagline = "Monster Storm Bank Rolls into the Gulf and is Building";
    let maxWin = "55,555X base bet";
    
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
    
    function toggleGameInfo() {
        showGameInfo = !showGameInfo;
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
            <div class="light-button">
                <button on:click={toggleGameInfo} class="bt action-btn menu">
                    <div class="light-holder">
                        <div class="dot"></div>
                        <div class="light"></div>
                    </div>
                    <div class="button-holder">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                        </svg>
                        <p>Game Info</p>
                    </div>
                </button>
            </div>
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

    <!-- Game Info Modal -->
    {#if showGameInfo}
        <div class="modal-overlay" on:click={toggleGameInfo}>
            <div class="modal-content" on:click|stopPropagation>
                <div class="modal-header">
                    <h1 class="modal-title">GAME INFO – {gameName}</h1>
                    <button class="close-btn" on:click={toggleGameInfo}>×</button>
                </div>
                <div class="modal-body">
                    <p class="tagline">{tagline}</p>

                    <section class="info-section">
                        <h2 class="section-title about">ABOUT THE GAME</h2>
                        <p class="section-text">
                            Hurricane Chase is a catastrophic 5x5 storm-themed slot where volatile weather meets volatile winnings.
                            Featuring Walking Wilds, Expanding Multipliers, and multiple Scatter-based bonus modes, it delivers a max win of {maxWin}.
                        </p>
                    </section>

                    <section class="info-section">
                        <h2 class="section-title features">FEATURES</h2>
                        <div class="feature-item">
                            <h3 class="feature-title">Tracking the Tropics (3 Scatters)</h3>
                            <p class="feature-text">
                                Initiates when 3 Stormtracker Scatter symbols land. The storm enters the board and walks left each spin,
                                increasing its category multiplier with each move. If it reaches the edge, Landfall occurs — multiplying the total win by the storm's final category.
                            </p>
                        </div>
                        <div class="feature-item">
                            <h3 class="feature-title">Hurricane Alley (4 Scatters)</h3>
                            <p class="feature-text">
                                Triggers 10 free spins with a guaranteed Category 2+ storm and added Wilds with multipliers across reels.
                            </p>
                        </div>
                        <div class="feature-item">
                            <h3 class="feature-title">Cyclone Zone (5 Scatters)</h3>
                            <p class="feature-text">
                                Super Bonus round with 15 free spins, stacked Wilds, and progressive storm categories that can reach up to Cat 5 for max Landfall multipliers.
                            </p>
                        </div>
                    </section>

                    <section class="info-section">
                        <h2 class="section-title walking-wild">WALKING WILD – STORMTRACKER</h2>
                        <p class="section-text">
                            When triggered, the Stormtracker Wild moves left each spin, applying its current category multiplier (1x to 5x) to line payouts it participates in.
                            Upon reaching reel 1, it multiplies the total spin win by the final storm category (Landfall).
                        </p>
                    </section>

                    <section class="info-section">
                        <h2 class="section-title payouts">SYMBOL PAYOUTS</h2>
                        <div class="symbol-payouts-grid">
                            <!-- Low Symbols Row 1 -->
                            <div class="symbol-group">
                                <div class="symbol-header low-symbols">10</div>
                                <div class="symbol-card">
                                    <div class="symbol-image" style="background-position: calc(-522px * 0.4838) calc(-738px * 0.4838);"></div>
                                    <div class="payout-values">
                                        <p>5 – 1.00x</p>
                                        <p>4 – 0.50x</p>
                                        <p>3 – 0.10x</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group">
                                <div class="symbol-header low-symbols">JACK</div>
                                <div class="symbol-card">
                                    <div class="symbol-image" style="background-position: calc(-456px * 0.4838) calc(-128px * 0.4838);"></div>
                                    <div class="payout-values">
                                        <p>5 – 1.25x</p>
                                        <p>4 – 0.60x</p>
                                        <p>3 – 0.15x</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group">
                                <div class="symbol-header low-symbols">QUEEN</div>
                                <div class="symbol-card">
                                    <div class="symbol-image" style="background-position: calc(-294px * 0.4838) calc(-455px * 0.4838);"></div>
                                    <div class="payout-values">
                                        <p>5 – 1.50x</p>
                                        <p>4 – 0.75x</p>
                                        <p>3 – 0.20x</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group">
                                <div class="symbol-header low-symbols">KING</div>
                                <div class="symbol-card">
                                    <div class="symbol-image" style="background-position: calc(-456px * 0.4838) calc(-2px * 0.4838);"></div>
                                    <div class="payout-values">
                                        <p>5 – 2.00x</p>
                                        <p>4 – 1.00x</p>
                                        <p>3 – 0.25x</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group">
                                <div class="symbol-header low-symbols">ACE</div>
                                <div class="symbol-card">
                                    <div class="symbol-image" style="background-position: calc(-396px * 0.4838) calc(-634px * 0.4838);"></div>
                                    <div class="payout-values">
                                        <p>5 – 2.50x</p>
                                        <p>4 – 1.25x</p>
                                        <p>3 – 0.30x</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Mid Symbols Row 2 -->
                            <div class="symbol-group">
                                <div class="symbol-header mid-symbols">WINDSOCK</div>
                                <div class="symbol-card">
                                    <div class="symbol-image" style="background-position: calc(-2px * 0.4838) calc(-2px * 0.4838);"></div>
                                    <div class="payout-values">
                                        <p>5 – 3.00x</p>
                                        <p>4 – 1.50x</p>
                                        <p>3 – 0.50x</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group">
                                <div class="symbol-header mid-symbols">WATER</div>
                                <div class="symbol-card">
                                    <img src="/water.png" alt="Water" class="symbol-image-standalone" />
                                    <div class="payout-values">
                                        <p>5 – 4.00x</p>
                                        <p>4 – 2.00x</p>
                                        <p>3 – 0.60x</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group">
                                <div class="symbol-header mid-symbols">RADIO</div>
                                <div class="symbol-card">
                                    <div class="symbol-image" style="background-position: calc(-294px * 0.4838) calc(-329px * 0.4838);"></div>
                                    <div class="payout-values">
                                        <p>5 – 5.00x</p>
                                        <p>4 – 2.50x</p>
                                        <p>3 – 0.75x</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group">
                                <div class="symbol-header top-symbols">FLASHLIGHT</div>
                                <div class="symbol-card">
                                    <div class="symbol-image" style="background-position: calc(-456px * 0.4838) calc(-254px * 0.4838);"></div>
                                    <div class="payout-values">
                                        <p>5 – 7.50x</p>
                                        <p>4 – 3.75x</p>
                                        <p>3 – 1.00x</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group">
                                <div class="symbol-header top-symbols">EVAC SIGN</div>
                                <div class="symbol-card">
                                    <div class="symbol-image" style="background-position: calc(-420px * 0.4838) calc(-380px * 0.4838);"></div>
                                    <div class="payout-values">
                                        <p>5 – 10.00x</p>
                                        <p>4 – 5.00x</p>
                                        <p>3 – 1.25x</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Special Symbols Row 3 -->
                            <div class="symbol-group special-wild">
                                <div class="symbol-header wild-symbols">WILD SYMBOLS</div>
                                <div class="symbol-card">
                                    <div class="wild-variants">
                                        <img src="/wild.png" alt="Wild 1x" class="wild-image" />
                                        <img src="/wild2x.png" alt="Wild 2x" class="wild-image" />
                                        <img src="/wild3x.png" alt="Wild 3x" class="wild-image" />
                                        <img src="/wild4x.png" alt="Wild 4x" class="wild-image" />
                                        <img src="/wild5x.png" alt="Wild 5x" class="wild-image" />
                                    </div>
                                    <div class="payout-values">
                                        <p>Substitutes for all symbols</p>
                                        <p>Multipliers: 1x, 2x, 3x, 4x, 5x</p>
                                        <p>Walking Wild feature</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group special-scatter">
                                <div class="symbol-header scatter-symbols">SCATTER</div>
                                <div class="symbol-card">
                                    <div class="symbol-image" style="background-position: calc(-2px * 0.4838) calc(-128px * 0.4838);"></div>
                                    <div class="payout-values">
                                        <p>3+ – Tracking the Tropics</p>
                                        <p>4+ – Hurricane Alley</p>
                                        <p>5 – Cyclone Zone</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="info-section">
                        <h2 class="section-title ways">WAYS TO WIN</h2>
                        <p class="section-text">
                            Win if matching symbols appear in any of the 15 predefined line paths starting from leftmost reel. Multiple wins are added together.
                        </p>
                        
                        <div class="paylines-section">
                            <h3 class="paylines-title">15 PAYLINES</h3>
                            <div class="paylines-image-container">
                                <img src="/15paylines.png" alt="15 Paylines" class="paylines-image" />
                            </div>
                            <div class="paylines-description">
                                <p>The game features 15 fixed paylines across the 5×5 grid:</p>
                                <ul class="paylines-list">
                                    <li><strong>Lines 1-5:</strong> Horizontal lines (top to bottom rows)</li>
                                    <li><strong>Lines 6-7:</strong> Diagonal lines (top-left to bottom-right)</li>
                                    <li><strong>Lines 8-9:</strong> Diagonal lines (bottom-left to top-right)</li>
                                    <li><strong>Lines 10-15:</strong> Zigzag and special patterns</li>
                                </ul>
                                <p class="paylines-note">
                                    All paylines read from left to right. Minimum 3 consecutive matching symbols required for a win.
                                    Wild symbols substitute for all regular symbols to help complete winning combinations.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section class="info-section">
                        <h2 class="section-title bonus">BONUS BUY & RTP</h2>
                        <p class="section-text">
                            Buy into Tracking the Tropics, Hurricane Alley, or Cyclone Zone directly via the Bonus Buy feature. RTP:
                        </p>
                        <ul class="rtp-list">
                            <li>Tracking the Tropics: 97.21%</li>
                            <li>Hurricane Alley: 97.44%</li>
                            <li>Cyclone Zone: 97.50%</li>
                        </ul>
                    </section>

                    <section class="info-section">
                        <h2 class="section-title general">GENERAL</h2>
                        <ul class="general-list">
                            <li>Bet range: $0.20 to $500</li>
                            <li>Spin with mouse, spacebar, or touch</li>
                            <li>Max win: {maxWin}</li>
                            <li>Autoplay and Turbo available</li>
                        </ul>
                    </section>

                    <section class="info-section">
                        <h2 class="section-title terms">TERMS & CONDITIONS</h2>
                        <p class="terms-text">
                            Malfunction voids all plays and pays. This game uses a random number generator and is not based on a physical machine. Hurricane Chase (v1.0.0).
                        </p>
                    </section>
                </div>
            </div>
        </div>
    {/if}
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
        width: 110px; /* Increased from 85px */
        height: 110px; /* Increased from 85px */
        object-fit: contain;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    }

    .spin-text {
        position: absolute;
        color: black;
        font-size: 2.0rem; /* Increased from 1.6rem */
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
        height: 200px; /* Increased from 160px */
    }

    .spin-light-button button.bt .button-holder.spin-button-holder {
        height: 130px; /* Increased from 100px */
        width: 180px; /* Increased from 140px */
        background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
        border: 3px solid #ffd700;
        color: white;
    }

    .spin-light-button button.bt .light-holder {
        width: 180px; /* Increased from 140px */
        height: 200px; /* Increased from 160px */
    }

    .spin-light-button button.bt .light-holder .light {
        width: 220px; /* Increased from 180px */
        height: 200px; /* Same as container height */
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

    /* Game Info Modal Styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(5px);
    }

    .modal-content {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%);
        border: 2px solid #00d4ff;
        border-radius: 12px;
        width: 90%;
        max-width: 800px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 
            0 0 30px rgba(0, 212, 255, 0.5),
            inset 0 0 20px rgba(0, 212, 255, 0.1);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 25px;
        border-bottom: 2px solid rgba(0, 212, 255, 0.3);
        background: linear-gradient(90deg, rgba(0, 212, 255, 0.1) 0%, transparent 100%);
    }

    .modal-title {
        color: #00d4ff;
        font-family: 'Orbitron', monospace;
        font-size: 24px;
        font-weight: 900;
        text-shadow: 0 0 10px rgba(0, 212, 255, 0.8);
        margin: 0;
    }

    .close-btn {
        background: none;
        border: 2px solid #00d4ff;
        color: #00d4ff;
        font-size: 24px;
        font-weight: bold;
        width: 35px;
        height: 35px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }

    .close-btn:hover {
        background: #00d4ff;
        color: #0f1419;
        box-shadow: 0 0 15px rgba(0, 212, 255, 0.6);
        transform: scale(1.1);
    }

    .modal-body {
        padding: 25px;
    }

    .tagline {
        color: #ffd700;
        font-family: 'Orbitron', monospace;
        font-size: 18px;
        font-weight: 700;
        text-align: center;
        margin-bottom: 30px;
        text-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
    }

    .info-section {
        margin-bottom: 25px;
        padding: 20px;
        background: linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, rgba(255, 215, 0, 0.02) 100%);
        border-radius: 8px;
        border-left: 3px solid #00d4ff;
    }

    .section-title {
        color: #00d4ff;
        font-family: 'Orbitron', monospace;
        font-size: 16px;
        font-weight: 800;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        text-shadow: 0 0 6px rgba(0, 212, 255, 0.5);
    }

    .section-title.features {
        color: #ffd700;
        text-shadow: 0 0 6px rgba(255, 215, 0, 0.5);
    }

    .section-title.walking-wild {
        color: #ff6b35;
        text-shadow: 0 0 6px rgba(255, 107, 53, 0.5);
    }

    .section-title.payouts {
        color: #32cd32;
        text-shadow: 0 0 6px rgba(50, 205, 50, 0.5);
    }

    /* Paylines Section Styling */
    .paylines-section {
        margin-top: 20px;
        padding: 15px;
        background: rgba(50, 205, 50, 0.05);
        border-radius: 8px;
        border: 1px solid rgba(50, 205, 50, 0.2);
    }

    .paylines-title {
        color: #32cd32;
        font-family: 'Orbitron', monospace;
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 15px;
        text-align: center;
        text-shadow: 0 0 4px rgba(50, 205, 50, 0.5);
        letter-spacing: 1px;
    }

    .paylines-image-container {
        display: flex;
        justify-content: center;
        margin-bottom: 15px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 6px;
    }

    .paylines-image {
        max-width: 100%;
        height: auto;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .paylines-description {
        color: #e0e6ed;
        font-size: 13px;
        line-height: 1.5;
    }

    .paylines-list {
        margin: 10px 0;
        padding-left: 20px;
    }

    .paylines-list li {
        margin-bottom: 6px;
    }

    .paylines-list strong {
        color: #32cd32;
        text-shadow: 0 0 2px rgba(50, 205, 50, 0.3);
    }

    .paylines-note {
        margin-top: 15px;
        padding: 10px;
        background: rgba(50, 205, 50, 0.08);
        border-left: 3px solid #32cd32;
        border-radius: 4px;
        font-style: italic;
        font-size: 12px;
    }

    .section-text {
        color: #e0e6ed;
        font-family: 'Arial', sans-serif;
        font-size: 14px;
        line-height: 1.6;
        margin: 0;
    }

    .feature-item {
        margin-bottom: 15px;
        padding: 15px;
        background: rgba(255, 215, 0, 0.08);
        border-radius: 6px;
        border-left: 2px solid #ffd700;
    }

    .feature-title {
        color: #ffd700;
        font-family: 'Orbitron', monospace;
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 8px;
        text-shadow: 0 0 4px rgba(255, 215, 0, 0.4);
    }

    .feature-text {
        color: #e0e6ed;
        font-family: 'Arial', sans-serif;
        font-size: 13px;
        line-height: 1.5;
        margin: 0;
    }

    .rtp-list, .general-list {
        color: #e0e6ed;
        font-family: 'Arial', sans-serif;
        font-size: 14px;
        line-height: 1.6;
        margin: 10px 0 0 20px;
        padding: 0;
    }

    .rtp-list li, .general-list li {
        margin-bottom: 8px;
    }

    .terms-text {
        color: #b0b6bd;
        font-family: 'Arial', sans-serif;
        font-size: 12px;
        line-height: 1.5;
        font-style: italic;
        margin: 0;
    }

    /* Scrollbar styling for modal */
    .modal-content::-webkit-scrollbar {
        width: 8px;
    }

    .modal-content::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
    }

    .modal-content::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #00d4ff 0%, #0099cc 100%);
        border-radius: 4px;
    }

    .modal-content::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #00e6ff 0%, #00b3e6 100%);
    }

    /* Symbol Payouts Grid Styling */
    .symbol-payouts-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 15px;
        margin-top: 20px;
    }

    .symbol-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        padding: 15px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .symbol-group.special-wild {
        grid-column: span 2;
    }

    .symbol-group.special-scatter {
        grid-column: span 1;
    }

    .symbol-header {
        font-family: 'Orbitron', monospace;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 10px;
        text-align: center;
    }

    .symbol-header.low-symbols {
        color: #00d4ff;
        text-shadow: 0 0 4px rgba(0, 212, 255, 0.5);
    }

    .symbol-header.mid-symbols {
        color: #ffd700;
        text-shadow: 0 0 4px rgba(255, 215, 0, 0.5);
    }

    .symbol-header.top-symbols {
        color: #ff6b35;
        text-shadow: 0 0 4px rgba(255, 107, 53, 0.5);
    }

    .symbol-header.wild-symbols {
        color: #32cd32;
        text-shadow: 0 0 4px rgba(50, 205, 50, 0.5);
    }

    .symbol-header.scatter-symbols {
        color: #ff1493;
        text-shadow: 0 0 4px rgba(255, 20, 147, 0.5);
    }

    .symbol-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
    }

    .symbol-image {
        width: 60px;
        height: 60px;
        border-radius: 6px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        background: rgba(0, 0, 0, 0.5);
        background-image: url('/cat-sprites.png');
        background-repeat: no-repeat;
        /* Scale sprite sheet down to fit 60x60 containers */
        /* Original sprite sheet: 2630x1084, symbols: 124x124 */
        /* Scale factor: 60/124 = 0.4838 */
        background-size: calc(2630px * 0.4838) calc(1084px * 0.4838);
    }

    /* Standalone image styling for symbols like water.png */
    .symbol-image-standalone {
        width: 60px;
        height: 60px;
        border-radius: 6px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        background: rgba(0, 0, 0, 0.5);
        object-fit: contain;
    }

    .wild-variants {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        justify-content: center;
        max-width: 150px;
    }

    .wild-image {
        width: 25px;
        height: 25px;
        object-fit: contain;
        border-radius: 4px;
        border: 1px solid rgba(50, 205, 50, 0.3);
    }

    .payout-values {
        text-align: center;
        font-size: 11px;
        line-height: 1.4;
    }

    .payout-values p {
        margin: 2px 0;
        color: #e0e6ed;
    }

    /* Responsive grid for smaller screens */
    @media (max-width: 768px) {
        .symbol-payouts-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }
        
        .symbol-group.special-wild {
            grid-column: span 3;
        }
        
        .symbol-group.special-scatter {
            grid-column: span 3;
        }
        
        .symbol-image {
            width: 50px;
            height: 50px;
        }
        
        .wild-image {
            width: 20px;
            height: 20px;
        }
    }

    @media (max-width: 480px) {
        .symbol-payouts-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .symbol-group {
            padding: 10px;
        }
        
        .symbol-image {
            width: 40px;
            height: 40px;
        }
        
        .payout-values {
            font-size: 10px;
        }
    }
</style>
