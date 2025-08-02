import {
    Application,
    Graphics,
    Container
} from "pixi.js";

let app;
const COLS = 5;
const ROWS = 5;
const cellSize = 100;

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
    const gridContainer = new Container();

    // Center the grid
    gridContainer.x = 50;
    gridContainer.y = 50;

    // Create grid cells
    for (let row = 0; row < ROWS; row++) {
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
        }
    }

    app.stage.addChild(gridContainer);
}

export { init };
