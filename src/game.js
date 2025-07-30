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



async function init(canvasContainer) {
    try {
        console.log("Initializing game...");
        app = new Application();
        await app.init({
            width: 1024,
            height: 768,
            backgroundColor: 0x003366
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
        
        // For backwards compatibility, set sheet to catSheet since all symbols are now there
        sheet = catSheet;

        // Add background
        backgroundSprite = new Sprite(catSheet.textures["backgroundhc.png"]);
        backgroundSprite.width = 1024;
        backgroundSprite.height = 768;
        backgroundSprite.x = 0;
        backgroundSprite.y = 0;
        app.stage.addChild(backgroundSprite);

        drawReels();
        
        // Add reel frame outline (after reels but before other elements)
        reelFrameSprite = new Sprite(catSheet.textures["reelframehc.png"]);
        // Position and size the reel frame to outline all 5 reels
        reelFrameSprite.x = 0;
        reelFrameSprite.y = 0;
        reelFrameSprite.width = COLS * cellSize;
        reelFrameSprite.height = ROWS * cellSize;
        app.stage.addChild(reelFrameSprite);

        startHurricaneSpinAnimation();
        console.log("Game initialization complete!");
    } catch (error) {
        console.error("Error initializing game:", error);
    }
}

function drawReels() {
    // Clear existing reels (but keep background)
    // Remove all children except background and reel frame
    const childrenToKeep = [backgroundSprite, reelFrameSprite].filter(Boolean);
    const childrenToRemove = app.stage.children.filter(child => !childrenToKeep.includes(child));
    childrenToRemove.forEach(child => app.stage.removeChild(child));
    
    reels = [];

    for (let col = 0; col < COLS; col++) {
        reels[col] = [];
        for (let row = 0; row < ROWS; row++) {
            const key = symbolNames[Math.floor(Math.random() * symbolNames.length)];
            reels[col][row] = key;

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
            
            // All new sprites are straight, no rotation needed
            sprite.x = col * cellSize;
            sprite.y = row * cellSize;
            sprite.width = sprite.height = cellSize;
            
            app.stage.addChild(sprite);
        }
    }
    
    // Ensure reel frame stays on top
    if (reelFrameSprite) {
        app.stage.removeChild(reelFrameSprite);
        app.stage.addChild(reelFrameSprite);
    }
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
    scatterSprite.x = hurricaneCol * cellSize;
    scatterSprite.y = cellSize * 2; // Middle row

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
        categorySprite.x = hurricaneCol * cellSize + cellSize * 0.1;
        categorySprite.y = cellSize * 2 + cellSize * 0.1;

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
            finalSprite.x = hurricaneCol * cellSize;
            finalSprite.y = cellSize * 2;
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
    categoryLabelSprite.y = cellSize * 0.25; // Brought down slightly
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

    hurricane.x = hurricaneCol * cellSize;
    hurricane.y = 0;
    app.stage.addChild(hurricane);
    console.log(`Hurricane positioned at column ${hurricaneCol}, x=${hurricane.x}`);

    // Store references for animation
    hurricane.spinningSprite = categorySprite;
    hurricane.outerBorder = outerBorder;
    hurricane.innerBorder = innerBorder;
    hurricane.categoryLabel = categoryLabelSprite;

    console.log("Hurricane visual creation complete");
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

    // Simulate spinning animation (you can enhance this later)
    setTimeout(() => {
        // Generate new symbols for non-hurricane columns
        for (let col = 0; col < COLS; col++) {
            if (col !== hurricaneCol) { // Don't change the hurricane column
                for (let row = 0; row < ROWS; row++) {
                    reels[col][row] = symbolNames[Math.floor(Math.random() * symbolNames.length)];
                }
            }
        }

        redrawReels();
        calculateWins();

        // Move hurricane left after calculating wins
        setTimeout(() => {
            // Leave wild placeholder in the current column before moving
            if (hurricaneCol >= 0) {
                console.log(`🃏 Leaving wild placeholders in column ${hurricaneCol} (Category ${hurricaneCategory})`);
                
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
                    
                    // Position each wild placeholder in its individual cell
                    wildPlaceholder.width = cellSize;
                    wildPlaceholder.height = cellSize;
                    wildPlaceholder.x = hurricaneCol * cellSize;
                    wildPlaceholder.y = row * cellSize;
                    app.stage.addChild(wildPlaceholder);
                    
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
            }
            
            hurricaneHitsReel();
        }, 1500);

    }, 2000); // 2 second spin duration
}

function redrawReels() {
    // Clear stage but preserve background, reel frame, and hurricane
    const hurricaneRef = hurricane;
    const childrenToKeep = [backgroundSprite, reelFrameSprite, hurricaneRef].filter(Boolean);
    const childrenToRemove = app.stage.children.filter(child => !childrenToKeep.includes(child));
    childrenToRemove.forEach(child => app.stage.removeChild(child));

    for (let col = 0; col < COLS; col++) {
        for (let row = 0; row < ROWS; row++) {
            // Skip drawing regular symbols where hurricane is present
            if (col === hurricaneCol && hurricaneRef) {
                continue;
            }

            const key = reels[col][row];
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
            
            // All sprites are straight, no rotation needed
            sprite.x = col * cellSize;
            sprite.y = row * cellSize;
            sprite.width = sprite.height = cellSize;
            
            app.stage.addChild(sprite);
        }
    }

    // Ensure proper layering: background -> reels -> reel frame -> hurricane
    if (reelFrameSprite) {
        app.stage.removeChild(reelFrameSprite);
        app.stage.addChild(reelFrameSprite);
    }
    
    // Re-add hurricane visual if it exists
    if (hurricaneRef && hurricaneCol >= 0) {
        app.stage.addChild(hurricaneRef);
        hurricane = hurricaneRef;
    }
}

function calculateWins() {
    let roundWinnings = 0;

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
        }
    }

    totalWinnings += roundWinnings;
    console.log(`💵 Round winnings: ${roundWinnings}, Total: ${totalWinnings}`);
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
