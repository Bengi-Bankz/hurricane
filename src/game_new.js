import {
    Application,
    Graphics,
    Container,
    Assets,
    Spritesheet,
    Sprite
} from "pixi.js";

let app;
let gridContainer;
let gridCells = [];
let symbolSprites = [];
let spritesheet;
let reelContainers = []; // Container for each reel column
let reelSymbols = []; // Symbols in each reel (more than visible)
let isSpinning = false;
const COLS = 5;
const ROWS = 5;
const cellSize = 124; // Match the symbol size from JSON
const REEL_HEIGHT = ROWS * cellSize; // Height of visible reel area
const SYMBOLS_PER_REEL = 20; // Total symbols in each reel (including off-screen)

// Symbol names from the sprite sheet
const symbolNames = [
    "windsock.png",
    "water.png",
    "radio.png",
    "queen.png",
    "king.png",
    "jack.png",
    "flashlight.png",
    "evacsign.png",
    "ace.png",
    "10.png"
];

// Special symbols
const wildSymbol = "wild.png";
const scatterSymbol = "scatter.png";
const stormTrackerSymbol = "storm-tracker.png";

// Hurricane category symbols
const hurricaneSymbols = [
    "cat1.png",
    "cat2.png",
    "cat3.png",
    "cat4.png",
    "cat5.png"
];

async function init(canvasContainer) {
    // Create PIXI application
    app = new Application();

    await app.init({
        width: COLS * cellSize + 100,
        height: ROWS * cellSize + 100,
        backgroundColor: 0x1e1e1e
    });

    // Add canvas to the container
    canvasContainer.appendChild(app.canvas);

    // Load the sprite sheet
    await loadSprites();

    // Create the grid
    createGrid();

    // Populate with initial symbols
    populateGrid();
}

async function loadSprites() {
    try {
        // Load the sprite sheet
        const texture = await Assets.load('/symbol-sprites.png');
        const atlasData = await Assets.load('/symbol-sprites.png.json');

        spritesheet = new Spritesheet(texture, atlasData);
        await spritesheet.parse();

        console.log('Sprites loaded successfully');
        console.log('Available sprites:', Object.keys(spritesheet.textures));
    } catch (error) {
        console.error('Error loading sprites:', error);
    }
}

function createGrid() {
    // Create container for the grid
    gridContainer = new Container();

    // Center the grid
    gridContainer.x = 50;
    gridContainer.y = 50;

    // Create grid background cells
    for (let row = 0; row < ROWS; row++) {
        gridCells[row] = [];
        for (let col = 0; col < COLS; col++) {
            // Create background cell
            const cell = new Graphics();
            cell.rect(0, 0, cellSize, cellSize);
            cell.fill(0x333333);
            cell.stroke({ width: 2, color: 0x666666 });
            cell.x = col * cellSize;
            cell.y = row * cellSize;

            gridContainer.addChild(cell);
            gridCells[row][col] = cell;
        }
    }

    // Create reel containers for spinning
    for (let col = 0; col < COLS; col++) {
        const reelContainer = new Container();
        reelContainer.x = col * cellSize;
        reelContainer.y = 0;

        // Create mask for each reel to hide symbols outside the visible area
        const mask = new Graphics();
        mask.rect(col * cellSize, 0, cellSize, REEL_HEIGHT);
        mask.fill(0xffffff);
        reelContainer.mask = mask;

        gridContainer.addChild(mask);
        gridContainer.addChild(reelContainer);
        reelContainers[col] = reelContainer;
        reelSymbols[col] = [];
    }

    app.stage.addChild(gridContainer);
}

function populateGrid() {
    // Clear existing symbols
    clearSymbols();

    // Initialize each reel with symbols
    for (let col = 0; col < COLS; col++) {
        populateReel(col);
    }
}

function populateReel(col) {
    // Clear existing symbols in this reel
    reelSymbols[col].forEach(sprite => {
        if (sprite && sprite.parent) {
            sprite.parent.removeChild(sprite);
        }
    });
    reelSymbols[col] = [];

    // Create symbols for this reel (more than visible for smooth scrolling)
    for (let i = 0; i < SYMBOLS_PER_REEL; i++) {
        const symbolName = getRandomSymbol();
        const sprite = createSymbolSprite(symbolName);

        if (sprite) {
            // Position symbol in the reel
            sprite.x = 0; // Relative to reel container
            sprite.y = (i - 5) * cellSize; // Start some symbols above visible area

            reelContainers[col].addChild(sprite);
            reelSymbols[col][i] = sprite;
        }
    }
}

