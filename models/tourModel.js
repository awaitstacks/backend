// import mongoose from "mongoose";

// const tourSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   batch: { type: String, required: true },

//   // ✅ Existing untouched fields
//   duration: {
//     days: { type: Number, required: true },
//     nights: { type: Number, required: true },
//   },

//   price: {
//     doubleSharing: { type: Number, required: true },
//     tripleSharing: { type: Number, required: true },
//     childWithBerth: { type: Number },
//     childWithoutBerth: { type: Number },
//   },

//   advanceAmount: {
//     adult: { type: Number, required: true },
//     child: { type: Number, default: 0 },
//   },

//   balanceDouble: { type: Number },
//   balanceTriple: { type: Number },
//   balanceChildWithBerth: { type: Number },
//   balanceChildWithoutBerth: { type: Number },

//   destination: { type: [String], required: true },
//   sightseeing: { type: [String], required: true },
//   itinerary: { type: [String], required: true },
//   includes: { type: [String], required: true },
//   excludes: { type: [String], required: true },

//   trainDetails: [
//     {
//       trainNo: { type: String },
//       trainName: { type: String },
//       fromCode: { type: String },
//       fromStation: { type: String },
//       toCode: { type: String },
//       toStation: { type: String },
//       class: { type: String },
//       departureTime: { type: String },
//       arrivalTime: { type: String },
//       ticketOpenDate: { type: Date },
//     },
//   ],

//   flightDetails: [
//     {
//       airline: { type: String },
//       flightNo: { type: String },
//       fromCode: { type: String },
//       fromAirport: { type: String },
//       toCode: { type: String },
//       toAirport: { type: String },
//       class: { type: String },
//       departureTime: { type: String },
//       arrivalTime: { type: String },
//     },
//   ],

//   addons: [
//     {
//       name: { type: String },
//       amount: { type: Number },
//     },
//   ],

//   remarks: { type: String },

//   boardingPoints: [
//     {
//       stationCode: { type: String },
//       stationName: { type: String },
//     },
//   ],

//   deboardingPoints: [
//     {
//       stationCode: { type: String },
//       stationName: { type: String },
//     },
//   ],

//   titleImage: { type: String, required: true },
//   mapImage: { type: String, required: true },
//   galleryImages: { type: [String], required: true },

//   lastBookingDate: { type: Date, required: true },
//   completedTripsCount: { type: Number, default: 0 },
//   available: { type: Boolean, default: true },

//   // 🚨 New section for second package
//   // 🚨 change from object → array of objects
//   variantPackage: [
//     {
//       duration: {
//         days: { type: Number },
//         nights: { type: Number },
//       },
//       price: {
//         doubleSharing: { type: Number },
//         tripleSharing: { type: Number },
//         childWithBerth: { type: Number },
//         childWithoutBerth: { type: Number },
//       },
//       advanceAmount: {
//         adult: { type: Number },
//         child: { type: Number },
//       },
//       balanceDouble: { type: Number },
//       balanceTriple: { type: Number },
//       balanceChildWithBerth: { type: Number },
//       balanceChildWithoutBerth: { type: Number },
//       destination: { type: [String] },
//       sightseeing: { type: [String] },
//       itinerary: { type: [String] },
//       includes: { type: [String] },
//       excludes: { type: [String] },
//       trainDetails: [
//         {
//           trainNo: { type: String },
//           trainName: { type: String },
//           fromCode: { type: String },
//           fromStation: { type: String },
//           toCode: { type: String },
//           toStation: { type: String },
//           class: { type: String },
//           departureTime: { type: String },
//           arrivalTime: { type: String },
//           ticketOpenDate: { type: Date },
//         },
//       ],
//       flightDetails: [
//         {
//           airline: { type: String },
//           flightNo: { type: String },
//           fromCode: { type: String },
//           fromAirport: { type: String },
//           toCode: { type: String },
//           toAirport: { type: String },
//           class: { type: String },
//           departureTime: { type: String },
//           arrivalTime: { type: String },
//         },
//       ],
//       addons: [
//         {
//           name: { type: String },
//           amount: { type: Number },
//         },
//       ],
//       remarks: { type: String },
//       boardingPoints: [
//         {
//           stationCode: { type: String },
//           stationName: { type: String },
//         },
//       ],
//       deboardingPoints: [
//         {
//           stationCode: { type: String },
//           stationName: { type: String },
//         },
//       ],
//       lastBookingDate: { type: Date },
//     },
//   ],
// });

