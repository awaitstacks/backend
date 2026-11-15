// import jwt from "jsonwebtoken";

// //Admin authentication middleware

// const authAdmin = async (req, res, next) => {
//   try {
//     const { atoken } = req.headers;
//     if (!atoken) {
//       return res.json({
//         success: false,
//         message: "Not authorized login again",
//       });
//     }
//     const token_decode = jwt.verify(atoken, process.env.JWT_SECRET);
//     if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
//       return res.json({
//         success: false,
//         message: "Not authorized login again",
//       });
//     }
//     next();
//   } catch (error) {
//     console.log(error);
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// export default authAdmin;


import jwt from "jsonwebtoken";

// Admin authentication
// Login token = jwt.sign(ADMIN_EMAIL + ADMIN_PASSWORD) (tourAdminController → loginAdmin).
// .env la ADMIN_EMAIL / ADMIN_PASSWORD maathina → pazhaya token match aagaadhu → frontend logout.
// Response status pazhaya maadhiriye (200 + success:false) — matha pages break aagaadhu.
const authAdmin = async (req, res, next) => {
  try {
    const { atoken } = req.headers;
    if (!atoken) {
      return res.json({
        success: false,
        message: "Not authorized login again",
      });
    }
    const token_decode = jwt.verify(atoken, process.env.JWT_SECRET);
    if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
      return res.json({
        success: false,
        message: "Your session has ended. Please login again.",
      });
    }
    next();
  } catch (error) {
    console.log("authAdmin error:", error.message);
    return res.json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }
};

export default authAdmin;