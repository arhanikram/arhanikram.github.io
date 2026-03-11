document.getElementById('year').textContent = new Date().getFullYear();

// --- Dynamic Wandering Paw Prints Logic ---
const pawCanvas = document.getElementById('paw-canvas');
const pawCtx = pawCanvas ? pawCanvas.getContext('2d') : null;
let paws = [];
let lastStepTime = 0;

// Two invisible cat walkers
let catWalkers = [];

function initWalkers() {
    catWalkers = [
        {
            x: -20, // Start slightly off the left edge
            y: window.innerHeight * 0.25,
            angle: 0.2, // Pointing generally right and slightly down
            leftFoot: true,
            stride: 35, 
            spread: 16  
        },
        {
            x: window.innerWidth + 20, // Start slightly off the right edge
            y: window.innerHeight * 0.75,
            angle: Math.PI + 0.2, // Pointing generally left and slightly up
            leftFoot: false, // Alternate foot rhythm
            stride: 35,
            spread: 16
        }
    ];
}

function resizePawCanvas() {
    if(pawCanvas) {
        pawCanvas.width = window.innerWidth;
        pawCanvas.height = window.innerHeight;
        // Initialize walkers only if they haven't been created yet
        if (catWalkers.length === 0) {
            initWalkers();
        }
    }
}

window.addEventListener('resize', resizePawCanvas);
resizePawCanvas();

function drawPawPrint(ctx, x, y, rotation, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation + Math.PI / 2); // Canvas rotates clockwise, adjust direction
    ctx.scale(1.5, 1.5); // Make paws 50% larger
    ctx.fillStyle = `rgba(120, 60, 104, ${alpha * 0.35})`; // Darker Mauve-700 reduced to 35% opacity max

    // Main pad
    ctx.beginPath();
    ctx.ellipse(0, 5, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Toes
    ctx.beginPath(); ctx.ellipse(-10, -3, 3, 5, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-4, -9, 3, 5, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -9, 3, 5, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10, -3, 3, 5, 0.3, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
}

function animatePaws(timestamp) {
    if (!pawCtx) return;
    requestAnimationFrame(animatePaws);

    // Clear canvas for next frame
    pawCtx.clearRect(0, 0, pawCanvas.width, pawCanvas.height);

    // Take a step every 250ms (slightly faster stepping)
    if (timestamp - lastStepTime > 250) {
        const margin = 100;
        
        // Process each walker independently
        catWalkers.forEach(walker => {
            // Steer away from edges
            if (walker.x < margin || walker.x > pawCanvas.width - margin ||
                walker.y < margin || walker.y > pawCanvas.height - margin) {
                const angleToCenter = Math.atan2(pawCanvas.height/2 - walker.y, pawCanvas.width/2 - walker.x);
                let diff = angleToCenter - walker.angle;
                // Normalize the turn
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                walker.angle += diff * 0.2;
            } else {
                // Wander randomly
                walker.angle += (Math.random() - 0.5) * 0.8;
            }

            // Place foot (perpendicular to body angle)
            const perpAngle = walker.angle + (walker.leftFoot ? -Math.PI/2 : Math.PI/2);
            const pawX = walker.x + Math.cos(perpAngle) * walker.spread;
            const pawY = walker.y + Math.sin(perpAngle) * walker.spread;

            paws.push({ x: pawX, y: pawY, angle: walker.angle, alpha: 1.0 });

            // Move forward
            walker.x += Math.cos(walker.angle) * walker.stride;
            walker.y += Math.sin(walker.angle) * walker.stride;
            walker.leftFoot = !walker.leftFoot;
        });
        
        lastStepTime = timestamp;
    }

    // Draw fading paws
    for (let i = paws.length - 1; i >= 0; i--) {
        const paw = paws[i];
        paw.alpha -= 0.0015; // Fade out speed is halved (lingers longer)
        if (paw.alpha <= 0) {
            paws.splice(i, 1);
        } else {
            drawPawPrint(pawCtx, paw.x, paw.y, paw.angle, paw.alpha);
        }
    }
}

requestAnimationFrame(animatePaws);

// --- Layout and Wavy Line Math ---
const wrap = document.getElementById('horizontal-wrap');
const wavyLine = document.getElementById('wavy-line');
const catsContainer = document.getElementById('cats-container');
const catsFlipper = document.getElementById('cats-flipper');

// Define the total number of sections (vw)
const totalSections = 4;
const totalWidthVW = totalSections * 100;

// Safety check to prevent null reference errors
if(wrap) {
    wrap.style.width = `${totalWidthVW}vw`;
}

let waveAmplitude = window.innerHeight * 0.15;
let waveFrequency = 0.0025;
let waveCenterY = window.innerHeight * 0.75; // Lowered from 0.55 to 0.75 to move cats down

function drawWave() {
    if(!wavyLine) return; // Prevent null reference errors
    waveAmplitude = window.innerHeight * 0.15;
    waveCenterY = window.innerHeight * 0.75; // Lowered here too
    
    // Total width in pixels
    const totalWidthPx = (window.innerWidth * totalWidthVW) / 100;
    
    // Generate points for organic math-based wave
    let points = [];
    for (let x = 0; x <= totalWidthPx; x += 20) {
        // Compound sine waves for that "lusion" organic feel
        let y = waveCenterY 
                + Math.sin(x * waveFrequency) * waveAmplitude 
                + Math.sin(x * waveFrequency * 2.5) * (waveAmplitude * 0.3);
        points.push(`${x},${y}`);
    }
    wavyLine.setAttribute('points', points.join(' '));
    
    // Re-trigger scroll to correctly snap cats after resize
    updateScrollAndCats();
}

window.addEventListener('resize', drawWave);

// --- Horizontal Scroll & Cat Placement Logic ---
let lastScrollY = window.scrollY;
let scrollTimeout;

function updateScrollAndCats() {
    if(!wrap || !catsContainer) return; // Prevent null reference errors

    const scrollY = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    
    // Percentage scrolled (0 to 1)
    let scrollPercent = maxScroll > 0 ? scrollY / maxScroll : 0;
    
    // Translate the horizontal container
    const maxTranslate = (totalSections - 1) * window.innerWidth;
    const currentTranslateX = scrollPercent * maxTranslate;
    wrap.style.transform = `translateX(-${currentTranslateX}px)`;

    // Where are the cats horizontally on the screen? Fixed at 25% from left
    const catScreenX = window.innerWidth * 0.25;
    catsContainer.style.left = `${catScreenX}px`;

    // Calculate the exact X position on our wave math
    const globalX = currentTranslateX + catScreenX;
    
    // Match the Y using the exact same formula as the drawWave function
    const catY = waveCenterY 
                + Math.sin(globalX * waveFrequency) * waveAmplitude 
                + Math.sin(globalX * waveFrequency * 2.5) * (waveAmplitude * 0.3);
    
    // Offset the cat container so their paws perfectly touch the line (approx 85px)
    catsContainer.style.top = `${catY - 85}px`;

    // Animation classes based on scrolling direction
    if (scrollY !== lastScrollY) {
        catsContainer.classList.add('cat-walking');
        // Face direction of scroll
        if (scrollY < lastScrollY) {
            if (catsFlipper) catsFlipper.classList.remove('cats-facing-right'); // Moving backward (left)
        } else {
            if (catsFlipper) catsFlipper.classList.add('cats-facing-right'); // Moving forward (right)
        }
    }

    lastScrollY = scrollY;

    // Stop walking animation when scrolling stops
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        catsContainer.classList.remove('cat-walking');
    }, 100);
}

