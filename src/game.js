import {
    Application,
    Assets,
    Sprite,
    Spritesheet,
    Container,
    Graphics
} from "pixi.js";

let app;

const COLS = 5;
const ROWS = 5;
const cellSize = 124;

let sheet;
let hurricane = null;
let hurricaneCol = null;
let hurricaneCategory = null;
let walking = false;
let reels = []; // Store reel symbols
let totalWinnings = 0;
let hurricaneSpinRotation = 0;

// Reel spinning mechanics
let reelSpinning = false;
let reelContainers = []; // Containers for each reel column
let reelSymbols = []; // 2D array of symbol sprites for spinning
let spinSpeeds = [0, 0, 0, 0, 0]; // Speed for each reel column
let baseSpinSpeed = 8; // Base spinning speed (much faster now)
let stormSpeedMultiplier = 2.5; // How much faster reels spin in front of storm
let postStormSpeedMultiplier = 1.5; // Post-storm reels still spin fast but opposite direction
let symbolsSpun = [0, 0, 0, 0, 0]; // Track how many symbols each reel has spun
let activeWildPlaceholders = []; // Track active wild placeholder sprites for removal

const symbolNames = [
    "windsockhc.png",
    "waterhc.png",
    "radiohc.png",
    "queenhc.png",
    "kinghc.png",
    "jackhc.png",
    "flashlighthc.png",
    "evacsignhc.png",
    "acehc.png",
    "10hc.png"
];

// Hurricane category sprites
const hurricaneSprites = [
    "cat1.png",
    "cat2.png",
    "cat3.png",
    "cat4.png",
    "cat5.png"
];

// Free spins scatter vs walking wild scatter
const freeSpinsScatterSprite = "scatterhc.png";
const scatterSpriteName = "scatterhc-removebg-preview.png";
const fullReelSprite = "fullreelhc.png";

// Wild placeholder sprites (one for each category)
const wildPlaceholderSprites = [
    "wild.png",      // Category 1
    "wild2x.png",    // Category 2
    "wild3x.png",    // Category 3
    "wild4x.png",    // Category 4
    "wild5x.png"     // Category 5
];

let catSheet; // For the new cat sprites
let backgroundSprite; // Game background
let reelFrameSprite; // Reel outline
let walkingWildTint = null; // For red flash effect
let categoryLabels = {}; // For category1.png through category5.png
let wildPlaceholderTextures = {}; // For wild placeholder textures
let winningLineOverlays = []; // Track winning line overlay graphics

// Center offset calculations
let centerOffsetX = 0;
let centerOffsetY = 0;



async function init(canvasContainer) {
    try {
        console.log("Initializing game...");

        // Calculate available space (full viewport minus bottom panel)
        const availableWidth = window.innerWidth;
        const availableHeight = window.innerHeight - 120; // Subtract bottom panel height

        app = new Application();
        await app.init({
            width: availableWidth,
            height: availableHeight,
            backgroundColor: 0x003366,
            resizeTo: window // Resize to window instead of container
        });

        canvasContainer.appendChild(app.canvas);

        // Load and parse the cat sprites (contains all game assets now)
        console.log("Loading cat-sprites.png...");
        const catTexture = await Assets.load("/cat-sprites.png");
        const catJson = await fetch("/cat-sprites.png.json").then((res) => res.json());
        catSheet = new Spritesheet(catTexture, catJson);
        await catSheet.parse();
        console.log("Cat spritesheet loaded successfully");

        // Load category label images
        console.log("Loading category labels...");
        for (let i = 1; i <= 5; i++) {
            categoryLabels[i] = await Assets.load(`/category${i}.png`);
        }
        console.log("Category labels loaded successfully");

        // Load wild placeholder images (one for each category)
        console.log("Loading wild placeholders...");
        try {
            for (let i = 0; i < wildPlaceholderSprites.length; i++) {
                wildPlaceholderTextures[i + 1] = await Assets.load(`/${wildPlaceholderSprites[i]}`);
            }
            console.log("Wild placeholders loaded successfully");
        } catch (error) {
            console.warn("Some wild placeholders not found, will use ace wild as fallback:", error.message);
        }

        // Load standalone reel frame
        console.log("Loading reel frame...");
        const frameTexture = await Assets.load("/framehc.png");
        console.log("Reel frame loaded successfully");

        // For backwards compatibility, set sheet to catSheet since all symbols are now there
        sheet = catSheet;

        // Add background that fills the entire viewport
        backgroundSprite = new Sprite(catSheet.textures["backgroundhc.png"]);
        backgroundSprite.width = app.screen.width;
        backgroundSprite.height = app.screen.height;
        backgroundSprite.x = 0;
        backgroundSprite.y = 0;
        app.stage.addChild(backgroundSprite);

        // Calculate center offsets for game elements
        const gameWidth = COLS * cellSize; // 620px
        const gameHeight = ROWS * cellSize; // 620px
        centerOffsetX = (app.screen.width - gameWidth) / 2.2;
        centerOffsetY = (app.screen.height - gameHeight) / 2.2;
        console.log(`Centering game at offset: ${centerOffsetX}, ${centerOffsetY}`);

        // Add reel frame outline BEFORE drawing reels so it appears behind them
        reelFrameSprite = new Sprite(frameTexture);

        // Use frame at its natural size (1.0 scale)
        reelFrameSprite.scale.set(1.07);

        // Position frame slightly up and to the left from the grid's top-left corner
        reelFrameSprite.x = centerOffsetX - 30; // Move 10px to the left
        reelFrameSprite.y = centerOffsetY - 30; // Move 10px up

        // Add frame FIRST so it appears behind everything
        app.stage.addChild(reelFrameSprite);

        // Draw reels AFTER frame so they appear on top
        drawReels();

        startHurricaneSpinAnimation();
        console.log("Game initialization complete!");
    } catch (error) {
        console.error("Error initializing game:", error);
    }
}

