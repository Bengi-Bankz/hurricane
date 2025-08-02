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

// Payline definitions - each payline is an array of [row, col] coordinates
const paylines = [
    // Lines 1-5: Horizontal lines
    [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], // Line 1
    [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]], // Line 2
    [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]], // Line 3
    [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4]], // Line 4
    [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4]], // Line 5

    // Lines 6-13: Zigzag patterns
    [[0, 0], [1, 1], [0, 2], [1, 3], [0, 4]], // Line 6
    [[1, 0], [0, 1], [1, 2], [0, 3], [1, 4]], // Line 7
    [[1, 0], [2, 1], [1, 2], [2, 3], [1, 4]], // Line 8
    [[2, 0], [1, 1], [2, 2], [1, 3], [2, 4]], // Line 9
    [[2, 0], [3, 1], [2, 2], [3, 3], [2, 4]], // Line 10
    [[3, 0], [2, 1], [3, 2], [2, 3], [3, 4]], // Line 11
    [[3, 0], [4, 1], [3, 2], [4, 3], [3, 4]], // Line 12
    [[4, 0], [3, 1], [4, 2], [3, 3], [4, 4]], // Line 13

    // Lines 14-15: Diagonal lines
    [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]], // Line 14
    [[4, 0], [3, 1], [2, 2], [1, 3], [0, 4]]  // Line 15
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
        console.log('Starting to load sprites...');

        // Load the sprite sheet texture
        console.log('Loading texture from: /symbol-sprites.png');
        const texture = await Assets.load('/symbol-sprites.png');
        console.log('Texture loaded successfully:', texture);

        // Load the atlas data as raw JSON using fetch
        console.log('Loading atlas data from: /symbol-sprites.png.json');
        const response = await fetch('/symbol-sprites.png.json');
        const atlasData = await response.json();
        console.log('Atlas data loaded successfully:', atlasData);

        // Create and parse spritesheet
        console.log('Creating spritesheet...');
        spritesheet = new Spritesheet(texture, atlasData);
        await spritesheet.parse();

        console.log('Sprites loaded successfully');
        console.log('Available sprites:', Object.keys(spritesheet.textures));
    } catch (error) {
        console.error('Error loading sprites:', error);
        console.error('Error details:', error.message);
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

    // Calculate the target Y position for this row
    const targetY = row * cellSize;

    // Find the symbol at this exact position (within 1 pixel tolerance)
    for (const sprite of reelSymbolsInCol) {
        if (sprite && Math.abs(sprite.y - targetY) < 1) {
            return sprite.symbolName;
        }
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

async function spin(betAmount = 10) {
    if (isSpinning) return;
    isSpinning = true;

    return new Promise((resolve) => {
        console.log(`Starting spin with bet: ${betAmount}`);
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

                // Check for payline wins with bet amount
                const result = checkPaylines(betAmount);

                setTimeout(() => resolve(result), 100); // Return the win result
            } else if (!allStopped) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    });
}

function spinReel(col, speed) {
    // Move all symbols down
    reelSymbols[col].forEach(sprite => {
        if (sprite) {
            sprite.y += speed;

            // If symbol has moved too far down, wrap it to the top
            if (sprite.y > REEL_HEIGHT + cellSize) {
                sprite.y = sprite.y - (SYMBOLS_PER_REEL * cellSize);

                // Give it a new random symbol and maintain proper scaling
                const newSymbolName = getRandomSymbol();
                if (spritesheet && spritesheet.textures[newSymbolName]) {
                    sprite.texture = spritesheet.textures[newSymbolName];
                    sprite.symbolName = newSymbolName;

                    // Re-apply proper scaling to maintain 124x124 size
                    const scaleX = cellSize / sprite.texture.width;
                    const scaleY = cellSize / sprite.texture.height;
                    sprite.scale.set(scaleX, scaleY);
                }
            }
        }
    });
}

function stopReel(col) {
    // Find all symbols in this reel and sort by Y position
    const sortedSymbols = reelSymbols[col]
        .filter(sprite => sprite)
        .sort((a, b) => a.y - b.y);

    if (sortedSymbols.length === 0) return;

    // Find the symbol closest to the top of the visible area (y = 0)
    let closestToTop = sortedSymbols[0];
    let minDistance = Math.abs(closestToTop.y);

    for (const sprite of sortedSymbols) {
        const distance = Math.abs(sprite.y);
        if (distance < minDistance) {
            minDistance = distance;
            closestToTop = sprite;
        }
    }

    // Calculate snap offset to align closest symbol to grid
    const targetY = Math.round(closestToTop.y / cellSize) * cellSize;
    const snapOffset = targetY - closestToTop.y;

    // Apply snap offset to all symbols
    reelSymbols[col].forEach(sprite => {
        if (sprite) {
            sprite.y += snapOffset;
        }
    });

    // Now ensure we have exactly 5 symbols in the visible area (0, 124, 248, 372, 496)
    const visiblePositions = [0, cellSize, cellSize * 2, cellSize * 3, cellSize * 4];

    visiblePositions.forEach((targetY, index) => {
        // Check if we have a symbol at this exact position
        let symbolAtPosition = reelSymbols[col].find(sprite =>
            sprite && Math.abs(sprite.y - targetY) < 1
        );

        if (!symbolAtPosition) {
            // Find the closest symbol to move to this position
            let closestSymbol = null;
            let closestDistance = Infinity;

            for (const sprite of reelSymbols[col]) {
                if (sprite && !visiblePositions.some(pos => Math.abs(sprite.y - pos) < 1)) {
                    const distance = Math.abs(sprite.y - targetY);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestSymbol = sprite;
                    }
                }
            }

            if (closestSymbol) {
                closestSymbol.y = targetY;

                // Give it a new random symbol
                const newSymbolName = getRandomSymbol();
                if (spritesheet && spritesheet.textures[newSymbolName]) {
                    closestSymbol.texture = spritesheet.textures[newSymbolName];
                    closestSymbol.symbolName = newSymbolName;

                    const scaleX = cellSize / closestSymbol.texture.width;
                    const scaleY = cellSize / closestSymbol.texture.height;
                    closestSymbol.scale.set(scaleX, scaleY);
                }
            }
        }
    });
}

