function randomizeInputs() {
    const equationContainer = document.getElementById('equation')
    const reactionContainer = document.getElementById('reactionContainer')
    // Generate random values for each variable
    const randomP = (Math.floor(Math.random() * 41) + 10) * 10; // Random value between 100 and 500 N in multiples of 10
    const randomE = (Math.floor(Math.random() * 21) + 10) * 10; // Random value between 100 and 300 GPa in multiples of 10
    const randomI = (Math.floor(Math.random() * 41) + 10) * 100000; // Random value between 1,000,000 and 5,000,000 mm^4 in multiples of 100,000
    const randomL = Math.floor(Math.random() * 10) + 1; // Random integer value between 1 and 10 m

    // Convert E from GPa to Pa and I from mm^4 to m^4
    const E_Pa = randomE * 1e9; // Convert GPa to Pa
    const I_m4 = randomI * 1e-12; // Convert mm^4 to m^4

    // Function to format numbers in scientific notation
    function toScientificNotation(value) {
        const exponent = Math.floor(Math.log10(value));
        const mantissa = (value / Math.pow(10, exponent)).toFixed(2);
        return `${mantissa} \\times 10^{${exponent}}`;
    }

    // Update the table with the new values
    document.getElementById('P').textContent = `${randomP} N`;
    document.getElementById('E').textContent = `${randomE} GPa`;
    document.getElementById('I').textContent = `${randomI} mm^4`;
    document.getElementById('L').textContent = `${randomL} m`;

    let v2 = (-398*1000*randomL*randomL*randomL*randomP/(3024*E_Pa * I_m4)).toFixed(2)
    let theta2 = (1000*366*randomL*randomL*randomP/(3024*E_Pa * I_m4)).toFixed(2)
    let theta3 = (1000*255*randomL*randomL*randomP/(3024*E_Pa * I_m4)).toFixed(2)
    let RF1 = (randomP*332/1008).toFixed(2);
    let RM1 = (randomP*1292*randomL/1008).toFixed(2);
    let RF3 = (randomP*3979/1008).toFixed(2);
    let RF4 = (randomP*753/1008).toFixed(2);
    let RM4 = (-randomP*166*randomL/1008).toFixed(2);
    

    // Update the equation
    const equation = `
      \\[
        \\bold{x} = \\frac{${randomP} \\times ${randomL}^2}{3024 \\times ${toScientificNotation(E_Pa)} \\times ${toScientificNotation(I_m4)}} 
        \\begin{bmatrix}
          0 & 0 & -398 \\times ${randomL} & 366 & 0 & 255 & 0 & 0
        \\end{bmatrix}^T 
      \\]
      \\[\\therefore v_2 = ${v2}\\times 10^{-3} m\\]
          \\[\\therefore \\theta_2 = ${theta2}\\times 10^{-3} rad\\]
          \\[\\therefore \\theta_3 = ${theta3}\\times 10^{-3} rad\\]`;
    

    const reactions = `
    \\[
        A_J^{Reactions} = \\frac{${randomP}}{1008}
        \\begin{bmatrix} 
        332 & 1292 \\times ${randomL} & 0 & 0 & 3979 & 0 & 753 & -166\\times${randomL}
        \\end{bmatrix}^T 
        \\]
        \\[\\therefore RF_1 = ${RF1} N\\]
        \\[\\therefore RM_1 = ${RM1} Nm\\]
        \\[\\therefore RF_3 = ${RF3} N\\]
        \\[\\therefore RF_4 = ${RF4} N\\]
        \\[\\therefore RM_4 = ${RM4} Nm\\]`

    
    equationContainer.innerHTML = equation;
    reactionContainer.innerHTML = reactions;
    // Render the equation using KaTeX
    renderMathInElement(equationContainer);
    renderMathInElement(reactionContainer);
  }