function drawReels() {
    // Clear existing reels and wild placeholders (but keep background)
    // Remove all children except background and reel frame
    const childrenToKeep = [backgroundSprite, reelFrameSprite].filter(Boolean);
    const childrenToRemove = app.stage.children.filter(child => !childrenToKeep.includes(child));
    childrenToRemove.forEach(child => app.stage.removeChild(child));

    // Clear winning line overlays
    clearWinningLineOverlays();

    reels = [];
    reelContainers = [];
    reelSymbols = [];
    symbolsSpun = [0, 0, 0, 0, 0]; // Reset spin counters

    console.log("🧹 Cleared all wild placeholders and reels for fresh spin");

    for (let col = 0; col < COLS; col++) {
        reels[col] = [];
        reelSymbols[col] = [];

        // Create container for this reel column
        const reelContainer = new Container();
        reelContainer.x = col * cellSize + centerOffsetX;
        reelContainer.y = centerOffsetY;

        // Create mask for this reel with rounded corners
        const reelMask = new Graphics();
        reelMask.beginFill(0x000000);
        // Draw rounded rectangle for the mask
        reelMask.drawRoundedRect(0, 0, cellSize, cellSize * ROWS, 8); // 8px border radius
        reelMask.endFill();
        reelContainer.addChild(reelMask);
        reelContainer.mask = reelMask;

        reelContainers[col] = reelContainer;
        app.stage.addChild(reelContainer);

        // Create extra symbols for spinning effect (more symbols than visible)
        const totalSymbols = ROWS + 3; // Extra symbols for smooth spinning
        for (let i = 0; i < totalSymbols; i++) {
            const key = symbolNames[Math.floor(Math.random() * symbolNames.length)];
            if (i < ROWS) {
                reels[col][i] = key; // Store visible symbols
            }

            let sprite;

            // Use appropriate texture based on symbol type
            if (key.startsWith("wild") && key.endsWith(".png")) {
                // Extract category from wild filename (wild2x.png -> category 2)
                const category = key === "wild.png" ? 1 : parseInt(key.match(/wild(\d+)x\.png/)?.[1] || "1");
                if (wildPlaceholderTextures[category]) {
                    sprite = new Sprite(wildPlaceholderTextures[category]);
                } else {
                    sprite = new Sprite(catSheet.textures["acehc.png"]);
                }
            } else {
                // Use regular cat sheet textures
                sprite = new Sprite(catSheet.textures[key]);
            }

            // Position symbols in the reel (some will be above/below visible area)
            sprite.x = 0;
            sprite.y = (i - 1) * cellSize; // Start one symbol above visible area
            sprite.width = sprite.height = cellSize;

            reelContainer.addChild(sprite);

            if (!reelSymbols[col]) reelSymbols[col] = [];
            reelSymbols[col][i] = sprite;
        }
    }

    // Ensure proper layering: frame stays behind reels
    if (reelFrameSprite && reelFrameSprite.parent) {
        // Frame should stay in its current position behind the reels
        // Don't move it to the top
    }

    // Start the reel spinning animation loop
    startReelSpinAnimation();
}

