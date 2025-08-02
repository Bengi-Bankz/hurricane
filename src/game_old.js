import {
    Application,
    Graphics,
    Container
} from "pixi.js";

let app;
let gridContainer;
let gridCells = [];
const COLS = 5;
const ROWS = 5;
const cellSize = 124;

async function init(canvasContainer) {
    // Create PIXI application
    app = new Application();

    await app.init({
        width: COLS * cellSize + 100, // Add some padding
        height: ROWS * cellSize + 100,
        backgroundColor: 0x1e1e1e
    });

    // Add canvas to the container
    canvasContainer.appendChild(app.canvas);

    // Create the grid
    createGrid();
}

function createGrid() {
    // Create container for the grid
    gridContainer = new Container();

    // Center the grid
    gridContainer.x = 50;
    gridContainer.y = 50;

    // Create grid cells
    for (let row = 0; row < ROWS; row++) {
        gridCells[row] = [];
        for (let col = 0; col < COLS; col++) {
            const cell = new Graphics();

            // Draw cell background
            cell.rect(0, 0, cellSize, cellSize);
            cell.fill(0x333333);
            cell.stroke({ width: 2, color: 0x666666 });

            // Position the cell
            cell.x = col * cellSize;
            cell.y = row * cellSize;

            gridContainer.addChild(cell);
            gridCells[row][col] = cell;
        }
    }

    app.stage.addChild(gridContainer);
}

async function spin() {
    return new Promise((resolve) => {
        // Simple spin animation - flash each cell randomly
        let flashCount = 0;
        const maxFlashes = 20;

        const flashInterval = setInterval(() => {
            // Reset all cells to normal color
            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    gridCells[row][col].clear();
                    gridCells[row][col].rect(0, 0, cellSize, cellSize);
                    gridCells[row][col].fill(0x333333);
                    gridCells[row][col].stroke({ width: 2, color: 0x666666 });
                }
            }

            // Flash random cells
            for (let i = 0; i < 5; i++) {
                const randomRow = Math.floor(Math.random() * ROWS);
                const randomCol = Math.floor(Math.random() * COLS);
                const cell = gridCells[randomRow][randomCol];

                cell.clear();
                cell.rect(0, 0, cellSize, cellSize);
                cell.fill(0x4CAF50); // Green flash
                cell.stroke({ width: 2, color: 0x666666 });
            }

            flashCount++;
            if (flashCount >= maxFlashes) {
                clearInterval(flashInterval);

                // Final state - reset all to normal
                for (let row = 0; row < ROWS; row++) {
                    for (let col = 0; col < COLS; col++) {
                        gridCells[row][col].clear();
                        gridCells[row][col].rect(0, 0, cellSize, cellSize);
                        gridCells[row][col].fill(0x333333);
                        gridCells[row][col].stroke({ width: 2, color: 0x666666 });
                    }
                }

                resolve();
            }
        }, 100); // Flash every 100ms
    });
}

export { init, spin };
