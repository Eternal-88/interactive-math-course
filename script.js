// --- Navigation ---
function showModule(moduleId) {
    document.querySelectorAll('.module').forEach(module => {
        module.style.display = 'none';
    });
    const selectedModule = document.getElementById(moduleId);
    if (selectedModule) {
        selectedModule.style.display = 'block';
        // Scroll to the top of the module for better UX
        // selectedModule.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Option 1: Smooth scroll
        window.scrollTo(0, selectedModule.offsetTop - 80); // Option 2: Instant jump near top (adjust offset if header height changes)

    } else {
        console.error("Module ID not found:", moduleId);
    }
}

// --- Utility Functions ---
function parseData(inputId, errorId) {
    const inputElement = document.getElementById(inputId);
    const errorElement = document.getElementById(errorId);
    errorElement.textContent = '';

    if (!inputElement) {
        errorElement.textContent = `Error: Input element with ID '${inputId}' not found.`;
        console.error(`Input element with ID '${inputId}' not found.`);
        return null;
    }

    const rawText = inputElement.value.trim();
    if (!rawText) {
        errorElement.textContent = 'Please enter some data.';
        return null;
    }

    const dataPoints = rawText.split(',')
                             .map(item => item.trim())
                             .filter(item => item !== '')
                             .map(item => Number(item));

    if (dataPoints.some(isNaN)) {
        errorElement.textContent = 'Data must contain only numbers separated by commas.';
        return null;
    }

    if (dataPoints.length === 0) {
        errorElement.textContent = 'No valid numbers entered.';
        return null;
    }
    return dataPoints;
}

// --- Helper to safely get number input ---
function getNumberInput(inputId, errorId, fieldName) {
    const inputElement = document.getElementById(inputId);
    const errorElement = document.getElementById(errorId);

    if (!inputElement) {
        errorElement.textContent = `Error: Input element with ID '${inputId}' not found.`;
         console.error(`Input element with ID '${inputId}' not found.`);
        return null;
    }
    const value = parseFloat(inputElement.value);
    if (isNaN(value)) {
        errorElement.textContent = `${fieldName} must be a valid number.`;
        return null;
    }
    return value;
}


// --- Module 1: Histogram ---
function generateHistogram() {
    const data = parseData('histData', 'histogramError');
    const numBinsInput = document.getElementById('numBins');
    const display = document.getElementById('histogramDisplay');
    const errorElement = document.getElementById('histogramError');
    display.innerHTML = '';
    errorElement.textContent = '';

    if (!data || !numBinsInput) return;

    const numBins = parseInt(numBinsInput.value);
    if (isNaN(numBins) || numBins <= 0) {
         errorElement.textContent = 'Number of bins must be a positive integer.';
         return;
    }
    if (data.length < 1) { // Allow histogram for single point, though less useful
         errorElement.textContent = 'Please enter at least one data point.';
         return;
    }

    const minVal = Math.min(...data);
    let maxVal = Math.max(...data);

     // Handle case where all data points are the same
    if (minVal === maxVal) {
        maxVal = minVal + numBins; // Create artificial range if all values identical
    }

    let binWidth = (maxVal - minVal) / numBins;
     if (binWidth === 0) binWidth = 1; // Avoid zero width


    const adjustedMax = maxVal + binWidth * 0.001; // Include max value

    const bins = Array(numBins).fill(0);
    const binRanges = [];

    for (let i = 0; i < numBins; i++) {
        const binMin = minVal + i * binWidth;
        const binMax = minVal + (i + 1) * binWidth;
        binRanges.push(`[${binMin.toFixed(1)}, ${binMax.toFixed(1)})`);
    }
     // Ensure last bin label correctly reflects potential inclusion of max value
     const lastBinMin = minVal + (numBins - 1) * binWidth;
     binRanges[numBins - 1] = `[${lastBinMin.toFixed(1)}, ${maxVal.toFixed(1)}]`; // Use ] for last bin potentially

    data.forEach(value => {
        let binIndex = Math.floor((value - minVal) / binWidth);
        if (value === maxVal) { // Ensure max value goes into the last bin
            binIndex = numBins - 1;
        }
        binIndex = Math.max(0, Math.min(binIndex, numBins - 1)); // Clamp index
        bins[binIndex]++;
    });

    const maxFreq = Math.max(...bins, 1); // Ensure maxFreq is at least 1 to avoid division by zero in height calc

    // Draw bars
    display.style.minHeight = `${Math.max(150, numBins * 10)}px`; // Adjust min height slightly based on bins

    for (let i = 0; i < numBins; i++) {
        const bar = document.createElement('div');
        bar.classList.add('hist-bar');
        const barHeight = maxFreq > 0 ? (bins[i] / maxFreq) * 100 : 0;
        // Set height using style property - needs a small delay for transition to work on creation
        setTimeout(() => {
            bar.style.height = `${Math.max(barHeight, 0.5)}%`;
        }, 10); // Small delay


        const label = document.createElement('span');
        label.classList.add('hist-label');
        label.textContent = binRanges[i];
        bar.appendChild(label);

        const freqLabel = document.createElement('span');
        freqLabel.classList.add('hist-freq');
        freqLabel.textContent = bins[i];
        bar.appendChild(freqLabel);

        display.appendChild(bar);
    }
}


