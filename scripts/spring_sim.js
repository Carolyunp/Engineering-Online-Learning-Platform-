document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");
    const forceInput = document.getElementById('force');
    const forceSlider = document.getElementById('forceSlider');
    const springConstantInput = document.getElementById('springConstant');
    const springConstantSlider = document.getElementById('springConstantSlider');
    const matrixContainer = document.querySelector('.matrixContainer');
    const springStart = 300;
    const springEnd = canvas.width;
    const yPositions = [150, 100, 150, 200]; // Array to hold Y positions for the line segments
    
    function drawSpring(extension) {
        ctx.beginPath();
        ctx.lineWidth = 1;        
        const segments = (springEnd - springStart) / 25;
        const newSpringStart = springStart + extension;
        const newSegmentLength = (springEnd - newSpringStart) / segments;
        
        ctx.moveTo(newSpringStart, yPositions[0]);
        
        for (let i = 0; i <= segments; i++) {
        const x = newSpringStart + i * newSegmentLength;
        const y = yPositions[i % 4];
        ctx.lineTo(x, y);
        }
        ctx.stroke();
        const force = parseFloat(forceInput.value);
        drawVariables(newSpringStart, force);
    }

    function drawVariables(springStart, force) {
        ctx.beginPath();
        ctx.moveTo(springStart, 50);
        ctx.lineTo(springStart + 100, 50);
        ctx.lineTo(springStart + 90, 45);
        ctx.moveTo(springStart + 100, 50);
        ctx.lineTo(springStart + 90, 55);
        ctx.textAlign = "center";
        ctx.font = "20px Arial";
        ctx.fillText(force + " N", springStart + 50, 40);
        ctx.stroke();
    }
    
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    function updateCanvas() {
        clearCanvas();
          // Draw the fixed base of the spring
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.moveTo(canvas.width, 100);
        ctx.lineTo(canvas.width, 200);
        ctx.stroke();
        const k = parseFloat(springConstantInput.value);
        const F = parseFloat(forceInput.value);
        const extension = 100 * F / k;
        drawSpring(extension);
    }
    
    function updateMatrix() {
        const f1 = forceInput.value;
        const k = springConstantInput.value;
        const u1 = f1 / k;
        const u2 = 0; 
        matrixContainer.innerHTML = `
        \\[ \\begin{bmatrix}
            f_1 \\\\
            f_2
            \\end{bmatrix} 
            =
         \\begin{bmatrix}
            k & -k \\\\
            -k & k 
            \\end{bmatrix} 
         \\begin{bmatrix}
            u_1 \\\\
            u_2
            \\end{bmatrix} \\]
        \\[ \\begin{bmatrix}
            ${f1} \\\\
            ${-f1}
        \\end{bmatrix} 
        =
        \\begin{bmatrix}
            ${k} & ${-k} \\\\
            ${-k} & ${k}
        \\end{bmatrix}
        \\begin{bmatrix}
            ${u1} \\\\
            ${u2}
        \\end{bmatrix} \\]
        `;
        renderMathInElement(matrixContainer);
    }
    
    function handleValueChange() {
        updateCanvas();
        updateMatrix();
    }
        
    // Sync the force input and slider
    function syncInputs(source, target) {
        target.value = source.value;
        handleValueChange();
    }
    
    forceInput.addEventListener('input', () => syncInputs(forceInput, forceSlider));
    forceSlider.addEventListener('input', () => syncInputs(forceSlider, forceInput));
    springConstantInput.addEventListener('input', () => syncInputs(springConstantInput, springConstantSlider));
    springConstantSlider.addEventListener('input', () => syncInputs(springConstantSlider, springConstantInput));
    
    // Initial drawing
    updateCanvas();
    drawVariables(springStart, 0);
    ctx.fillText("k", 650, 250);
    });
    