function createSymbolSprite(symbolName) {
    if (spritesheet && spritesheet.textures[symbolName]) {
        const sprite = new Sprite(spritesheet.textures[symbolName]);

        // Scale to fit cell exactly
        const scaleX = cellSize / sprite.width;
        const scaleY = cellSize / sprite.height;
        sprite.scale.set(scaleX, scaleY);

        sprite.symbolName = symbolName;
        return sprite;
    }
    return null;
}

function getRandomSymbol() {
    // 85% chance for regular symbols, 10% wild, 5% scatter
    const rand = Math.random();

    if (rand < 0.85) {
        // Regular symbol
        return symbolNames[Math.floor(Math.random() * symbolNames.length)];
    } else if (rand < 0.95) {
        // Wild symbol
        return wildSymbol;
    } else {
        // Scatter symbol
        return scatterSymbol;
    }
}

function clearSymbols() {
    for (let col = 0; col < COLS; col++) {
        reelSymbols[col].forEach(sprite => {
            if (sprite && sprite.parent) {
                sprite.parent.removeChild(sprite);
            }
        });
        reelSymbols[col] = [];
    }
}

function getSymbolAt(row, col) {
    // Find the symbol at the specific grid position
    const reelSymbolsInCol = reelSymbols[col];
    if (!reelSymbolsInCol) return null;

    // Calculate which symbol index corresponds to this row
    // The visible symbols start at index 5 (since we have 5 symbols above visible area)
    const symbolIndex = 5 + row;

    if (reelSymbolsInCol[symbolIndex]) {
        return reelSymbolsInCol[symbolIndex].symbolName;
    }
    return null;
}

function getGridState() {
    const grid = [];
    for (let row = 0; row < ROWS; row++) {
        grid[row] = [];
        for (let col = 0; col < COLS; col++) {
            grid[row][col] = getSymbolAt(row, col);
        }
    }
    return grid;
}

async function spin() {
    if (isSpinning) return;
    isSpinning = true;

    return new Promise((resolve) => {
        const spinDurations = [2000, 2200, 2400, 2600, 2800]; // Each reel stops at different times
        const spinSpeeds = [15, 16, 17, 18, 19]; // Different speeds for variety
        const reelStopTimes = spinDurations.map(duration => Date.now() + duration);
        const reelStopped = [false, false, false, false, false];
        let allReelsStopped = false;

        // Start spinning all reels
        const animate = () => {
            const currentTime = Date.now();
            let allStopped = true;

            for (let col = 0; col < COLS; col++) {
                if (!reelStopped[col]) {
                    if (currentTime >= reelStopTimes[col]) {
                        // Stop this reel - snap to nearest symbol position
                        stopReel(col);
                        reelStopped[col] = true;
                    } else {
                        // Continue spinning this reel
                        spinReel(col, spinSpeeds[col]);
                        allStopped = false;
                    }
                }
            }

            if (allStopped && !allReelsStopped) {
                allReelsStopped = true;
                isSpinning = false;
                console.log('Final grid state:', getGridState());
                setTimeout(() => resolve(), 100); // Small delay to see final result
            } else if (!allStopped) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    });
}

function spinReel(col, speed) {
    const reelContainer = reelContainers[col];

    // Move all symbols down
    reelSymbols[col].forEach(sprite => {
        if (sprite) {
            sprite.y += speed;

            // If symbol has moved too far down, wrap it to the top
            if (sprite.y > REEL_HEIGHT + cellSize) {
                sprite.y = sprite.y - (SYMBOLS_PER_REEL * cellSize);
                // Give it a new random symbol
                sprite.texture = spritesheet.textures[getRandomSymbol()];
                sprite.symbolName = getRandomSymbol();
            }
        }
    });
}

function stopReel(col) {
    // Snap the reel to the nearest symbol position
    const reelContainer = reelContainers[col];

    // Find the closest snap position
    if (reelSymbols[col][5]) { // The first visible symbol (index 5)
        const currentY = reelSymbols[col][5].y;
        const targetY = 0; // Where we want the first visible symbol to be
        const snapOffset = targetY - currentY;

        // Adjust all symbols in this reel
        reelSymbols[col].forEach(sprite => {
            if (sprite) {
                sprite.y += snapOffset;
            }
        });
    }
}

export {
    init,
    spin,
    getSymbolAt,
    getGridState,
    symbolNames,
    wildSymbol,
    scatterSymbol,
    stormTrackerSymbol,
    hurricaneSymbols
};
