// Playground page functionality for StudyHub
// Handles code editing, execution, and challenge management

class PlaygroundManager {
    constructor() {
        this.editor = null;
        this.pyodide = null;
        this.currentLanguage = 'javascript';
        this.challenges = {};
        this.snippets = {};
        this.init();
    }

    async init() {
        this.initEditor();
        this.initLanguageSelector();
        this.initToolbar();
        this.initChallenges();
        this.initSnippets();
        this.loadSavedCode();
        
        // Initialize Python environment if needed
        if (this.currentLanguage === 'python') {
            await this.initPython();
        }
    }

    initEditor() {
        const editorElement = document.getElementById('code-editor');
        if (!editorElement) return;

        // Initialize CodeMirror
        this.editor = CodeMirror.fromTextArea(editorElement, {
            lineNumbers: true,
            mode: this.currentLanguage === 'javascript' ? 'javascript' : 'python',
            theme: 'dracula',
            autoCloseBrackets: true,
            matchBrackets: true,
            indentWithTabs: false,
            indentUnit: 2,
            tabSize: 2,
            lineWrapping: true,
            extraKeys: {
                'Ctrl-Space': 'autocomplete',
                'Ctrl-/': 'toggleComment',
                'Ctrl-Enter': () => this.runCode(),
                'F11': function(cm) {
                    cm.setOption('fullScreen', !cm.getOption('fullScreen'));
                },
                'Esc': function(cm) {
                    if (cm.getOption('fullScreen')) cm.setOption('fullScreen', false);
                }
            }
        });

        // Set initial content
        this.setDefaultCode();
    }

    initLanguageSelector() {
        const languageSelect = document.getElementById('language-select');
        if (!languageSelect) return;

        languageSelect.addEventListener('change', async (e) => {
            this.currentLanguage = e.target.value;
            await this.switchLanguage(this.currentLanguage);
        });
    }

    async switchLanguage(language) {
        if (!this.editor) return;

        // Save current code before switching
        this.saveCurrentCode();

        // Update editor mode
        const mode = language === 'javascript' ? 'javascript' : 'python';
        this.editor.setOption('mode', mode);

        // Load saved code for the new language or set default
        const savedCode = this.getSavedCode(language);
        if (savedCode) {
            this.editor.setValue(savedCode);
        } else {
            this.setDefaultCode(language);
        }

        // Initialize Python if needed
        if (language === 'python' && !this.pyodide) {
            await this.initPython();
        }

        // Clear output
        this.clearOutput();
        
        this.currentLanguage = language;
        window.studyHub.showNotification(`Switched to ${language}`, 'success');
    }

