import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      sparse: true
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    mobileNumber: {
      type: String,
      required: false, // Optional for now to avoid breaking existing users, or true if mandatory
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'tenant'],
      default: 'tenant'
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    studentId: {
      type: String,
      unique: true,
      sparse: true
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    verificationCode: {
      type: String,
      default: null
    },
    verificationCodeExpires: {
      type: Date,
      default: null
    },
    isTemporary: {
      type: Boolean,
      default: false  // false = account is permanent/verified, true = awaiting verification
    },
    passwordResetCode: {
      type: String,
      default: null
    },
    passwordResetCodeExpires: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

// Generate unique user ID and hash password before saving
userSchema.pre('save', async function (next) {
  // Generate userId only on creation
  if (this.isNew && !this.userId) {
    const timestamp = Date.now().toString().slice(-8);
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.userId = `USR${timestamp}${randomNum}`;
  }
  
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;