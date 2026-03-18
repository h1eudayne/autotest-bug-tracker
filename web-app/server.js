const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Valid users - simple hardcoded list
const VALID_USERS = {
  'standard_user': 'secret_sauce',
  'admin': 'admin123',
  'locked_user': 'locked_pass'
};

// BUG INTENTIONAL: locked_user should be blocked but isn't checked
// BUG INTENTIONAL: No special character sanitization on username
// BUG INTENTIONAL: Weak validation - only checks empty, not length or format

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Basic validation - BUG: only checks falsy, not empty string properly
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required'
    });
  }

  // BUG INTENTIONAL: No sanitization of special characters
  // This will cause issues with XSS-like inputs
  // The username is directly used without escaping
  
  // BUG INTENTIONAL: locked_user should be blocked but we "forgot" to check
  const validPassword = VALID_USERS[username];
  
  if (validPassword && validPassword === password) {
    return res.json({
      success: true,
      message: `Welcome ${username}!`, // BUG: direct interpolation without sanitization
      user: {
        username: username, // BUG: returning raw unsanitized username
        role: 'user'
      }
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid username or password'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`);
});