function triggerHurricane() {
    console.log("Spin button clicked!");
    console.log("Walking:", walking);
    console.log("Cat sheet loaded:", !!catSheet);

    if (walking || !catSheet) {
        console.log("Cannot start hurricane - conditions not met");
        return;
    }

    // Reset for new hurricane
    totalWinnings = 0;
    hurricaneCol = COLS - 1;
    hurricaneCategory = Math.floor(Math.random() * 5) + 1;

    console.log(`🌪️ Hurricane Category ${hurricaneCategory} approaching!`);

    walking = true;

    // Clear the board for fresh hurricane by redrawing reels (this removes wild placeholders)
    drawReels();

    // Ensure frame stays behind reels after redraw
    if (reelFrameSprite && reelFrameSprite.parent) {
        app.stage.removeChild(reelFrameSprite);
        app.stage.addChildAt(reelFrameSprite, 1); // Add after background but before reels
    }

    updateReelSpeeds(); // Update reel speeds based on storm position
    hurricaneHitsReel();
}

function hurricaneHitsReel() {
    if (hurricaneCol < 0) {
        // Hurricane has left the board - calculate final winnings
        const finalWinnings = totalWinnings * hurricaneCategory;
        console.log(`🌪️ Hurricane made landfall! Total winnings: ${totalWinnings} × Category ${hurricaneCategory} = ${finalWinnings}`);
        walking = false;
        if (hurricane) {
            app.stage.removeChild(hurricane);
            hurricane = null;
        }
        if (walkingWildTint) {
            walkingWildTint = null;
        }
        return;
    }

    console.log(`💥 Hurricane hits column ${hurricaneCol}!`);

    // Show scatter symbol and selection animation
    showScatterAndSelection();
}

function showScatterAndSelection() {
    // Show scatter symbol on the hit column
    const scatterContainer = new Container();
    const scatterSprite = new Sprite(catSheet.textures[scatterSpriteName]);
    scatterSprite.width = cellSize;
    scatterSprite.height = cellSize;
    scatterSprite.x = hurricaneCol * cellSize + centerOffsetX;
    scatterSprite.y = cellSize * 2 + centerOffsetY; // Middle row

    app.stage.addChild(scatterSprite);
    app.stage.addChild(scatterContainer);

    // Start selection animation - cycle through category sprites with motion blur
    let currentSelection = 0;
    let selectionSpeed = 100; // Start fast
    const maxSelections = 20; // Number of cycles before stopping
    let selectionCount = 0;

    const selectionInterval = setInterval(() => {
        // Remove previous selection sprite
        if (scatterContainer.children.length > 0) {
            scatterContainer.removeChildren();
        }

        // Add current hurricane category sprite with motion blur effect
        const categorySprite = new Sprite(catSheet.textures[hurricaneSprites[currentSelection]]);
        categorySprite.width = cellSize * 0.8;
        categorySprite.height = cellSize * 0.8;
        categorySprite.x = hurricaneCol * cellSize + cellSize * 0.1 + centerOffsetX;
        categorySprite.y = cellSize * 2 + cellSize * 0.1 + centerOffsetY;

        // Add motion blur by making it slightly transparent and offset
        categorySprite.alpha = 0.8;
        scatterContainer.addChild(categorySprite);

        currentSelection = (currentSelection + 1) % hurricaneSprites.length;
        selectionCount++;

        // Slow down the selection as we approach the end
        if (selectionCount > maxSelections - 10) {
            selectionSpeed += 20;
        }

        if (selectionCount >= maxSelections) {
            clearInterval(selectionInterval);
            // Final selection is the hurricane category - 1 (array is 0-indexed)
            const finalCategory = hurricaneCategory - 1;

            // Show final selected category
            scatterContainer.removeChildren();
            const finalSprite = new Sprite(catSheet.textures[hurricaneSprites[finalCategory]]);
            finalSprite.width = cellSize;
            finalSprite.height = cellSize;
            finalSprite.x = hurricaneCol * cellSize + centerOffsetX;
            finalSprite.y = cellSize * 2 + centerOffsetY;
            finalSprite.alpha = 1.0;
            scatterContainer.addChild(finalSprite);

            setTimeout(() => {
                // Remove all selection animations
                app.stage.removeChild(scatterSprite);
                app.stage.removeChild(scatterContainer);
                expandReel();
            }, 1000);
        }
    }, selectionSpeed);
}

