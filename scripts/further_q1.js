document.addEventListener("DOMContentLoaded", () => {
    // Set initial values
    setInitialValues();
});

function setInitialValues() {
    const initialP = 50000;
    const initialE = 210;
    const initialI = 200000000;
    const initialL = 3;
    const initialk = 200000;

    // Convert E from GPa to Pa and I from mm^4 to m^4
    const E_Pa = initialE * 1e9; // Convert GPa to Pa
    const I_m4 = initialI * 1e-12; // Convert mm^4 to m^4

    // Update the table with the initial values
    document.getElementById('P').textContent = `${initialP} N`;
    document.getElementById('E').textContent = `${initialE} GPa`;
    document.getElementById('I').textContent = `${initialI} mm^4`;
    document.getElementById('L').textContent = `${initialL} m`;
    document.getElementById('k').textContent = `${initialk} N/m`;

    // Store the values in data attributes for later use
    document.getElementById('P').dataset.value = initialP;
    document.getElementById('E').dataset.value = E_Pa;
    document.getElementById('I').dataset.value = I_m4;
    document.getElementById('L').dataset.value = initialL;
    document.getElementById('k').dataset.value = initialk;

    // Clear result messages
    clearResults();
}

function randomizeInputs() {
    // Generate random values for each variable
    const randomP = (Math.floor(Math.random() * 41) + 10) * 10; // Random value between 100 and 500 N in multiples of 10
    const randomE = (Math.floor(Math.random() * 21) + 10) * 10; // Random value between 100 and 300 GPa in multiples of 10
    const randomI = (Math.floor(Math.random() * 41) + 10) * 100000; // Random value between 1,000,000 and 5,000,000 mm^4 in multiples of 100,000
    const randomL = Math.floor(Math.random() * 10) + 1; // Random integer value between 1 and 10 m
    const randomk = (Math.floor(Math.random() * 41) + 10) * 1000; // Random value between 100 and 500 N in multiples of 10


    // Convert E from GPa to Pa and I from mm^4 to m^4
    const E_Pa = randomE * 1e9; // Convert GPa to Pa
    const I_m4 = randomI * 1e-12; // Convert mm^4 to m^4

    // Update the table with the new values
    document.getElementById('P').textContent = `${randomP} N`;
    document.getElementById('E').textContent = `${randomE} GPa`;
    document.getElementById('I').textContent = `${randomI} mm^4`;
    document.getElementById('L').textContent = `${randomL} m`;
    document.getElementById('k').textContent = `${randomk} N/m`;

    // Store the values in data attributes for later use
    document.getElementById('P').dataset.value = randomP;
    document.getElementById('E').dataset.value = E_Pa;
    document.getElementById('I').dataset.value = I_m4;
    document.getElementById('L').dataset.value = randomL;
    document.getElementById('k').dataset.value = randomk;


    // Clear result messages
    clearResults();
    // Hide the error message
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('solution').style.display = 'none';
}

function clearResults() {
    const results = document.querySelectorAll('.result');
    results.forEach(result => {
        result.textContent = '';
    });
}

function checkAnswers() {
    const solutionContainer = document.getElementById('solution')
    solutionContainer.style.display = "block";
    const equationContainer = document.getElementById('equation')
    const reactionContainer = document.getElementById('reactionContainer')

    // Get user inputs
    const theta2 = parseFloat(document.getElementById('theta2').value);
    const x3 = parseFloat(document.getElementById('x3').value);
    const theta3 = parseFloat(document.getElementById('theta3').value);
    const RF1 = parseFloat(document.getElementById('RF1').value);
    const RM1 = parseFloat(document.getElementById('RM1').value);
    const RF2 = parseFloat(document.getElementById('RF2').value);

    // Get the random values used for calculation
    const randomP = parseFloat(document.getElementById('P').dataset.value);
    const E_Pa = parseFloat(document.getElementById('E').dataset.value);
    const I_m4 = parseFloat(document.getElementById('I').dataset.value);
    const randomL = parseFloat(document.getElementById('L').dataset.value);
    const randomk = parseFloat(document.getElementById('k').dataset.value);

    // Calculate the correct answers
    const correct_theta3 = (-1000 * randomP * randomL * randomL/(E_Pa * I_m4 * ((4/3) + (7*randomL*randomL*randomL*randomk)/(9*E_Pa*I_m4))) ).toFixed(2);
    const correct_x3 = ((-1000 * 7*randomP * randomL*randomL*randomL)/(9*E_Pa*I_m4*((4/3) + (7*randomL*randomL*randomL*randomk)/(9*E_Pa*I_m4)))).toFixed(2);
    const correct_theta2 = ((3*correct_x3 - 2*randomL*correct_theta3)/randomL).toFixed(2);
    const correct_RF1 = (E_Pa*I_m4*(6*correct_theta2*randomL)/(randomL*randomL*randomL*1000)).toFixed(2);
    const correct_RM1 = (E_Pa*I_m4/(randomL*randomL*randomL*1000)*(2*correct_theta2*randomL*randomL)).toFixed(2);
    const correct_RF2 = (E_Pa*I_m4/(randomL*randomL*randomL*1000)*(-12*correct_x3 + 6*randomL*correct_theta3)).toFixed(2);

    // Check answers and display results
    if (!checkAndDisplayResult('theta2', theta2, correct_theta2)) isCorrect = false;
    if (!checkAndDisplayResult('x3', x3, correct_x3)) isCorrect = false;
    if (!checkAndDisplayResult('theta3', theta3, correct_theta3)) isCorrect = false;
    if (!checkAndDisplayResult('RF1', RF1, correct_RF1)) isCorrect = false;
    if (!checkAndDisplayResult('RM1', RM1, correct_RM1)) isCorrect = false;
    if (!checkAndDisplayResult('RF2', RF2, correct_RF2)) isCorrect = false;

    const equation = `
            \\[\\therefore \\theta_2 = ${correct_theta2}\\times 10^{-3} rad\\]
          \\[\\therefore x_3 = ${correct_x3}\\times 10^{-3} m\\]
          \\[\\therefore \\theta_3 = ${correct_theta3}\\times 10^{-3} rad\\]`;
    
    const reaction = `
        \\[\\therefore RF_1 = ${correct_RF1} N\\]
        \\[\\therefore RM_1 = ${correct_RM1} Nm\\]
        \\[\\therefore RF_2 = ${correct_RF2} N\\]`;
    equationContainer.innerHTML = equation;
    reactionContainer.innerHTML = reaction;
    renderMathInElement(equationContainer);
    renderMathInElement(reactionContainer);
    }

function checkAndDisplayResult(id, userAnswer, correctAnswer) {
    const resultSpan = document.getElementById(id + '_result');
    if (userAnswer == correctAnswer) { // Use == instead of === for comparison
        resultSpan.textContent = `Correct! (${correctAnswer})`;
        resultSpan.style.color = 'green';
        return true;
    } else {
        resultSpan.textContent = `Incorrect. Correct answer: ${correctAnswer}`;
        resultSpan.style.color = 'red';
        return false;
    }
}