import jwt from "jsonwebtoken";

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
    req.tour = decoded.id;
    next();
  } catch (error) {
    console.log("authTour error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }
};

export default authTour;
