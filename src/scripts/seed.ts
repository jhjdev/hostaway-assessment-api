import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import { hashPassword } from '../utils/auth';
import { User } from '../types';

// Load environment variables based on NODE_ENV
const env = process.env.NODE_ENV || 'development';
config({ path: `.env.${env}` });

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME!;

async function createSuperAdmin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(MONGODB_DB_NAME);
    const usersCollection = db.collection<User>('users');

    // Check if superadmin already exists
    const existingSuperAdmin = await usersCollection.findOne({ 
      email: 'jhj@jhjdev.com' 
    });

    if (existingSuperAdmin) {
      console.log('✅ Superadmin user already exists');
      return;
    }

    // Create superadmin user
    const hashedPassword = await hashPassword('password123');
    const superAdmin: Omit<User, '_id'> = {
      email: 'jhj@jhjdev.com',
      password: hashedPassword,
      isVerified: true, // Superadmin is pre-verified
      role: 'superadmin',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(superAdmin);
    console.log('✅ Superadmin user created successfully');
    console.log(`📧 Email: jhj@jhjdev.com`);
    console.log(`🔑 Password: password123`);
    console.log(`🆔 User ID: ${result.insertedId}`);

  } catch (error) {
    console.error('❌ Error creating superadmin:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the seed script
createSuperAdmin();
