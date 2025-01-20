const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const leftEndPosition = 50;
const rightEndPosition = 550;

window.onload = function() {
    loadMainNav();
    window.supportPositions = [];
    window.pointLoadPositions = [];
    window.momentPositions = [];
    window.supportTypes = {};
    window.supports = {};
    window.pointLoads = {};
    window.moments = {};
    window.loads = {};
    window.distributedLoads = [];
    window.E = 200000000; // Default Young's Modulus in kPa
    window.I = 0.00001; // Default Moment of Inertia in m^4 
};

function loadMainNav() {
    const inputBar = document.getElementById('inputBar');
    inputBar.innerHTML = `
        <button onclick="loadBeamSettings()">Beams</button>
        <button onclick="loadSupportSettings()">Supports</button>
        <button onclick="loadPointLoadSettings()">Point Loads</button>
        <button onclick="loadMomentSettings()">Moments</button>
        <button onclick="loadDistributedLoadSettings()">Distributed Loads</button>
        <button onclick="solve()" id="solveBtn">Solve</button>
        <button onclick="reset()" id="resetBtn">&#8634;</button>
    `;
};

function reset() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    window.supportPositions = [];
    window.pointLoadPositions = [];
    window.momentPositions = [];
    window.supportTypes = {};
    window.supports = {};
    window.pointLoads = {};
    window.moments = {};
    window.loads = {};
    window.distributedLoads = [];
    messageArea.innerHTML = '';
    messageArea.style.display = 'none';
    answerArea.innerHTML = '';
    answerArea.style.display = 'none';
}


function updateMessage(message) {
    const messageArea = document.getElementById('messageArea');
    if(messageArea.style.display === 'none') {
        messageArea.style.display = 'block';
    }
    // Check if messageArea already has text and append a new line if it does
    if (messageArea.textContent.length > 0) {
        messageArea.innerHTML += "<br>"; // Adds a line break for clear separation
    }
    messageArea.innerHTML += message; // Append the new message
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessageArea');
    errorMessage.innerHTML = message;
    setTimeout(() => {
        document.addEventListener('click', removeError, {once: true});
    }, 200); 
};
function removeError() {
    const errorMessage = document.getElementById('errorMessageArea');
    errorMessage.innerHTML = '';
};

function countReactionForces() {
    let totalReactions = 0;
    Object.keys(window.supportTypes).forEach(position => {
        const type = window.supportTypes[position];
        switch (type) {
            case 'fixed':
                totalReactions += 3;
                break;
            case 'pinned':
                totalReactions += 2;
                break;
            case 'rolled':
                totalReactions += 1;
                break;
        }
    });
    return totalReactions;
}

function countBeamElements() {
    if (window.supportPositions.length === 0) {
        // If no supports, the number of beam elements depends on whether you consider an unsupported beam as one element or unstable.
        return 0;
    }
    // Sort positions to process them in order.
    let sortedPositions = window.supportPositions.sort((a, b) => a - b);
    let beamElements = 0;

    // Check for a segment before the first support if it's not at the start of the beam.
    if (sortedPositions[0] !== 0) {
        beamElements += 1;
    }
    // Count segments between supports.
    for (let i = 0; i < sortedPositions.length - 1; i++) {
        beamElements += 1;
    }
    // Check for a segment after the last support if it's not at the end of the beam.
    if (sortedPositions[sortedPositions.length - 1] !== window.beamLength) {
        beamElements += 1;
    }
    return beamElements;
}


