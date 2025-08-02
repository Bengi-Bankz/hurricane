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

// Payline definitions removed - starting fresh


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
let backgroundSprite; // Game background (will be animated)
let gameTitleSprite; // Game title at top left
let reelFrameSprite; // Reel outline
let walkingWildTint = null; // For red flash effect
let categoryLabels = {}; // For category1.png through category5.png
let wildPlaceholderTextures = {}; // For wild placeholder textures

// Animated background system
let backgroundFrames = {
    intro: [], // intro_002 through intro_012 (bright lightning flash starts at intro_002)
    loop: []   // bg_001 through bg_026 (background loop frames)
};
let backgroundSheets = []; // Store the loaded spritesheets
let currentBackgroundFrame = 0;
let backgroundAnimationState = 'intro'; // 'intro' or 'loop'
let backgroundAnimationSpeed = 100; // milliseconds between frames
let lastBackgroundFrameTime = 0;

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

        // Load standalone walking wild assets
        console.log("Loading walking wild assets...");
        try {
            // Load scatter expanding image (note: the file has a hyphen)
            console.log("Loading scatter-expanding.png...");
            await Assets.load("/scatter-expanding.png");
            console.log("✓ scatter-expanding.png loaded");
            
            // Load walking wild reel image
            console.log("Loading walkingwildreel.png...");
            await Assets.load("/walkingwildreel.png");
            console.log("✓ walkingwildreel.png loaded");
            
            // Load individual cat images for slot animation
            console.log("Loading cat images...");
            for (let i = 1; i <= 5; i++) {
                await Assets.load(`/cat${i}.png`);
                console.log(`✓ cat${i}.png loaded`);
            }
            console.log("Walking wild assets loaded successfully");
        } catch (error) {
            console.warn("Some walking wild assets not found:", error.message);
            console.error("Detailed error:", error);
        }

        // Load standalone reel frame
        console.log("Loading reel frame...");
        const frameTexture = await Assets.load("/framehc.png");
        console.log("Reel frame loaded successfully");

        // Load game title
        console.log("Loading game title...");
        await Assets.load("/gametitle.png");
        console.log("Game title loaded successfully");

        // Load animated background frames from spritesheets
        console.log("Loading animated background spritesheets...");
        try {
            // Load all 6 spritesheets (bg-0 through bg-5)
            for (let i = 0; i <= 5; i++) {
                console.log(`Loading bg-${i} spritesheet...`);
                const bgTexture = await Assets.load(`/bg/bg-${i}.png`);
                const bgJson = await fetch(`/bg/bg-${i}.png.json`).then((res) => res.json());
                const bgSheet = new Spritesheet(bgTexture, bgJson);
                await bgSheet.parse();
                backgroundSheets.push(bgSheet);
                console.log(`✓ Loaded bg-${i} spritesheet with ${Object.keys(bgSheet.textures).length} frames`);
            }
            
            // Extract intro frames (intro_002 through intro_012) - starting from intro_002 for lightning flash
            for (let i = 2; i <= 12; i++) {
                const frameKey = `intro_${i.toString().padStart(3, '0')}.png`;
                for (const sheet of backgroundSheets) {
                    if (sheet.textures[frameKey]) {
                        backgroundFrames.intro.push(sheet.textures[frameKey]);
                        console.log(`✓ Found intro frame: ${frameKey}`);
                        break;
                    }
                }
            }
            
            // Extract background loop frames (bg_001 through bg_026)
            for (let i = 1; i <= 26; i++) {
                const frameKey = `bg_${i.toString().padStart(3, '0')}.png`;
                for (const sheet of backgroundSheets) {
                    if (sheet.textures[frameKey]) {
                        backgroundFrames.loop.push(sheet.textures[frameKey]);
                        console.log(`✓ Found bg frame: ${frameKey}`);
                        break;
                    }
                }
            }
            
            console.log(`Animated background loaded: ${backgroundFrames.intro.length} intro frames, ${backgroundFrames.loop.length} loop frames`);
        } catch (error) {
            console.warn("Some background frames not found:", error.message);
            console.error("Detailed error:", error);
            // Fallback to static background if frames fail to load
            backgroundFrames.intro = [];
            backgroundFrames.loop = [];
        }

        // For backwards compatibility, set sheet to catSheet since all symbols are now there
        sheet = catSheet;

        // Add animated background that fills the entire viewport
        if (backgroundFrames.intro.length > 0) {
            // Use animated background system
            backgroundSprite = new Sprite(backgroundFrames.intro[0]); // Start with first intro frame
            console.log("Using animated background system");
        } else {
            // Fallback to static background
            backgroundSprite = new Sprite(catSheet.textures["backgroundhc.png"]);
            console.log("Using static background fallback");
        }
        
        backgroundSprite.width = app.screen.width;
        backgroundSprite.height = app.screen.height;
        backgroundSprite.x = 0;
        backgroundSprite.y = 0;
        app.stage.addChild(backgroundSprite);

        // Add game title at top right corner
        gameTitleSprite = new Sprite(Assets.get("/gametitle.png"));
        // Scale the title to appropriate size if needed
        const titleScale = Math.min(app.screen.width * 0.3 / gameTitleSprite.width, 1);
        gameTitleSprite.scale.set(titleScale);
        gameTitleSprite.x = app.screen.width - gameTitleSprite.width - 20; // 20px from right edge
        gameTitleSprite.y = 20; // 20px from top edge
        app.stage.addChild(gameTitleSprite);

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

        // Start background animation if frames are loaded
        if (backgroundFrames.intro.length > 0 || backgroundFrames.loop.length > 0) {
            startBackgroundAnimation();
        }

        startHurricaneSpinAnimation();
        console.log("Game initialization complete!");
    } catch (error) {
        console.error("Error initializing game:", error);
    }
}