function expandReel() {
    // Transform column to full reel wild
    transformColumnToFullReel(hurricaneCol);

    // Create spinning hurricane visual
    createSpinningHurricaneVisual();

    // Spin other reels after a short delay
    setTimeout(() => {
        spinReels();
    }, 1000);
}

function createSpinningHurricaneVisual() {
    console.log("Creating spinning hurricane visual...");

    // Remove existing hurricane
    if (hurricane) {
        app.stage.removeChild(hurricane);
    }

    hurricane = new Container();

    // Use the full reel sprite as background FIRST
    const fullReel = new Sprite(catSheet.textures[fullReelSprite]);
    fullReel.width = cellSize;
    fullReel.height = cellSize * ROWS;
    fullReel.x = 0;
    fullReel.y = 0;
    hurricane.addChild(fullReel);
    console.log("Added full reel sprite");

    // Add category label at the top INSIDE the full reel (within the 124x620 area)
    const categoryLabelSprite = new Sprite(categoryLabels[hurricaneCategory]);
    categoryLabelSprite.width = cellSize * 1.04; // 30% bigger (0.8 * 1.3)
    categoryLabelSprite.height = cellSize * 0.52; // 30% bigger (0.4 * 1.3)
    categoryLabelSprite.x = cellSize * 0.02; // Adjust to center the larger sprite
    categoryLabelSprite.y = cellSize * 0.95; // Brought down slightly
    hurricane.addChild(categoryLabelSprite);
    console.log(`Added category ${hurricaneCategory} label inside reel`);

    // Create double red border graphics ON TOP of the sprite
    const outerBorder = new Graphics();
    outerBorder.lineStyle(8, 0xff0000, 1); // Thicker outer red border
    outerBorder.drawRect(0, 0, cellSize, cellSize * ROWS);
    hurricane.addChild(outerBorder);
    console.log("Added outer border");

    const innerBorder = new Graphics();
    innerBorder.lineStyle(4, 0xff4444, 1); // Thinner inner lighter red border
    innerBorder.drawRect(4, 4, cellSize - 8, cellSize * ROWS - 8);
    hurricane.addChild(innerBorder);
    console.log("Added inner border");

    // Add the category sprite in the middle ON TOP
    const categorySprite = new Sprite(catSheet.textures[hurricaneSprites[hurricaneCategory - 1]]);
    categorySprite.width = cellSize * 0.8;
    categorySprite.height = cellSize * 0.8;
    categorySprite.anchor.set(0.5);
    categorySprite.x = cellSize / 2;
    categorySprite.y = (cellSize * ROWS) / 2;
    hurricane.addChild(categorySprite);
    console.log("Added category sprite");

    hurricane.x = hurricaneCol * cellSize + centerOffsetX;
    hurricane.y = centerOffsetY;
    app.stage.addChild(hurricane);
    console.log(`Hurricane positioned at column ${hurricaneCol}, x=${hurricane.x}`);

    // Store references for animation
    hurricane.spinningSprite = categorySprite;
    hurricane.outerBorder = outerBorder;
    hurricane.innerBorder = innerBorder;
    hurricane.categoryLabel = categoryLabelSprite;

    console.log("Hurricane visual creation complete");
}

function startReelSpinAnimation() {
    // Main reel spinning animation loop
    app.ticker.add(() => {
        // Spin each reel column
        for (let col = 0; col < COLS; col++) {
            if (reelContainers[col] && spinSpeeds[col] !== 0) {
                const speed = Math.abs(spinSpeeds[col]);
                const direction = spinSpeeds[col] > 0 ? 1 : -1; // Positive = down, Negative = up

                // Move all symbols in this reel
                for (let i = 0; i < reelSymbols[col].length; i++) {
                    const symbol = reelSymbols[col][i];
                    symbol.y += speed * direction;

                    // Handle symbol wrapping based on direction
                    if (direction > 0) {
                        // Spinning down - if symbol goes below visible area, move to top
                        if (symbol.y > cellSize * (ROWS + 1)) {
                            symbol.y = -cellSize;
                            symbolsSpun[col]++;

                            // Change to new random symbol
                            const newKey = symbolNames[Math.floor(Math.random() * symbolNames.length)];
                            symbol.texture = getSymbolTexture(newKey);
                        }
                    } else {
                        // Spinning up - if symbol goes above visible area, move to bottom
                        if (symbol.y < -cellSize * 2) {
                            symbol.y = cellSize * (ROWS + 1);
                            symbolsSpun[col]++;

                            // Change to new random symbol
                            const newKey = symbolNames[Math.floor(Math.random() * symbolNames.length)];
                            symbol.texture = getSymbolTexture(newKey);
                        }
                    }
                }
            }
        }
    });
}

