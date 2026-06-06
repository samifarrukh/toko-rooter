import mongoose from "mongoose";

const plumberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  service: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model("Booking", plumberSchema);
export default Booking;
