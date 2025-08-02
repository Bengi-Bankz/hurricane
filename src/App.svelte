<script>
    import { onMount } from "svelte";
    import { init, spin } from "./game.js";
    let canvasContainer;
    let isSpinning = false;
    let lastWin = null;
    let totalCredits = 1000.00; // Starting credits
    let betAmount = 10.00;
    let showGameInfo = false;

    // Game info constants
    const gameName = "HURRICANE CHASE";
    const tagline = "Where volatile weather meets volatile winnings";
    const maxWin = "5,000x";

    // Helper function to format currency
    function formatCurrency(amount) {
        return amount.toFixed(2);
    }

    // Ensure betAmount is properly formatted
    $: betAmount = parseFloat(parseFloat(betAmount).toFixed(2));

    onMount(() => {
        if (canvasContainer) {
            init(canvasContainer);
        }
    });

    function handleSpin() {
        if (!isSpinning && totalCredits >= betAmount) {
            isSpinning = true;
            totalCredits = parseFloat((totalCredits - betAmount).toFixed(2));
            lastWin = null;

            spin(betAmount).then((result) => {
                if (result && result.totalPayout > 0) {
                    lastWin = result;
                    totalCredits = parseFloat((totalCredits + result.totalPayout).toFixed(2));
                }
                isSpinning = false;
            });
        }
    }

    function toggleGameInfo() {
        showGameInfo = !showGameInfo;
    }
</script>