// --- Module 1: Measures of Center ---
function calculateCenter() {
    const data = parseData('centerData', 'centerError');
    const resultElement = document.getElementById('centerResult');
    resultElement.innerHTML = ''; // Use innerHTML since we're adding HTML tags

    if (!data) return;

    const n = data.length;
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;

    const sortedData = [...data].sort((a, b) => a - b);
    const mid = Math.floor(n / 2);
    let median;
    if (n % 2 === 0) {
        median = (sortedData[mid - 1] + sortedData[mid]) / 2;
    } else {
        median = sortedData[mid];
    }

    resultElement.innerHTML = `
        Count (n): <strong>${n}</strong><br>
        Mean ($\\bar{x}$): <strong>${mean.toFixed(3)}</strong><br>
        Median: <strong>${median.toFixed(3)}</strong>
    `;
    if (window.MathJax) {
       window.MathJax.typesetPromise([resultElement]).catch((err) => console.error('MathJax typesetting error:', err));
    }
}

// --- Module 2: Standard Deviation ---
function calculateSD() {
    const data = parseData('sdData', 'sdError');
    const resultElement = document.getElementById('sdResult');
    resultElement.innerHTML = '';

    if (!data) return;

    const n = data.length;
    if (n < 2) {
        document.getElementById('sdError').textContent = 'Need at least two data points to calculate sample standard deviation.';
        return;
    }

    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;

    const squaredDeviationsSum = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
    const variance = squaredDeviationsSum / (n - 1); // Sample variance (n-1)
    const standardDeviation = Math.sqrt(variance);

     resultElement.innerHTML = `
        Count (n): <strong>${n}</strong><br>
        Mean ($\\bar{x}$): <strong>${mean.toFixed(3)}</strong><br>
        Sample Variance ($s^2$): <strong>${variance.toFixed(3)}</strong><br>
        Sample Standard Deviation ($s$): <strong>${standardDeviation.toFixed(3)}</strong>
    `;
    if (window.MathJax) {
       window.MathJax.typesetPromise([resultElement]).catch((err) => console.error('MathJax typesetting error:', err));
    }
}