function drawReels() {
    // Clear existing reels and wild placeholders (but keep background)
    // Remove all children except background, game title, and reel frame
    const childrenToKeep = [backgroundSprite, gameTitleSprite, reelFrameSprite].filter(Boolean);
    const childrenToRemove = app.stage.children.filter(child => !childrenToKeep.includes(child));
    childrenToRemove.forEach(child => app.stage.removeChild(child));

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
                    sprite = new Sprite(wildPlaceholderTextures[1] || catSheet.textures["wild.png"]);
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
        console.log("Cannot start spin - conditions not met");
        return;
    }

    // Walking wild disabled - just do regular reel spin
    console.log("🎰 Regular reel spin - walking wild disabled");
    
    // Reset for new spin
    totalWinnings = 0;
    walking = true; // Prevent multiple spins

    // Clear the board for fresh spin by redrawing reels
    drawReels();

    // Ensure frame stays behind reels after redraw
    if (reelFrameSprite && reelFrameSprite.parent) {
        app.stage.removeChild(reelFrameSprite);
        app.stage.addChildAt(reelFrameSprite, 1); // Add after background but before reels
    }

    // Start regular reel spinning without hurricane mechanics
    regularReelSpin();
}

function regularReelSpin() {
    console.log("🎰 Starting regular reel spin...");

    // Start spinning all reels at normal speed
    startReelSpin();

    // Wait for reels to spin through at least 20 symbols each
    const checkSpinProgress = setInterval(() => {
        let allReelsSpunEnough = true;
        for (let col = 0; col < COLS; col++) {
            if (symbolsSpun[col] < 20) {
                allReelsSpunEnough = false;
                break;
            }
        }

        if (allReelsSpunEnough) {
            clearInterval(checkSpinProgress);
            console.log("🎰 All reels have spun enough symbols");

            // Stop spinning with staggered timing
            stopReelSpin();

            // Wait for all reels to finish stopping before revealing results
            setTimeout(() => {
                console.log("🎰 All reels stopped, using symbols that are already in position");

                // DON'T generate new symbols - just capture what's already there
                // Update the reels array to match what's visually displayed
                for (let col = 0; col < COLS; col++) {
                    for (let row = 0; row < ROWS; row++) {
                        // Find the symbol that's currently at this visible position
                        const visibleSymbolIndex = row + 1; // Offset by 1 because we have extra symbols
                        if (reelSymbols[col] && reelSymbols[col][visibleSymbolIndex]) {
                            const sprite = reelSymbols[col][visibleSymbolIndex];
                            // Determine which symbol this texture represents
                            const symbolKey = getSymbolKeyFromTexture(sprite.texture);
                            reels[col][row] = symbolKey;
                        }
                    }
                }
                
                // TODO: Calculate wins here - pay logic removed for fresh start
                console.log("🎰 Regular spin complete - ready for new pay logic");
                console.log("Final reel state (captured from visible symbols):");
                for (let col = 0; col < COLS; col++) {
                    console.log(`Column ${col}:`, reels[col]);
                }
                
                // Re-enable spinning
                walking = false;

            }, 3000); // Wait longer for staggered stopping to complete (5 reels * 500ms + buffer)
        }
    }, 100); // Check every 100ms
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
    // Show scatter symbol on the hit column using scatter-expanding.png
    const scatterContainer = new Container();
    const scatterSprite = new Sprite(Assets.get("/scatter-expanding.png"));
    scatterSprite.width = cellSize;
    scatterSprite.height = cellSize;
    scatterSprite.x = hurricaneCol * cellSize + centerOffsetX;
    scatterSprite.y = cellSize * 2 + centerOffsetY; // Middle row

    // Hide the reel container for the hurricane column to prevent symbols showing behind
    if (reelContainers[hurricaneCol]) {
        reelContainers[hurricaneCol].visible = false;
    }

    app.stage.addChild(scatterSprite);
    app.stage.addChild(scatterContainer);

    // Create slot machine reel container with mask for the black middle area
    const slotReelContainer = new Container();
    slotReelContainer.x = hurricaneCol * cellSize + centerOffsetX;
    slotReelContainer.y = centerOffsetY;

    // Add black layer behind everything first
    const blackLayer = new Graphics();
    blackLayer.beginFill(0x000000);
    blackLayer.drawRect(0, 0, cellSize, cellSize * ROWS);
    blackLayer.endFill();
    slotReelContainer.addChild(blackLayer);

    // Create a separate container for the animated cat sprites FIRST (so it's behind walkingwildreel)
    const catAnimationContainer = new Container();
    
    // Create mask for the slot reel (black area in middle where cats will animate)
    const reelMask = new Graphics();
    reelMask.beginFill(0x000000);
    reelMask.drawRect(cellSize * 0.1, cellSize * 1.8, cellSize * 0.8, cellSize * 1.4); // Middle area of column
    reelMask.endFill();
    
    catAnimationContainer.addChild(reelMask);
    catAnimationContainer.mask = reelMask;
    slotReelContainer.addChild(catAnimationContainer);

    // Add walkingwildreel.png AFTER the cat animation container (so it appears on top)
    const walkingWildReelSprite = new Sprite(Assets.get("/walkingwildreel.png"));
    walkingWildReelSprite.width = cellSize;
    walkingWildReelSprite.height = cellSize * ROWS;
    walkingWildReelSprite.x = 0;
    walkingWildReelSprite.y = 0;
    console.log("Creating walkingwildreel sprite:", walkingWildReelSprite.texture ? "✓ Texture loaded" : "✗ Texture missing");
    slotReelContainer.addChild(walkingWildReelSprite);

    // Add slot machine container directly to main stage at the TOP z-index
    app.stage.addChild(slotReelContainer);

    // Create multiple cat sprites for the slot reel effect (3 complete sets)
    const reelSprites = [];
    const catSpriteHeight = cellSize * 0.8;
    const spacing = catSpriteHeight + 10; // Small gap between sprites
    const totalReelHeight = 5 * spacing; // 5 cat images

    // Create 3 sets of standalone cat sprites (cat1.png through cat5.png) to ensure smooth infinite scroll
    for (let set = 0; set < 3; set++) {
        for (let i = 1; i <= 5; i++) {
            const categorySprite = new Sprite(Assets.get(`/cat${i}.png`));
            categorySprite.width = cellSize * 0.72; // 0.8 * 0.9 = 0.72
            categorySprite.height = catSpriteHeight * 0.9;
            categorySprite.x = cellSize * 0.14; // Adjust x position to center the smaller sprite
            categorySprite.y = (set * totalReelHeight) + ((i-1) * spacing) - totalReelHeight; // Start above visible area

            catAnimationContainer.addChild(categorySprite);
            reelSprites.push(categorySprite);
        }
    }

    // Slot machine animation variables
    let reelSpeed = 15; // Initial fast speed
    let animationTime = 0;
    const totalAnimationTime = 3000; // 3 seconds total animation
    const slowDownStartTime = 2000; // Start slowing down after 2 seconds

    // Final category selection (pre-determined)
    const finalCategory = hurricaneCategory - 1;

    // Animation loop
    const slotAnimation = () => {
        animationTime += app.ticker.deltaMS;

        // Calculate current speed (slow down near the end)
        if (animationTime > slowDownStartTime) {
            const slowDownProgress = (animationTime - slowDownStartTime) / (totalAnimationTime - slowDownStartTime);
            reelSpeed = 15 * (1 - slowDownProgress); // Gradually slow to 0
        }

        // Move all reel sprites down
        for (let sprite of reelSprites) {
            sprite.y += reelSpeed;

            // Wrap sprites that go below visible area back to top
            if (sprite.y > cellSize * 5) {
                sprite.y -= totalReelHeight * 3;
            }
        }

        // Check if animation should end
        if (animationTime >= totalAnimationTime) {
            app.ticker.remove(slotAnimation);

            // Find the sprite closest to the final position and snap to it
            const targetY = cellSize * 2 + cellSize * 0.1; // Middle position
            let closestSprite = null;
            let closestDistance = Infinity;

            for (let sprite of reelSprites) {
                const distance = Math.abs(sprite.y - targetY);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestSprite = sprite;
                }
            }

            // Hide all sprites except the final category
            for (let sprite of reelSprites) {
                sprite.visible = false;
            }

            // Create and show final sprite snapping into position
            const finalSprite = new Sprite(Assets.get(`/cat${finalCategory + 1}.png`));
            finalSprite.width = cellSize;
            finalSprite.height = cellSize;
            finalSprite.x = hurricaneCol * cellSize + centerOffsetX;
            finalSprite.y = cellSize * 2 + centerOffsetY;
            finalSprite.alpha = 1.0;

            // Animate the snap into position
            finalSprite.y = closestSprite ? closestSprite.y + cellSize * 0.1 : targetY + 20; // Start slightly off
            scatterContainer.addChild(finalSprite);

            // Smooth snap animation
            const snapAnimation = () => {
                const targetFinalY = cellSize * 2 + centerOffsetY;
                const diff = targetFinalY - finalSprite.y;
                finalSprite.y += diff * 0.3; // Smooth easing

                if (Math.abs(diff) < 1) {
                    finalSprite.y = targetFinalY;
                    app.ticker.remove(snapAnimation);

                    setTimeout(() => {
                        // Remove all selection animations
                        app.stage.removeChild(scatterSprite);
                        app.stage.removeChild(scatterContainer);
                        app.stage.removeChild(slotReelContainer); // Remove slot machine container from main stage
                        expandReel();
                    }, 1000);
                }
            };

            app.ticker.add(snapAnimation);
        }
    };

    app.ticker.add(slotAnimation);
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

    // Use the standalone walkingwildreel.png as background FIRST
    const fullReel = new Sprite(Assets.get("/walkingwildreel.png"));
    fullReel.width = cellSize;
    fullReel.height = cellSize * ROWS;
    fullReel.x = 0;
    fullReel.y = 0;
    console.log("Creating hurricane walkingwildreel sprite:", fullReel.texture ? "✓ Texture loaded" : "✗ Texture missing");
    console.log("Hurricane fullReel dimensions:", fullReel.width, "x", fullReel.height, "at position", fullReel.x, fullReel.y);
    hurricane.addChild(fullReel);
    console.log("Added walkingwildreel.png sprite");

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

                    // Handle symbol wrapping based on direction - but only if still spinning
                    if (reelSpinning) {
                        if (direction > 0) {
                            // Spinning down - if symbol goes below visible area, move to top
                            if (symbol.y > cellSize * (ROWS + 1)) {
                                symbol.y = -cellSize;
                                symbolsSpun[col]++;

                                // Change to new random symbol only while actively spinning
                                const newKey = symbolNames[Math.floor(Math.random() * symbolNames.length)];
                                symbol.texture = getSymbolTexture(newKey);
                            }
                        } else {
                            // Spinning up - if symbol goes above visible area, move to bottom
                            if (symbol.y < -cellSize * 2) {
                                symbol.y = cellSize * (ROWS + 1);
                                symbolsSpun[col]++;

                                // Change to new random symbol only while actively spinning
                                const newKey = symbolNames[Math.floor(Math.random() * symbolNames.length)];
                                symbol.texture = getSymbolTexture(newKey);
                            }
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
        return wildPlaceholderTextures[category] ? wildPlaceholderTextures[category] : wildPlaceholderTextures[1];
    } else {
        return catSheet.textures[key];
    }
}