function solve() {
    // Use existing function to check if the beam length is defined
    if (!ensureBeamLengthDefined()) {
        return; // Stop execution if no beam length
    }

    // Check if there are enough supports
    const numberOfSupports = window.supportPositions.length;
    
    // Ensure there is either one fixed support or at least two other supports
    if (numberOfSupports < 1) {
        showError("Please add supports before solving.");
        return;
    }

    // Check if all supports are roller supports
    const allRollerSupports = window.supportPositions.every(position => window.supportTypes[position] === 'rolled');
    if (allRollerSupports) {
        showError("The beam is unstable. Please add a fixed or pinned support.");
        return;
    }

    // Check if there is at least one load or moment
    if (window.pointLoadPositions.length === 0 && window.momentPositions.length === 0 && window.distributedLoads.length === 0) {
        showError("Please add at least one load or moment before solving.");
        return;
    }

    const reactionForces = countReactionForces();

    if (reactionForces < 3) {
        showError("The beam is unstable, please add more supports.");
        return;
    } 
    
    const nodes = generateNodes(window.beamLength);
    const { K_global, elementStiffnessMatrices } = createGlobalStiffnessMatrix(nodes, window.E, window.I);
    let DoFs = initialiseDoFMatrix(nodes, window.supports);
    let loads = initializeLoadMatrix(nodes, window.pointLoads, window.moments, window.distributedLoads);
    let solvedDoFs = solveForUnknowns(K_global, DoFs, loads);
    let solvedForces = calculateUnknownForces(K_global, solvedDoFs);
    let solvedReactions = calculateUnknownReactions(solvedForces, loads);
    let formattedDoFs = formatDoFs(solvedDoFs);
    let formattedK_global = formatMatrix(K_global, 1); // Format global stiffness matrix to 1 decimal place
    console.log('reactions: ', solvedReactions);
    console.log('DoFs: ', formattedDoFs);
    displayResults(elementStiffnessMatrices, formattedK_global, solvedForces, solvedReactions, formattedDoFs); // Pass solvedForces to displayResults
    drawNodePositions(nodes, window.beamLength);
}



function matrixToKaTeX(matrix, title, preface) {
    let matrixContent = '';

    // Construct each row of the matrix
    matrix.forEach((row, index) => {
        row.forEach((cell, cellIndex) => {
            // Append the unit directly next to each number
            matrixContent += `${cell}`;  // Format numbers to 5 decimal places and add units
            if (cellIndex < row.length - 1) {
                matrixContent += '& ';  // LaTeX column separator
            }
        });
        if (index < matrix.length - 1) {
            matrixContent += '\\\\ ';  // LaTeX row separator
        }
    });

    // Wrap the content in LaTeX matrix syntax and add preface if provided
    let html = `<h3>${title}</h3>`;
    html += `\\[ ${preface}\\begin{bmatrix} ${matrixContent} \\end{bmatrix} \\]`;

    return html;
}

function matrixEquationToKaTeX(forces, stiffnessMatrix, dofs) {
    let forcesContent = '';
    let stiffnessMatrixContent = '';
    let dofsContent = '';

    // Construct each row of the forces matrix
    forces.forEach((row, index) => {
        row.forEach((cell, cellIndex) => {
            forcesContent += `${cell}`;
            if (cellIndex < row.length - 1) {
                forcesContent += '& ';
            }
        });
        if (index < forces.length - 1) {
            forcesContent += '\\\\ ';
        }
    });

    // Construct each row of the stiffness matrix
    stiffnessMatrix.forEach((row, index) => {
        row.forEach((cell, cellIndex) => {
            stiffnessMatrixContent += `${cell}`;
            if (cellIndex < row.length - 1) {
                stiffnessMatrixContent += '& ';
            }
        });
        if (index < stiffnessMatrix.length - 1) {
            stiffnessMatrixContent += '\\\\ ';
        }
    });

    // Construct each row of the dofs matrix
    dofs.forEach((row, index) => {
        row.forEach((cell, cellIndex) => {
            dofsContent += `${cell}`;
            if (cellIndex < row.length - 1) {
                dofsContent += '& ';
            }
        });
        if (index < dofs.length - 1) {
            dofsContent += '\\\\ ';
        }
    });

    // Wrap the content in LaTeX matrix syntax and add preface if provided
    return `\\[ \\begin{bmatrix} ${forcesContent} \\end{bmatrix} = \\begin{bmatrix} ${stiffnessMatrixContent} \\end{bmatrix} \\begin{bmatrix} ${dofsContent} \\end{bmatrix} \\]`;
}



