function createGlobalStiffnessMatrix(nodes, E, I) {
    const numNodes = nodes.length;
    const numDOFs = numNodes * 2;
    let K_global = [];
    let elementStiffnessMatrices = []; // To store stiffness matrices of each element

    // initialise the global stiffness matrix with zeros
    for (let i = 0; i < numDOFs; i++) {
        K_global[i] = Array(numDOFs).fill(0);
    }

    // Assemble the global stiffness matrix with dynamic lengths for each element
    for (let i = 0; i < numNodes - 1; i++) {
        const L = nodes[i + 1] - nodes[i]; // Dynamic length calculation for each element
        const K_element = [
            [12 * E * I / (L**3), 6 * E * I / (L**2), -12 * E * I / (L**3), 6 * E * I / (L**2)],
            [6 * E * I / (L**2), 4 * E * I / L, -6 * E * I / (L**2), 2 * E * I / L],
            [-12 * E * I / (L**3), -6 * E * I / (L**2), 12 * E * I / (L**3), -6 * E * I / (L**2)],
            [6 * E * I / (L**2), 2 * E * I / L, -6 * E * I / (L**2), 4 * E * I / L]
        ];

        // Format element stiffness matrix to 1 decimal place
        const formattedK_element = formatMatrix(K_element, 1);
        elementStiffnessMatrices.push(formattedK_element); // Store the formatted element stiffness matrix

        let startDOF = i * 2;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                K_global[startDOF + row][startDOF + col] += K_element[row][col];
            }
        }
    }

    return { K_global, elementStiffnessMatrices };
}



function initialiseDoFMatrix(nodes, supports) {
    let DoFs = [];

    nodes.forEach((node, index) => {
        let supportType = supports[node];
        let dofIndex = index * 2; // Each node has two degrees of freedom: x and theta

        // Initialize default degrees of freedom as null in column vector format
        DoFs[dofIndex] = [null]; // Displacement x
        DoFs[dofIndex + 1] = [null]; // Rotation theta

        switch (supportType) {
            case 'fixed':
                DoFs[dofIndex] = [0]; // Displacement x is zero at fixed supports
                DoFs[dofIndex + 1] = [0]; // Rotation theta is zero at fixed supports
                break;
            case 'pinned':
            case 'rolled':
                DoFs[dofIndex] = [0]; // Displacement x is zero at pinned or rolled supports
                // Theta remains null since rotation can occur and needs to be calculated
                break;
            default:
                // If no support is specified, the DoF should be calculated (remain null)
                break;
        }
    });

    return DoFs;
    }

function initialiseReactions(nodes, supports) {
    let reactions = [];

    nodes.forEach((node, index) => {
        let supportType = supports[node]; // Get the support type for this node
        let reactionIndex = index * 2; // Each node has two degrees of freedom

        // Prepare for column vector: each DoF as an array with a single element
        reactions[reactionIndex] = [0]; // Default to zero for free nodes
        reactions[reactionIndex + 1] = [0]; // Default to zero for free nodes

        switch (supportType) {
            case 'fixed':
                reactions[reactionIndex] = [null]; // Unknown reaction force, as a column vector
                reactions[reactionIndex + 1] = [null]; // Unknown reaction moment, as a column vector
                break;
            case 'pinned':
            case 'rolled':
                reactions[reactionIndex] = [null]; // Unknown reaction force, as a column vector
                reactions[reactionIndex + 1] = [0]; // No moment reaction for pinned and rolled, explicitly set as zero
                break;
            default:
                // Free nodes are already initialized to [0] above
                break;
        }
    });

    return reactions;
};

function calculateEquivalentEndLoads(distributedLoads) {
    let equivalentEndLoads = [];

    distributedLoads.forEach(load => {
        const length = load.end - load.start;
        const value = load.value;

        const A_E = [
            (value * length) / 2,
            (value * Math.pow(length, 2)) / 12,
            (value * length) / 2,
            (-value * Math.pow(length, 2)) / 12
        ];

        equivalentEndLoads.push(A_E);
    });

    return equivalentEndLoads;
};

