// import jwt from "jsonwebtoken";

// const authTour = async (req, res, next) => {
//   try {
//     const tToken = req.headers.ttoken;

//     if (!tToken) {
//       return res.json({
//         success: false,
//         message: "Not Authorized. Please login again.",
//       });
//     }

//     const decoded = jwt.verify(tToken, process.env.JWT_SECRET);
//     req.tour = decoded.id;
//     next();
//   } catch (error) {
//     console.log("authTour error:", error);
//     return res.status(401).json({
//       success: false,
//       message: "Invalid or expired token. Please login again.",
//     });
//   }
// };

// export default authTour;

import jwt from "jsonwebtoken";

// Tour Admin authentication
// Login token = jwt.sign(TOUR_EMAIL + TOUR_PASSWORD) (tourController → loginTour).
// .env la TOUR_EMAIL / TOUR_PASSWORD maathina → pazhaya token match aagaadhu → 401 → frontend logout.
const authTour = async (req, res, next) => {
  try {
    const tToken = req.headers.ttoken;

    if (!tToken) {
      return res.json({
        success: false,
        message: "Not Authorized. Please login again.",
      });
    }

    const decoded = jwt.verify(tToken, process.env.JWT_SECRET);
    if (decoded !== process.env.TOUR_EMAIL + process.env.TOUR_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: "Your session has ended. Please login again.",
      });
    }
    req.tour = decoded?.id;
    next();
  } catch (error) {
    console.log("authTour error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }
};

export default authTour;