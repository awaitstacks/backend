import mongoose from "mongoose";

const tourSchema = new mongoose.Schema({
  title: { type: String, required: true },
  batch: { type: String, required: true },

  // ✅ Existing untouched fields
  duration: {
    days: { type: Number, required: true },
    nights: { type: Number, required: true },
  },

  price: {
    doubleSharing: { type: Number, required: true },
    tripleSharing: { type: Number, required: true },
    childWithBerth: { type: Number },
    childWithoutBerth: { type: Number },
  },

  advanceAmount: {
    adult: { type: Number, required: true },
    child: { type: Number, default: 0 },
  },

  balanceDouble: { type: Number },
  balanceTriple: { type: Number },
  balanceChildWithBerth: { type: Number },
  balanceChildWithoutBerth: { type: Number },

  destination: { type: [String], required: true },
  sightseeing: { type: [String], required: true },
  itinerary: { type: [String], required: true },
  includes: { type: [String], required: true },
  excludes: { type: [String], required: true },

  trainDetails: [
    {
      trainNo: { type: String },
      trainName: { type: String },
      fromCode: { type: String },
      fromStation: { type: String },
      toCode: { type: String },
      toStation: { type: String },
      class: { type: String },
      departureTime: { type: String },
      arrivalTime: { type: String },
      ticketOpenDate: { type: Date },
    },
  ],

  flightDetails: [
    {
      airline: { type: String },
      flightNo: { type: String },
      fromCode: { type: String },
      fromAirport: { type: String },
      toCode: { type: String },
      toAirport: { type: String },
      class: { type: String },
      departureTime: { type: String },
      arrivalTime: { type: String },
    },
  ],

  addons: [
    {
      name: { type: String },
      amount: { type: Number },
    },
  ],

  remarks: { type: String },

  boardingPoints: [
    {
      stationCode: { type: String },
      stationName: { type: String },
    },
  ],

  deboardingPoints: [
    {
      stationCode: { type: String },
      stationName: { type: String },
    },
  ],

  titleImage: { type: String, required: true },
  mapImage: { type: String, required: true },
  galleryImages: { type: [String], required: true },

  lastBookingDate: { type: Date, required: true },
  completedTripsCount: { type: Number, default: 0 },
  available: { type: Boolean, default: true },

  // 🚨 New section for second package
  // 🚨 change from object → array of objects
  variantPackage: [
    {
      duration: {
        days: { type: Number },
        nights: { type: Number },
      },
      price: {
        doubleSharing: { type: Number },
        tripleSharing: { type: Number },
        childWithBerth: { type: Number },
        childWithoutBerth: { type: Number },
      },
      advanceAmount: {
        adult: { type: Number },
        child: { type: Number },
      },
      balanceDouble: { type: Number },
      balanceTriple: { type: Number },
      balanceChildWithBerth: { type: Number },
      balanceChildWithoutBerth: { type: Number },
      destination: { type: [String] },
      sightseeing: { type: [String] },
      itinerary: { type: [String] },
      includes: { type: [String] },
      excludes: { type: [String] },
      trainDetails: [
        {
          trainNo: { type: String },
          trainName: { type: String },
          fromCode: { type: String },
          fromStation: { type: String },
          toCode: { type: String },
          toStation: { type: String },
          class: { type: String },
          departureTime: { type: String },
          arrivalTime: { type: String },
          ticketOpenDate: { type: Date },
        },
      ],
      flightDetails: [
        {
          airline: { type: String },
          flightNo: { type: String },
          fromCode: { type: String },
          fromAirport: { type: String },
          toCode: { type: String },
          toAirport: { type: String },
          class: { type: String },
          departureTime: { type: String },
          arrivalTime: { type: String },
        },
      ],
      addons: [
        {
          name: { type: String },
          amount: { type: Number },
        },
      ],
      remarks: { type: String },
      boardingPoints: [
        {
          stationCode: { type: String },
          stationName: { type: String },
        },
      ],
      deboardingPoints: [
        {
          stationCode: { type: String },
          stationName: { type: String },
        },
      ],
      lastBookingDate: { type: Date },
    },
  ],
});

const tourModel = mongoose.models.tour || mongoose.model("tour", tourSchema);
export default tourModel;