function getSymbolTexture(key) {
    if (key.startsWith("wild") && key.endsWith(".png")) {
        const category = key === "wild.png" ? 1 : parseInt(key.match(/wild(\d+)x\.png/)?.[1] || "1");
        return wildPlaceholderTextures[category] ? wildPlaceholderTextures[category] : catSheet.textures["acehc.png"];
    } else {
        return catSheet.textures[key];
    }
}

function snapSymbolsToGrid(col) {
    // Snap all symbols in this reel column to proper grid positions
    if (!reelSymbols[col]) return;

    for (let i = 0; i < reelSymbols[col].length; i++) {
        const symbol = reelSymbols[col][i];

        // Calculate the nearest grid position
        const targetY = (i - 1) * cellSize; // Expected position for this symbol index
        const currentY = symbol.y;

        // Find the closest grid-aligned position
        const gridPosition = Math.round(currentY / cellSize) * cellSize;

        // Snap to the nearest valid position
        symbol.y = gridPosition;

        // Ensure symbols are properly distributed vertically
        // If symbols are bunched up, redistribute them
        if (i > 0) {
            const prevSymbol = reelSymbols[col][i - 1];
            const minDistance = cellSize;

            if (Math.abs(symbol.y - prevSymbol.y) < minDistance) {
                // If too close to previous symbol, position it one cell away
                if (symbol.y >= prevSymbol.y) {
                    symbol.y = prevSymbol.y + cellSize;
                } else {
                    symbol.y = prevSymbol.y - cellSize;
                }
            }
        }
    }

    // Sort symbols by Y position and reassign proper spacing
    const sortedSymbols = [...reelSymbols[col]].sort((a, b) => a.y - b.y);
    for (let i = 0; i < sortedSymbols.length; i++) {
        sortedSymbols[i].y = (i - 1) * cellSize;
    }

    console.log(`📐 Snapped reel ${col} symbols to grid`);
}

function updateReelSpeeds() {
    // Update reel speeds based on hurricane position
    for (let col = 0; col < COLS; col++) {
        if (col > hurricaneCol) {
            // Reels in front of the storm (to the right) - spin down faster
            spinSpeeds[col] = baseSpinSpeed * stormSpeedMultiplier;
        } else if (col < hurricaneCol) {
            // Reels behind the storm (closer to landfall/left side) - spin UP
            spinSpeeds[col] = -(baseSpinSpeed * postStormSpeedMultiplier); // Negative = up
        } else {
            // The storm column itself - no spinning (will be replaced by hurricane visual)
            spinSpeeds[col] = 0;
        }
    }

    console.log(`🌪️ Reel speeds updated - Storm at col ${hurricaneCol}:`, spinSpeeds);
}

function startReelSpin() {
    if (!reelSpinning) {
        reelSpinning = true;
        symbolsSpun = [0, 0, 0, 0, 0]; // Reset symbol counters

        // Set base spinning speed for all reels (down direction)
        for (let col = 0; col < COLS; col++) {
            spinSpeeds[col] = baseSpinSpeed;
        }
        console.log("🎰 All reels spinning at base speed");
    }
}

function stopReelSpin(delay = 0) {
    setTimeout(() => {
        reelSpinning = false;
        console.log("🎰 Starting staggered reel stop sequence");

        // Stop reels with staggered timing from left to right (only non-hurricane columns)
        for (let col = 0; col < COLS; col++) {
            if (col !== hurricaneCol) { // Only stop non-hurricane columns
                setTimeout(() => {
                    // Snap symbols to grid before stopping
                    snapSymbolsToGrid(col);
                    spinSpeeds[col] = 0;
                    console.log(`🎰 Reel ${col} stopped and snapped to grid`);
                }, col * 500); // 500ms delay between each reel stopping
            }
        }
    }, delay);
}