function checkPaylines(betAmount = 10) {
    const wins = [];
    const currentGrid = getGridState();

    console.log('Checking paylines with grid:', currentGrid);

    paylines.forEach((payline, lineIndex) => {
        const lineSymbols = payline.map(([row, col]) => currentGrid[row][col]);
        console.log(`Payline ${lineIndex + 1}:`, lineSymbols);

        const win = checkLineForWin(lineSymbols, lineIndex + 1, betAmount);
        if (win) {
            wins.push({
                ...win,
                payline: lineIndex + 1,
                positions: payline
            });
        }
    });

    if (wins.length > 0) {
        console.log('WINS FOUND:', wins);
        highlightWinningLines(wins);

        // Calculate total payout
        const totalPayout = parseFloat((wins.reduce((sum, win) => sum + win.payout, 0)).toFixed(2));
        console.log(`Total payout: $${totalPayout.toFixed(2)}`);

        return { wins, totalPayout };
    }

    console.log('No wins found');
    return { wins: [], totalPayout: 0.00 };
}

function checkLineForWin(symbols, paylineNumber, betAmount = 10) {
    // Remove null symbols and get the actual symbol names
    const cleanSymbols = symbols.filter(symbol => symbol !== null);
    if (cleanSymbols.length < 5) return null;

    console.log(`Checking payline ${paylineNumber}:`, cleanSymbols);

    // Check for matching symbols from left to right
    const firstSymbol = cleanSymbols[0];
    let matchCount = 1;
    let actualSymbol = firstSymbol; // Track the actual symbol (not wild)

    // If first symbol is wild, we need to find the first non-wild to determine the winning symbol
    if (firstSymbol === wildSymbol && cleanSymbols.length > 1) {
        for (let i = 1; i < cleanSymbols.length; i++) {
            if (cleanSymbols[i] !== wildSymbol) {
                actualSymbol = cleanSymbols[i];
                break;
            }
        }
    }

    for (let i = 1; i < cleanSymbols.length; i++) {
        const currentSymbol = cleanSymbols[i];

        // A symbol matches if:
        // 1. It's the same as our actual symbol
        // 2. It's a wild (wilds substitute for anything)
        // 3. Our actual symbol is wild (wild line)
        if (currentSymbol === actualSymbol ||
            currentSymbol === wildSymbol ||
            actualSymbol === wildSymbol) {
            matchCount++;
        } else {
            break;
        }
    }

    console.log(`Payline ${paylineNumber}: ${matchCount} matching ${actualSymbol}`);

    // Define payout multipliers based on Game Info modal
    const payoutMultipliers = {
        // Low symbols (playing cards)
        5: {
            "10.png": 1.00,
            "jack.png": 1.25,
            "queen.png": 1.50,
            "king.png": 2.00,
            "ace.png": 2.50,
            // Mid symbols
            "windsock.png": 3.00,
            "water.png": 4.00,
            "radio.png": 5.00,
            // Top symbols
            "flashlight.png": 7.50,
            "evacsign.png": 10.00,
            // Special symbols
            [wildSymbol]: 10.00,
            [scatterSymbol]: 10.00
        },
        4: {
            "10.png": 0.50,
            "jack.png": 0.60,
            "queen.png": 0.75,
            "king.png": 1.00,
            "ace.png": 1.25,
            // Mid symbols
            "windsock.png": 1.50,
            "water.png": 2.00,
            "radio.png": 2.50,
            // Top symbols
            "flashlight.png": 3.75,
            "evacsign.png": 5.00,
            // Special symbols
            [wildSymbol]: 5.00,
            [scatterSymbol]: 5.00
        },
        3: {
            "10.png": 0.10,
            "jack.png": 0.15,
            "queen.png": 0.20,
            "king.png": 0.25,
            "ace.png": 0.30,
            // Mid symbols
            "windsock.png": 0.50,
            "water.png": 0.60,
            "radio.png": 0.75,
            // Top symbols
            "flashlight.png": 1.00,
            "evacsign.png": 1.25,
            // Special symbols
            [wildSymbol]: 2.50,
            [scatterSymbol]: 2.50
        }
    };

    // Add hurricane symbols with higher payouts
    hurricaneSymbols.forEach(symbol => {
        payoutMultipliers[5][symbol] = 6.00;
        payoutMultipliers[4][symbol] = 3.00;
        payoutMultipliers[3][symbol] = 1.00;
    });

    if (matchCount >= 3) {
        const multiplier = payoutMultipliers[matchCount]?.[actualSymbol] || 0;
        const payout = parseFloat((multiplier * betAmount).toFixed(2));
        console.log(`WIN: ${matchCount} ${actualSymbol} = ${multiplier}x bet ($${payout.toFixed(2)})`);
        return {
            symbol: actualSymbol,
            count: matchCount,
            payout: payout,
            multiplier: multiplier
        };
    }

    return null;
}

function highlightWinningLines(wins) {
    // Visual feedback for winning lines
    // This could animate the winning symbols or draw lines
    wins.forEach(win => {
        console.log(`Payline ${win.payline} won with ${win.count} ${win.symbol} for $${win.payout.toFixed(2)}`);

        // Highlight the winning symbols
        win.positions.forEach(([row, col]) => {
            // You could add visual effects here
            console.log(`Highlight position [${row}, ${col}]`);
        });
    });
}

export {
    init,
    spin,
    getSymbolAt,
    getGridState,
    checkPaylines,
    symbolNames,
    wildSymbol,
    scatterSymbol,
    stormTrackerSymbol,
    hurricaneSymbols,
    paylines
};