function generateMatrixLabel(prefixes, count) {
    let labelContent = '';
    for (let i = 1; i <= count; i++) {
        prefixes.forEach(prefix => {
            labelContent += `${prefix}${i} \\\\ `;
        });
    }
    // Remove the extra '\\\\' from the end of the string
    labelContent = labelContent.slice(0, -4);
    return `\\begin{bmatrix} ${labelContent} \\end{bmatrix} = `;
}

function displayResults(elementStiffnessMatrices, stiffnessMatrix, solvedForces, solvedReactions, formattedDoFs, loads) {
    const answerArea = document.getElementById('answerArea');
    answerArea.style.display = 'block'; // Ensure the area is visible

    // Equation
    let initialAnswer = '<h3>Solved Equation:</h3>';
    initialAnswer += '\\[ \\begin{bmatrix}\\bold{F}\\end{bmatrix} = \\begin{bmatrix}\\bold{K}\\end{bmatrix} \\begin{bmatrix}\\bold{x}\\end{bmatrix} \\]';
    
    // Display the formatted equation with matrices
    const formattedUnknownForces = formatUnknownForces(solvedForces);
    const equationHtml = matrixEquationToKaTeX(formattedUnknownForces, stiffnessMatrix, formattedDoFs);

    // Element Stiffness Matrices
    let elementStiffnessMatricesHtml = '<h3>Element Stiffness Matrices:</h3>';
    elementStiffnessMatrices.forEach((matrix, index) => {
        elementStiffnessMatricesHtml += matrixToKaTeX(matrix, `Element ${index + 1} Stiffness Matrix:`, `\\begin{bmatrix}\\bold{K}_e^${index + 1}\\end{bmatrix} = `, '');
    });

    // Global Stiffness Matrix
    const stiffnessMatrixHtml = matrixToKaTeX(stiffnessMatrix, 'Global Stiffness Matrix:', '\\begin{bmatrix}\\bold{K}\\end{bmatrix} = ');

    // Reaction Forces Matrix
    const reactionPrefixes = ['R_', 'M_'];
    const reactionCount = solvedReactions.length / 2; // Assuming each reaction has a force and a moment
    const reactionLabel = generateMatrixLabel(reactionPrefixes, reactionCount);
    const solvedReactionsHtml = matrixToKaTeX(solvedReactions, 'Reaction Forces:', reactionLabel);

    // Degrees of Freedom
    const dofPrefixes = ['x_', '\\theta_'];
    const dofCount = formattedDoFs.length / 2; // Assuming each node has a displacement and a rotation
    const dofLabel = generateMatrixLabel(dofPrefixes, dofCount);
    const formattedDoFsMatrixHtml = matrixToKaTeX(formattedDoFs, 'Degrees of Freedom:', dofLabel);

    answerArea.innerHTML = initialAnswer + equationHtml + elementStiffnessMatricesHtml + stiffnessMatrixHtml + solvedReactionsHtml + formattedDoFsMatrixHtml + '* Anticlockwise and upwards direction are taken as positive.';
    renderMathInElement(answerArea);
}





function generateNodes(beamLength) {
    let nodeSet = new Set();

    // Ensure the leftmost and rightmost edges are always considered as nodes
    nodeSet.add(0); // Left edge of the beam
    nodeSet.add(beamLength); // Right edge of the beam

    // Add all support positions to the node set
    Object.keys(window.supports).forEach(position => {
        nodeSet.add(parseFloat(position));
    });

    // Add all point load positions to the node set
    Object.keys(window.pointLoads).forEach(position => {
        nodeSet.add(parseFloat(position));
    });

    // Add all moment positions to the node set
    Object.keys(window.moments).forEach(position => {
        nodeSet.add(parseFloat(position));
    });

    // Add all distributed load positions to the node set
    window.distributedLoads.forEach(load => {
        nodeSet.add(load.start);
        nodeSet.add(load.end);
    });

    // Convert the set back to an array and sort it
    let nodes = Array.from(nodeSet).sort((a, b) => a - b);

    return nodes;
}