function initializeLoadMatrix(nodes, pointLoads, moments, distributedLoads) {
    let loads = [];
    for (let i = 0; i < nodes.length * 2; i++) {
        loads.push([0]);
    }

    console.log("Initializing Loads for Nodes:", nodes);

    for (const [node, load] of Object.entries(pointLoads)) {
        let index = nodes.indexOf(parseInt(node));
        console.log(`Processing Point Load at Node ${node}: Index ${index}, Load ${load}`);
        if (index !== -1) {
            loads[index * 2] = [load];
        }
    }

    for (const [node, moment] of Object.entries(moments)) {
        let index = nodes.indexOf(parseInt(node));
        console.log(`Processing Moment at Node ${node}: Index ${index}, Moment ${moment}`);
        if (index !== -1) {
            loads[index * 2 + 1] = [moment];
        }
    }

    for (const load of distributedLoads) {
        const { start, end, value } = load;
        const startIndex = nodes.indexOf(start);
        const endIndex = nodes.indexOf(end);

        if (startIndex !== -1 && endIndex !== -1) {
            const length = end - start;
            const A_E = [
                (value * length) / 2,
                (value * Math.pow(length, 2)) / 12,
                (value * length) / 2,
                (-value * Math.pow(length, 2)) / 12
            ];

            console.log(`Processing Distributed Load from Node ${start} to Node ${end}: Start Index ${startIndex}, End Index ${endIndex}, Equivalent Loads ${A_E}`);

            // Add equivalent loads to the start and end nodes
            loads[startIndex * 2][0] += A_E[0];
            loads[startIndex * 2 + 1][0] += A_E[1];
            loads[endIndex * 2][0] += A_E[2];
            loads[endIndex * 2 + 1][0] += A_E[3];
        } else {
            console.warn(`Distributed Load from ${start} to ${end} could not be processed because one or both nodes are not defined.`);
        }
    }

    console.log("Final Load Matrix:", loads);
    return loads;
};


function solveForUnknowns(stiffnessMatrix, dof, forces) {
    let unknownIndices = [];
    let reducedForces = [];

    // Prepare new array for solution
    let newDoF = dof.map(value => value[0] !== null ? value : [0]);

    // Identify the indices of the null degrees of freedom
    dof.forEach((value, index) => {
        if (value[0] === null) {
            unknownIndices.push(index);
            reducedForces.push([forces[index][0]]); // Add corresponding force to the reduced forces array
        }
    });

    // Check if there are unknowns to solve
    if (unknownIndices.length === 0) {
        return []; // Return empty if no unknowns
    }

    // Extract the submatrix and subvector that correspond to the unknown degrees of freedom
    let reducedStiffnessMatrix = unknownIndices.map(i => 
        unknownIndices.map(j => stiffnessMatrix[i][j])
    );
    
    // Convert reducedForces to a matrix format for mathjs operations
    reducedForces = math.matrix(reducedForces, 'dense', 'number');

    // Solve the linear system of equations for the unknowns
    try {
        let reducedKMatrix = math.matrix(reducedStiffnessMatrix, 'dense', 'number');
        let unknowns = math.lusolve(reducedKMatrix, reducedForces);
        
        // Extract and map the solution values to the corresponding indices in the new degrees of freedom array
        for (let i = 0; i < unknowns.size()[0]; i++) {
            // Access the solution correctly assuming it is a matrix with single column
            newDoF[unknownIndices[i]] = [unknowns.subset(math.index(i, 0))];
        }

    } catch (error) {
        console.error("Error solving the system: ", error);
        return null; // Return null or appropriate error handling
    }

    return newDoF;
}

function calculateUnknownForces(stiffnessMatrix, solvedDoFs) {
    try {
        solvedForceMatrix = math.multiply(stiffnessMatrix, solvedDoFs);
    } catch (error) {
        console.error("Error calculating forces: ", error);
        return null; // Return null or an appropriate error handling response
    }
    return solvedForceMatrix;
}

