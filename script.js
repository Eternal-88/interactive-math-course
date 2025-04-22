// --- Navigation ---
function showModule(moduleId) {
    // Hide all modules
    document.querySelectorAll('.module').forEach(module => {
        module.style.display = 'none';
    });
    // Show the selected module
    const selectedModule = document.getElementById(moduleId);
    if (selectedModule) {
        selectedModule.style.display = 'block';
    } else {
        console.error("Module ID not found:", moduleId);
    }
}

// --- Utility Functions ---
function parseData(inputId, errorId) {
    const inputElement = document.getElementById(inputId);
    const errorElement = document.getElementById(errorId);
    errorElement.textContent = ''; // Clear previous errors

    if (!inputElement) {
        errorElement.textContent = `Error: Input element with ID '${inputId}' not found.`;
        return null;
    }

    const rawText = inputElement.value.trim();
    if (!rawText) {
        errorElement.textContent = 'Error: Please enter some data.';
        return null;
    }

    const dataPoints = rawText.split(',')
                             .map(item => item.trim())
                             .filter(item => item !== '') // Filter out empty strings resulting from extra commas
                             .map(item => Number(item));

    if (dataPoints.some(isNaN)) {
        errorElement.textContent = 'Error: Data must contain only numbers separated by commas.';
        return null;
    }

    if (dataPoints.length === 0) {
        errorElement.textContent = 'Error: No valid numbers entered.';
        return null;
    }

    return dataPoints;
}


// --- Module 1: Histogram ---
function generateHistogram() {
    const data = parseData('histData', 'histogramError');
    const numBinsInput = document.getElementById('numBins');
    const display = document.getElementById('histogramDisplay');
    const errorElement = document.getElementById('histogramError');
    display.innerHTML = ''; // Clear previous histogram
    errorElement.textContent = ''; // Clear previous error

    if (!data || !numBinsInput) return;

    const numBins = parseInt(numBinsInput.value);
    if (isNaN(numBins) || numBins <= 0) {
         errorElement.textContent = 'Error: Number of bins must be a positive integer.';
         return;
    }
    if (data.length < 2) {
         errorElement.textContent = 'Error: Need at least two data points for a meaningful histogram.';
         return;
    }


    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);

    // Avoid division by zero if all data points are the same
    let binWidth = (maxVal - minVal) / numBins;
    if (binWidth === 0) {
        binWidth = 1; // Assign a default bin width if all values are identical
    }

    // Adjust maxVal slightly to include the maximum value in the last bin
    const adjustedMax = maxVal + binWidth * 0.001;

    const bins = Array(numBins).fill(0);
    const binRanges = [];

    for (let i = 0; i < numBins; i++) {
        const binMin = minVal + i * binWidth;
        const binMax = minVal + (i + 1) * binWidth;
        binRanges.push(`[${binMin.toFixed(1)}, ${binMax.toFixed(1)})`); // Label for the bin
    }

    data.forEach(value => {
        let binIndex = Math.floor((value - minVal) / binWidth);
        // Handle the maximum value potentially falling outside due to floating point issues or exact match
        if (value === maxVal) {
            binIndex = numBins - 1;
        }
        // Clamp index to valid range (shouldn't be necessary with adjustedMax, but good practice)
        binIndex = Math.max(0, Math.min(binIndex, numBins - 1));

        bins[binIndex]++;
    });

    const maxFreq = Math.max(...bins);
    if (maxFreq === 0) {
        display.innerHTML = '<p>No data points fall within the calculated bins (this might happen with unusual data or bin choices).</p>';
        return;
    }

    // Draw bars
    for (let i = 0; i < numBins; i++) {
        const bar = document.createElement('div');
        bar.classList.add('hist-bar');
        // Scale height relative to max frequency, ensure minimum visibility
        const barHeight = maxFreq > 0 ? (bins[i] / maxFreq) * 100 : 0;
        bar.style.height = `${Math.max(barHeight, 0.5)}%`; // Use % for responsiveness within container

        const label = document.createElement('span');
        label.classList.add('hist-label');
        label.textContent = binRanges[i];
        bar.appendChild(label);

        const freqLabel = document.createElement('span');
        freqLabel.classList.add('hist-freq');
        freqLabel.textContent = bins[i]; // Show frequency count
        bar.appendChild(freqLabel);


        display.appendChild(bar);
    }
}


