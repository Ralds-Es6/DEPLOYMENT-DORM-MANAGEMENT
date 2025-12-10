import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      validate: {
        validator: function(v) {
          return /^[A-Z0-9-]+$/.test(v);
        },
        message: props => `${props.value} is not a valid room number! Use only uppercase letters, numbers, and hyphens.`
      }
    },
    floor: {
      type: String,
      required: [true, 'Floor number is required'],
      trim: true,
      validate: {
        validator: function(v) {
          return /^[0-9]+$/.test(v);
        },
        message: props => `${props.value} is not a valid floor number!`
      }
    },
    capacity: {
      type: Number,
      required: [true, 'Room capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [6, 'Capacity cannot exceed 6']
    },
    occupied: {
      type: Number,
      default: 0,
      min: [0, 'Occupied cannot be negative'],
      validate: {
        validator: function(v) {
          return v <= this.capacity;
        },
        message: props => 'Occupied cannot exceed capacity!'
      }
    },
    type: {
      type: String,
      required: [true, 'Room type is required'],
      enum: {
        values: ['Standard', 'Single', 'Double', 'Suite'],
        message: '{VALUE} is not a valid room type'
      }
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['available', 'occupied', 'maintenance'],
        message: '{VALUE} is not a valid status'
      },
      default: 'available'
    },
    images: {
      type: [String],
      default: []
    },
    monthlyRate: {
      type: Number,
      default: 5000
    },
    description: {
      type: String,
      default: ''
    },
    amenities: {
      type: [String],
      default: []
    },
    currentOccupants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true
  }
);

// Middleware to update status based on occupancy
roomSchema.pre('save', function(next) {
  // If room is fully occupied and status is being changed to 'available', prevent it
  if (this.occupied >= this.capacity && this.status === 'available') {
    return next(new Error('Cannot set a fully occupied room to available'));
  }
  
  // If room is fully occupied and status is not maintenance, set it to occupied
  if (this.occupied >= this.capacity && this.status !== 'maintenance') {
    this.status = 'occupied';
  } else if (this.occupied < this.capacity && this.status === 'occupied') {
    // Only auto-convert from occupied to available if no explicit status change was made
    this.status = 'available';
  }
  next();
});

const Room = mongoose.model('Room', roomSchema);
export default Room;
