let currentValue = '0';
let storedValue = '';
let currentOperator = null;
let needsReset = false;
let calculationHistory = [];

const display = document.getElementById('mainDisplay');
const previousDisplay = document.getElementById('previousOperation');

// Load history from localStorage on startup
function loadHistory() {
    const saved = localStorage.getItem('calcHistory');
    if (saved) {
        calculationHistory = JSON.parse(saved);
    }
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem('calcHistory', JSON.stringify(calculationHistory));
}

// Add calculation to history
function addToHistory(calculation, result) {
    const historyItem = {
        calculation: calculation,
        result: result,
        timestamp: new Date().toLocaleString()
    };
    calculationHistory.unshift(historyItem);
    
    // Keep only last 50 calculations
    if (calculationHistory.length > 50) {
        calculationHistory.pop();
    }
    
    saveHistory();
}

loadHistory();

function pressNumber(num) {
    if (needsReset) {
        currentValue = '';
        needsReset = false;
    }
    
    // Prevent multiple decimal points
    if (num === '.' && currentValue.includes('.')) {
        return;
    }
    
    // Limit total digits to prevent precision issues
    if (currentValue.length >= 50 && num !== '.') {
        return;
    }
    
    // Handle initial zero
    if (currentValue === '0' && num !== '.') {
        currentValue = num;
    } else {
        currentValue = currentValue + num;
    }
    
    refreshDisplay();
}

function selectOperation(operator) {
    if (currentOperator !== null && !needsReset) {
        computeAnswer();
    }
    
    currentOperator = operator;
    storedValue = currentValue;
    needsReset = true;
    
    previousDisplay.textContent = `${addCommas(storedValue)} ${operator}`;
}

function computeAnswer() {
    if (currentOperator === null || needsReset) {
        return;
    }
    
    let answer;
    const firstNum = parseFloat(storedValue);
    const secondNum = parseFloat(currentValue);
    
    if (isNaN(firstNum) || isNaN(secondNum)) {
        alert('Something went wrong!');
        return;
    }
    
    switch (currentOperator) {
        case '+':
            // For very large numbers, handle as string addition
            if (storedValue.includes('.') || currentValue.includes('.')) {
                answer = firstNum + secondNum;
            } else {
                answer = firstNum + secondNum;
            }
            break;
        case '-':
        case '−':
            answer = firstNum - secondNum;
            break;
        case '×':
        case '*':
        case '∗':
            answer = firstNum * secondNum;
            break;
        case '÷':
        case '/':
            if (secondNum === 0) {
                alert('Cannot divide by zero!');
                clearAll();
                return;
            }
            answer = firstNum / secondNum;
            break;
        default:
            return;
    }
    
    // Handle the result carefully
    if (!isNaN(answer) && isFinite(answer)) {
        // Round to avoid floating point errors
        if (Number.isInteger(answer)) {
            answer = Math.round(answer);
        } else {
            answer = Math.round(answer * 100000000) / 100000000;
        }
        
        previousDisplay.textContent = `${addCommas(storedValue)} ${currentOperator} ${addCommas(currentValue)}`;
        
        // Add to history
        const calculationText = `${storedValue} ${currentOperator} ${currentValue}`;
        addToHistory(calculationText, answer.toString());
        
        currentValue = answer.toString();
        currentOperator = null;
        needsReset = true;
        
        refreshDisplay();
    } else {
        alert('Result is too large or invalid!');
    }
}

function clearAll() {
    currentValue = '0';
    storedValue = '';
    currentOperator = null;
    needsReset = false;
    previousDisplay.textContent = '';
    refreshDisplay();
}

function deleteLastDigit() {
    if (currentValue.length > 1) {
        currentValue = currentValue.slice(0, -1);
    } else {
        currentValue = '0';
    }
    refreshDisplay();
}

function refreshDisplay() {
    display.textContent = addCommas(currentValue);
}

function addCommas(value) {
    const str = value.toString();
    
    // Handle decimal numbers
    if (str.includes('.')) {
        const parts = str.split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1];
        
        // Format integer part with commas without using parseFloat
        const formattedInteger = formatIntegerWithCommas(integerPart);
        return `${formattedInteger}.${decimalPart}`;
    }
    
    // For whole numbers, format with commas
    return formatIntegerWithCommas(str);
}

