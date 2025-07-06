import { config } from 'dotenv';
import { hashPassword } from '../utils/auth';
import { User } from '../models/User';
import {
  connectToDatabase,
  disconnectFromDatabase,
} from '../services/database';

// Load environment variables based on NODE_ENV
const env = process.env.NODE_ENV || 'development';
config({ path: `.env.${env}` });

const MONGODB_URI = process.env.MONGODB_URI!;

async function createSuperAdmin() {
  try {
    await connectToDatabase(MONGODB_URI);

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({
      email: 'jhj@jhjdev.com',
    });

    if (existingSuperAdmin) {
      // eslint-disable-next-line no-console
      console.log('✅ Superadmin user already exists');
      return;
    }

    // Create superadmin user
    const hashedPassword = await hashPassword('password123');
    const superAdmin = new User({
      email: 'jhj@jhjdev.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      isVerified: true, // Superadmin is pre-verified
      preferences: {
        temperatureUnit: 'celsius',
        theme: 'system',
        notifications: true,
      },
    });

    const result = await superAdmin.save();
    // eslint-disable-next-line no-console
    console.log('✅ Superadmin user created successfully');
    // eslint-disable-next-line no-console
    console.log('📧 Email: jhj@jhjdev.com');
    // eslint-disable-next-line no-console
    console.log('🔑 Password: password123');
    // eslint-disable-next-line no-console
    console.log(`🆔 User ID: ${result._id}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error creating superadmin:', error);
    process.exit(1);
  } finally {
    await disconnectFromDatabase();
  }
}

// Run the seed script
createSuperAdmin();