function calculateUnknownReactions(solvedForces, loads) {
    if (solvedForces.length !== loads.length) {
        console.error("Error: The dimensions of the force and load arrays do not match.");
        return null;
    }

    let solvedReactions = [];
    try {
        // Perform element-wise subtraction
        for (let i = 0; i < solvedForces.length; i++) {
            let reaction = solvedForces[i][0] - loads[i][0];
            // Format to 5 decimal places and convert to number
            reaction = parseFloat(reaction.toFixed(5));
            // Treat very small values as zero
            reaction = Math.abs(reaction) < 1e-5 ? 0 : reaction;
            solvedReactions.push([reaction]);
        }
    } catch (error) {
        console.error("Error calculating reaction forces: ", error);
        return null;
    }

    return solvedReactions;
}

function formatDoFs(dofArray) {
    return dofArray.map(value => {
        if (value[0] !== null) {
            let formattedValue = parseFloat(value[0].toFixed(5)); // Format to 5 decimal places
            formattedValue = Math.abs(formattedValue) < 1e-5 ? 0 : formattedValue; // Treat very small values as zero
            return [formattedValue];
        }
        return value; // Return null values unchanged
    });
}

function formatKGlobal(stiffnessMatrix) {
    // Create a new matrix to store the formatted values
    let formattedKGlobal = [];

    // Iterate over each row of the global stiffness matrix
    for (let i = 0; i < stiffnessMatrix.length; i++) {
        formattedKGlobal[i] = [];  // Initialize a new row in the formatted matrix
        // Iterate over each column in the current row
        for (let j = 0; j < stiffnessMatrix[i].length; j++) {
            // Format the current value to one decimal place and convert it back to a number
            formattedKGlobal[i][j] = Number(stiffnessMatrix[i][j].toFixed(1));
        }
    }

    return formattedKGlobal;
}

function formatMatrix(matrix, decimalPlaces) {
    return matrix.map(row => 
        row.map(value => Number(value.toFixed(decimalPlaces)))
    );
}

function formatUnknownForces(forces) {
    return forces.map(value => {
        let formattedValue = parseFloat(value[0].toFixed(5)); // Format to 5 decimal places
        formattedValue = Math.abs(formattedValue) < 1e-5 ? 0 : formattedValue; // Treat very small values as zero
        return [formattedValue];
    });
}







// Example usage:
// let nodes = [0,1,2,3,10]; 
// let E = 1; 
// let I = 1; 
// let supports = {
//     0: 'fixed', 
//     2: 'pinned', 
//     4: 'fixed' 
// };
// let pointLoads = { 
//     1: -1
// };
// let moments = {}; 
// const distributedLoads = [
//     { start: 1, end: 2, value: -10 },
//     { start: 2, end: 10, value: -1 }
// ];




// const equivalentEndLoads = calculateEquivalentEndLoads(distributedLoads);
// let K_global = createGlobalStiffnessMatrix(nodes, E, I);
// let DoFs = initialiseDoFMatrix(nodes, supports);
// let reactions = initialiseReactions(nodes, supports);
// let loads = initializeLoadMatrix(nodes, pointLoads, moments, distributedLoads);
// let solvedDoFs = solveForUnknowns(K_global, DoFs, loads);
// let solvedForces = calculateUnknownForces(K_global, solvedDoFs);
// let solvedReactions = calculateUnknownReactions(solvedForces, loads);
// let formattedDoFs = formatDoFs(solvedDoFs);
// console.log('equivalent loads: ', equivalentEndLoads);                 
// console.log('stiffness matrix: ', K_global);
// console.log('degrees of freedom: ', DoFs);
// console.log('reaction forces: ', reactions);
// console.log("Load Matrix:", loads);
// console.log("Solved x values:", solvedDoFs);
// console.log("Solved Forces:", solvedForces);
// console.log('solved degrees of freedom: ', formattedDoFs);
// console.log('solved reactions: ', solvedReactions);

