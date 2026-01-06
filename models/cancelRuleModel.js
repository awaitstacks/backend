import mongoose from "mongoose";

const gvTierSchema = new mongoose.Schema({
  fromDays: { type: Number, required: false },
  toDays: { type: Number, required: false },
  percentage: { type: Number, required: false }, // refund or deduction %
});

const gvSectionSchema = new mongoose.Schema({
  tiers: [gvTierSchema], // multiple tiers
});

const gvSchema = new mongoose.Schema({
  advancePaid: gvSectionSchema,
  fullyPaid: gvSectionSchema,
});

const irctcSchema = new mongoose.Schema({
  classType: { type: String, required: false }, // e.g. "SL", "3A", "2S"
  noOfDays: { type: Number, required: false },
  fixedAmount: { type: Number, required: false },
  percentage: { type: Number, required: false },
});

const cancelrulemodelSchema = new mongoose.Schema(
  {
    gv: gvSchema, // GV section
    irctc: [irctcSchema], // multiple class-based entries
  },
  { timestamps: true }
);

export default mongoose.model("cancelrulemodel", cancelrulemodelSchema);