// const tourModel = mongoose.models.tour || mongoose.model("tour", tourSchema);
// export default tourModel;


// import mongoose from "mongoose";

// const tourSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   batch: { type: String, required: true },

//   // ✅ Existing untouched fields
//   duration: {
//     days: { type: Number, required: true },
//     nights: { type: Number, required: true },
//   },

//   price: {
//     doubleSharing: { type: Number, required: true },
//     tripleSharing: { type: Number, required: true },
//     childWithBerth: { type: Number },
//     childWithoutBerth: { type: Number },
//   },

//   // 🚨 New field — GST percentage applied to this tour, defaults to 0
//   gst: {
//     type: Number,
//     default: 0,
//     min: [0, "GST cannot be negative"],
//   },

//   advanceAmount: {
//     adult: { type: Number, required: true },
//     child: { type: Number, default: 0 },
//   },

//   balanceDouble: { type: Number },
//   balanceTriple: { type: Number },
//   balanceChildWithBerth: { type: Number },
//   balanceChildWithoutBerth: { type: Number },

//   destination: { type: [String], required: true },
//   sightseeing: { type: [String], required: true },
//   itinerary: { type: [String], required: true },
//   includes: { type: [String], required: true },
//   excludes: { type: [String], required: true },

//   trainDetails: [
//     {
//       trainNo: { type: String },
//       trainName: { type: String },
//       fromCode: { type: String },
//       fromStation: { type: String },
//       toCode: { type: String },
//       toStation: { type: String },
//       class: { type: String },
//       departureTime: { type: String },
//       arrivalTime: { type: String },
//       ticketOpenDate: { type: Date },
//     },
//   ],

//   flightDetails: [
//     {
//       airline: { type: String },
//       flightNo: { type: String },
//       fromCode: { type: String },
//       fromAirport: { type: String },
//       toCode: { type: String },
//       toAirport: { type: String },
//       class: { type: String },
//       departureTime: { type: String },
//       arrivalTime: { type: String },
//     },
//   ],

//   addons: [
//     {
//       name: { type: String },
//       amount: { type: Number },
//     },
//   ],

//   remarks: { type: String },

//   boardingPoints: [
//     {
//       stationCode: { type: String },
//       stationName: { type: String },
//     },
//   ],

//   deboardingPoints: [
//     {
//       stationCode: { type: String },
//       stationName: { type: String },
//     },
//   ],

//   titleImage: { type: String, required: true },
//   mapImage: { type: String, required: true },
//   galleryImages: { type: [String], required: true },

//   lastBookingDate: { type: Date, required: true },
//   completedTripsCount: { type: Number, default: 0 },
//   available: { type: Boolean, default: true },