window.addEventListener('scroll', updateScrollAndCats);

// Allow horizontal scroll (trackpad/shift+wheel) to drive vertical scroll
window.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        window.scrollBy({ top: e.deltaX, behavior: 'auto' });
    }
}, { passive: false });

// Initial setup
setTimeout(() => {
    drawWave();
    updateScrollAndCats();
}, 100);

// --- Gateway Logic ---
function revealGames() {
    document.getElementById('games-gateway').classList.add('hidden');
    const gamesList = document.getElementById('games-list');
    gamesList.classList.remove('hidden');
    gamesList.classList.add('flex');
    
    // Subtle fade in effect
    gamesList.style.opacity = 0;
    setTimeout(() => {
        gamesList.style.transition = 'opacity 0.5s ease';
        gamesList.style.opacity = 1;
    }, 10);
}

// --- Game Modal Logic ---
let snakeGameLoop;

function openGame(game) {
    document.body.style.overflow = 'hidden'; // Prevent scrolling background
    const modal = document.getElementById(`modal-${game}`);
    if(modal) modal.classList.add('active');
    
    if (game === 'ttt') {
        initTTT();
    } else if (game === 'snake') {
        initSnake();
    }
}

function closeGame(game) {
    document.body.style.overflow = 'auto';
    const modal = document.getElementById(`modal-${game}`);
    if(modal) modal.classList.remove('active');
    if (game === 'snake') {
        clearInterval(snakeGameLoop);
    }
}

// --- Tic Tac Toe Logic ---
let tttBoard = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let tttActive = true;

function initTTT() {
    tttBoard = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    tttActive = true;
    
    const statusEl = document.getElementById('ttt-status');
    if(statusEl) {
        statusEl.textContent = `Player X's Turn`;
        statusEl.className = "text-center text-pink-600 font-semibold mb-6 text-lg";
    }
    
    const boardEl = document.getElementById('ttt-board');
    if(!boardEl) return;
    boardEl.innerHTML = '';
    
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'ttt-cell text-pink-700';
        cell.onclick = () => handleTTTClick(i, cell);
        boardEl.appendChild(cell);
    }
}

function handleTTTClick(index, cellEl) {
    if (tttBoard[index] !== '' || !tttActive) return;

    tttBoard[index] = currentPlayer;
    cellEl.textContent = currentPlayer;
    
    // Stylize colors based on player
    cellEl.style.color = currentPlayer === 'X' ? '#ec4899' : '#9d174d'; 

    checkTTTWinner();
    
    if (tttActive) {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        const statusEl = document.getElementById('ttt-status');
        if(statusEl) statusEl.textContent = `Player ${currentPlayer}'s Turn`;
    }
}