function startHurricaneSpinAnimation() {
    let flashTime = 0;
    let redTintTime = 0;

    // Animation loop for spinning hurricane and flashing borders
    app.ticker.add(() => {
        if (hurricane && hurricane.spinningSprite && walking) {
            // Spinning hurricane category sprite
            hurricaneSpinRotation += 0.1;
            hurricane.spinningSprite.rotation = hurricaneSpinRotation;

            // Dramatic flashing border effect
            flashTime += 0.2;
            const outerFlash = (Math.sin(flashTime) + 1) / 2; // Creates a pulsing effect between 0 and 1
            const innerFlash = (Math.sin(flashTime * 1.3) + 1) / 2; // Different timing for inner border

            if (hurricane.outerBorder) {
                // Flash between 0.3 and 1.0 alpha for dramatic effect
                hurricane.outerBorder.alpha = 0.3 + (outerFlash * 0.7);
            }

            if (hurricane.innerBorder) {
                // Inner border flashes with different timing and range
                hurricane.innerBorder.alpha = 0.4 + (innerFlash * 0.6);
            }

            // Red tint flash effect for walking wild (every couple seconds)
            redTintTime += 0.02;
            if (redTintTime >= 2.0) { // Flash every 2 seconds
                if (!walkingWildTint) {
                    // Create red tint overlay
                    walkingWildTint = new Graphics();
                    walkingWildTint.beginFill(0xff0000, 0.3); // Red with 30% opacity
                    walkingWildTint.drawRect(0, 0, cellSize, cellSize * ROWS);
                    walkingWildTint.endFill();
                    hurricane.addChild(walkingWildTint);

                    // Remove tint after 0.2 seconds
                    setTimeout(() => {
                        if (walkingWildTint && hurricane) {
                            hurricane.removeChild(walkingWildTint);
                            walkingWildTint = null;
                        }
                    }, 200);
                }
                redTintTime = 0; // Reset timer
            }
        }
    });
}

function transformColumnToFullReel(col) {
    // Transform the hit column to wild symbols (full reel)
    for (let row = 0; row < ROWS; row++) {
        reels[col][row] = "acehc.png"; // Use ace as wild symbol
    }
}

function spinReels() {
    console.log("🎰 Reels spinning...");

    // Remove all active wild placeholder sprites when reels start spinning
    activeWildPlaceholders.forEach(wildSprite => {
        if (wildSprite.parent) {
            wildSprite.parent.removeChild(wildSprite);
        }
    });
    activeWildPlaceholders = []; // Clear the array
    console.log("🃏 Removed all wild placeholders - they spun away!");

    // When reels start spinning, make all reel containers visible again
    for (let col = 0; col < COLS; col++) {
        if (reelContainers[col]) {
            reelContainers[col].visible = true;
        }
    }

    // Start spinning all reels first
    startReelSpin();

    // Apply storm effects to reel speeds
    updateReelSpeeds();

    // Wait for reels to spin through at least 20 symbols each (exclude hurricane column)
    const checkSpinProgress = setInterval(() => {
        // Only check non-hurricane columns for symbol count
        let allReelsSpunEnough = true;
        for (let col = 0; col < COLS; col++) {
            if (col !== hurricaneCol && symbolsSpun[col] < 20) {
                allReelsSpunEnough = false;
                break;
            }
        }

        if (allReelsSpunEnough) {
            clearInterval(checkSpinProgress);
            console.log("🎰 All non-hurricane reels have spun enough symbols");

            // Stop spinning with staggered timing (only non-hurricane columns)
            stopReelSpin();

            // Wait for all reels to finish stopping before revealing results
            setTimeout(() => {
                console.log("🎰 All reels stopped, generating final symbols");

                // Generate final symbols for non-hurricane columns
                for (let col = 0; col < COLS; col++) {
                    if (col !== hurricaneCol) { // Don't change the hurricane column
                        for (let row = 0; row < ROWS; row++) {
                            reels[col][row] = symbolNames[Math.floor(Math.random() * symbolNames.length)];
                        }
                    }
                }

                // Update the visible symbols to match the final reel state
                updateVisibleSymbols();
                calculateWins();

                // Move hurricane left after calculating wins
                setTimeout(() => {
                    // Leave wild placeholder in the current column before moving
                    if (hurricaneCol >= 0) {
                        console.log(`🃏 Leaving wild placeholders in column ${hurricaneCol} (Category ${hurricaneCategory})`);

                        // Hide the hurricane reel container to reveal wild placeholders underneath
                        if (reelContainers[hurricaneCol]) {
                            reelContainers[hurricaneCol].visible = false;
                        }

                        // Create category-specific wild placeholder for each row
                        const wildTexture = wildPlaceholderTextures[hurricaneCategory];
                        const wildSpriteName = wildPlaceholderSprites[hurricaneCategory - 1];

                        for (let row = 0; row < ROWS; row++) {
                            let wildPlaceholder;

                            if (wildTexture) {
                                // Use category-specific wild placeholder
                                wildPlaceholder = new Sprite(wildTexture);
                            } else {
                                // Fallback to ace wild if wild placeholder not available
                                wildPlaceholder = new Sprite(catSheet.textures["acehc.png"]);
                                console.log("Using ace wild as placeholder fallback");
                            }

                            // Position each wild placeholder in its individual cell (centered)
                            wildPlaceholder.width = cellSize;
                            wildPlaceholder.height = cellSize;
                            wildPlaceholder.x = hurricaneCol * cellSize + centerOffsetX;
                            wildPlaceholder.y = row * cellSize + centerOffsetY;
                            app.stage.addChild(wildPlaceholder);

                            // Track this wild placeholder for later removal
                            activeWildPlaceholders.push(wildPlaceholder);

                            // Mark the reel data as wild placeholder
                            if (wildTexture) {
                                reels[hurricaneCol][row] = wildSpriteName;
                            } else {
                                reels[hurricaneCol][row] = "acehc.png"; // Fallback to ace
                            }
                        }
                    }

                    hurricaneCol--;

                    // Hurricane can go up or down one category for next reel (if there is a next reel)
                    if (hurricaneCol >= 0) {
                        const categoryChange = Math.random() < 0.5 ? -1 : 1; // Randomly go up or down
                        const newCategory = hurricaneCategory + categoryChange;

                        // Keep category within bounds (1-5)
                        if (newCategory >= 1 && newCategory <= 5) {
                            hurricaneCategory = newCategory;
                            console.log(`🌪️ Hurricane intensity changed to Category ${hurricaneCategory}!`);
                        } else {
                            console.log(`🌪️ Hurricane intensity stays at Category ${hurricaneCategory} (boundary reached)`);
                        }

                        // Update reel speeds for new hurricane position
                        updateReelSpeeds();
                    }

                    hurricaneHitsReel();
                }, 1500);

            }, 2000); // Adjusted wait time for staggered stopping to complete
        }
    }, 100); // Check every 100ms
}

