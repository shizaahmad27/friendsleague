const jwt = require('jsonwebtoken');

// Load environment variables
require('dotenv').config();

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWZsa2xnYWowMDAwb25uNWd3ODc1MnlzIiwidXNlcm5hbWUiOiJhbGVrc3Rlc3QxIiwiaWF0IjoxNzU3OTY3OTE5LCJleHAiOjE3NTc5Njg4MTl9.-AR9xZRlVULu40d9IUgQNBf_-SgfGV0DTu_qcnrznW0';

console.log('Current JWT_SECRET:', process.env.JWT_SECRET);
console.log('Current JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET);

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token verification SUCCESS:', decoded);
} catch (error) {
  console.log('Token verification FAILED:', error.message);
  
  // Try with refresh secret
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    console.log('Token verification with refresh secret SUCCESS:', decoded);
  } catch (refreshError) {
    console.log('Token verification with refresh secret FAILED:', refreshError.message);
  }
}