function checkTTTWinner() {
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (let condition of winConditions) {
        const [a, b, c] = condition;
        if (tttBoard[a] && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c]) {
            tttActive = false;
            const statusEl = document.getElementById('ttt-status');
            if(statusEl) {
                statusEl.textContent = `Player ${tttBoard[a]} Wins! 🎉`;
                statusEl.classList.add('text-green-600');
            }
            return;
        }
    }

    if (!tttBoard.includes('')) {
        tttActive = false;
        const statusEl = document.getElementById('ttt-status');
        if(statusEl) statusEl.textContent = 'It\'s a Draw! 🤝';
    }
}

// --- Snake Game Logic ---
const canvas = document.getElementById('snake-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const gridSize = 15;
const tileCount = canvas ? canvas.width / gridSize : 20;

let snake = [];
let apple = {};
let velocity = { x: 0, y: 0 };
let score = 0;
let highScore = localStorage.getItem('snakeHigh') || 0;

const highEl = document.getElementById('snake-high');
if(highEl) highEl.textContent = highScore;

// Touch swipe variables
let touchStartX = 0;
let touchStartY = 0;

function initSnake() {
    const overlay = document.getElementById('snake-overlay');
    if(overlay) overlay.classList.add('hidden');
    
    score = 0;
    const scoreEl = document.getElementById('snake-score');
    if(scoreEl) scoreEl.textContent = score;
    
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    velocity = { x: 0, y: -1 }; // Start moving up
    placeApple();
    
    clearInterval(snakeGameLoop);
    snakeGameLoop = setInterval(gameLoop, 120); // Speed
}

function startSnake() {
    initSnake();
}

function gameLoop() {
    updateSnake();
    drawSnakeGame();
}

function updateSnake() {
    // Calculate new head position
    const head = { 
        x: snake[0].x + velocity.x, 
        y: snake[0].y + velocity.y 
    };

    // Check Wall Collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Check Self Collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head); // Add new head

    // Check Apple Collision
    if (head.x === apple.x && head.y === apple.y) {
        score += 10;
        const scoreEl = document.getElementById('snake-score');
        if(scoreEl) scoreEl.textContent = score;
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('snakeHigh', highScore);
            if(highEl) highEl.textContent = highScore;
        }
        placeApple();
    } else {
        snake.pop(); // Remove tail if no apple eaten
    }
}

function drawSnakeGame() {
    if(!ctx) return;
    // Clear canvas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // slight transparent clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Snake
    snake.forEach((segment, index) => {
        // Gradient effect for snake
        ctx.fillStyle = index === 0 ? '#db2777' : '#f472b6'; 
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
        // Cute rounded look
        ctx.strokeStyle = '#be185d';
        ctx.strokeRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
    });

    // Draw Apple (as an emoji or red square)
    ctx.fillStyle = '#e11d48'; // Red
    ctx.beginPath();
    ctx.arc(
        apple.x * gridSize + gridSize/2, 
        apple.y * gridSize + gridSize/2, 
        gridSize/2 - 1, 
        0, 2 * Math.PI
    );
    ctx.fill();
}

function placeApple() {
    apple = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    // Prevent apple spawning on snake
    for (let segment of snake) {
        if (segment.x === apple.x && segment.y === apple.y) {
            placeApple();
            break;
        }
    }
}

function gameOver() {
    clearInterval(snakeGameLoop);
    const overlay = document.getElementById('snake-overlay');
    if(overlay) overlay.classList.remove('hidden');
}

// --- Controls for Snake ---
document.addEventListener('keydown', (e) => {
    // Only capture keys if modal is active
    const modal = document.getElementById('modal-snake');
    if(!modal || !modal.classList.contains('active')) return;

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (velocity.y !== 1) velocity = { x: 0, y: -1 };
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (velocity.y !== -1) velocity = { x: 0, y: 1 };
            e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (velocity.x !== 1) velocity = { x: -1, y: 0 };
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (velocity.x !== -1) velocity = { x: 1, y: 0 };
            e.preventDefault();
            break;
    }
});

// Touch Swipe Support for Mobile
if(canvas) {
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, {passive: true});

    canvas.addEventListener('touchend', (e) => {
        let touchEndX = e.changedTouches[0].screenX;
        let touchEndY = e.changedTouches[0].screenY;
        handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
    }, {passive: true});
}

function handleSwipe(startX, startY, endX, endY) {
    let dx = endX - startX;
    let dy = endY - startY;
    
    // Determine swipe direction based on largest delta
    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 30 && velocity.x !== -1) velocity = { x: 1, y: 0 }; // Right
        else if (dx < -30 && velocity.x !== 1) velocity = { x: -1, y: 0 }; // Left
    } else {
        // Vertical swipe
        if (dy > 30 && velocity.y !== -1) velocity = { x: 0, y: 1 }; // Down
        else if (dy < -30 && velocity.y !== 1) velocity = { x: 0, y: -1 }; // Up
    }
}