function getSymbolKeyFromTexture(texture) {
    // Find which symbol key matches this texture
    for (const symbolKey of symbolNames) {
        if (catSheet.textures[symbolKey] === texture) {
            return symbolKey;
        }
    }
    
    // Check wild placeholders
    for (let i = 1; i <= 5; i++) {
        if (wildPlaceholderTextures[i] === texture) {
            return wildPlaceholderSprites[i - 1];
        }
    }
    
    // Fallback to a default symbol if texture not found
    console.warn("Could not identify texture, defaulting to first symbol");
    return symbolNames[0];
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
        console.log("🎰 Starting staggered reel stop sequence");

        // Stop reels with staggered timing from left to right
        for (let col = 0; col < COLS; col++) {
            setTimeout(() => {
                // Snap symbols to grid before stopping
                snapSymbolsToGrid(col);
                spinSpeeds[col] = 0;
                console.log(`🎰 Reel ${col} stopped and snapped to grid`);
                
                // Check if this is the last reel to stop
                if (col === COLS - 1) {
                    // All reels have stopped, now set reelSpinning to false
                    reelSpinning = false;
                    console.log("🎰 All reels completely stopped - reelSpinning set to false");
                }
            }, col * 500); // 500ms delay between each reel stopping
        }
    }, delay);
}

