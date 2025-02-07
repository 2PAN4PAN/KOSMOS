const mongoose = require('mongoose');
const User = require('../auth/models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB connection function
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Create initial admin function
async function createInitialAdmin() {
  try {
    // Check if an admin already exists
    const existingAdmin = await User.findOne({ isAdmin: true });
    if (existingAdmin) {
      console.log('An admin user already exists.');
      return;
    }

    // Create initial admin user
    const initialAdmin = new User({
      studentId: 'admin',
      name: 'admin',
      password: '@admin!!admin@', // IMPORTANT: Change this immediately after first login
      isAdmin: true
    });

    await initialAdmin.save();
    console.log('Initial admin user created successfully');
  } catch (error) {
    console.error('Error creating initial admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Main execution
async function main() {
  await connectToDatabase();
  await createInitialAdmin();
}

main();