//   // 🚨 New section for second package
//   // 🚨 change from object → array of objects
//   variantPackage: [
//     {
//       duration: {
//         days: { type: Number },
//         nights: { type: Number },
//       },
//       price: {
//         doubleSharing: { type: Number },
//         tripleSharing: { type: Number },
//         childWithBerth: { type: Number },
//         childWithoutBerth: { type: Number },
//       },
//       advanceAmount: {
//         adult: { type: Number },
//         child: { type: Number },
//       },
//       balanceDouble: { type: Number },
//       balanceTriple: { type: Number },
//       balanceChildWithBerth: { type: Number },
//       balanceChildWithoutBerth: { type: Number },
//       destination: { type: [String] },
//       sightseeing: { type: [String] },
//       itinerary: { type: [String] },
//       includes: { type: [String] },
//       excludes: { type: [String] },
//       trainDetails: [
//         {
//           trainNo: { type: String },
//           trainName: { type: String },
//           fromCode: { type: String },
//           fromStation: { type: String },
//           toCode: { type: String },
//           toStation: { type: String },
//           class: { type: String },
//           departureTime: { type: String },
//           arrivalTime: { type: String },
//           ticketOpenDate: { type: Date },
//         },
//       ],
//       flightDetails: [
//         {
//           airline: { type: String },
//           flightNo: { type: String },
//           fromCode: { type: String },
//           fromAirport: { type: String },
//           toCode: { type: String },
//           toAirport: { type: String },
//           class: { type: String },
//           departureTime: { type: String },
//           arrivalTime: { type: String },
//         },
//       ],
//       addons: [
//         {
//           name: { type: String },
//           amount: { type: Number },
//         },
//       ],
//       remarks: { type: String },
//       boardingPoints: [
//         {
//           stationCode: { type: String },
//           stationName: { type: String },
//         },
//       ],
//       deboardingPoints: [
//         {
//           stationCode: { type: String },
//           stationName: { type: String },
//         },
//       ],
//       lastBookingDate: { type: Date },
//     },
//   ],
// });

// const tourModel = mongoose.models.tour || mongoose.model("tour", tourSchema);
// export default tourModel;


// import mongoose from "mongoose";

// const tourSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   batch: { type: String, required: true },

//   // ✅ Existing untouched fields
//   duration: {
//     days: { type: Number, required: true },
//     nights: { type: Number, required: true },
//   },

//   price: {
//     doubleSharing: { type: Number, required: true },
//     tripleSharing: { type: Number, required: true },
//     childWithBerth: { type: Number },
//     childWithoutBerth: { type: Number },
//   },

//   // 🚨 New field — GST percentage applied to this tour, defaults to 0
//   gst: {
//     type: Number,
//     default: 0,
//     min: [0, "GST cannot be negative"],
//   },

//   advanceAmount: {
//     adult: { type: Number, required: true },
//     child: { type: Number, default: 0 },
//   },

//   balanceDouble: { type: Number },
//   balanceTriple: { type: Number },
//   balanceChildWithBerth: { type: Number },
//   balanceChildWithoutBerth: { type: Number },

//   destination: { type: [String], required: true },
//   sightseeing: { type: [String], required: true },
//   itinerary: { type: [String], required: true },
//   includes: { type: [String], required: true },
//   excludes: { type: [String], required: true },

//   trainDetails: [
//     {
//       trainNo: { type: String },
//       trainName: { type: String },
//       fromCode: { type: String },
//       fromStation: { type: String },
//       toCode: { type: String },
//       toStation: { type: String },
//       class: { type: String },
//       departureTime: { type: String },
//       arrivalTime: { type: String },
//       ticketOpenDate: { type: Date },
//       tripType: { type: String, default: "" }, // ← NEW: free text, no enum restriction
//       addons: [
//         {
//           name: { type: String },
//           amount: { type: Number },
//         },
//       ],
//     },
//   ],

//   flightDetails: [
//     {
//       airline: { type: String },
//       flightNo: { type: String },
//       fromCode: { type: String },
//       fromAirport: { type: String },
//       toCode: { type: String },
//       toAirport: { type: String },
//       class: { type: String },
//       departureTime: { type: String },
//       arrivalTime: { type: String },
//       // ── NEW: flight-wise addons ──
//       addons: [
//         {
//           name: { type: String },
//           amount: { type: Number },
//         },
//       ],
//     },
//   ],

//   // Old flat addons — still supported for existing bookings/UI
//   addons: [
//     {
//       name: { type: String },
//       amount: { type: Number },
//     },
//   ],

//   remarks: { type: String },

//   boardingPoints: [
//     {
//       stationCode: { type: String },
//       stationName: { type: String },
//     },
//   ],

//   deboardingPoints: [
//     {
//       stationCode: { type: String },
//       stationName: { type: String },
//     },
//   ],

//   titleImage: { type: String, required: true },
//   mapImage: { type: String, required: true },
//   galleryImages: { type: [String], required: true },

