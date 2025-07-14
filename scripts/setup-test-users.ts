import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

interface UserDocument extends mongoose.Document {
  email: string;
  password: string;
  isVerified: boolean;
  role: 'user' | 'admin';
  verificationCode?: string;
  preferences: {
    temperatureUnit: 'celsius' | 'fahrenheit';
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
  };
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    verificationCode: String,
    preferences: {
      temperatureUnit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius',
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      notifications: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const User = mongoose.model<UserDocument>('User', userSchema);

interface TestUser {
  email: string;
  password: string;
  isVerified: boolean;
  role: 'user' | 'admin';
  verificationCode?: string | null;
  preferences: {
    temperatureUnit: 'celsius' | 'fahrenheit';
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
  };
}

async function createTestUsers(): Promise<void> {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/hostaway-test';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Hash passwords
    const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
    const userPassword = await bcrypt.hash('UserPassword123!', 10);

    // Create admin user
    const adminUser: TestUser = {
      email: 'admin@hostaway.com',
      password: adminPassword,
      isVerified: true,
      role: 'admin',
      verificationCode: null,
      preferences: {
        temperatureUnit: 'celsius',
        theme: 'system',
        notifications: true,
      },
    };

    // Create regular user
    const regularUser: TestUser = {
      email: 'user@hostaway.com',
      password: userPassword,
      isVerified: true,
      role: 'user',
      verificationCode: null,
      preferences: {
        temperatureUnit: 'celsius',
        theme: 'system',
        notifications: true,
      },
    };

    // Delete existing users if they exist
    await User.deleteMany({
      email: { $in: ['admin@hostaway.com', 'user@hostaway.com'] },
    });
    console.log('🗑️  Deleted existing test users');

    // Insert test users
    await User.insertMany([adminUser, regularUser]);
    console.log('✅ Created admin user: admin@hostaway.com');
    console.log('✅ Created regular user: user@hostaway.com');

    // Verify users were created
    const adminCheck = await User.findOne({ email: 'admin@hostaway.com' });
    const userCheck = await User.findOne({ email: 'user@hostaway.com' });

    console.log('\n📋 User Summary:');
    console.log(
      `Admin: ${adminCheck?.email} (${adminCheck?.role}) - Verified: ${adminCheck?.isVerified}`
    );
    console.log(
      `User: ${userCheck?.email} (${userCheck?.role}) - Verified: ${userCheck?.isVerified}`
    );

    console.log('\n🔑 Login with these credentials:');
    console.log('Admin: admin@hostaway.com / AdminPassword123!');
    console.log('User: user@hostaway.com / UserPassword123!');

    console.log('\n📝 Credentials saved to: test-credentials.txt');
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Run the script
createTestUsers().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