<div class="game-layout">
    <!-- Main game area -->
    <div class="game-main">
        <div bind:this={canvasContainer} class="canvas-area"></div>
    </div>

    <!-- Win display -->
    {#if lastWin && lastWin.totalPayout > 0}
        <div class="win-notification">
            <div class="text-lg font-bold">WIN!</div>
            <div class="text-xl">+${formatCurrency(lastWin.totalPayout)}</div>
            <div class="text-sm">
                {lastWin.wins.length} payline{lastWin.wins.length > 1
                    ? "s"
                    : ""}
            </div>
        </div>
    {/if}

    <!-- Fixed bottom control panel -->
    <div class="bottom-panel">
        <div class="game-info">
            <div class="info-item">
                <span class="label">Balance</span>
                <span class="value">${formatCurrency(totalCredits)}</span>
            </div>
            <div class="info-item">
                <span class="label">Bet</span>
                <input
                    type="number"
                    class="bet-input"
                    bind:value={betAmount}
                    min="10.00"
                    max="100.00"
                    step="10.00"
                />
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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V9h-2v4z"
                            />
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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                            />
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
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                            />
                        </svg>
                        <p>Bonus</p>
                    </div>
                </button>
            </div>
        </div>

        <div class="control-section">
            <div class="light-button spin-light-button">
                <button
                    on:click={handleSpin}
                    class="bt spin-btn"
                    disabled={isSpinning || totalCredits < betAmount}
                >
                    <div class="light-holder">
                        <div class="dot"></div>
                        <div class="light"></div>
                    </div>
                    <div class="button-holder spin-button-holder">
                        <div
                            class="spin-image-container"
                            class:spinning={isSpinning}
                        >
                            <img
                                src="/spin.png"
                                alt="Spin"
                                class="spin-image"
                            />
                            <span class="spin-text"
                                >{isSpinning ? "SPINNING..." : "SPIN"}</span
                            >
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
                    <button class="close-btn" on:click={toggleGameInfo}
                        >×</button
                    >
                </div>
                <div class="modal-body">
                    <p class="tagline">{tagline}</p>

                    <section class="info-section">
                        <h2 class="section-title about">ABOUT THE GAME</h2>
                        <p class="section-text">
                            Hurricane Chase is a catastrophic 5x5 storm-themed
                            slot where volatile weather meets volatile winnings.
                            Featuring Walking Wilds, Expanding Multipliers, and
                            multiple Scatter-based bonus modes, it delivers a
                            max win of {maxWin}.
                        </p>
                    </section>

                    <section class="info-section">
                        <h2 class="section-title payouts">SYMBOL PAYOUTS</h2>
                        <div class="symbol-payouts-grid">
                            <!-- Low Symbols Row 1 -->
                            <div class="symbol-group">
                                <div class="symbol-header low-symbols">10</div>
                                <div class="symbol-card">
                                    <img
                                        src="/10.png"
                                        alt="10"
                                        class="symbol-image-simple"
                                    />
                                    <div class="payout-values">
                                        <p>5 – 1.00x</p>
                                        <p>4 – 0.50x</p>
                                        <p>3 – 0.10x</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group">
                                <div class="symbol-header low-symbols">
                                    JACK
                                </div>
                                <div class="symbol-card">
                                    <img
                                        src="/jack.png"
                                        alt="Jack"
                                        class="symbol-image-simple"
                                    />
                                    <div class="payout-values">
                                        <p>5 – 1.25x</p>
                                        <p>4 – 0.60x</p>
                                        <p>3 – 0.15x</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group">
                                <div class="symbol-header low-symbols">
                                    QUEEN
                                </div>
                                <div class="symbol-card">
                                    <img
                                        src="/queen.png"
                                        alt="Queen"
                                        class="symbol-image-simple"
                                    />
                                    <div class="payout-values">
                                        <p>5 – 1.50x</p>
                                        <p>4 – 0.75x</p>
                                        <p>3 – 0.20x</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group">
                                <div class="symbol-header low-symbols">
                                    KING
                                </div>
                                <div class="symbol-card">
                                    <img
                                        src="/king.png"
                                        alt="King"
                                        class="symbol-image-simple"
                                    />
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
                                    <img
                                        src="/ace.png"
                                        alt="Ace"
                                        class="symbol-image-simple"
                                    />
                                    <div class="payout-values">
                                        <p>5 – 2.50x</p>
                                        <p>4 – 1.25x</p>
                                        <p>3 – 0.30x</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Mid Symbols Row 2 -->
                            <div class="symbol-group">
                                <div class="symbol-header mid-symbols">
                                    WINDSOCK
                                </div>
                                <div class="symbol-card">
                                    <img
                                        src="/windsock.png"
                                        alt="Windsock"
                                        class="symbol-image-simple"
                                    />
                                    <div class="payout-values">
                                        <p>5 – 3.00x</p>
                                        <p>4 – 1.50x</p>
                                        <p>3 – 0.50x</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group">
                                <div class="symbol-header mid-symbols">
                                    WATER
                                </div>
                                <div class="symbol-card">
                                    <img
                                        src="/water.png"
                                        alt="Water"
                                        class="symbol-image-simple"
                                    />
                                    <div class="payout-values">
                                        <p>5 – 4.00x</p>
                                        <p>4 – 2.00x</p>
                                        <p>3 – 0.60x</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group">
                                <div class="symbol-header mid-symbols">
                                    RADIO
                                </div>
                                <div class="symbol-card">
                                    <img
                                        src="/radio.png"
                                        alt="Radio"
                                        class="symbol-image-simple"
                                    />
                                    <div class="payout-values">
                                        <p>5 – 5.00x</p>
                                        <p>4 – 2.50x</p>
                                        <p>3 – 0.75x</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group">
                                <div class="symbol-header top-symbols">
                                    FLASHLIGHT
                                </div>
                                <div class="symbol-card">
                                    <img
                                        src="/flashlight.png"
                                        alt="Flashlight"
                                        class="symbol-image-simple"
                                    />
                                    <div class="payout-values">
                                        <p>5 – 7.50x</p>
                                        <p>4 – 3.75x</p>
                                        <p>3 – 1.00x</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group">
                                <div class="symbol-header top-symbols">
                                    EVAC SIGN
                                </div>
                                <div class="symbol-card">
                                    <img
                                        src="/evacsign.png"
                                        alt="Evac Sign"
                                        class="symbol-image-simple"
                                    />
                                    <div class="payout-values">
                                        <p>5 – 10.00x</p>
                                        <p>4 – 5.00x</p>
                                        <p>3 – 1.25x</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Special Symbols Row 3 -->
                            <div class="symbol-group special-wild">
                                <div class="symbol-header wild-symbols">
                                    WILD SYMBOLS
                                </div>
                                <div class="symbol-card">
                                    <div class="wild-variants">
                                        <img
                                            src="/wild.png"
                                            alt="Wild 1x"
                                            class="wild-image"
                                        />
                                        <img
                                            src="/wild2x.png"
                                            alt="Wild 2x"
                                            class="wild-image"
                                        />
                                        <img
                                            src="/wild3x.png"
                                            alt="Wild 3x"
                                            class="wild-image"
                                        />
                                        <img
                                            src="/wild4x.png"
                                            alt="Wild 4x"
                                            class="wild-image"
                                        />
                                        <img
                                            src="/wild5x.png"
                                            alt="Wild 5x"
                                            class="wild-image"
                                        />
                                    </div>
                                    <div class="payout-values">
                                        <p>Substitutes for all symbols</p>
                                        <p>Multipliers: 1x, 2x, 3x, 4x, 5x</p>
                                        <p>Walking Wild feature</p>
                                    </div>
                                </div>
                            </div>
                            <div class="symbol-group special-scatter">
                                <div class="symbol-header scatter-symbols">
                                    SCATTER
                                </div>
                                <div class="symbol-card">
                                    <img
                                        src="/scatter.png"
                                        alt="Scatter"
                                        class="symbol-image-simple"
                                    />
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
                        <h2 class="section-title ways">15 PAYLINES</h2>
                        <p class="section-text">
                            Win if matching symbols appear in any of the 15
                            predefined line paths starting from leftmost reel.
                            Multiple wins are added together.
                        </p>
                        <div class="paylines-image-container">
                            <img
                                src="/15paylines.png"
                                alt="15 Paylines"
                                class="paylines-image"
                            />
                        </div>

                        <div class="paylines-breakdown">
                            <div class="payline-category">
                                <h3 class="payline-category-title">
                                    Lines 1-5: Horizontal Lines (each row)
                                </h3>
                                <ul class="payline-list">
                                    <li>
                                        <strong>Line 1:</strong> Top row (0,0)→(0,1)→(0,2)→(0,3)→(0,4)
                                    </li>
                                    <li>
                                        <strong>Line 2:</strong> Second row (1,0)→(1,1)→(1,2)→(1,3)→(1,4)
                                    </li>
                                    <li>
                                        <strong>Line 3:</strong> Middle row (2,0)→(2,1)→(2,2)→(2,3)→(2,4)
                                    </li>
                                    <li>
                                        <strong>Line 4:</strong> Fourth row (3,0)→(3,1)→(3,2)→(3,3)→(3,4)
                                    </li>
                                    <li>
                                        <strong>Line 5:</strong> Bottom row (4,0)→(4,1)→(4,2)→(4,3)→(4,4)
                                    </li>
                                </ul>
                            </div>

                            <div class="payline-category">
                                <h3 class="payline-category-title">
                                    Lines 6-13: Zigzag Patterns
                                </h3>
                                <p class="payline-description">
                                    Various up/down patterns across the reels
                                </p>
                            </div>

                            <div class="payline-category">
                                <h3 class="payline-category-title">
                                    Lines 14-15: Diagonal Lines
                                </h3>
                                <ul class="payline-list">
                                    <li>
                                        <strong>Line 14:</strong> Top-left to bottom-right
                                        diagonal
                                    </li>
                                    <li>
                                        <strong>Line 15:</strong> Bottom-left to
                                        top-right diagonal
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section class="info-section">
                        <h2 class="section-title general">GENERAL</h2>
                        <ul class="general-list">
                            <li>Bet range: 10 to 100 coins</li>
                            <li>Max win: {maxWin}</li>
                            <li>15 fixed paylines</li>
                            <li>Wild symbols substitute for all symbols</li>
                        </ul>
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
        min-height: 0;
    }

    .canvas-area {
        width: 100vw;
        height: calc(100vh - 120px);
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

    .win-notification {
        position: absolute;
        top: 20px;
        right: 20px;
        background: #16a34a;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 100;
        animation: pulse 2s infinite;
        border: 2px solid #ffd700;
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

    .game-info {
        display: flex;
        gap: 30px;
        min-width: 200px;
        justify-content: flex-start;
        align-items: flex-end;
        height: 120px;
    }

    .info-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 15px 20px;
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid #ffd700;
        border-radius: 8px;
        backdrop-filter: blur(5px);
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

    .action-buttons {
        display: flex;
        gap: 20px;
        flex: 1;
        justify-content: center;
        align-items: flex-end;
        height: 120px;
    }

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

    .light-button button.bt:hover .light-holder .light {
        background: linear-gradient(
            to bottom,
            rgba(255, 215, 0, 0.4) 0%,
            rgba(255, 215, 0, 0.2) 50%,
            rgba(255, 215, 0, 0) 100%
        );
    }

    .control-section {
        display: flex;
        align-items: flex-end;
        min-width: 200px;
        justify-content: flex-end;
        height: 120px;
    }

    .spin-light-button button.bt {
        height: 140px;
    }

    .spin-light-button button.bt .button-holder.spin-button-holder {
        height: 90px;
        width: 220px;
        background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
        border: 3px solid #ffd700;
        color: white;
    }

    .spin-light-button button.bt .light-holder {
        width: 220px;
        height: 140px;
    }

    .spin-light-button button.bt .light-holder .light {
        width: 260px;
        height: 140px;
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
        width: 110px;
        height: 110px;
        object-fit: contain;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    }

    .spin-text {
        position: absolute;
        color: black;
        font-size: 2rem;
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

    /* Modal Styles */
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
        background: linear-gradient(
            135deg,
            #1a1a2e 0%,
            #16213e 50%,
            #0f1419 100%
        );
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
        background: linear-gradient(
            90deg,
            rgba(0, 212, 255, 0.1) 0%,
            transparent 100%
        );
    }

    .modal-title {
        color: #00d4ff;
        font-family: "Orbitron", monospace;
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
        font-family: "Orbitron", monospace;
        font-size: 18px;
        font-weight: 700;
        text-align: center;
        margin-bottom: 30px;
    }

    .info-section {
        margin-bottom: 30px;
    }

    .section-title {
        color: #00d4ff;
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 15px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .section-text {
        color: #e2e8f0;
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 15px;
    }

    .symbol-payouts-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1rem;
        margin-top: 1rem;
    }

    .symbol-group {
        background: linear-gradient(135deg, #1e3c72, #2a5298);
        border: 2px solid #f1c40f;
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .symbol-group.special-wild,
    .symbol-group.special-scatter {
        grid-column: span 2;
    }

    .symbol-header {
        padding: 0.5rem;
        text-align: center;
        font-weight: bold;
        font-size: 0.8rem;
        color: #fff;
    }

    .symbol-header.low-symbols {
        background: linear-gradient(135deg, #8e44ad, #3498db);
    }

    .symbol-header.mid-symbols {
        background: linear-gradient(135deg, #e67e22, #f39c12);
    }

    .symbol-header.top-symbols {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
    }

    .symbol-header.wild-symbols {
        background: linear-gradient(135deg, #2ecc71, #27ae60);
    }

    .symbol-header.scatter-symbols {
        background: linear-gradient(135deg, #9b59b6, #8e44ad);
    }

    .symbol-card {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        flex-grow: 1;
    }

    .symbol-image-simple {
        width: 30px;
        height: 30px;
        object-fit: contain;
        border: 2px solid #f1c40f;
        border-radius: 4px;
    }

    .symbol-image-standalone {
        width: 30px;
        height: 30px;
        object-fit: contain;
        border: 2px solid #f1c40f;
        border-radius: 4px;
    }

    .wild-variants {
        display: flex;
        gap: 0.25rem;
        flex-wrap: wrap;
        justify-content: center;
    }

    .wild-image {
        width: 20px;
        height: 20px;
        object-fit: contain;
        border: 1px solid #f1c40f;
        border-radius: 2px;
    }

    .payout-values {
        text-align: center;
        color: #f1c40f;
        font-size: 0.8rem;
        line-height: 1.3;
    }

    .payout-values p {
        margin: 0.1rem 0;
    }

    @media (max-width: 1200px) {
        .symbol-payouts-grid {
            grid-template-columns: repeat(3, 1fr);
        }

        .symbol-group.special-wild,
        .symbol-group.special-scatter {
            grid-column: span 1;
        }
    }

    @media (max-width: 768px) {
        .symbol-payouts-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .symbol-image-simple,
        .symbol-image-standalone {
            width: 25px;
            height: 25px;
        }

        .wild-image {
            width: 15px;
            height: 15px;
        }

        .payout-values {
            font-size: 0.7rem;
        }
    }

    .paylines-image-container {
        text-align: center;
        margin: 20px 0;
    }

    .paylines-image {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        border: 1px solid #ffd700;
    }

    .paylines-breakdown {
        margin-top: 20px;
    }

    .payline-category {
        margin-bottom: 20px;
        background: rgba(0, 0, 0, 0.2);
        padding: 15px;
        border-radius: 8px;
        border-left: 3px solid #ffd700;
    }

    .payline-category-title {
        color: #ffd700;
        font-size: 16px;
        font-weight: bold;
        margin: 0 0 10px 0;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .payline-list {
        color: #e2e8f0;
        padding-left: 20px;
        margin: 0;
    }

    .payline-list li {
        margin-bottom: 8px;
        font-size: 14px;
        line-height: 1.5;
    }

    .payline-list strong {
        color: #00d4ff;
    }

    .payline-description {
        color: #e2e8f0;
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
        font-style: italic;
    }

    .general-list {
        color: #e2e8f0;
        padding-left: 20px;
    }

    .general-list li {
        margin-bottom: 8px;
        font-size: 14px;
        line-height: 1.5;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.7;
        }
    }
</style>