function startBackgroundAnimation() {
    console.log("🎬 Starting animated background system");
    
    // Reset animation state
    currentBackgroundFrame = 0;
    backgroundAnimationState = 'intro';
    lastBackgroundFrameTime = performance.now();
    
    // Background animation loop
    app.ticker.add(() => {
        const currentTime = performance.now();
        
        // Check if it's time for the next frame
        if (currentTime - lastBackgroundFrameTime >= backgroundAnimationSpeed) {
            updateBackgroundFrame();
            lastBackgroundFrameTime = currentTime;
        }
    });
    
    console.log("🎬 Background animation started");
}

function updateBackgroundFrame() {
    if (backgroundAnimationState === 'intro' && backgroundFrames.intro.length > 0) {
        // Play intro animation once
        backgroundSprite.texture = backgroundFrames.intro[currentBackgroundFrame];
        currentBackgroundFrame++;
        
        if (currentBackgroundFrame >= backgroundFrames.intro.length) {
            // Intro finished, switch to loop
            console.log("🎬 Intro animation complete, switching to loop");
            backgroundAnimationState = 'loop';
            currentBackgroundFrame = 0;
        }
    } else if (backgroundAnimationState === 'loop' && backgroundFrames.loop.length > 0) {
        // Play loop animation continuously
        backgroundSprite.texture = backgroundFrames.loop[currentBackgroundFrame];
        currentBackgroundFrame++;
        
        if (currentBackgroundFrame >= backgroundFrames.loop.length) {
            // Loop back to beginning
            currentBackgroundFrame = 0;
        }
    }
}