function updateVisibleSymbols() {
    // Update the visible symbols in each reel to match the final reel data
    for (let col = 0; col < COLS; col++) {
        if (col !== hurricaneCol && reelSymbols[col]) { // Don't update hurricane column
            for (let row = 0; row < ROWS; row++) {
                const key = reels[col][row];
                let newTexture;

                if (key.startsWith("wild") && key.endsWith(".png")) {
                    const category = key === "wild.png" ? 1 : parseInt(key.match(/wild(\d+)x\.png/)?.[1] || "1");
                    newTexture = wildPlaceholderTextures[category] ? wildPlaceholderTextures[category] : catSheet.textures["acehc.png"];
                } else {
                    newTexture = catSheet.textures[key];
                }

                // Find the symbol at the correct visible position and update its texture
                const visibleSymbolIndex = row + 1; // Offset by 1 because we have extra symbols
                if (reelSymbols[col][visibleSymbolIndex]) {
                    reelSymbols[col][visibleSymbolIndex].texture = newTexture;
                }
            }
        }
    }
}

function redrawReels() {
    // With the new container system, we mainly just need to ensure proper layering
    // The reel symbols are already managed by the spinning animation system

    // Ensure proper layering: background -> reel containers -> reel frame -> hurricane
    if (reelFrameSprite) {
        app.stage.removeChild(reelFrameSprite);
        app.stage.addChild(reelFrameSprite);
    }

    // Re-add hurricane visual if it exists
    if (hurricane && hurricaneCol >= 0) {
        app.stage.removeChild(hurricane);
        app.stage.addChild(hurricane);
    }
}

