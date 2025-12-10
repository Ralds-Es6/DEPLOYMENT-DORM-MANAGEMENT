import mongoose from 'mongoose';

const roomAssignmentSchema = new mongoose.Schema(
  {
    referenceNumber: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    idImage: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
    },
    checkInTime: {
      type: Date,
      default: null
    },
    checkOutTime: {
      type: Date,
      default: null
    },
    checkedOutBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvalTime: {
      type: Date,
      default: null
    },
    totalPrice: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
  }
);

// Middleware to handle room status updates when assignment status changes
roomAssignmentSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    const Room = this.model('Room');
    const room = await Room.findById(this.room);
    
    if (!room) {
      console.error(`[RoomAssignment Middleware] Room not found with ID: ${this.room}`);
      return next(new Error('Room not found'));
    }

    // Get the previous status from Mongoose's changeTracking
    // When updating an existing document, getters return the original value
    let previousStatus = this.status;
    
    if (!this.isNew) {
      // For updates, use the original value from the database
      const originalDoc = this.constructor.hydrate(this._doc);
      const dbVersion = await this.constructor.findById(this._id, { status: 1 });
      previousStatus = dbVersion?.status || this.status;
      
      console.log(`[RoomAssignment Middleware] DB Previous Status: ${previousStatus}, New Status: ${this.status}`);
    } else {
      console.log(`[RoomAssignment Middleware] New assignment with status: ${this.status}`);
    }

    console.log(`[RoomAssignment Middleware] Assignment ${this._id}: ${previousStatus} → ${this.status}`);
    console.log(`[RoomAssignment Middleware] Room ${room._id} (${room.number}): Occupancy before = ${room.occupied}/${room.capacity}`);

    // Handle different status transitions
    switch (this.status) {
      case 'pending':
        // Room stays available even with pending assignment
        console.log(`[RoomAssignment Middleware] Pending: No occupancy change`);
        break;
        
      case 'approved':
        if (previousStatus === 'pending') {
          // Check capacity before allowing approval
          if (room.occupied >= room.capacity) {
            console.error(`[RoomAssignment Middleware] Room at capacity, cannot approve`);
            return next(new Error('Room is already at full capacity'));
          }
          // Increment occupancy when approved
          console.log(`[RoomAssignment Middleware] Approved: Incrementing occupancy for room ${room.number}`);
          room.occupied = room.occupied + 1;
          if (!room.currentOccupants.includes(this.requestedBy)) {
            room.currentOccupants.push(this.requestedBy);
          }
          // Update room status based on occupancy
          room.status = room.occupied >= room.capacity ? 'occupied' : 'available';
          console.log(`[RoomAssignment Middleware] Room ${room.number}: Occupancy after = ${room.occupied}/${room.capacity}, Status = ${room.status}`);
        } else {
          console.log(`[RoomAssignment Middleware] Approved: But previousStatus is ${previousStatus}, not 'pending'. Skipping occupancy change.`);
        }
        break;

      case 'active':
        // Record check-in time when transitioning to active
        if (!this.checkInTime) {
          this.checkInTime = new Date();
        }
        // Active status doesn't change occupancy (it's already incremented on approved)
        if (['approved', 'pending'].includes(previousStatus)) {
          // If transitioning from pending to active (skip approved), increment occupancy
          if (previousStatus === 'pending') {
            if (room.occupied >= room.capacity) {
              console.error(`[RoomAssignment Middleware] Room at capacity for active transition`);
              return next(new Error('Room is already at full capacity'));
            }
            console.log(`[RoomAssignment Middleware] Active: Incrementing occupancy (pending→active)`);
            room.occupied = room.occupied + 1;
            if (!room.currentOccupants.includes(this.requestedBy)) {
              room.currentOccupants.push(this.requestedBy);
            }
            room.status = room.occupied >= room.capacity ? 'occupied' : 'available';
            console.log(`[RoomAssignment Middleware] Room ${room.number}: Occupancy after active = ${room.occupied}/${room.capacity}, Status = ${room.status}`);
          } else {
            console.log(`[RoomAssignment Middleware] Active: previousStatus is ${previousStatus}, occupancy already adjusted`);
          }
        }
        break;

      case 'completed':
      case 'rejected':
        if (['active', 'approved', 'pending'].includes(previousStatus)) {
          // Decrease occupancy only if was approved or active (occupancy was incremented)
          if (['active', 'approved'].includes(previousStatus)) {
            console.log(`[RoomAssignment Middleware] ${this.status}: Decrementing occupancy for room ${room.number}`);
            room.occupied = Math.max(0, room.occupied - 1);
            room.currentOccupants = room.currentOccupants.filter(
              occupant => occupant.toString() !== this.requestedBy.toString()
            );
            console.log(`[RoomAssignment Middleware] Room ${room.number}: Occupancy after ${this.status} = ${room.occupied}/${room.capacity}`);
          }
          room.status = room.occupied >= room.capacity ? 'occupied' : 'available';
        }
        break;
    }

    try {
      await room.save();
      console.log(`[RoomAssignment Middleware] Room ${room.number} saved successfully. Final occupancy: ${room.occupied}/${room.capacity}, Status: ${room.status}`);
    } catch (error) {
      console.error(`[RoomAssignment Middleware] Error saving room: ${error.message}`);
      return next(error);
    }
  }
  next();
});

const RoomAssignment = mongoose.model('RoomAssignment', roomAssignmentSchema);
export default RoomAssignment;