function playIntroAnimation() {
    // Function to restart intro animation (for bonus rounds)
    console.log("🎬 Playing intro animation for bonus round");
    currentBackgroundFrame = 0;
    backgroundAnimationState = 'intro';
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
        reels[col][row] = wildPlaceholderSprites[hurricaneCategory - 1]; // Use category-specific wild placeholder
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
                
                // TODO: Calculate wins here - pay logic removed for fresh start
                console.log("🎰 Reel spin complete - ready for new pay logic");

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
                                // Fallback to generic wild if wild placeholder not available
                                wildPlaceholder = new Sprite(wildPlaceholderTextures[1] || catSheet.textures["wild.png"]);
                                console.log("Using generic wild as placeholder fallback");
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
                                reels[hurricaneCol][row] = "wild.png"; // Fallback to generic wild
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
    console.log("🔄 Updating visible symbols to match final reel state...");
    
    for (let col = 0; col < COLS; col++) {
        if (reelSymbols[col]) {
            for (let row = 0; row < ROWS; row++) {
                const key = reels[col][row];
                console.log(`Setting visible symbol at [${col}, ${row}] to: ${key}`);
                
                let newTexture;

                if (key.startsWith("wild") && key.endsWith(".png")) {
                    const category = key === "wild.png" ? 1 : parseInt(key.match(/wild(\d+)x\.png/)?.[1] || "1");
                    newTexture = wildPlaceholderTextures[category] ? wildPlaceholderTextures[category] : wildPlaceholderTextures[1];
                } else {
                    newTexture = catSheet.textures[key];
                }

                // Find the symbol at the correct visible position and update its texture
                const visibleSymbolIndex = row + 1; // Offset by 1 because we have extra symbols
                if (reelSymbols[col][visibleSymbolIndex]) {
                    reelSymbols[col][visibleSymbolIndex].texture = newTexture;
                    console.log(`✓ Updated texture for visible symbol at index ${visibleSymbolIndex}`);
                }
            }
        }
    }
    console.log("🔄 Visible symbol update complete");
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
    // Pay logic removed - starting fresh
    console.log("🎯 calculateWins() called - implement new pay logic here");
    console.log("Current reel state:");
    for (let col = 0; col < COLS; col++) {
        console.log(`Column ${col}:`, reels[col]);
    }
}



function getSymbolPayout(symbol) {
    // Symbol payouts removed - starting fresh with pay logic
    console.log(`💰 getSymbolPayout called for: ${symbol}`);
    return 0; // Placeholder until new pay logic is implemented
}

function getReelSpinningState() {
    return reelSpinning || walking;
}

function getGameData() {
    return {
        totalWinnings: totalWinnings,
        hurricaneCategory: hurricaneCategory,
        isWalking: walking,
        hurricaneCol: hurricaneCol
    };
}

export { init, triggerHurricane, getReelSpinningState, getGameData };