function drawNodePositions(nodePositions, beamLength) {
    // Constants for drawing
    const scale = 500 / beamLength;
    const dotRadius = 5; // Radius of the dots
    const dotColor = 'red';

    
    // Draw a red dot for each node position
    nodePositions.forEach((position, index) => {
        const scaledPosition = 50 + position * scale;
        ctx.beginPath();
        ctx.arc(scaledPosition, canvas.height / 2, dotRadius, 0, 2 * Math.PI, false);
        ctx.fillStyle = dotColor;
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();
        ctx.setLineDash([2, 4]);
        ctx.moveTo(scaledPosition, 160);
        ctx.lineTo(scaledPosition, 240);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '12px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(index + 1, scaledPosition, 250);
    });
    // Label the elements
    for (let i = 0; i < nodePositions.length - 1; i++) {
        const startNodePosition = 50 + nodePositions[i] * scale;
        const endNodePosition = 50 + nodePositions[i + 1] * scale;
        const elementMidPoint = (startNodePosition + endNodePosition) / 2;

        ctx.font = '16px Arial';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i + 1, elementMidPoint, 165);
    }
    ctx.fillStyle = 'black';
}


function loadBeamSettings() {
    const inputBar = document.getElementById('inputBar');
    inputBar.innerHTML = `
        <button onclick="loadMainNav()">&larr;</button>
        <h3>Beam Length:</h3>
        <input type="number" placeholder="Length in meters" id="L"/><span> m</span>
        <button onclick="saveBeamLength()">Save</button>
        <div>
        <button onclick="loadBeamProperties()">Beam Properties</button>
        </div>
    `;
}

function ensureBeamLengthDefined() {
    if (window.beamLength === undefined || window.beamLength === 0) {
        showError("Please go back and choose a valid length for the beam before proceeding.");
        return false;  // Return false if the beam length is not set
    }
    return true;  // Return true if the beam length is defined
}

function loadBeamProperties() {
    const inputBar = document.getElementById('inputBar');
    inputBar.innerHTML = `
        <button onclick="loadBeamSettings()">&larr;</button>
        <h3>Moment of Inertia (Iz):</h3>
        <input type="number" value="10000000" id="I"/><span> mm<sup>4</sup></span>
        <h3>Young's Modulus (E):</h3>
        <input type="number" value="200000" id="E"/><span> MPa</span>
        <button onclick="saveBeamProperties()">Save</button>
        `;
    }
    
function saveBeamProperties() {
    const momentOfInertiaInput = document.getElementById('I');
    const youngsModulusInput = document.getElementById('E');
     // Update the global variables if inputs are valid and not empty
    if (momentOfInertiaInput.value) {
        window.I = parseFloat(momentOfInertiaInput.value) / 1e12;
        console.log('Moment of Inertia updated: ', window.I);
    }

    if (youngsModulusInput.value) {
        window.E = parseFloat(youngsModulusInput.value) * 1000;
        console.log("Young's Modulus updated: ", window.E);
    }
}
function saveBeamLength() {
    const lengthInput = document.getElementById('L');
    const messageArea = document.getElementById('messageArea');
    if (lengthInput.value > 0) {
        window.beamLength = parseFloat(lengthInput.value);
        console.log('Length:', lengthInput.value); // Here you would handle saving the input value
        drawBeam(window.beamLength);
        window.supportPositions = [];
        window.pointLoadPositions = [];
        window.momentPositions = [];
        window.supportTypes = {};
        window.supports = {};
        window.pointLoads = {};
        window.moments = {};
        window.loads = {};
        messageArea.innerHTML = '';
        messageArea.style.display = 'none';
        answerArea.innerHTML = '';
        answerArea.style.display = 'none';
    } else {
        showError('Please enter a valid beam length greater than 0.')
    }
}

