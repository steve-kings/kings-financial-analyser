
        let currentUser = null;
        let transactions = [];
        let budgets = [];
        let savingsGoals = [];
        let incomeExpenseChart, expenseCategoryChart, spendingTrendChart;

        // Initialize app
        window.addEventListener('DOMContentLoaded', function() {
            // Check authentication
            const userData = localStorage.getItem('currentUser');
            if (!userData) {
                window.location.href = 'index.html';
                return;
            }
            
            currentUser = JSON.parse(userData);
            document.getElementById('userDisplayName').textContent = currentUser.fullName || currentUser.username;
            document.getElementById('welcomeUserName').textContent = (currentUser.fullName || currentUser.username).split(' ')[0];

            // Load user data
            loadUserData();
            
            // Initialize dark mode
            initDarkMode();
            
            // Initialize charts
            initCharts();
            
            // Set default date to today
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('transactionDate').value = today;
            
            // Initialize event listeners
            initEventListeners();
            
            // Update displays
            updateFinancialSummary();
            updateTransactionsList();
            updateBudgetOverview();
            updateSavingsGoalsList();
        });
        
        // Initialize event listeners
        function initEventListeners() {
            // Transaction form
            document.getElementById('transactionForm').addEventListener('submit', function(e) {
                e.preventDefault();
                addTransaction(this);
            });

            // Quick transaction form
            document.getElementById('quickTransactionForm').addEventListener('submit', function(e) {
                e.preventDefault();
                addTransaction(this, true);
            });

            // Budget form
            document.getElementById('budgetForm').addEventListener('submit', function(e) {
                e.preventDefault();
                addBudget();
            });

            // Savings goal form
            document.getElementById('goalForm').addEventListener('submit', function(e) {
                e.preventDefault();
                addSavingsGoal();
            });

            // Transaction type change handlers
            document.getElementById('transactionType').addEventListener('change', function() {
                updateCategoryOptions('transactionCategory', this.value);
            });

            document.getElementById('quickTransactionType').addEventListener('change', function() {
                updateCategoryOptions('quickTransactionCategory', this.value);
            });

            // Initialize category options
            updateCategoryOptions('transactionCategory', 'expense');
            updateCategoryOptions('quickTransactionCategory', 'expense');
        }

        // Update category options based on transaction type
        function updateCategoryOptions(selectId, type) {
            const select = document.getElementById(selectId);
            const options = select.querySelectorAll('option');
            
            options.forEach(option => {
                if (option.value === '') return; // Skip default option
                
                if (option.classList.contains('income-category')) {
                    option.style.display = type === 'income' ? '' : 'none';
                } else {
                    option.style.display = type === 'expense' ? '' : 'none';
                }
            });
            
            select.value = '';
        }

        // Load user data from localStorage
        function loadUserData() {
            const userId = currentUser.username;
            transactions = JSON.parse(localStorage.getItem(`transactions_${userId}`)) || [];
            budgets = JSON.parse(localStorage.getItem(`budgets_${userId}`)) || [];
            savingsGoals = JSON.parse(localStorage.getItem(`savingsGoals_${userId}`)) || [];
        }

        // Save user data to localStorage
        function saveUserData() {
            const userId = currentUser.username;
            localStorage.setItem(`transactions_${userId}`, JSON.stringify(transactions));
            localStorage.setItem(`budgets_${userId}`, JSON.stringify(budgets));
            localStorage.setItem(`savingsGoals_${userId}`, JSON.stringify(savingsGoals));
        }

        // Add transaction
        function addTransaction(form, isModal = false) {
            const prefix = isModal ? 'quick' : '';
            const type = document.getElementById(`${prefix}TransactionType`).value;
            const amount = parseFloat(document.getElementById(`${prefix}TransactionAmount`).value);
            const category = document.getElementById(`${prefix}TransactionCategory`).value;
            const description = document.getElementById(`${prefix}TransactionDescription`).value || (type === 'income' ? 'Income' : 'Expense');
            const date = document.getElementById('transactionDate')?.value || new Date().toISOString().split('T')[0];

            const transaction = {
                id: Date.now(),
                type: type,
                category: category,
                amount: amount,
                date: date,
                description: description,
                timestamp: new Date().toISOString()
            };

            transactions.push(transaction);
            saveUserData();
            
            form.reset();
            if (!isModal) {
                document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
                updateCategoryOptions('transactionCategory', 'expense');
            } else {
                updateCategoryOptions('quickTransactionCategory', 'expense');
                bootstrap.Modal.getInstance(document.getElementById('addTransactionModal')).hide();
            }
            
            updateFinancialSummary();
            updateTransactionsList();
            updateCharts();
            
            // Show success message
            showNotification('Transaction added successfully!', 'success');
        }

        // Add budget
        function addBudget() {
            const category = document.getElementById('budgetCategory').value;
            const amount = parseFloat(document.getElementById('budgetAmount').value);

            const existingBudgetIndex = budgets.findIndex(b => b.category === category);
            if (existingBudgetIndex >= 0) {
                budgets[existingBudgetIndex].amount = amount;
            } else {
                budgets.push({ 
                    id: Date.now(),
                    category: category, 
                    amount: amount,
                    timestamp: new Date().toISOString()
                });
            }

            saveUserData();
            document.getElementById('budgetForm').reset();
            updateBudgetOverview();
            showNotification('Budget updated successfully!', 'success');
        }

        // Add savings goal
        function addSavingsGoal() {
            const name = document.getElementById('goalName').value;
            const targetAmount = parseFloat(document.getElementById('goalAmount').value);
            const targetDate = document.getElementById('goalDate').value;
            const initialAmount = parseFloat(document.getElementById('initialSaving').value) || 0;

            const goal = {
                id: Date.now(),
                name: name,
                targetAmount: targetAmount,
                currentAmount: initialAmount,
                targetDate: targetDate,
                timestamp: new Date().toISOString()
            };

            savingsGoals.push(goal);
            saveUserData();
            document.getElementById('goalForm').reset();
            updateSavingsGoalsList();
            showNotification('Savings goal created successfully!', 'success');
        }

        // Update financial summary
        function updateFinancialSummary() {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const monthlyTransactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
            });

            const totalIncome = monthlyTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const totalExpenses = monthlyTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const netSavings = totalIncome - totalExpenses;

            document.getElementById('totalIncomeValue').textContent = `KSh ${totalIncome.toLocaleString()}`;
            document.getElementById('totalExpenseValue').textContent = `KSh ${totalExpenses.toLocaleString()}`;
            document.getElementById('savingsValue').textContent = `KSh ${netSavings.toLocaleString()}`;
        }

        // Update transactions list
        function updateTransactionsList() {
            const container = document.getElementById('transactionsList');
            
            if (transactions.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-receipt"></i>
                        <h4>No transactions yet</h4>
                        <p>Start by adding your first transaction to track your finances.</p>
                        <button class="btn btn-primary" onclick="showAddTransactionModal()">
                            <i class="fas fa-plus me-2"></i> Add First Transaction
                        </button>
                    </div>
                `;
                return;
            }

            const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
            const recentTransactions = sortedTransactions.slice(0, 10);

            container.innerHTML = recentTransactions.map(transaction => `
                <div class="transaction-item d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">${transaction.description}</div>
                        <div class="text-muted small">${new Date(transaction.date).toLocaleDateString()}</div>
                    </div>
                    <div class="text-end">
                        <div class="transaction-amount ${transaction.type === 'income' ? 'amount-income' : 'amount-expense'}">
                            ${transaction.type === 'income' ? '+' : '-'}KSh ${transaction.amount.toLocaleString()}
                        </div>
                        <span class="transaction-category category-${transaction.category}">${getCategoryDisplayName(transaction.category)}</span>
                    </div>
                </div>
            `).join('');
        }

        // Update budget overview
        function updateBudgetOverview() {
            const container = document.getElementById('budgetOverview');
            
            if (budgets.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-chart-pie"></i>
                        <h4>No budgets set</h4>
                        <p>Create your first budget to track spending by category.</p>
                    </div>
                `;
                return;
            }

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            container.innerHTML = budgets.map(budget => {
                const spent = transactions
                    .filter(t => {
                        const transactionDate = new Date(t.date);
                        return t.type === 'expense' && 
                               t.category === budget.category &&
                               transactionDate.getMonth() === currentMonth &&
                               transactionDate.getFullYear() === currentYear;
                    })
                    .reduce((sum, t) => sum + t.amount, 0);

                const percentage = Math.min((spent / budget.amount) * 100, 100);
                const progressClass = percentage > 90 ? 'bg-danger' : percentage > 70 ? 'bg-warning' : 'bg-success';

                return `
                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <div>
                                <span class="fw-bold">${getCategoryDisplayName(budget.category)}</span>
                                <span class="ms-2 text-muted">KSh ${spent.toLocaleString()} / KSh ${budget.amount.toLocaleString()}</span>
                            </div>
                            <span>${Math.round(percentage)}%</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar ${progressClass}" role="progressbar" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Update savings goals list
        function updateSavingsGoalsList() {
            const container = document.getElementById('savingsGoalsList');
            
            if (savingsGoals.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-bullseye"></i>
                        <h4>No savings goals yet</h4>
                        <p>Set your first savings goal to start building your future.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = savingsGoals.map(goal => {
                const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                const progressClass = percentage >= 100 ? 'bg-success' : percentage >= 75 ? 'bg-info' : percentage >= 50 ? 'bg-warning' : 'bg-primary';

                return `
                    <div class="savings-goal d-flex align-items-center">
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between mb-1">
                                <h5 class="mb-0">${goal.name}</h5>
                                <span class="fw-bold">KSh ${goal.currentAmount.toLocaleString()} / KSh ${goal.targetAmount.toLocaleString()}</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar ${progressClass}" role="progressbar" style="width: ${percentage}%"></div>
                            </div>
                            <div class="d-flex justify-content-between mt-2">
                                <small class="text-muted">Target date: ${new Date(goal.targetDate).toLocaleDateString()}</small>
                                <small class="fw-bold">${Math.round(percentage)}%</small>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Generate AI advice based on user's financial data
        async function generateAIAdvice() {
            const adviceText = document.getElementById('aiAdviceText');
            
            // Show loading state
            adviceText.innerHTML = `
                <div class="ai-advice-loading">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Analyzing your financial data...</p>
                </div>
            `;

            try {
                // Analyze user's financial situation
                const analysis = analyzeFinancialSituation();
                
                // Send message to AI for personalized advice
                const prompt = `@Claude-Sonnet-4 As a financial advisor, provide personalized advice based on this financial analysis. Provide ONLY raw JSON in your response with no explanations, additional text, or code block formatting (no \`\`\`).

Financial Analysis:
- Monthly Income: KSh ${analysis.monthlyIncome}
- Monthly Expenses: KSh ${analysis.monthlyExpenses}
- Net Savings: KSh ${analysis.netSavings}
- Savings Rate: ${analysis.savingsRate}%
- Number of Transactions: ${analysis.transactionCount}
- Top Expense Categories: ${analysis.topExpenseCategories.join(', ')}
- Budget Compliance: ${analysis.budgetCompliance}%
- Savings Goals: ${analysis.savingsGoals}

Respond with JSON format:
{
  "advice": "main financial advice",
  "priority": "high/medium/low",
  "actionItems": ["action1", "action2", "action3"],
  "insights": ["insight1", "insight2"],
  "recommendation": "specific recommendation"
}`;

                // Register handler for AI response
                window.Poe.registerHandler("financial-advice-handler", (result) => {
                    const response = result.responses[0];
                    
                    if (response.status === "error") {
                        adviceText.innerHTML = `
                            <p>Unable to generate AI advice at the moment. Here's some general financial guidance:</p>
                            <ul>
                                <li>Track your expenses regularly to identify spending patterns</li>
                                <li>Aim to save at least 20% of your income</li>
                                <li>Create an emergency fund covering 3-6 months of expenses</li>
                                <li>Review and adjust your budget monthly</li>
                            </ul>
                        `;
                    } else if (response.status === "complete") {
                        try {
                            const advice = JSON.parse(response.content);
                            displayAIAdvice(advice);
                        } catch (error) {
                            // Fallback to plain text if JSON parsing fails
                            adviceText.innerHTML = `<p>${response.content}</p>`;
                        }
                    } else if (response.status === "incomplete") {
                        // Still generating, keep loading state
                        return;
                    }
                });

                // Send the message to AI
                await window.Poe.sendUserMessage(prompt, {
                    handler: "financial-advice-handler",
                    stream: false,
                    openChat: false
                });

            } catch (error) {
                console.error('Error generating AI advice:', error);
                adviceText.innerHTML = `
                    <p>Unable to connect to AI advisor. Here's some general financial guidance based on your data:</p>
                    <ul>
                        <li>Track your expenses regularly to identify spending patterns</li>
                        <li>Aim to save at least 20% of your income</li>
                        <li>Create an emergency fund covering 3-6 months of expenses</li>
                        <li>Review and adjust your budget monthly</li>
                    </ul>
                `;
            }
        }

        // Analyze user's financial situation
        function analyzeFinancialSituation() {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const monthlyTransactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
            });

            const monthlyIncome = monthlyTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const monthlyExpenses = monthlyTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const netSavings = monthlyIncome - monthlyExpenses;
            const savingsRate = monthlyIncome > 0 ? Math.round((netSavings / monthlyIncome) * 100) : 0;

            // Get top expense categories
            const expensesByCategory = {};
            monthlyTransactions
                .filter(t => t.type === 'expense')
                .forEach(t => {
                    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
                });

            const topExpenseCategories = Object.entries(expensesByCategory)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([category]) => getCategoryDisplayName(category));

            // Calculate budget compliance
            let budgetCompliance = 100;
            if (budgets.length > 0) {
                const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
                const totalSpent = budgets.reduce((sum, b) => {
                    const spent = monthlyTransactions
                        .filter(t => t.type === 'expense' && t.category === b.category)
                        .reduce((s, t) => s + t.amount, 0);
                    return sum + Math.min(spent, b.amount);
                }, 0);
                budgetCompliance = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 100;
            }

            return {
                monthlyIncome,
                monthlyExpenses,
                netSavings,
                savingsRate,
                transactionCount: transactions.length,
                topExpenseCategories,
                budgetCompliance,
                savingsGoals: savingsGoals.length
            };
        }

        // Display AI advice in a formatted way
        function displayAIAdvice(advice) {
            const adviceText = document.getElementById('aiAdviceText');
            
            const priorityColor = advice.priority === 'high' ? 'danger' : advice.priority === 'medium' ? 'warning' : 'success';
            const priorityIcon = advice.priority === 'high' ? 'exclamation-triangle' : advice.priority === 'medium' ? 'info-circle' : 'check-circle';

            adviceText.innerHTML = `
                <div class="mb-3">
                    <span class="badge bg-${priorityColor} mb-2">
                        <i class="fas fa-${priorityIcon} me-1"></i> ${advice.priority.toUpperCase()} PRIORITY
                    </span>
                    <p class="mb-3">${advice.advice}</p>
                </div>
                
                ${advice.recommendation ? `
                    <div class="mb-3">
                        <h6><i class="fas fa-lightbulb me-2"></i>Key Recommendation</h6>
                        <p class="mb-0">${advice.recommendation}</p>
                    </div>
                ` : ''}
                
                ${advice.actionItems && advice.actionItems.length > 0 ? `
                    <div class="mb-3">
                        <h6><i class="fas fa-tasks me-2"></i>Action Items</h6>
                        <ul class="mb-0">
                            ${advice.actionItems.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${advice.insights && advice.insights.length > 0 ? `
                    <div>
                        <h6><i class="fas fa-chart-line me-2"></i>Financial Insights</h6>
                        <ul class="mb-0">
                            ${advice.insights.map(insight => `<li>${insight}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            `;
        }

        // Get category display name
        function getCategoryDisplayName(category) {
            const categoryMap = {
                'salary': 'Salary',
                'freelance': 'Freelance',
                'investment': 'Investment',
                'other-income': 'Other Income',
                'food': 'Food & Dining',
                'housing': 'Housing',
                'transport': 'Transportation',
                'entertainment': 'Entertainment',
                'shopping': 'Shopping',
                'utilities': 'Utilities',
                'health': 'Health',
                'education': 'Education',
                'other': 'Other'
            };
            return categoryMap[category] || category;
        }

        // Filter transactions
        function filterTransactions(type) {
            // Update active button
            document.querySelectorAll('#transactionsList').forEach(container => {
                const buttons = container.previousElementSibling.querySelectorAll('.btn');
                buttons.forEach(btn => btn.classList.remove('active'));
                event.target.classList.add('active');
            });

            // For now, just update the list (could implement actual filtering)
            updateTransactionsList();
        }

        // Show/hide tabs
        function showBudgetTab() {
            const budgetTab = document.getElementById('budget-tab');
            budgetTab.click();
        }

        function showSavingsTab() {
            const savingsTab = document.getElementById('savings-tab');
            savingsTab.click();
        }

        // Show add transaction modal
        function showAddTransactionModal() {
            const modal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
            modal.show();
        }

        // Clear all data
        function clearAllData() {
            if (confirm('Are you sure you want to clear all your financial data? This action cannot be undone.')) {
                const userId = currentUser.username;
                localStorage.removeItem(`transactions_${userId}`);
                localStorage.removeItem(`budgets_${userId}`);
                localStorage.removeItem(`savingsGoals_${userId}`);
                
                transactions = [];
                budgets = [];
                savingsGoals = [];
                
                updateFinancialSummary();
                updateTransactionsList();
                updateBudgetOverview();
                updateSavingsGoalsList();
                updateCharts();
                
                showNotification('All data cleared successfully!', 'info');
            }
        }

        // Logout
        function logout() {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }

        // Show notification
        function showNotification(message, type = 'success') {
            // Create a simple toast notification
            const toast = document.createElement('div');
            toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
            toast.style.zIndex = '9999';
            toast.innerHTML = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }

        // Initialize charts
        function initCharts() {
            // Income vs Expense Chart
            const incomeExpenseCtx = document.getElementById('incomeExpenseChart').getContext('2d');
            incomeExpenseChart = new Chart(incomeExpenseCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [
                        {
                            label: 'Income',
                            data: new Array(12).fill(0),
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            borderColor: 'rgba(76, 175, 80, 1)',
                            borderWidth: 2,
                            fill: true
                        },
                        {
                            label: 'Expenses',
                            data: new Array(12).fill(0),
                            backgroundColor: 'rgba(244, 67, 54, 0.1)',
                            borderColor: 'rgba(244, 67, 54, 1)',
                            borderWidth: 2,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'KSh ' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });

            // Expense Category Chart (initially empty)
            const expenseCategoryCtx = document.getElementById('expenseCategoryChart').getContext('2d');
            expenseCategoryChart = new Chart(expenseCategoryCtx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: ['#FF9800', '#2196F3', '#4CAF50', '#9C27B0', '#F44336', '#607D8B', '#00BCD4', '#795548'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        }
                    }
                }
            });

            // Spending Trend Chart (initially empty)
            const spendingTrendCtx = document.getElementById('spendingTrendChart').getContext('2d');
            spendingTrendChart = new Chart(spendingTrendCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Monthly Spending',
                        data: [],
                        backgroundColor: 'rgba(93, 92, 222, 0.6)',
                        borderColor: 'rgba(93, 92, 222, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'KSh ' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });
        }

        // Update charts with current data
        function updateCharts() {
            updateIncomeExpenseChart();
            updateExpenseCategoryChart();
            updateSpendingTrendChart();
        }

        function updateIncomeExpenseChart() {
            const monthlyData = new Array(12).fill(0).map(() => ({ income: 0, expenses: 0 }));
            const currentYear = new Date().getFullYear();

            transactions.forEach(transaction => {
                const date = new Date(transaction.date);
                if (date.getFullYear() === currentYear) {
                    const month = date.getMonth();
                    if (transaction.type === 'income') {
                        monthlyData[month].income += transaction.amount;
                    } else {
                        monthlyData[month].expenses += transaction.amount;
                    }
                }
            });

            incomeExpenseChart.data.datasets[0].data = monthlyData.map(d => d.income);
            incomeExpenseChart.data.datasets[1].data = monthlyData.map(d => d.expenses);
            incomeExpenseChart.update();
        }

        function updateExpenseCategoryChart() {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const categoryData = {};
            transactions
                .filter(t => {
                    const date = new Date(t.date);
                    return t.type === 'expense' && 
                           date.getMonth() === currentMonth && 
                           date.getFullYear() === currentYear;
                })
                .forEach(transaction => {
                    const category = getCategoryDisplayName(transaction.category);
                    categoryData[category] = (categoryData[category] || 0) + transaction.amount;
                });

            expenseCategoryChart.data.labels = Object.keys(categoryData);
            expenseCategoryChart.data.datasets[0].data = Object.values(categoryData);
            expenseCategoryChart.update();
        }

        function updateSpendingTrendChart() {
            const last6Months = [];
            const today = new Date();
            
            for (let i = 5; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                last6Months.push({
                    label: date.toLocaleDateString('en-US', { month: 'short' }),
                    month: date.getMonth(),
                    year: date.getFullYear(),
                    spending: 0
                });
            }

            transactions
                .filter(t => t.type === 'expense')
                .forEach(transaction => {
                    const date = new Date(transaction.date);
                    const monthData = last6Months.find(m => 
                        m.month === date.getMonth() && m.year === date.getFullYear()
                    );
                    if (monthData) {
                        monthData.spending += transaction.amount;
                    }
                });

            spendingTrendChart.data.labels = last6Months.map(m => m.label);
            spendingTrendChart.data.datasets[0].data = last6Months.map(m => m.spending);
            spendingTrendChart.update();
        }

        function updateChartsTheme() {
            if (incomeExpenseChart) {
                updateCharts();
            }
        }