// --- Module 3: Z-Score Calculator ---
function calculateZScore() {
    const errorElement = document.getElementById('zScoreError');
    const resultElement = document.getElementById('zScoreResult');
    errorElement.textContent = '';
    resultElement.innerHTML = '';

    const x = getNumberInput('zDataPoint', 'zScoreError', 'Data Point (x)');
    const mean = getNumberInput('zMean', 'zScoreError', 'Mean');
    const stdDev = getNumberInput('zStdDev', 'zScoreError', 'Standard Deviation');

    // If any input is invalid, stop
    if (x === null || mean === null || stdDev === null) return;

    if (stdDev <= 0) {
        errorElement.textContent = 'Standard Deviation must be a positive number.';
        return;
    }

    const zScore = (x - mean) / stdDev;

    let interpretation = '';
    if (zScore === 0) {
        interpretation = 'This value is exactly equal to the mean.';
    } else if (zScore > 0) {
        interpretation = `This value is ${zScore.toFixed(2)} standard deviations ABOVE the mean.`;
    } else {
        interpretation = `This value is ${Math.abs(zScore).toFixed(2)} standard deviations BELOW the mean.`;
    }

    resultElement.innerHTML = `
        Z-Score: <strong>${zScore.toFixed(3)}</strong><br>
        <em>${interpretation}</em>
    `;
     // No MathJax needed here, but keep pattern if formulas were added later
}


// --- Quiz Checking (Improved Feedback) ---
function checkQuiz(quizId, correctAnswers) {
    const quizElement = document.getElementById(quizId);
    const resultElement = document.getElementById(`${quizId}Result`);
    resultElement.innerHTML = ''; // Clear previous result
    resultElement.className = 'quiz-feedback'; // Reset class
    let score = 0;
    let allAnswered = true;

    // Clear previous styling
    quizElement.querySelectorAll('label').forEach(label => {
        label.style.fontWeight = 'normal';
        label.style.color = 'inherit'; // Reset color
        label.style.border = 'none';
    });

    for (let i = 0; i < correctAnswers.length; i++) {
        // Adjust question number based on quiz ID (q1, q2 for quiz1; q3, q4 for quiz2; q5, q6 for quiz3, etc.)
        const questionIndex = (parseInt(quizId.replace('quiz', '')) - 1) * correctAnswers.length + i + 1;
        const questionName = `q${questionIndex}`;

        const selectedAnswer = quizElement.querySelector(`input[name="${questionName}"]:checked`);
        const questionLabels = quizElement.querySelectorAll(`input[name="${questionName}"]`);

        if (!selectedAnswer) {
            allAnswered = false;
             // Highlight unanswered question area if needed (optional)
            const pElement = questionLabels[0]?.closest('p'); // Find parent paragraph
            if (pElement) pElement.style.border = '1px solid orange';

        } else {
            const correctValue = correctAnswers[i];
            const chosenValue = selectedAnswer.value;
            const chosenLabel = selectedAnswer.parentElement;
            const correctLabel = quizElement.querySelector(`input[name="${questionName}"][value="${correctValue}"]`).parentElement;

            if (chosenValue === correctValue) {
                score++;
                chosenLabel.style.fontWeight = 'bold';
                chosenLabel.style.color = 'var(--success-color)'; // Use CSS variable
                chosenLabel.style.border = '1px solid var(--success-color)';
            } else {
                chosenLabel.style.fontWeight = 'bold';
                chosenLabel.style.color = 'var(--danger-color)'; // Use CSS variable
                 chosenLabel.style.border = '1px solid var(--danger-color)';
                // Also highlight the correct answer
                correctLabel.style.fontWeight = 'bold';
                 correctLabel.style.border = '1px solid var(--success-color)';
                 correctLabel.style.backgroundColor = '#e6ffed'; // Slight background for correct answer
            }
        }
    }

    if (!allAnswered) {
        resultElement.textContent = "Please answer all questions.";
        resultElement.classList.add('partial'); // Add class for styling
    } else {
        resultElement.textContent = `You got ${score} out of ${correctAnswers.length} correct.`;
        if (score === correctAnswers.length) {
             resultElement.classList.add('correct');
        } else {
             resultElement.classList.add('incorrect');
        }
    }
}


// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // Ensure first module is shown on load
    showModule('module1');

    // Optional: Add event listeners to nav buttons instead of inline onclick
    // document.querySelector('nav').addEventListener('click', (event) => {
    //     if (event.target.tagName === 'BUTTON' && event.target.dataset.module) {
    //         showModule(event.target.dataset.module);
    //     }
    // });
     // Need to add `data-module="module1"` etc. to buttons in HTML for this approach
});