function drawBeam(length) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    // Draw the beam
    ctx.beginPath();
    ctx.fillStyle = 'black';
    ctx.lineWidth = 3;
    ctx.moveTo(50, canvasHeight / 2); // Start point of the beam
    ctx.lineTo(canvasWidth - 50 , canvasHeight / 2); // End point of the beam
    ctx.stroke();
    // Draw scale
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.moveTo(50, canvasHeight - 20);
    ctx.lineTo(50, canvasHeight - 40);
    ctx.moveTo(50, canvasHeight - 30);
    ctx.lineTo(canvasWidth - 50, canvasHeight - 30);
    ctx.moveTo(canvasWidth - 50, canvasHeight - 20);
    ctx.lineTo(canvasWidth - 50, canvasHeight - 40);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.font = "16px Arial";
    ctx.fillText(length + " m", canvasWidth / 2, canvasHeight - 10);
}


function loadSupportSettings() {
    if(ensureBeamLengthDefined()) {
        const inputBar = document.getElementById('inputBar');
        inputBar.innerHTML = `
            <button onclick="loadMainNav()">&larr;</button>
            <h3>Supports</h3>
            <div id="supportOptions">
                <button id="rolledSupport" onclick="selectSupport('rolled')">Rolled Support</button>
                <button id="pinnedSupport" onclick="selectSupport('pinned')">Pinned Support</button>
                <button id="fixedSupport" onclick="selectSupport('fixed')">Fixed Support</button>
            </div>
            <h3>Support Position:</h3>
            <input type="number" id="supportPosition" placeholder="Position" min="0" /><span> m</span>
            <button onclick="addSupport()">Add</button>
        `;
    
        // Initialize support type state
        window.selectedSupportType = null;
    }
}

function selectSupport(type) {
    // Clear previous selections
    document.querySelectorAll('#supportOptions button').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Mark the selected support type
    document.getElementById(`${type}Support`).classList.add('selected');
    window.selectedSupportType = type;
}

function addSupport() {
    const positionInput = document.getElementById('supportPosition');
    const position = parseFloat(positionInput.value);
    
    // Check for duplicate positions
    if (window.supportPositions.includes(position)) {
        showError("A support is already placed at this position.");
        return;
    }

    // Validate the position of the support against the beam length
    if (position > window.beamLength || isNaN(position) || position < 0) {
        showError(`Please enter a valid support position between 0 and ${window.beamLength} meters.`);
        return;
    }

    // Specific check for fixed supports
    if (window.selectedSupportType === 'fixed' && position !== 0 && position !== window.beamLength) {
        showError(`Fixed supports can only be placed at the ends of the beam (0 or ${window.beamLength}m).`);
        return;
    }

    if (!window.selectedSupportType) {
        showError("Please select a support type.");
        return;
    }

    // Adding the support position to the global tracking array
    window.supportPositions.push(position);
    window.supportTypes[position] = window.selectedSupportType;
    window.supports[position] = window.selectedSupportType;
    updateSupportsOrder();
    console.log(`Adding ${window.selectedSupportType} support at position ${position} meters.`);
    console.log(window.supports);
    // Draw the support
    drawSupport(position, window.selectedSupportType);
    // Clear the input field
    positionInput.value = "";
    // Clear previous selections
    document.querySelectorAll('#supportOptions button').forEach(btn => {
        btn.classList.remove('selected');
    });
    updateMessage(`${window.selectedSupportType} support @ ${position}m.`);
}

function updateSupportsOrder() {
    const orderedSupports = {};
    Object.keys(window.supports).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(key => {
        orderedSupports[key] = window.supports[key];
    });
    window.supports = orderedSupports; 
}

