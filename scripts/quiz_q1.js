document.addEventListener("DOMContentLoaded", () => {
    // Set initial values
    setInitialValues();
});

function setInitialValues() {
    const initialP = 500;
    const initialE = 200;
    const initialI = 8000000;
    const initialL = 1;

    // Convert E from GPa to Pa and I from mm^4 to m^4
    const E_Pa = initialE * 1e9; // Convert GPa to Pa
    const I_m4 = initialI * 1e-12; // Convert mm^4 to m^4

    // Update the table with the initial values
    document.getElementById('P').textContent = `${initialP} N`;
    document.getElementById('E').textContent = `${initialE} GPa`;
    document.getElementById('I').textContent = `${initialI} mm^4`;
    document.getElementById('L').textContent = `${initialL} m`;

    // Store the values in data attributes for later use
    document.getElementById('P').dataset.value = initialP;
    document.getElementById('E').dataset.value = E_Pa;
    document.getElementById('I').dataset.value = I_m4;
    document.getElementById('L').dataset.value = initialL;

    // Clear result messages
    clearResults();
}

function randomizeInputs() {
    // Generate random values for each variable
    const randomP = (Math.floor(Math.random() * 41) + 10) * 10; // Random value between 100 and 500 N in multiples of 10
    const randomE = (Math.floor(Math.random() * 21) + 10) * 10; // Random value between 100 and 300 GPa in multiples of 10
    const randomI = (Math.floor(Math.random() * 41) + 10) * 100000; // Random value between 1,000,000 and 5,000,000 mm^4 in multiples of 100,000
    const randomL = Math.floor(Math.random() * 10) + 1; // Random integer value between 1 and 10 m

    // Convert E from GPa to Pa and I from mm^4 to m^4
    const E_Pa = randomE * 1e9; // Convert GPa to Pa
    const I_m4 = randomI * 1e-12; // Convert mm^4 to m^4

    // Update the table with the new values
    document.getElementById('P').textContent = `${randomP} N`;
    document.getElementById('E').textContent = `${randomE} GPa`;
    document.getElementById('I').textContent = `${randomI} mm^4`;
    document.getElementById('L').textContent = `${randomL} m`;

    // Store the values in data attributes for later use
    document.getElementById('P').dataset.value = randomP;
    document.getElementById('E').dataset.value = E_Pa;
    document.getElementById('I').dataset.value = I_m4;
    document.getElementById('L').dataset.value = randomL;

    // Clear result messages
    clearResults();
    // Hide the error message
    document.getElementById('errorMessage').style.display = 'none';
}

function clearResults() {
    const results = document.querySelectorAll('.result');
    results.forEach(result => {
        result.textContent = '';
    });
}

function checkAnswers() {
    let isCorrect = true;
    // Get user inputs
    const x2 = parseFloat(document.getElementById('x2').value);
    const theta2 = parseFloat(document.getElementById('theta2').value);
    const theta3 = parseFloat(document.getElementById('theta3').value);
    const RF1 = parseFloat(document.getElementById('RF1').value);
    const RM1 = parseFloat(document.getElementById('RM1').value);
    const RF3 = parseFloat(document.getElementById('RF3').value);
    const RF4 = parseFloat(document.getElementById('RF4').value);
    const RM4 = parseFloat(document.getElementById('RM4').value);

    // Get the random values used for calculation
    const randomP = parseFloat(document.getElementById('P').dataset.value);
    const E_Pa = parseFloat(document.getElementById('E').dataset.value);
    const I_m4 = parseFloat(document.getElementById('I').dataset.value);
    const randomL = parseFloat(document.getElementById('L').dataset.value);

    // Calculate the correct answers
    const correct_x2 = (-398 * 100000 * randomL * randomL * randomL * randomP / (3024 * E_Pa * I_m4)).toFixed(2);
    const correct_theta2 = (100000 * 366 * randomL * randomL * randomP / (3024 * E_Pa * I_m4)).toFixed(2);
    const correct_theta3 = (100000 * 255 * randomL * randomL * randomP / (3024 * E_Pa * I_m4)).toFixed(2);
    const correct_RF1 = (randomP * 332 / 1008).toFixed(2);
    const correct_RM1 = (randomP * 1292 * randomL / 1008).toFixed(2);
    const correct_RF3 = (randomP * 3979 / 1008).toFixed(2);
    const correct_RF4 = (randomP * 753 / 1008).toFixed(2);
    const correct_RM4 = (-randomP * 166 * randomL / 1008).toFixed(2);

    // Check answers and display results
    if (!checkAndDisplayResult('x2', x2, correct_x2)) isCorrect = false;
    if (!checkAndDisplayResult('theta2', theta2, correct_theta2)) isCorrect = false;
    if (!checkAndDisplayResult('theta3', theta3, correct_theta3)) isCorrect = false;
    if (!checkAndDisplayResult('RF1', RF1, correct_RF1)) isCorrect = false;
    if (!checkAndDisplayResult('RM1', RM1, correct_RM1)) isCorrect = false;
    if (!checkAndDisplayResult('RF3', RF3, correct_RF3)) isCorrect = false;
    if (!checkAndDisplayResult('RF4', RF4, correct_RF4)) isCorrect = false;
    if (!checkAndDisplayResult('RM4', RM4, correct_RM4)) isCorrect = false;
    // Display message if at least one answer is incorrect
    const errorMessage = document.getElementById('errorMessage');
    if (!isCorrect) {
        errorMessage.style.display = 'block';
    } else {
        errorMessage.style.display = 'none';
    }
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