function formatIntegerWithCommas(intStr) {
    // Handle negative numbers
    let isNegative = false;
    let numStr = intStr;
    
    if (intStr.startsWith('-')) {
        isNegative = true;
        numStr = intStr.slice(1);
    }
    
    // Add commas from right to left
    let result = '';
    let count = 0;
    
    for (let i = numStr.length - 1; i >= 0; i--) {
        if (count > 0 && count % 3 === 0) {
            result = ',' + result;
        }
        result = numStr[i] + result;
        count++;
    }
    
    return isNegative ? '-' + result : result;
}

// Toggle history panel
function toggleHistory() {
    const panel = document.getElementById('historyPanel');
    panel.classList.toggle('show');
    
    if (panel.classList.contains('show')) {
        displayHistory();
    }
}

// Display history in the panel
function displayHistory() {
    const historyList = document.getElementById('historyList');
    
    if (calculationHistory.length === 0) {
        historyList.innerHTML = '<p class="no-history">No calculations yet</p>';
        return;
    }
    
    let historyHTML = '';
    calculationHistory.forEach((item, index) => {
        historyHTML += `
            <div class="history-item" onclick="loadFromHistory(${index})">
                <div class="history-calculation">${item.calculation}</div>
                <div class="history-result">= ${addCommas(item.result)}</div>
            </div>
        `;
    });
    
    historyList.innerHTML = historyHTML;
}

// Load a calculation from history
function loadFromHistory(index) {
    const item = calculationHistory[index];
    currentValue = item.result;
    needsReset = true;
    refreshDisplay();
    toggleHistory();
}

// Clear all history
function clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
        calculationHistory = [];
        saveHistory();
        displayHistory();
    }
}

refreshDisplay();

// Keyboard input support
document.addEventListener('keydown', function(event) {
    const key = event.key;
    let buttonToPress = null;
    
    // Number keys (0-9)
    if (key >= '0' && key <= '9') {
        pressNumber(key);
        buttonToPress = document.getElementById('btn' + key);
        event.preventDefault();
    }
    
    // Decimal point
    if (key === '.') {
        pressNumber('.');
        buttonToPress = document.getElementById('btnDot');
        event.preventDefault();
    }
    
    // Operations
    if (key === '+') {
        selectOperation('+');
        buttonToPress = document.getElementById('btnAdd');
        event.preventDefault();
    }
    
    if (key === '-') {
        selectOperation('-');
        buttonToPress = document.getElementById('btnSubtract');
        event.preventDefault();
    }
    
    if (key === '*') {
        selectOperation('×');
        buttonToPress = document.getElementById('btnMultiply');
        event.preventDefault();
    }
    
    if (key === '/') {
        selectOperation('÷');
        buttonToPress = document.getElementById('btnDivide');
        event.preventDefault();
    }
    
    // Equals (Enter or =)
    if (key === 'Enter' || key === '=') {
        computeAnswer();
        buttonToPress = document.getElementById('btnEquals');
        event.preventDefault();
    }
    
    // Clear (Escape or C)
    if (key === 'Escape' || key.toUpperCase() === 'C') {
        clearAll();
        buttonToPress = document.getElementById('btnC');
        event.preventDefault();
    }
    
    // Backspace to delete last digit
    if (key === 'Backspace') {
        deleteLastDigit();
        buttonToPress = document.getElementById('btnBack');
        event.preventDefault();
    }
    
    // Add visual feedback to the button
    if (buttonToPress) {
        buttonToPress.classList.add('pressed');
    }
});

document.addEventListener('keyup', function(event) {
    const key = event.key;
    let buttonToRelease = null;
    
    // Find the button that was pressed
    if (key >= '0' && key <= '9') {
        buttonToRelease = document.getElementById('btn' + key);
    } else if (key === '.') {
        buttonToRelease = document.getElementById('btnDot');
    } else if (key === '+') {
        buttonToRelease = document.getElementById('btnAdd');
    } else if (key === '-') {
        buttonToRelease = document.getElementById('btnSubtract');
    } else if (key === '*') {
        buttonToRelease = document.getElementById('btnMultiply');
    } else if (key === '/') {
        buttonToRelease = document.getElementById('btnDivide');
    } else if (key === 'Enter' || key === '=') {
        buttonToRelease = document.getElementById('btnEquals');
    } else if (key === 'Escape' || key.toUpperCase() === 'C') {
        buttonToRelease = document.getElementById('btnC');
    } else if (key === 'Backspace') {
        buttonToRelease = document.getElementById('btnBack');
    }
    
    // Remove visual feedback
    if (buttonToRelease) {
        buttonToRelease.classList.remove('pressed');
    }
});