    initToolbar() {
        // Theme selector
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                if (this.editor) {
                    this.editor.setOption('theme', e.target.value);
                    localStorage.setItem('studyhub-editor-theme', e.target.value);
                }
            });

            // Load saved theme
            const savedTheme = localStorage.getItem('studyhub-editor-theme') || 'dracula';
            themeSelect.value = savedTheme;
            if (this.editor) {
                this.editor.setOption('theme', savedTheme);
            }
        }

        // Run code button
        const runBtn = document.getElementById('run-code');
        if (runBtn) {
            runBtn.addEventListener('click', () => this.runCode());
        }

        // Reset button
        const resetBtn = document.getElementById('reset-code');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetCode());
        }

        // Save button
        const saveBtn = document.getElementById('save-code');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCode());
        }

        // Share button
        const shareBtn = document.getElementById('share-code');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareCode());
        }

        // Clear output button
        const clearBtn = document.getElementById('clear-output');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearOutput());
        }
    }

    async initPython() {
        const loadingOverlay = document.getElementById('python-loading');
        
        try {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'flex';
            }

            if (!this.pyodide) {
                this.pyodide = await loadPyodide();
                
                // Install common packages
                await this.pyodide.loadPackage(['numpy', 'matplotlib']);
                
                // Setup matplotlib for web
                this.pyodide.runPython(`
                    import matplotlib
                    matplotlib.use('Agg')
                    import matplotlib.pyplot as plt
                    import io
                    import base64
                    
                    def show_plot():
                        buf = io.BytesIO()
                        plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
                        buf.seek(0)
                        img_str = base64.b64encode(buf.read()).decode()
                        plt.close()
                        return f'<img src="data:image/png;base64,{img_str}" style="max-width: 100%; height: auto;">'
                `);
            }

            this.appendOutput('Python environment ready! 🐍', 'success');
        } catch (error) {
            this.appendOutput(`Error initializing Python: ${error.message}`, 'error');
        } finally {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }
    }

    async runCode() {
        const code = this.editor.getValue();
        if (!code.trim()) {
            window.studyHub.showNotification('Please enter some code to run', 'info');
            return;
        }

        // Clear previous output
        this.clearOutput();
        this.appendOutput(`Running ${this.currentLanguage} code...`, 'info');

        try {
            if (this.currentLanguage === 'javascript') {
                await this.runJavaScript(code);
            } else if (this.currentLanguage === 'python') {
                await this.runPython(code);
            }
        } catch (error) {
            this.appendOutput(`Execution error: ${error.message}`, 'error');
        }
    }

    runJavaScript(code) {
        return new Promise((resolve) => {
            // Capture console output
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;

            let hasOutput = false;

            console.log = (...args) => {
                hasOutput = true;
                this.appendOutput(args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' '), 'log');
                originalLog.apply(console, args);
            };

            console.error = (...args) => {
                hasOutput = true;
                this.appendOutput(args.map(arg => String(arg)).join(' '), 'error');
                originalError.apply(console, args);
            };

            console.warn = (...args) => {
                hasOutput = true;
                this.appendOutput(args.map(arg => String(arg)).join(' '), 'warn');
                originalWarn.apply(console, args);
            };

            try {
                // Create a function to execute the code with proper scope
                const executeCode = new Function(`
                    "use strict";
                    ${code}
                `);

                const result = executeCode();
                
                // If there's a return value and no console output, show it
                if (result !== undefined && !hasOutput) {
                    this.appendOutput(`Return value: ${JSON.stringify(result)}`, 'log');
                }

                if (!hasOutput && result === undefined) {
                    this.appendOutput('Code executed successfully (no output)', 'success');
                }

            } catch (error) {
                this.appendOutput(`Error: ${error.message}`, 'error');
            } finally {
                // Restore original console methods
                console.log = originalLog;
                console.error = originalError;
                console.warn = originalWarn;
                resolve();
            }
        });
    }

    async runPython(code) {
        if (!this.pyodide) {
            await this.initPython();
        }

        if (!this.pyodide) {
            this.appendOutput('Python environment not available', 'error');
            return;
        }

        try {
            // Capture stdout
            this.pyodide.runPython(`
                import sys
                import io
                
                # Capture stdout
                old_stdout = sys.stdout
                sys.stdout = captured_output = io.StringIO()
            `);

            // Execute the user code
            this.pyodide.runPython(code);

            // Get the captured output
            const output = this.pyodide.runPython(`
                output = captured_output.getvalue()
                sys.stdout = old_stdout
                output
            `);

            if (output) {
                this.appendOutput(output, 'log');
            } else {
                this.appendOutput('Code executed successfully (no output)', 'success');
            }

        } catch (error) {
            this.appendOutput(`Python Error: ${error.message}`, 'error');
        }
    }

    appendOutput(text, type = 'log') {
        const outputElement = document.getElementById('output');
        if (!outputElement) return;

        // Remove placeholder if it exists
        const placeholder = outputElement.querySelector('.output-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        const outputLine = document.createElement('div');
        outputLine.className = `output-line output-${type}`;
        
        // Handle HTML content (like matplotlib plots)
        if (text.includes('<img')) {
            outputLine.innerHTML = text;
        } else {
            outputLine.textContent = text;
        }

        outputElement.appendChild(outputLine);
        outputElement.scrollTop = outputElement.scrollHeight;
    }

    clearOutput() {
        const outputElement = document.getElementById('output');
        if (outputElement) {
            outputElement.innerHTML = `
                <div class="output-placeholder">
                    <i class="fas fa-play-circle"></i>
                    <p>Click "Run Code" to see your output here</p>
                </div>
            `;
        }
    }

    setDefaultCode(language = this.currentLanguage) {
        const defaultCodes = {
            javascript: `// Welcome to StudyHub Coding Playground!
// Write your JavaScript code here and click 'Run Code' to execute

console.log("Hello, StudyHub!");

// Try some examples:
// 1. Variables and functions
function greetStudent(name) {
    return \`Welcome to StudyHub, \${name}!\`;
}

console.log(greetStudent("Student"));

// 2. Arrays and loops
const subjects = ["Math", "Science", "Programming"];
subjects.forEach(subject => {
    console.log(\`Studying: \${subject}\`);
});

// 3. Simple calculation
const calculateGrade = (score, total) => {
    const percentage = (score / total) * 100;
    return \`Grade: \${percentage.toFixed(1)}%\`;
};

console.log(calculateGrade(85, 100));`,

            python: `# Welcome to StudyHub Python Playground!
# Write your Python code here and click 'Run Code' to execute

print("Hello, StudyHub!")

# Try some examples:
# 1. Variables and functions
def greet_student(name):
    return f"Welcome to StudyHub, {name}!"

print(greet_student("Student"))

# 2. Lists and loops
subjects = ["Math", "Science", "Programming"]
for subject in subjects:
    print(f"Studying: {subject}")

# 3. Simple calculation
def calculate_grade(score, total):
    percentage = (score / total) * 100
    return f"Grade: {percentage:.1f}%"

print(calculate_grade(85, 100))

# 4. List comprehension
squares = [x**2 for x in range(1, 6)]
print(f"Squares: {squares}")

# 5. Working with dictionaries
student_grades = {
    "Math": 92,
    "Science": 88,
    "Programming": 95
}

for subject, grade in student_grades.items():
    print(f"{subject}: {grade}%")`
        };

        if (this.editor) {
            this.editor.setValue(defaultCodes[language] || defaultCodes.javascript);
        }
    }

    resetCode() {
        if (confirm('Are you sure you want to reset the code? This will clear all your changes.')) {
            this.setDefaultCode();
            this.clearOutput();
            window.studyHub.showNotification('Code reset to default', 'success');
        }
    }

    saveCode() {
        const code = this.editor.getValue();
        localStorage.setItem(`studyhub-code-${this.currentLanguage}`, code);
        window.studyHub.showNotification('Code saved locally', 'success');
    }

    saveCurrentCode() {
        if (this.editor) {
            const code = this.editor.getValue();
            localStorage.setItem(`studyhub-code-${this.currentLanguage}`, code);
        }
    }

    loadSavedCode() {
        const savedCode = this.getSavedCode(this.currentLanguage);
        if (savedCode && this.editor) {
            this.editor.setValue(savedCode);
        }
    }

    getSavedCode(language) {
        return localStorage.getItem(`studyhub-code-${language}`);
    }

    shareCode() {
        const code = this.editor.getValue();
        if (!code.trim()) {
            window.studyHub.showNotification('No code to share', 'info');
            return;
        }

        // Create a simple share URL (in a real app, this would use a backend service)
        const shareData = {
            language: this.currentLanguage,
            code: code,
            timestamp: new Date().toISOString()
        };

        const encoded = btoa(JSON.stringify(shareData));
        const shareUrl = `${window.location.origin}${window.location.pathname}?shared=${encoded}`;

        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            window.studyHub.showNotification('Share URL copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback: show the URL in a modal or alert
            prompt('Share URL (copy this):', shareUrl);
        });
    }

    initChallenges() {
        this.challenges = {
            fizzbuzz: {
                title: 'FizzBuzz Classic',
                description: 'Print numbers 1-100, but for multiples of 3 print "Fizz", multiples of 5 print "Buzz", and multiples of both print "FizzBuzz".',
                javascript: `// FizzBuzz Challenge
// Print numbers 1-100 with the following rules:
// - Multiples of 3: print "Fizz"
// - Multiples of 5: print "Buzz"  
// - Multiples of both 3 and 5: print "FizzBuzz"
// - All other numbers: print the number

for (let i = 1; i <= 100; i++) {
    // Your code here
    
}`,
                python: `# FizzBuzz Challenge
# Print numbers 1-100 with the following rules:
# - Multiples of 3: print "Fizz"
# - Multiples of 5: print "Buzz"  
# - Multiples of both 3 and 5: print "FizzBuzz"
# - All other numbers: print the number

for i in range(1, 101):
    # Your code here
    pass`
            },

            palindrome: {
                title: 'Palindrome Check',
                description: 'Write a function that checks if a word reads the same backward as forward, ignoring spaces and case.',
                javascript: `// Palindrome Checker
// Write a function that returns true if a string is a palindrome
// (reads the same forwards and backwards)
// Ignore spaces, punctuation, and case

function isPalindrome(str) {
    // Your code here
    
}

// Test cases
console.log(isPalindrome("racecar")); // should return true
console.log(isPalindrome("A man a plan a canal Panama")); // should return true
console.log(isPalindrome("race a car")); // should return false
console.log(isPalindrome("hello")); // should return false`,
                python: `# Palindrome Checker
# Write a function that returns True if a string is a palindrome
# (reads the same forwards and backwards)
# Ignore spaces, punctuation, and case

def is_palindrome(s):
    # Your code here
    pass

# Test cases
print(is_palindrome("racecar"))  # should return True
print(is_palindrome("A man a plan a canal Panama"))  # should return True
print(is_palindrome("race a car"))  # should return False
print(is_palindrome("hello"))  # should return False`
            },

            sorting: {
                title: 'Array Sorter',
                description: 'Implement different sorting algorithms and compare their performance.',
                javascript: `// Sorting Algorithms
// Implement bubble sort and quick sort algorithms

function bubbleSort(arr) {
    // Your bubble sort implementation here
    
}

function quickSort(arr) {
    // Your quick sort implementation here
    
}

// Test with sample data
const testArray = [64, 34, 25, 12, 22, 11, 90];
console.log("Original array:", testArray);

// Test bubble sort
const bubbled = bubbleSort([...testArray]);
console.log("Bubble sorted:", bubbled);

// Test quick sort
const quickSorted = quickSort([...testArray]);
console.log("Quick sorted:", quickSorted);`,
                python: `# Sorting Algorithms
# Implement bubble sort and quick sort algorithms

def bubble_sort(arr):
    # Your bubble sort implementation here
    pass

def quick_sort(arr):
    # Your quick sort implementation here
    pass

# Test with sample data
test_array = [64, 34, 25, 12, 22, 11, 90]
print("Original array:", test_array)

# Test bubble sort
bubbled = bubble_sort(test_array.copy())
print("Bubble sorted:", bubbled)

# Test quick sort
quick_sorted = quick_sort(test_array.copy())
print("Quick sorted:", quick_sorted)`
            },

            calculator: {
                title: 'Calculator App',
                description: 'Build a simple calculator that can perform basic arithmetic operations with proper error handling.',
                javascript: `// Simple Calculator
// Build a calculator that can perform basic arithmetic operations
// Include proper error handling for division by zero

class Calculator {
    add(a, b) {
        // Your implementation here
    }
    
    subtract(a, b) {
        // Your implementation here
    }
    
    multiply(a, b) {
        // Your implementation here
    }
    
    divide(a, b) {
        // Your implementation here
        // Remember to handle division by zero!
    }
    
    calculate(expression) {
        // Parse and evaluate expressions like "2 + 3 * 4"
        // Your implementation here
    }
}

// Test your calculator
const calc = new Calculator();
console.log("5 + 3 =", calc.add(5, 3));
console.log("10 - 4 =", calc.subtract(10, 4));
console.log("6 * 7 =", calc.multiply(6, 7));
console.log("15 / 3 =", calc.divide(15, 3));
console.log("10 / 0 =", calc.divide(10, 0)); // Should handle error gracefully`,
                python: `# Simple Calculator
# Build a calculator that can perform basic arithmetic operations
# Include proper error handling for division by zero

class Calculator:
    def add(self, a, b):
        # Your implementation here
        pass
    
    def subtract(self, a, b):
        # Your implementation here
        pass
    
    def multiply(self, a, b):
        # Your implementation here
        pass
    
    def divide(self, a, b):
        # Your implementation here
        # Remember to handle division by zero!
        pass
    
    def calculate(self, expression):
        # Parse and evaluate expressions like "2 + 3 * 4"
        # Your implementation here
        pass

# Test your calculator
calc = Calculator()
print("5 + 3 =", calc.add(5, 3))
print("10 - 4 =", calc.subtract(10, 4))
print("6 * 7 =", calc.multiply(6, 7))
print("15 / 3 =", calc.divide(15, 3))
print("10 / 0 =", calc.divide(10, 0))  # Should handle error gracefully`
            },

            tree: {
                title: 'Binary Tree Traversal',
                description: 'Implement and visualize different tree traversal methods.',
                javascript: `// Binary Tree Traversal
// Implement inorder, preorder, and postorder traversal

class TreeNode {
    constructor(val, left = null, right = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

class BinaryTree {
    constructor(root = null) {
        this.root = root;
    }
    
    inorderTraversal(node = this.root) {
        // Left, Root, Right
        // Your implementation here
    }
    
    preorderTraversal(node = this.root) {
        // Root, Left, Right
        // Your implementation here
    }
    
    postorderTraversal(node = this.root) {
        // Left, Right, Root
        // Your implementation here
    }
}

// Create a sample tree:    1
//                        /   \\
//                       2     3
//                      / \\
//                     4   5

const tree = new BinaryTree(
    new TreeNode(1,
        new TreeNode(2,
            new TreeNode(4),
            new TreeNode(5)
        ),
        new TreeNode(3)
    )
);

console.log("Inorder:", tree.inorderTraversal());
console.log("Preorder:", tree.preorderTraversal());
console.log("Postorder:", tree.postorderTraversal());`,
                python: `# Binary Tree Traversal
# Implement inorder, preorder, and postorder traversal

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class BinaryTree:
    def __init__(self, root=None):
        self.root = root
    
    def inorder_traversal(self, node=None):
        # Left, Root, Right
        # Your implementation here
        if node is None:
            node = self.root
        pass
    
    def preorder_traversal(self, node=None):
        # Root, Left, Right
        # Your implementation here
        if node is None:
            node = self.root
        pass
    
    def postorder_traversal(self, node=None):
        # Left, Right, Root
        # Your implementation here
        if node is None:
            node = self.root
        pass

# Create a sample tree:    1
#                        /   \\
#                       2     3
#                      / \\
#                     4   5

tree = BinaryTree(
    TreeNode(1,
        TreeNode(2,
            TreeNode(4),
            TreeNode(5)
        ),
        TreeNode(3)
    )
)

print("Inorder:", tree.inorder_traversal())
print("Preorder:", tree.preorder_traversal())
print("Postorder:", tree.postorder_traversal())`
            },

            nqueens: {
                title: 'N-Queens Problem',
                description: 'Solve the classic N-Queens problem using backtracking algorithm.',
                javascript: `// N-Queens Problem
// Place N queens on an N×N chessboard so that no two queens attack each other

class NQueens {
    constructor(n) {
        this.n = n;
        this.board = Array(n).fill().map(() => Array(n).fill(0));
        this.solutions = [];
    }
    
    isSafe(row, col) {
        // Check if placing a queen at (row, col) is safe
        // Your implementation here
    }
    
    solve(row = 0) {
        // Use backtracking to find all solutions
        // Your implementation here
    }
    
    printBoard() {
        // Print the current board state
        this.board.forEach(row => {
            console.log(row.map(cell => cell ? 'Q' : '.').join(' '));
        });
        console.log('---');
    }
}

// Solve for 4 queens (classic example)
const nQueens = new NQueens(4);
console.log("Solving 4-Queens problem...");
nQueens.solve();
console.log(\`Found \${nQueens.solutions.length} solution(s)\`);`,
                python: `# N-Queens Problem
# Place N queens on an N×N chessboard so that no two queens attack each other

class NQueens:
    def __init__(self, n):
        self.n = n
        self.board = [[0 for _ in range(n)] for _ in range(n)]
        self.solutions = []
    
    def is_safe(self, row, col):
        # Check if placing a queen at (row, col) is safe
        # Your implementation here
        pass
    
    def solve(self, row=0):
        # Use backtracking to find all solutions
        # Your implementation here
        pass
    
    def print_board(self):
        # Print the current board state
        for row in self.board:
            print(' '.join('Q' if cell else '.' for cell in row))
        print('---')

# Solve for 4 queens (classic example)
n_queens = NQueens(4)
print("Solving 4-Queens problem...")
n_queens.solve()
print(f"Found {len(n_queens.solutions)} solution(s)")`
            }
        };

        // Add event listeners for challenge buttons
        document.querySelectorAll('.load-challenge').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const challengeId = e.target.getAttribute('data-challenge');
                this.loadChallenge(challengeId);
            });
        });
    }

    loadChallenge(challengeId) {
        const challenge = this.challenges[challengeId];
        if (!challenge) return;

        const code = challenge[this.currentLanguage];
        if (code && this.editor) {
            this.editor.setValue(code);
            this.clearOutput();
            window.studyHub.showNotification(`Loaded challenge: ${challenge.title}`, 'success');
        } else {
            window.studyHub.showNotification(`Challenge not available for ${this.currentLanguage}`, 'error');
        }
    }

    initSnippets() {
        this.snippets = {
            'array-methods': {
                javascript: `// JavaScript Array Methods Cheat Sheet

const fruits = ['apple', 'banana', 'orange', 'grape'];
const numbers = [1, 2, 3, 4, 5];

// Adding/Removing elements
console.log('=== Adding/Removing ===');
fruits.push('mango');                    // Add to end
console.log('After push:', fruits);

fruits.unshift('strawberry');            // Add to beginning
console.log('After unshift:', fruits);

const lastFruit = fruits.pop();          // Remove from end
console.log('Popped:', lastFruit);
console.log('After pop:', fruits);

const firstFruit = fruits.shift();       // Remove from beginning
console.log('Shifted:', firstFruit);
console.log('After shift:', fruits);

// Transformation methods
console.log('\\n=== Transformation ===');
const doubled = numbers.map(n => n * 2);
console.log('Doubled:', doubled);

const evenNumbers = numbers.filter(n => n % 2 === 0);
console.log('Even numbers:', evenNumbers);

const sum = numbers.reduce((acc, n) => acc + n, 0);
console.log('Sum:', sum);

// Search methods
console.log('\\n=== Search ===');
console.log('Index of orange:', fruits.indexOf('orange'));
console.log('Includes banana:', fruits.includes('banana'));
console.log('Find first even:', numbers.find(n => n % 2 === 0));

// Other useful methods
console.log('\\n=== Other Methods ===');
console.log('Joined fruits:', fruits.join(', '));
console.log('Reversed copy:', [...numbers].reverse());
console.log('Sorted copy:', [...fruits].sort());
console.log('Slice (1,3):', fruits.slice(1, 3));`,

                python: `# Python List Methods and Comprehensions

fruits = ['apple', 'banana', 'orange', 'grape']
numbers = [1, 2, 3, 4, 5]

# Adding/Removing elements
print('=== Adding/Removing ===')
fruits.append('mango')                   # Add to end
print('After append:', fruits)

fruits.insert(0, 'strawberry')          # Insert at position
print('After insert:', fruits)

last_fruit = fruits.pop()               # Remove from end
print('Popped:', last_fruit)
print('After pop:', fruits)

fruits.remove('banana')                 # Remove by value
print('After remove banana:', fruits)

# List comprehensions
print('\\n=== List Comprehensions ===')
doubled = [n * 2 for n in numbers]
print('Doubled:', doubled)

even_numbers = [n for n in numbers if n % 2 == 0]
print('Even numbers:', even_numbers)

squared_evens = [n**2 for n in numbers if n % 2 == 0]
print('Squared evens:', squared_evens)

# Built-in functions with lists
print('\\n=== Built-in Functions ===')
print('Sum:', sum(numbers))
print('Max:', max(numbers))
print('Min:', min(numbers))
print('Length:', len(fruits))

# Search methods
print('\\n=== Search ===')
print('Index of orange:', fruits.index('orange'))
print('Count of apple:', fruits.count('apple'))

# Other useful methods
print('\\n=== Other Methods ===')
print('Joined fruits:', ', '.join(fruits))
print('Reversed copy:', list(reversed(numbers)))
print('Sorted copy:', sorted(fruits))
print('Slice [1:3]:', fruits[1:3])`
            },

            'async-await': {
                javascript: `// Async/Await Examples in JavaScript

// Basic async function
async function fetchUserData(userId) {
    try {
        console.log('Fetching user data...');
        
        // Simulate API call with Promise
        const userData = await new Promise((resolve, reject) => {
            setTimeout(() => {
                if (userId > 0) {
                    resolve({
                        id: userId,
                        name: 'John Doe',
                        email: 'john@example.com'
                    });
                } else {
                    reject(new Error('Invalid user ID'));
                }
            }, 1000);
        });
        
        console.log('User data:', userData);
        return userData;
    } catch (error) {
        console.error('Error fetching user:', error.message);
        throw error;
    }
}

// Multiple async operations
async function fetchMultipleUsers() {
    try {
        console.log('\\n=== Fetching Multiple Users ===');
        
        // Sequential execution
        console.log('Sequential execution:');
        const user1 = await fetchUserData(1);
        const user2 = await fetchUserData(2);
        console.log('Sequential results:', [user1, user2]);
        
        // Parallel execution
        console.log('\\nParallel execution:');
        const [user3, user4] = await Promise.all([
            fetchUserData(3),
            fetchUserData(4)
        ]);
        console.log('Parallel results:', [user3, user4]);
        
    } catch (error) {
        console.error('Error in fetchMultipleUsers:', error.message);
    }
}

// Error handling with async/await
async function handleErrors() {
    console.log('\\n=== Error Handling ===');
    
    try {
        await fetchUserData(-1); // This will throw an error
    } catch (error) {
        console.log('Caught error:', error.message);
    }
    
    // Using Promise.allSettled for mixed results
    const results = await Promise.allSettled([
        fetchUserData(5),
        fetchUserData(-1),
        fetchUserData(6)
    ]);
    
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            console.log(\`Result \${index + 1} succeeded:, result.value);
        } else {
            console.log(\`Result \${index + 1} failed:\`, result.reason.message);
        }
    });
}

// Run examples
(async () => {
    await fetchUserData(1);
    await fetchMultipleUsers();
    await handleErrors();
})();`,

                python: `# Async/Await Examples in Python
import asyncio
import aiohttp
import time

# Basic async function
async def fetch_user_data(user_id):
    try:
        print('Fetching user data...')
        
        # Simulate API call with asyncio.sleep
        await asyncio.sleep(1)  # Non-blocking sleep
        
        if user_id > 0:
            user_data = {
                'id': user_id,
                'name': 'John Doe',
                'email': 'john@example.com'
            }
            print('User data:', user_data)
            return user_data
        else:
            raise ValueError('Invalid user ID')
            
    except Exception as error:
        print(f'Error fetching user: {error}')
        raise

# Multiple async operations
async def fetch_multiple_users():
    try:
        print('\\n=== Fetching Multiple Users ===')
        
        # Sequential execution
        print('Sequential execution:')
        start_time = time.time()
        user1 = await fetch_user_data(1)
        user2 = await fetch_user_data(2)
        sequential_time = time.time() - start_time
        print(f'Sequential results: [{user1}, {user2}]')
        print(f'Sequential time: {sequential_time:.2f}s')
        
        # Parallel execution
        print('\\nParallel execution:')
        start_time = time.time()
        user3, user4 = await asyncio.gather(
            fetch_user_data(3),
            fetch_user_data(4)
        )
        parallel_time = time.time() - start_time
        print(f'Parallel results: [{user3}, {user4}]')
        print(f'Parallel time: {parallel_time:.2f}s')
        
    except Exception as error:
        print(f'Error in fetch_multiple_users: {error}')

# Error handling with async/await
async def handle_errors():
    print('\\n=== Error Handling ===')
    
    try:
        await fetch_user_data(-1)  # This will raise an error
    except ValueError as error:
        print(f'Caught error: {error}')
    
    # Using asyncio.gather with return_exceptions=True
    results = await asyncio.gather(
        fetch_user_data(5),
        fetch_user_data(-1),
        fetch_user_data(6),
        return_exceptions=True
    )
    
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            print(f'Result {i + 1} failed: {result}')
        else:
            print(f'Result {i + 1} succeeded: {result}')

# Context manager for async operations
class AsyncTimer:
    def __init__(self, name):
        self.name = name
    
    async def __aenter__(self):
        self.start = time.time()
        print(f'Starting {self.name}...')
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start
        print(f'{self.name} completed in {duration:.2f}s')

async def timed_operation():
    async with AsyncTimer('Timed operation'):
        await asyncio.sleep(1)
        print('Operation completed!')

# Main function to run examples
async def main():
    await fetch_user_data(1)
    await fetch_multiple_users()
    await handle_errors()
    await timed_operation()

# Run the async main function
# Note: In a real Python environment, you would use:
# asyncio.run(main())
print("Async examples defined! Run asyncio.run(main()) to execute.")`
            },

            'dom-basics': {
                javascript: `// DOM Manipulation Basics

// 1. Selecting Elements
console.log('=== Selecting Elements ===');

// By ID
const headerElement = document.getElementById('main-header');
console.log('Header by ID:', headerElement);

// By class name
const buttons = document.getElementsByClassName('btn');
console.log('Buttons by class:', buttons);

// By tag name
const paragraphs = document.getElementsByTagName('p');
console.log('Paragraphs by tag:', paragraphs);

// Modern selectors (recommended)
const firstButton = document.querySelector('.btn');
const allButtons = document.querySelectorAll('.btn');
console.log('First button:', firstButton);
console.log('All buttons:', allButtons);

// 2. Creating Elements
console.log('\\n=== Creating Elements ===');

const newDiv = document.createElement('div');
newDiv.className = 'dynamic-content';
newDiv.innerHTML = '<h3>Dynamically Created Content</h3><p>This was created with JavaScript!</p>';

const newButton = document.createElement('button');
newButton.textContent = 'Click Me!';
newButton.className = 'btn dynamic-btn';

// 3. Modifying Elements
console.log('\\n=== Modifying Elements ===');

// Change text content
if (headerElement) {
    headerElement.textContent = 'Updated Header Text';
}

// Change HTML content
const container = document.createElement('div');
container.innerHTML = \`
    <h2>Dynamic Content</h2>
    <p>Current time: \${new Date().toLocaleTimeString()}</p>
    <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
    </ul>
\`;

// 4. Adding Event Listeners
console.log('\\n=== Event Listeners ===');

newButton.addEventListener('click', function(event) {
    console.log('Button clicked!', event);
    this.textContent = 'Clicked!';
    this.style.backgroundColor = '#28a745';
    this.style.color = 'white';
});

// Multiple event types
newButton.addEventListener('mouseenter', function() {
    this.style.transform = 'scale(1.05)';
});

newButton.addEventListener('mouseleave', function() {
    this.style.transform = 'scale(1)';
});

// 5. Working with Classes
console.log('\\n=== Class Manipulation ===');

const classDemo = document.createElement('div');
classDemo.textContent = 'Class manipulation demo';

// Add classes
classDemo.classList.add('demo', 'highlighted');
console.log('Classes after add:', classDemo.className);

// Remove class
classDemo.classList.remove('highlighted');
console.log('Classes after remove:', classDemo.className);

// Toggle class
classDemo.classList.toggle('active');
console.log('Classes after toggle:', classDemo.className);

// Check if class exists
console.log('Has "demo" class:', classDemo.classList.contains('demo'));

// 6. Working with Attributes
console.log('\\n=== Attributes ===');

const linkElement = document.createElement('a');
linkElement.textContent = 'StudyHub Homepage';

// Set attributes
linkElement.setAttribute('href', 'https://studyhub.com');
linkElement.setAttribute('target', '_blank');
linkElement.setAttribute('title', 'Visit StudyHub');

// Get attributes
console.log('Link href:', linkElement.getAttribute('href'));
console.log('Link target:', linkElement.getAttribute('target'));

// Data attributes
linkElement.dataset.category = 'navigation';
linkElement.dataset.priority = 'high';
console.log('Data category:', linkElement.dataset.category);

// 7. Inserting Elements into DOM
console.log('\\n=== Inserting Elements ===');

// Create a demo container
const demoContainer = document.createElement('div');
demoContainer.id = 'demo-container';
demoContainer.style.cssText = \`
    border: 2px solid #007bff;
    padding: 20px;
    margin: 20px 0;
    border-radius: 8px;
    background-color: #f8f9fa;
\`;

// Append elements
demoContainer.appendChild(newDiv);
demoContainer.appendChild(newButton);
demoContainer.appendChild(container);
demoContainer.appendChild(classDemo);
demoContainer.appendChild(linkElement);

// Insert into page (if body exists)
if (document.body) {
    document.body.appendChild(demoContainer);
    console.log('Demo container added to page!');
} else {
    console.log('No body element found - demo container created but not added to page');
}

// 8. Form Handling
console.log('\\n=== Form Handling ===');

const form = document.createElement('form');
form.innerHTML = \`
    <h3>Demo Form</h3>
    <div style="margin-bottom: 10px;">
        <label for="username">Username:</label>
        <input type="text" id="username" name="username" required>
    </div>
    <div style="margin-bottom: 10px;">
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required>
    </div>
    <button type="submit">Submit</button>
\`;

form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    
    console.log('Form submitted with data:', data);
    alert(\`Form submitted!\\nUsername: \${data.username}\\nEmail: \${data.email}\`);
});

if (demoContainer) {
    demoContainer.appendChild(form);
}

console.log('\\nDOM manipulation examples complete!');
console.log('Check the page for visual elements that were created.');`,

                python: `# DOM Manipulation in Python (using browser APIs via pyodide)
# Note: This requires running in a browser environment with pyodide

try:
    from js import document, console, alert
    import json
    
    print("=== Python DOM Manipulation ===")
    
    # 1. Selecting Elements
    print("\\n=== Selecting Elements ===")
    
    # Try to find existing elements
    try:
        body = document.body
        print("Body element found:", body)
    except:
        print("No body element accessible")
    
    # 2. Creating Elements
    print("\\n=== Creating Elements ===")
    
    # Create a new div element
    new_div = document.createElement('div')
    new_div.className = 'python-content'
    new_div.innerHTML = '<h3>Created with Python!</h3><p>This content was generated using Python in the browser.</p>'
    
    # Create a button
    new_button = document.createElement('button')
    new_button.textContent = 'Python Button'
    new_button.className = 'btn python-btn'
    
    # 3. Styling Elements
    print("\\n=== Styling Elements ===")
    
    new_div.style.cssText = '''
        border: 2px solid #3776ab;
        padding: 20px;
        margin: 20px 0;
        border-radius: 8px;
        background-color: #f0f8ff;
        color: #2c3e50;
    '''
    
    new_button.style.cssText = '''
        background-color: #3776ab;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
    '''
    
    # 4. Creating a List Dynamically
    print("\\n=== Creating Dynamic List ===")
    
    languages = ['Python', 'JavaScript', 'HTML', 'CSS', 'SQL']
    
    list_container = document.createElement('div')
    list_container.innerHTML = '<h4>Programming Languages:</h4>'
    
    ul = document.createElement('ul')
    for lang in languages:
        li = document.createElement('li')
        li.textContent = f"• {lang}"
        li.style.margin = '5px 0'
        ul.appendChild(li)
    
    list_container.appendChild(ul)
    
    # 5. Creating a Data Table
    print("\\n=== Creating Data Table ===")
    
    students = [
        {'name': 'Alice', 'grade': 92, 'subject': 'Math'},
        {'name': 'Bob', 'grade': 88, 'subject': 'Science'},
        {'name': 'Carol', 'grade': 95, 'subject': 'Programming'},
        {'name': 'David', 'grade': 90, 'subject': 'Physics'}
    ]
    
    table = document.createElement('table')
    table.style.cssText = '''
        border-collapse: collapse;
        width: 100%;
        margin: 10px 0;
    '''
    
    # Create header
    header = document.createElement('tr')
    for col in ['Name', 'Grade', 'Subject']:
        th = document.createElement('th')
        th.textContent = col
        th.style.cssText = '''
            border: 1px solid #ddd;
            padding: 8px;
            background-color: #f2f2f2;
            text-align: left;
        '''
        header.appendChild(th)
    table.appendChild(header)
    
    # Create data rows
    for student in students:
        row = document.createElement('tr')
        for value in [student['name'], student['grade'], student['subject']]:
            td = document.createElement('td')
            td.textContent = str(value)
            td.style.cssText = '''
                border: 1px solid #ddd;
                padding: 8px;
            '''
            row.appendChild(td)
        table.appendChild(row)
    
    # 6. Creating an Interactive Form
    print("\\n=== Creating Interactive Form ===")
    
    form = document.createElement('form')
    form.innerHTML = '''
        <h4>Python Form Example</h4>
        <div style="margin-bottom: 10px;">
            <label for="py-name">Name:</label><br>
            <input type="text" id="py-name" name="name" style="padding: 5px; margin-top: 5px;">
        </div>
        <div style="margin-bottom: 10px;">
            <label for="py-age">Age:</label><br>
            <input type="number" id="py-age" name="age" style="padding: 5px; margin-top: 5px;">
        </div>
        <button type="submit" style="background-color: #3776ab; color: white; border: none; padding: 8px 16px; border-radius: 4px;">
            Submit (Python Handler)
        </button>
    '''
    
    # 7. Assembling the Demo Container
    print("\\n=== Assembling Demo ===")
    
    demo_container = document.createElement('div')
    demo_container.id = 'python-demo-container'
    demo_container.style.cssText = '''
        border: 3px solid #3776ab;
        padding: 20px;
        margin: 20px 0;
        border-radius: 10px;
        background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
    '''
    
    # Add title
    title = document.createElement('h2')
    title.textContent = 'Python DOM Manipulation Demo'
    title.style.color = '#3776ab'
    demo_container.appendChild(title)
    
    # Add all elements
    demo_container.appendChild(new_div)
    demo_container.appendChild(new_button)
    demo_container.appendChild(list_container)
    demo_container.appendChild(table)
    demo_container.appendChild(form)
    
    # Try to add to page
    try:
        if document.body:
            document.body.appendChild(demo_container)
            print("Python demo container added to page!")
        else:
            print("No body element found")
    except Exception as e:
        print(f"Could not add to page: {e}")
    
    # 8. Working with Local Storage (if available)
    print("\\n=== Local Storage Example ===")
    
    try:
        from js import localStorage
        
        # Save some data
        data = {'language': 'Python', 'framework': 'Pyodide', 'timestamp': str(datetime.now())}
        localStorage.setItem('python-demo-data', json.dumps(data))
        
        # Retrieve data
        saved_data = json.loads(localStorage.getItem('python-demo-data'))
        print("Saved to localStorage:", saved_data)
        
    except Exception as e:
        print(f"localStorage not available: {e}")
    
    print("\\nPython DOM manipulation complete!")
    print("Check the page for visual elements created with Python!")

except ImportError:
    print("This code requires a browser environment with pyodide")
    print("DOM manipulation from Python is available when running in the browser")
    
    # Alternative: Show what the code would do
    print("\\n=== What this code would do in a browser ===")
    print("1. Create HTML elements using document.createElement()")
    print("2. Style elements with CSS properties")
    print("3. Generate dynamic content (lists, tables)")
    print("4. Create interactive forms")
    print("5. Add event listeners to elements")
    print("6. Manipulate the DOM structure")
    print("7. Work with browser APIs like localStorage")
    
except Exception as e:
    print(f"Error in DOM manipulation: {e}")
    print("Make sure you're running this in a browser environment")`
            },

            'list-comprehensions': {
                python: `# Python List Comprehensions - Complete Guide

print("=== Python List Comprehensions ===")

# 1. Basic List Comprehensions
print("\\n1. Basic List Comprehensions")

# Traditional way vs List comprehension
numbers = [1, 2, 3, 4, 5]

# Traditional way
squares_traditional = []
for x in numbers:
    squares_traditional.append(x**2)

# List comprehension way
squares_comprehension = [x**2 for x in numbers]

print("Original numbers:", numbers)
print("Squares (traditional):", squares_traditional)
print("Squares (comprehension):", squares_comprehension)

# 2. List Comprehensions with Conditions
print("\\n2. List Comprehensions with Conditions")

# Even numbers only
evens = [x for x in range(10) if x % 2 == 0]
print("Even numbers 0-9:", evens)

# Odd squares
odd_squares = [x**2 for x in range(10) if x % 2 == 1]
print("Odd squares:", odd_squares)

# Filter and transform
words = ['hello', 'world', 'python', 'programming', 'code']
long_words_upper = [word.upper() for word in words if len(word) > 4]
print("Long words (uppercase):", long_words_upper)

# 3. Nested List Comprehensions
print("\\n3. Nested List Comprehensions")

# Create a multiplication table
multiplication_table = [[i * j for j in range(1, 6)] for i in range(1, 6)]
print("5x5 Multiplication table:")
for row in multiplication_table:
    print(row)

# Flatten a nested list
nested_list = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flattened = [item for sublist in nested_list for item in sublist]
print("\\nNested list:", nested_list)
print("Flattened:", flattened)

# Matrix transpose
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
transposed = [[row[i] for row in matrix] for i in range(len(matrix[0]))]
print("\\nOriginal matrix:", matrix)
print("Transposed matrix:", transposed)

# 4. List Comprehensions with Multiple Conditions
print("\\n4. Multiple Conditions")

# Numbers divisible by both 2 and 3
divisible_by_2_and_3 = [x for x in range(1, 31) if x % 2 == 0 and x % 3 == 0]
print("Numbers 1-30 divisible by both 2 and 3:", divisible_by_2_and_3)

# Using multiple if conditions (equivalent to 'and')
same_result = [x for x in range(1, 31) if x % 2 == 0 if x % 3 == 0]
print("Same result with multiple if:", same_result)

# 5. List Comprehensions with Functions
print("\\n5. Using Functions")

def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

# Prime numbers
primes = [x for x in range(2, 30) if is_prime(x)]
print("Prime numbers 2-29:", primes)

# String operations
names = ['alice', 'bob', 'charlie', 'diana']
capitalized_names = [name.capitalize() for name in names]
initials = [name[0].upper() for name in names]
print("Names:", names)
print("Capitalized:", capitalized_names)
print("Initials:", initials)

# 6. Dictionary and Set Comprehensions
print("\\n6. Dictionary and Set Comprehensions")

# Dictionary comprehension
word_lengths = {word: len(word) for word in words}
print("Word lengths:", word_lengths)

# Dictionary with condition
long_word_lengths = {word: len(word) for word in words if len(word) > 4}
print("Long word lengths:", long_word_lengths)

# Set comprehension (removes duplicates)
lengths = {len(word) for word in words}
print("Unique word lengths:", lengths)

# 7. Advanced Examples
print("\\n7. Advanced Examples")

# Cartesian product
colors = ['red', 'green', 'blue']
sizes = ['S', 'M', 'L']
products = [(color, size) for color in colors for size in sizes]
print("Product combinations:", products)

# Conditional expressions (ternary operator)
numbers = range(-5, 6)
abs_values = [x if x >= 0 else -x for x in numbers]
print("Numbers:", list(numbers))
print("Absolute values:", abs_values)

# More complex conditional
labels = ['positive' if x > 0 else 'negative' if x < 0 else 'zero' for x in numbers]
print("Labels:", labels)

# 8. Working with Files and Data
print("\\n8. Data Processing Examples")

# Simulated CSV data
csv_data = [
    'name,age,city',
    'Alice,25,New York',
    'Bob,30,San Francisco',
    'Charlie,35,Chicago',
    'Diana,28,Boston'
]

# Parse CSV (skip header)
parsed_data = [line.split(',') for line in csv_data[1:]]
print("Parsed CSV data:", parsed_data)

# Extract specific columns
names_from_csv = [row[0] for row in parsed_data]
ages_from_csv = [int(row[1]) for row in parsed_data]
print("Names:", names_from_csv)
print("Ages:", ages_from_csv)

# Filter by age
adults_over_30 = [row for row in parsed_data if int(row[1]) > 30]
print("Adults over 30:", adults_over_30)

# 9. Performance Tips
print("\\n9. Performance Comparison")

import time

# Large dataset for timing
large_range = range(100000)

# Time traditional approach
start_time = time.time()
traditional_result = []
for x in large_range:
    if x % 2 == 0:
        traditional_result.append(x**2)
traditional_time = time.time() - start_time

# Time list comprehension
start_time = time.time()
comprehension_result = [x**2 for x in large_range if x % 2 == 0]
comprehension_time = time.time() - start_time

print(f"Traditional approach: {traditional_time:.4f} seconds")
print(f"List comprehension: {comprehension_time:.4f} seconds")
print(f"Speedup: {traditional_time/comprehension_time:.2f}x faster")

# Verify results are the same
print("Results are identical:", traditional_result == comprehension_result)

# 10. Common Patterns and Best Practices
print("\\n10. Best Practices")

# Good: Simple and readable
good_example = [x.strip().title() for x in ['  alice  ', '  bob  ', '  charlie  ']]
print("Good example:", good_example)

# Avoid: Too complex (use regular loops instead)
# complex_example = [x**2 if x % 2 == 0 else x**3 if x % 3 == 0 else x for x in range(20) if x > 5]

# Better: Break down complex logic
def process_number(x):
    if x % 2 == 0:
        return x**2
    elif x % 3 == 0:
        return x**3
    else:
        return x

better_example = [process_number(x) for x in range(20) if x > 5]
print("Better approach for complex logic:", better_example)

print("\\n=== List Comprehensions Guide Complete! ===")
print("Key takeaways:")
print("- List comprehensions are faster and more Pythonic")
print("- Keep them simple and readable")
print("- Use regular loops for complex logic")
print("- They work with dictionaries and sets too")
print("- Great for data processing and transformations")`
            }
        };

        // Add event listeners for snippet buttons
        document.querySelectorAll('.load-snippet').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const snippetId = e.target.getAttribute('data-snippet');
                this.loadSnippet(snippetId);
            });
        });
    }

    loadSnippet(snippetId) {
        const snippet = this.snippets[snippetId];
        if (!snippet) return;

        const code = snippet[this.currentLanguage];
        if (code && this.editor) {
            this.editor.setValue(code);
            this.clearOutput();
            window.studyHub.showNotification(`Loaded snippet: ${snippetId}`, 'success');
        } else {
            window.studyHub.showNotification(`Snippet not available for ${this.currentLanguage}`, 'error');
        }
    }

    // Check for shared code in URL
    checkForSharedCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedCode = urlParams.get('shared');
        
        if (sharedCode) {
            try {
                const shareData = JSON.parse(atob(sharedCode));
                if (shareData.code && shareData.language) {
                    this.currentLanguage = shareData.language;
                    
                    // Update language selector
                    const languageSelect = document.getElementById('language-select');
                    if (languageSelect) {
                        languageSelect.value = shareData.language;
                    }
                    
                    // Switch language and load code
                    this.switchLanguage(shareData.language).then(() => {
                        this.editor.setValue(shareData.code);
                        window.studyHub.showNotification('Shared code loaded!', 'success');
                    });
                }
            } catch (error) {
                window.studyHub.showNotification('Invalid share URL', 'error');
            }
        }
    }
}

// Initialize PlaygroundManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.playgroundManager = new PlaygroundManager();
    
    // Check for shared code after initialization
    setTimeout(() => {
        if (window.playgroundManager) {
            window.playgroundManager.checkForSharedCode();
        }
    }, 1000);
});
