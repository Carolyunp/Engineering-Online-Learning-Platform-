document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");
    const f1Input = document.getElementById('f1');
    const f1Slider = document.getElementById('f1Slider');
    const f2Input = document.getElementById('f2');
    const f2Slider = document.getElementById('f2Slider');    
    const k1Input = document.getElementById('k1');
    const k1Slider = document.getElementById('k1Slider');
    const k2Input = document.getElementById('k2');
    const k2Slider = document.getElementById('k2Slider');
    const matrixContainer = document.querySelector('.matrixContainer');
    const springStart = 1000;
    const springnode2 = 750;
    const springnode1 = 500;
    const yPositions = [150, 200, 150, 100]; // Array to hold Y positions for the line segments
    
    function drawSpring(extension1, extension2) {
        ctx.beginPath();
        ctx.lineWidth = 1;        
        const segments = (springStart - springnode1) / 25;
        let newSpringnode2 = springnode2 + extension2;
        let newSpringnode1 = springnode1 + extension1;

        // Limit newSpringnode2 to not exceed the canvas width
        if (newSpringnode2 >= canvas.width) {
            newSpringnode2 = canvas.width;
        }
        // Limit newSpringnode1 to not exceed newSpringnode1
        if (newSpringnode1 > newSpringnode2) {
            newSpringnode1 = newSpringnode2;
        }
        // Calculate the length of the spring elements
        const newSegment1Length = (newSpringnode2 - newSpringnode1) / segments;
        const newSegment2Length = (springStart - newSpringnode2) / segments;
        
        // Right part of spring
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.moveTo(springStart, yPositions[0]);
        for (let i = 0; i <= segments; i++) {
        const x = springStart - i * newSegment2Length;
        const y = yPositions[i % 4];
        ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.moveTo(newSpringnode2, yPositions[0]);
        ctx.moveTo(newSpringnode2, 100);
        ctx.lineTo(newSpringnode2, 200);
        ctx.stroke();

        // Left part of string
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.moveTo(newSpringnode2, yPositions[0]);
        for (let i = 0; i <= segments; i++) {
        const x = newSpringnode2 - i * newSegment1Length;
        const y = yPositions[i % 4];
        ctx.lineTo(x, y);
        }
        ctx.stroke();

        const f1 = parseFloat(f1Input.value);
        const f2 = parseFloat(f2Input.value);
        
        drawVariables(f1, newSpringnode1, f2, newSpringnode2);
    }

    function drawVariables(f1, springnode1, f2, springnode2) {
        ctx.beginPath();
        ctx.moveTo(springnode2, 50);
        ctx.lineTo(springnode2 + 100, 50);
        ctx.lineTo(springnode2 + 90, 45);
        ctx.moveTo(springnode2 + 100, 50);
        ctx.lineTo(springnode2 + 90, 55);
        ctx.textAlign = "center";
        ctx.font = "20px Arial";
        ctx.fillText(f1 + " N", springnode2 + 50, 40);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(springnode1, 250);
        ctx.lineTo(springnode1 + 100, 250);
        ctx.lineTo(springnode1 + 90, 245);
        ctx.moveTo(springnode1 + 100, 250);
        ctx.lineTo(springnode1 + 90, 255);
        ctx.textAlign = "center";
        ctx.font = "20px Arial";
        ctx.fillText(f2 + " N", springnode1 + 50, 240);
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
        const k1 = parseFloat(k1Input.value);
        const k2 = parseFloat(k2Input.value);
        const f1 = parseFloat(f1Input.value);
        const f2 = parseFloat(f2Input.value);
        var extension2 = 50 * f1/k1;
        var extension1 = 50 * f2/k2;
        drawSpring(extension1, extension2);
    }
    
    function updateMatrix() {
        const f1 = parseFloat(f1Input.value);
        const f2 = parseFloat(f2Input.value);
        const k1 = parseFloat(k1Input.value);
        const k2 = parseFloat(k2Input.value);
        var u1 = (f1*(k1+k2) + (k1 * f2))/(k1*k2);
        var u2 = ((k1 * u1) - f1)/k1;
        var f3 = -k2 * u2;


        matrixContainer.innerHTML = `
        \\[ \\begin{bmatrix}
            f_1 \\\\
            f_2 \\\\
            f_3
            \\end{bmatrix} 
            =
         \\begin{bmatrix}
            k_1 & -k_1 & 0 \\\\
            -k_1 & k_1 + k_2 & -k_2 \\\\
            0 & -k_2 & k_2 
            \\end{bmatrix} 
         \\begin{bmatrix}
            u_1 \\\\
            u_2 \\\\
            u_3
            \\end{bmatrix} \\] 
        \\[ \\begin{bmatrix}
            ${f2} \\\\
            ${f1} \\\\
            ${f3}
        \\end{bmatrix} 
        =
        \\begin{bmatrix}
            ${k1} & ${-k1} & 0 \\\\
            ${-k1} & ${k1 + k2} & ${-k2} \\\\
            0 & ${-k2} & ${k2}
        \\end{bmatrix}
        \\begin{bmatrix}
            ${u1} \\\\
            ${u2} \\\\
            0
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
    
    f1Input.addEventListener('input', () => syncInputs(f1Input, f1Slider));
    f1Slider.addEventListener('input', () => syncInputs(f1Slider, f1Input));
    f2Input.addEventListener('input', () => syncInputs(f2Input, f2Slider));
    f2Slider.addEventListener('input', () => syncInputs(f2Slider, f2Input));
    k1Input.addEventListener('input', () => syncInputs(k1Input, k1Slider));
    k1Slider.addEventListener('input', () => syncInputs(k1Slider, k1Input));
    k2Input.addEventListener('input', () => syncInputs(k2Input, k2Slider));
    k2Slider.addEventListener('input', () => syncInputs(k2Slider, k2Input));    
    
    // Initial drawing
    updateCanvas();
    drawVariables(0, springnode1, 0, springnode2);
    ctx.fillText("k₂", 875, 250);
    ctx.fillText("k₁", 625, 50);
    });
    