function calculateWins() {
    let roundWinnings = 0;

    // Clear any existing winning line overlays
    clearWinningLineOverlays();

    // Check for free spins scatter symbols first
    let scatterCount = 0;
    for (let col = 0; col < COLS; col++) {
        for (let row = 0; row < ROWS; row++) {
            if (reels[col][row] === freeSpinsScatterSprite) {
                scatterCount++;
            }
        }
    }

    if (scatterCount >= 3) {
        console.log(`🎰 FREE SPINS! Found ${scatterCount} scatter symbols`);
        // Trigger free spins (you can implement this logic later)
    }

    // Check for winning combinations (simplified example)
    // Check horizontal lines
    for (let row = 0; row < ROWS; row++) {
        let consecutiveCount = 1;
        let currentSymbol = reels[0][row];

        for (let col = 1; col < COLS; col++) {
            if (reels[col][row] === currentSymbol ||
                reels[col][row] === "acehc.png" ||
                (reels[col][row].startsWith("wild") && reels[col][row].endsWith(".png")) ||
                currentSymbol === "acehc.png" ||
                (currentSymbol.startsWith("wild") && currentSymbol.endsWith(".png"))) {
                consecutiveCount++;
            } else {
                break;
            }
        }

        if (consecutiveCount >= 3) {
            const winAmount = getSymbolPayout(currentSymbol) * consecutiveCount;
            roundWinnings += winAmount;
            console.log(`🎯 Win on row ${row}: ${consecutiveCount}x ${currentSymbol} = ${winAmount}`);

            // Create hurricane-style path overlay for this winning line
            createWinningLineOverlay(row, consecutiveCount, winAmount);
        }
    }

    totalWinnings += roundWinnings;
    console.log(`💵 Round winnings: ${roundWinnings}, Total: ${totalWinnings}`);
}

function createWinningLineOverlay(row, consecutiveCount, winAmount) {
    // Create the hurricane path cone effect for winning lines
    const pathOverlay = new Graphics();

    // Calculate the path from left to right across the winning symbols
    const startX = centerOffsetX;
    const startY = centerOffsetY + (row * cellSize) + (cellSize / 2); // Center of the row
    const endX = centerOffsetX + (consecutiveCount * cellSize);
    const endY = startY;

    // Create the cone path - starts narrow and widens
    const coneWidth = cellSize * 0.3; // How wide the cone gets
    const coneStartWidth = cellSize * 0.1; // Starting width

    // Draw the transparent red fill first
    pathOverlay.beginFill(0xff0000, 0.3); // Red with 30% transparency
    pathOverlay.moveTo(startX, startY - coneStartWidth);
    pathOverlay.lineTo(endX, endY - coneWidth);
    pathOverlay.lineTo(endX, endY + coneWidth);
    pathOverlay.lineTo(startX, startY + coneStartWidth);
    pathOverlay.closePath();
    pathOverlay.endFill();

    // Draw the top boundary line
    pathOverlay.lineStyle(3, 0xff0000, 0.8); // Red border
    pathOverlay.moveTo(startX, startY - coneStartWidth);
    pathOverlay.lineTo(endX, endY - coneWidth);

    // Draw the bottom boundary line
    pathOverlay.moveTo(startX, startY + coneStartWidth);
    pathOverlay.lineTo(endX, endY + coneWidth);

    // Add some pulsing animation
    pathOverlay.alpha = 0.8;

    // Position the overlay
    app.stage.addChild(pathOverlay);
    winningLineOverlays.push(pathOverlay);

    // Add pulsing animation to the winning line
    let pulseTime = 0;
    const pulseAnimation = () => {
        if (pathOverlay.parent) {
            pulseTime += 0.1;
            pathOverlay.alpha = 0.6 + (Math.sin(pulseTime) * 0.3); // Pulse between 0.3 and 0.9
            setTimeout(pulseAnimation, 50);
        }
    };
    pulseAnimation();

    console.log(`🌪️ Created winning line overlay for row ${row} with ${consecutiveCount} symbols`);
}

function clearWinningLineOverlays() {
    // Remove all existing winning line overlays
    winningLineOverlays.forEach(overlay => {
        if (overlay.parent) {
            app.stage.removeChild(overlay);
        }
    });
    winningLineOverlays = [];
}

function getSymbolPayout(symbol) {
    const payouts = {
        "acehc.png": 50,          // Wild
        "wild.png": 50,           // Wild placeholder Category 1
        "wild2x.png": 100,        // Wild placeholder Category 2 (2x multiplier)
        "wild3x.png": 150,        // Wild placeholder Category 3 (3x multiplier)
        "wild4x.png": 200,        // Wild placeholder Category 4 (4x multiplier)
        "wild5x.png": 250,        // Wild placeholder Category 5 (5x multiplier)
        "kinghc.png": 25,
        "queenhc.png": 20,
        "jackhc.png": 15,
        "10hc.png": 10,
        "evacsignhc.png": 8,
        "flashlighthc.png": 6,
        "radiohc.png": 5,
        "waterhc.png": 4,
        "windsockhc.png": 3
    };
    return payouts[symbol] || 1;
}

export { init, triggerHurricane };