function drawSupport(position, type) {
    const scale = 500 / window.beamLength;
    const scaledPosition = 50 + position * scale;

    switch(type) {
        case 'fixed':
            drawFixedSupport(scaledPosition);
            break;
        case 'pinned':
            drawPinnedSupport(scaledPosition);
            break;
        case 'rolled':
            drawRolledSupport(scaledPosition);
            break;
        default:
            console.log('No such support type');
    }
}

function drawFixedSupport(position) {
    // Start the drawing path
    ctx.beginPath();
    ctx.lineWidth = 2;

    // Determine if the support is on the left end or the right end of the beam
    if (position === leftEndPosition) {
        // Draw the left fixed support
        ctx.moveTo(position, 100);
        ctx.lineTo(position, 200);
        for (let i = 0; i <= 10; i++) {
            ctx.moveTo(position, 100 + i * 10);
            ctx.lineTo(position - 10, 110 + i * 10);
        }
    } else if (position === rightEndPosition) {
        // Draw the right fixed support
        ctx.moveTo(position, 100);
        ctx.lineTo(position, 200);
        for (let i = 0; i <= 10; i++) {
            ctx.moveTo(position, 100 + i * 10);
            ctx.lineTo(position + 10, 110 + i * 10);
        }
    }
    ctx.stroke();
}

function drawPinnedSupport(position) {
    // Draw pin support
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(position, 150);
    ctx.lineTo(position - 10, 170);
    ctx.lineTo(position + 10, 170);
    ctx.closePath();
    ctx.stroke();
    ctx.moveTo(position - 20, 170);
    ctx.lineTo(position + 20, 170);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
        ctx.moveTo(position - 12.5 + i*10, 170);
        ctx.lineTo(position - 22.5 + i*10, 180);
    }
    ctx.stroke();
}

