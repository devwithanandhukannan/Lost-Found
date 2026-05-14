import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email
    },
    process.env.JWT_SECRET || "secret",
    {
      expiresIn: "7d"
    }
  );
};

export default generateToken;