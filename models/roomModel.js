import mongoose from "mongoose";

/* ---------------- Occupant ---------------- */
const occupantSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    mobile: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Invalid mobile number"],
    },
  },
  { _id: false }
);

/* ---------------- Room ---------------- */
const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: Number, required: true },
    sharingType: {
      type: String,
      enum: ["single", "double", "triple", "quad"], // ← Added "quad"
      required: true,
    },
    occupants: {
      type: [occupantSchema],
      required: true,
      validate: {
        validator: function (value) {
          if (this.sharingType === "single") return value.length <= 1;
          if (this.sharingType === "double") return value.length <= 2;
          if (this.sharingType === "triple") return value.length <= 3;
          if (this.sharingType === "quad") return value.length <= 4; // ← New validation
          return true;
        },
        message: "Occupants exceed sharing type capacity",
      },
    },
  },
  { _id: false }
);

/* ---------------- Grouped by Mobile ---------------- */
const mobileGroupSchema = new mongoose.Schema(
  {
    contactMobile: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, "Invalid mobile number"],
    },
    bookingIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "tourBooking",
      },
    ],
    rooms: [roomSchema],
  },
  { _id: false }
);

/* ---------------- Old Booking-Based Structure ---------------- */
const bookingRoomSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tourBooking",
      required: true,
    },
    contactMobile: {
      type: String,
      match: [/^[0-9]{10}$/, "Invalid mobile number"],
    },
    rooms: [roomSchema],
  },
  { _id: false }
);

/* ---------------- Tour Room Allocation ---------------- */
const tourRoomAllocationSchema = new mongoose.Schema(
  {
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tour",
      required: true,
      unique: true,
    },

    groupedByMobile: [mobileGroupSchema],
    bookings: [bookingRoomSchema],
    grouped: { type: Boolean, default: true },
    isFinalized: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const tourRoomAllocationModel =
  mongoose.models.tourRoomAllocation ||
  mongoose.model("tourRoomAllocation", tourRoomAllocationSchema);

export default tourRoomAllocationModel;