// --- Module 1: Measures of Center ---
function calculateCenter() {
    const data = parseData('centerData', 'centerError');
    const resultElement = document.getElementById('centerResult');
    resultElement.textContent = ''; // Clear previous results

    if (!data) return;

    // Mean
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / data.length;

    // Median
    const sortedData = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sortedData.length / 2);
    let median;
    if (sortedData.length % 2 === 0) {
        // Even number of data points
        median = (sortedData[mid - 1] + sortedData[mid]) / 2;
    } else {
        // Odd number of data points
        median = sortedData[mid];
    }

    resultElement.innerHTML = `
        Count (n): ${data.length}<br>
        Mean ($\\bar{x}$): ${mean.toFixed(3)}<br>
        Median: ${median.toFixed(3)}
    `;
     // Re-render MathJax for the new content
    if (window.MathJax) {
       window.MathJax.typesetPromise([resultElement]).catch((err) => console.error('MathJax typesetting error:', err));
    }
}

// --- Module 2: Standard Deviation ---
function calculateSD() {
    const data = parseData('sdData', 'sdError');
    const resultElement = document.getElementById('sdResult');
    resultElement.textContent = ''; // Clear previous results

    if (!data) return;

    if (data.length < 2) {
        document.getElementById('sdError').textContent = 'Error: Need at least two data points to calculate sample standard deviation.';
        return;
    }

    // Mean
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / data.length;

    // Variance (Sample Variance, n-1)
    const squaredDeviationsSum = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
    const variance = squaredDeviationsSum / (data.length - 1);

    // Standard Deviation (Sample)
    const standardDeviation = Math.sqrt(variance);

     resultElement.innerHTML = `
        Count (n): ${data.length}<br>
        Mean ($\\bar{x}$): ${mean.toFixed(3)}<br>
        Sample Variance ($s^2$): ${variance.toFixed(3)}<br>
        Sample Standard Deviation ($s$): ${standardDeviation.toFixed(3)}
    `;
     // Re-render MathJax
    if (window.MathJax) {
       window.MathJax.typesetPromise([resultElement]).catch((err) => console.error('MathJax typesetting error:', err));
    }
}

// --- Quiz Checking ---
function checkQuiz(quizId, correctAnswers) {
    const quizElement = document.getElementById(quizId);
    const resultElement = document.getElementById(`${quizId}Result`);
    resultElement.textContent = ''; // Clear previous result
    let score = 0;
    let allAnswered = true;

    for (let i = 0; i < correctAnswers.length; i++) {
        const questionName = `q${quizId === 'quiz1' ? i + 1 : i + 3}`; // q1, q2 for quiz1; q3, q4 for quiz2
        const selectedAnswer = quizElement.querySelector(`input[name="${questionName}"]:checked`);

        if (!selectedAnswer) {
            allAnswered = false;
            break; // Stop checking if any question is unanswered
        }

        if (selectedAnswer.value === correctAnswers[i]) {
            score++;
             // Optional: Style correct answer label
             selectedAnswer.parentElement.style.color = 'green';
             selectedAnswer.parentElement.style.fontWeight = 'bold';
        } else {
             // Optional: Style incorrect answer label
             selectedAnswer.parentElement.style.color = 'red';
             // Find and style the correct answer label
            const correctLabel = quizElement.querySelector(`input[name="${questionName}"][value="${correctAnswers[i]}"]`);
             if (correctLabel) {
                 correctLabel.parentElement.style.color = 'green';
                 correctLabel.parentElement.style.fontWeight = 'bold';
             }
        }
    }

     // Reset styles after a delay or next check if needed (not implemented here)

    if (!allAnswered) {
        resultElement.textContent = "Please answer all questions.";
        resultElement.style.color = 'orange';
    } else {
        resultElement.textContent = `You got ${score} out of ${correctAnswers.length} correct.`;
        resultElement.style.color = score === correctAnswers.length ? 'green' : 'red';
    }
     resultElement.style.fontWeight = 'bold'; // Make result prominent
}


// --- Initial Setup ---
// Show the first module by default when the page loads
document.addEventListener('DOMContentLoaded', () => {
    showModule('module1');
});