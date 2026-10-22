import mongoose from "mongoose";

import type { IUserConnected } from "../types";

const UserConnectedSchema = new mongoose.Schema<IUserConnected>(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    allowChat: {
      type: Boolean,
      required: false,
    }
  },
  {
    strict: false,
    collection: "user-connected",
  },
);

const UserConnected: mongoose.Model<IUserConnected> =
  mongoose.models.UserConnected ||
  mongoose.model<IUserConnected>("UserConnected", UserConnectedSchema, "user-connected");

export default UserConnected;
