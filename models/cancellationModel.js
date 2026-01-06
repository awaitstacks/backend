// models/cancellationModel.js
import mongoose from "mongoose";

const cancellationSchema = new mongoose.Schema(
  {
    // NEW BOOLEAN FIELDS
    approvedBy: {
      type: Boolean,
      default: false, // false until approved
    },
    raisedBy: {
      type: Boolean,
      default: false, // false until raised
    },

    // EXISTING FIELDS
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tourBooking",
      required: false,
    },
    travellerIds: [{ type: mongoose.Schema.Types.ObjectId, required: false }], // store cancelled traveller _id(s)
    travellerIndexes: [{ type: Number, required: false }], // optional: store indexes sent from frontend
    netAmountPaid: { type: Number, required: false },
    noOfDays: { type: Number, required: false },

    gvCancellationAmount: { type: Number, required: false },
    irctcCancellationAmount: { type: Number, required: false },
    preBalanceAmount: { type: Number, required: false },
    bookingBalanceManagementAmount: { type: Number, required: false },
    remarksAmount: { type: Number, required: false },
    totalCancellationAmount: { type: Number, required: false },
    updatedBalance: { type: Number, required: false },
    refundAmount: { type: Number, required: false },
    gvCancellationPool: { type: Number, required: false },
    irctcCancellationPool: { type: Number, required: false },
    remarkText: { type: String, required: false }, // optional: store remark text
  },
  { timestamps: true }
);

export default mongoose.model("cancellationModel", cancellationSchema);
