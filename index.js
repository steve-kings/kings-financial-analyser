 
        // Show/hide forms
        function showSignup() {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('signupForm').style.display = 'block';
        }

        function showLogin() {
            document.getElementById('signupForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
        }

        // Show notification
        function showNotification(message, type = 'success') {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
            alertDiv.style.position = 'fixed';
            alertDiv.style.top = '20px';
            alertDiv.style.right = '20px';
            alertDiv.style.zIndex = '9999';
            alertDiv.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            document.body.appendChild(alertDiv);
            
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }

        // Validate form inputs
        function validateInput(value, type) {
            switch(type) {
                case 'username':
                    return value.length >= 3 && /^[a-zA-Z0-9_]+$/.test(value);
                case 'email':
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                case 'password':
                    return value.length >= 6;
                case 'fullname':
                    return value.trim().length >= 2;
                default:
                    return value.trim().length > 0;
            }
        }

        // Handle login
        document.getElementById('loginFormElement').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            // Basic validation
            if (!validateInput(username, 'username')) {
                showNotification('Please enter a valid username (3+ characters, alphanumeric)', 'danger');
                return;
            }
            
            if (!validateInput(password, 'password')) {
                showNotification('Password must be at least 6 characters long', 'danger');
                return;
            }
            
            // Check if user exists (simple simulation)
            const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
            if (existingUsers[username] && existingUsers[username].password === password) {
                // Store current user data
                const userData = existingUsers[username];
                localStorage.setItem('currentUser', JSON.stringify(userData));
                
                showNotification('Login successful! Redirecting...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showNotification('Invalid username or password', 'danger');
            }
        });

        // Handle signup
        document.getElementById('signupFormElement').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('signupFullName').value.trim();
            const username = document.getElementById('signupUsername').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;
            
            // Validation
            if (!validateInput(fullName, 'fullname')) {
                showNotification('Please enter a valid full name', 'danger');
                return;
            }
            
            if (!validateInput(username, 'username')) {
                showNotification('Username must be 3+ characters (letters, numbers, underscore only)', 'danger');
                return;
            }
            
            if (!validateInput(email, 'email')) {
                showNotification('Please enter a valid email address', 'danger');
                return;
            }
            
            if (!validateInput(password, 'password')) {
                showNotification('Password must be at least 6 characters long', 'danger');
                return;
            }
            
            // Check if username already exists
            const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '{}');
            if (existingUsers[username]) {
                showNotification('Username already exists. Please choose another one.', 'danger');
                return;
            }
            
            // Register new user
            const userData = {
                username: username,
                fullName: fullName,
                email: email,
                password: password,
                registeredAt: new Date().toISOString()
            };
            
            existingUsers[username] = userData;
            localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
            
            // Store current user data
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            showNotification('Account created successfully! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        });

        // Show features on larger screens
        window.addEventListener('resize', function() {
            const featuresSection = document.getElementById('featuresSection');
            if (window.innerWidth > 768) {
                featuresSection.style.display = 'block';
            } else {
                featuresSection.style.display = 'none';
            }
        });

        // Initial check for features display
        if (window.innerWidth > 768) {
            document.getElementById('featuresSection').style.display = 'block';
        }

        // Auto-focus on first input
        document.getElementById('loginUsername').focus();
        
        if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("Service Worker registered"))
    .catch((err) => console.log("Service Worker registration failed", err));
}