//   lastBookingDate: { type: Date, required: true },
//   completedTripsCount: { type: Number, default: 0 },
//   available: { type: Boolean, default: true },

//   // 🚨 New section for second package
//   // 🚨 change from object → array of objects
//   variantPackage: [
//     {
//       duration: {
//         days: { type: Number },
//         nights: { type: Number },
//       },
//       price: {
//         doubleSharing: { type: Number },
//         tripleSharing: { type: Number },
//         childWithBerth: { type: Number },
//         childWithoutBerth: { type: Number },
//       },
//       advanceAmount: {
//         adult: { type: Number },
//         child: { type: Number },
//       },
//       balanceDouble: { type: Number },
//       balanceTriple: { type: Number },
//       balanceChildWithBerth: { type: Number },
//       balanceChildWithoutBerth: { type: Number },
//       destination: { type: [String] },
//       sightseeing: { type: [String] },
//       itinerary: { type: [String] },
//       includes: { type: [String] },
//       excludes: { type: [String] },
//       trainDetails: [
//         {
//           trainNo: { type: String },
//           trainName: { type: String },
//           fromCode: { type: String },
//           fromStation: { type: String },
//           toCode: { type: String },
//           toStation: { type: String },
//           class: { type: String },
//           departureTime: { type: String },
//           arrivalTime: { type: String },
//           ticketOpenDate: { type: Date },
//           tripType: { type: String, default: "" }, // ← NEW: free text, no enum restriction

//           // ── NEW: train-wise addons for variant packages too ──
//           addons: [
//             {
//               name: { type: String },
//               amount: { type: Number },
//             },
//           ],
//         },
//       ],
//       flightDetails: [
//         {
//           airline: { type: String },
//           flightNo: { type: String },
//           fromCode: { type: String },
//           fromAirport: { type: String },
//           toCode: { type: String },
//           toAirport: { type: String },
//           class: { type: String },
//           departureTime: { type: String },
//           arrivalTime: { type: String },
//           // ── NEW: flight-wise addons for variant packages ──
//           addons: [
//             {
//               name: { type: String },
//               amount: { type: Number },
//             },
//           ],
//         },
//       ],
//       addons: [
//         {
//           name: { type: String },
//           amount: { type: Number },
//         },
//       ],
//       remarks: { type: String },
//       boardingPoints: [
//         {
//           stationCode: { type: String },
//           stationName: { type: String },
//         },
//       ],
//       deboardingPoints: [
//         {
//           stationCode: { type: String },
//           stationName: { type: String },
//         },
//       ],
//       lastBookingDate: { type: Date },
//     },
//   ],
// });

// const tourModel = mongoose.models.tour || mongoose.model("tour", tourSchema);
// export default tourModel;


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

  // 🚨 New field — GST percentage applied to this tour, defaults to 0
  gst: {
    type: Number,
    default: 0,
    min: [0, "GST cannot be negative"],
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
      tripType: { type: String, default: "" }, // ← free text, no enum restriction
      addons: [
        {
          name: { type: String },
          amount: { type: Number },
        },
      ],
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
      // ← NEW: matches trainDetails.tripType exactly — free text, e.g.
      // "Boarding" / "Middle" / "Deboarding". Needed so flight-only
      // (one-way, no train) tours can still tag journey order the same
      // way trains already could. Without this field in the schema,
      // Mongoose (strict mode) silently drops any tripType sent for a
      // flight on save.
      tripType: { type: String, default: "" },
      // ── flight-wise addons ──
      addons: [
        {
          name: { type: String },
          amount: { type: Number },
        },
      ],
    },
  ],

  // Old flat addons — still supported for existing bookings/UI
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
          tripType: { type: String, default: "" }, // ← free text, no enum restriction

          // ── train-wise addons for variant packages too ──
          addons: [
            {
              name: { type: String },
              amount: { type: Number },
            },
          ],
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
          // ← NEW: same as main package flightDetails.tripType above
          tripType: { type: String, default: "" },
          // ── flight-wise addons for variant packages ──
          addons: [
            {
              name: { type: String },
              amount: { type: Number },
            },
          ],
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
