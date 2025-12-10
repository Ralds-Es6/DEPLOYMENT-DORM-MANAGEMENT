import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const adminEmail = 'superadmin@dormmanagement.com';
    const adminName = 'Super Administrator';
    const adminPassword = process.argv[2] || '@admin123';

    // Validate password
    if (!adminPassword || adminPassword.length < 6) {
      console.error('❌ Password must be at least 6 characters long!');
      process.exit(1);
    }

    // Check if superadmin already exists
    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    
    if (existingAdmin) {
      if (existingAdmin.isAdmin) {
        console.log(`⚠️  Superadmin account with email ${adminEmail} already exists!`);
        console.log('🔄 Updating password...\n');
        
        // Update password (will be hashed by pre-save hook)
        existingAdmin.password = adminPassword;
        existingAdmin.name = adminName;
        existingAdmin.isAdmin = true;
        existingAdmin.isSuperAdmin = true;
        existingAdmin.role = 'admin';
        existingAdmin.status = 'approved';
        
        await existingAdmin.save();
        
        console.log('✅ Superadmin account updated successfully!');
        console.log('═══════════════════════════════════════════');
        console.log(`👤 Name: ${existingAdmin.name}`);
        console.log(`📧 Email: ${existingAdmin.email}`);
        console.log(`🔑 Password: ${adminPassword}`);
        console.log(`🔐 Role: ${existingAdmin.role}`);
        console.log(`✅ Status: ${existingAdmin.status}`);
        console.log('═══════════════════════════════════════════');
        console.log('\n⚠️  Please change this password after logging in for security.');
        console.log('\n🌐 Login URL:');
        console.log(`   http://localhost:5173/admin/login?key=${process.env.VITE_ADMIN_SECRET_KEY || 'admin_access_2025_secret'}\n`);
        
        await mongoose.connection.close();
        process.exit(0);
      } else {
        // Convert existing user to superadmin
        console.log(`⚠️  User ${adminEmail} exists but is not an admin. Converting to superadmin...`);
        existingAdmin.isAdmin = true;
        existingAdmin.isSuperAdmin = true;
        existingAdmin.role = 'admin';
        existingAdmin.status = 'approved';
        existingAdmin.name = adminName;
        existingAdmin.password = adminPassword;
        
        await existingAdmin.save();
        
        console.log('\n✅ User converted to superadmin successfully!');
        console.log('═══════════════════════════════════════════');
        console.log(`👤 Name: ${existingAdmin.name}`);
        console.log(`📧 Email: ${existingAdmin.email}`);
        console.log(`🔑 Password: ${adminPassword}`);
        console.log(`🔐 Role: ${existingAdmin.role}`);
        console.log(`✅ Status: ${existingAdmin.status}`);
        console.log('═══════════════════════════════════════════');
        console.log('\n⚠️  Please change this password after logging in for security.');
        console.log('\n🌐 Login URL:');
        console.log(`   http://localhost:5173/admin/login?key=${process.env.VITE_ADMIN_SECRET_KEY || 'admin_access_2025_secret'}\n`);
        
        await mongoose.connection.close();
        process.exit(0);
      }
    }

    // Create new superadmin user (password will be hashed by pre-save hook)
    const admin = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: adminPassword, // Will be automatically hashed by pre-save hook
      isAdmin: true,
      isSuperAdmin: true,
      role: 'admin',
      status: 'approved'
    });

    console.log('\n✅ Superadmin account created successfully!');
    console.log('═══════════════════════════════════════════');
    console.log(`👤 Name: ${admin.name}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`🔐 Role: ${admin.role}`);
    console.log(`✅ Status: ${admin.status}`);
    console.log('═══════════════════════════════════════════');
    console.log('\n⚠️  Please change this password after logging in for security.');
    console.log('\n🌐 Login URL:');
    console.log(`   http://localhost:5173/admin/login?key=${process.env.VITE_ADMIN_SECRET_KEY || 'admin_access_2025_secret'}\n`);

    // Close the connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating superadmin account:', error.message);
    if (error.code === 11000) {
      console.error('   Email already exists in the database!');
    }
    process.exit(1);
  }
};

// Run the script
createSuperAdmin();