function drawRolledSupport(position) {
    // Draw roller support
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(position, 150);
    ctx.lineTo(position - 10, 170);
    ctx.lineTo(position + 10, 170);
    ctx.closePath();
    ctx.stroke();
    ctx.moveTo(position - 20, 170);
    ctx.lineTo(position + 20, 170);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(position - 10 + i*10, 175, 5, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

function loadPointLoadSettings() {
    if(ensureBeamLengthDefined()) {
        const inputBar = document.getElementById('inputBar');
        inputBar.innerHTML = `
            <button onclick="loadMainNav()">&larr;</button>
            <h3>Position:</h3>
            <input type="number" id="pointLoadPosition" placeholder="Position" min="0"/> m
            <h3>Value:</h3>
            <input type="number" id="pointLoadValue" placeholder="Value" /> kN
            <button onclick="addPointLoad()">Add</button>
        `;
    }
}

function addPointLoad() {
    const positionInput = document.getElementById('pointLoadPosition');
    const valueInput = document.getElementById('pointLoadValue');
    const position = parseFloat(positionInput.value);
    const value = parseFloat(valueInput.value);

    if(isNaN(position) || position < 0 || position > window.beamLength) {
        showError('Please enter a valid position within the beam length.');
        return;
    }
    if (isNaN(value) || value == 0) {
        showError('Please enter a valid load value.');
        return;
    }
    if (window.pointLoadPositions.includes(position)) {
        showError('A point load already exists at this position. Please choose a different position.');
        return;
    }
    // Add position to array
    window.pointLoadPositions.push(position);
    window.pointLoads[position] = -value;
    sortPointLoads();
    console.log(window.pointLoads);
    // Draw load
    drawPointLoad(position, value);
    // Clear input field
    positionInput.value = "";
    valueInput.value = "";
    updateMessage(`Load of ${-value} kN @ ${position}m.`);
}

function sortPointLoads() {
    const orderedPointLoads = {};
    Object.keys(window.pointLoads).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(key => {
        orderedPointLoads[key] = window.pointLoads[key];
    });
    window.pointLoads = orderedPointLoads;
}

function drawPointLoad(position, value) {
    const scale = 500 / window.beamLength;
    const scaledPosition = 50 + position * scale;

    // Draw the load W at position
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(scaledPosition, 75);
    ctx.lineTo(scaledPosition, canvasHeight / 2);
    // Draw the arrowheads
    ctx.moveTo(scaledPosition, canvasHeight / 2);
    ctx.lineTo(scaledPosition - 5, canvasHeight / 2 - 10);
    ctx.moveTo(scaledPosition, canvasHeight / 2);
    ctx.lineTo(scaledPosition + 5, canvasHeight / 2 - 10);
    ctx.stroke();
    // Load W label
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(value + " kN", scaledPosition, 70);
}

function loadMomentSettings() {
    if(ensureBeamLengthDefined()) {
        const inputBar = document.getElementById('inputBar');
        inputBar.innerHTML = `
            <button onclick="loadMainNav()">&larr;</button>
            <h3>Direction:</h3>
            <div>
                <button id="clockwise" onclick="selectDirection('clockwise')">&#8635;</button> <!-- Clockwise -->
                <button id="anticlockwise" onclick="selectDirection('anticlockwise')">&#8634;</button> <!-- Counter-Clockwise -->
            </div>
            <h3>Position:</h3>
            <input type="number" id="momentPosition" placeholder="Position"/> m
            <h3>Magnitude:</h3>
            <input type="number" id="momentMagnitude" placeholder="Magnitude" /> kNm
            <button onclick="addMoment()">Add</button>
        `;
        // Initialise moment direction state
        window.momentDirection = null;
    }
}

function selectDirection(direction) {
    window.momentDirection = direction;
    // Highlight the selected button
    document.querySelectorAll('#inputBar button').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.getElementById(direction).classList.add('selected');
}

function addMoment() {
    const positionInput = document.getElementById('momentPosition');
    const magnitudeInput = document.getElementById('momentMagnitude');
    const position = parseFloat(positionInput.value);
    const magnitude = parseFloat(magnitudeInput.value);

    // Ensure no duplicate moments are placed at the same position
    if (window.momentPositions && window.momentPositions.includes(position)) {
        showError("A moment already exists at this position.");
        return;
    }

    // Validate inputs
    if (isNaN(position) || position < 0 || position > window.beamLength) {
        showError("Please enter a valid position within the beam length.");
        return;
    }
    if (isNaN(magnitude) || magnitude <= 0) {
        showError("Please enter a valid magnitude.");
        return;
    }
    if (!window.momentDirection) {
        showError("Please select a direction for the moment.");
        return;
    }

    const signedMagnitude = window.momentDirection === 'clockwise' ? -magnitude : magnitude;
    // Add moment to tracking list and draw
    window.momentPositions.push(position);
    window.moments[position] = signedMagnitude;
    updateMomentsOrder();
    console.log(window.moments);
    drawMoment(position, magnitude, window.momentDirection);

    // Clear input fields
    document.querySelectorAll('#inputBar button').forEach(btn => {
        btn.classList.remove('selected');
    });
    positionInput.value = "";
    magnitudeInput.value = "";
    // Add message
    if (window.momentDirection === 'clockwise') {
        updateMessage(`Moment of -${magnitude} kNm @ ${position}m.`);
    } else {
        updateMessage(`Moment of ${magnitude} kNm @ ${position}m.`)
    }
}

function updateMomentsOrder() {
    const orderedMoments = {};
    Object.keys(window.moments).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(key => {
        orderedMoments[key] = window.moments[key];
    });
    window.moments = orderedMoments;
}

function drawMoment(position, magnitude, direction) {
    const scale = 500 / window.beamLength;
    const scaledPosition = 50 + position * scale;
    const yPosition = 150; // Vertical position of the moment on canvas

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.arc(scaledPosition, yPosition, 20, Math.PI / 2, 3 * Math.PI / 2, direction === 'anticlockwise');
    ctx.moveTo(scaledPosition, yPosition - 20); // Move to top of the arc for arrowhead
    if (direction === 'anticlockwise') {
        ctx.lineTo(scaledPosition + 5, yPosition - 25);
        ctx.moveTo(scaledPosition, yPosition - 20);
        ctx.lineTo(scaledPosition + 5, yPosition - 15);
    } else {
        ctx.lineTo(scaledPosition - 5, yPosition - 25);
        ctx.moveTo(scaledPosition, yPosition - 20);
        ctx.lineTo(scaledPosition - 5, yPosition - 15);
    }
    ctx.stroke();

    // Label the moment
    ctx.font = "16px Arial";
    ctx.fillText(`${magnitude} kNm`, scaledPosition, yPosition - 30);
}

function loadDistributedLoadSettings() {
    if (ensureBeamLengthDefined()) {
        const inputBar = document.getElementById('inputBar');
        inputBar.innerHTML = `
            <button onclick="loadMainNav()">Back</button>
            <h3>Start Position:</h3>
            <input type="number" id="startPosition" placeholder="Start Position" /> m
            <h3>End Position:</h3>
            <input type="number" id="endPosition" placeholder="End Position" /> m
            <h3>Value:</h3>
            <input type="number" id="value" placeholder="Value" /> kN/m
            <button onclick="addDistributedLoad()">Add</button>
        `;
    }
}
function addDistributedLoad() {
    const startPosition = parseFloat(document.getElementById('startPosition').value);
    const endPosition = parseFloat(document.getElementById('endPosition').value);
    const value = parseFloat(document.getElementById('value').value);

    const scale = 500 / window.beamLength;
    const startLoadPosition = 50 + startPosition * scale;
    const endLoadPosition = 50 + endPosition * scale;

    // Validate input positions
    if (isNaN(startPosition) || startPosition < 0 || startPosition > window.beamLength ||
        isNaN(endPosition) || endPosition < 0 || endPosition > window.beamLength || startPosition >= endPosition) {
            showError('Please enter valid start and end positions within the beam length.');
            return;
        }

    // Validate value
    if (isNaN(value)) {
        showError('Please enter the value of the load.')
        return;
    }

    // Check for overlaps with existing loads
    for (let load of window.distributedLoads) {
        if ((startPosition > load.start && startPosition < load.end) ||
            (endPosition > load.start && endPosition < load.end) ||
            (startPosition <= load.start && endPosition >= load.end)) {
            showError('A distributed load already exists in this range. Please choose a different range.');
            return;
        };
    };

    // Add distributed load to the global tracking array
    window.distributedLoads.push({ start: startPosition, end: endPosition, value: -value });
    window.distributedLoads.sort((a, b) => a.start - b.start);

    console.log(window.distributedLoads);

    drawDistributedLoad(startLoadPosition, endLoadPosition, value);
    document.getElementById('startPosition').value = "";
    document.getElementById('endPosition').value = "";
    document.getElementById('value').value = "";
    updateMessage(`Distributed load of ${-value} kN/m from ${startPosition}m to ${endPosition}m.`);
}

function drawDistributedLoad(startLoadPosition, endLoadPosition, value) {
    const yBase = 110; // Base line for the load
    const yHeight = 150; // Top line where arrows point to

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(startLoadPosition, yBase);
    ctx.lineTo(endLoadPosition, yBase);
    distributedArrows(startLoadPosition, yHeight);
    distributedArrows(endLoadPosition, yHeight);
    ctx.stroke();

    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${value} kN/m`, (startLoadPosition + endLoadPosition) / 2, yBase - 10);

    function distributedArrows(loadPosition, yheight) {
        ctx.moveTo(loadPosition, 110);
        ctx.lineTo(loadPosition, yheight);
        ctx.moveTo(loadPosition - 5, yheight - 10);
        ctx.lineTo(loadPosition, yheight);
        ctx.lineTo(loadPosition + 5, yheight - 10);
    }
}

