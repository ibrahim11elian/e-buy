import mongoose from "mongoose";
import app from "./app";

// Connecting to the Database
mongoose
  .connect(process.env.LOCAL_DB as string)
  .then(() => {
    console.log("Connected to the Database");
  })
  .catch(() => {
    console.log("Failed to connect to the Database");
  });

const port = process.env.PORT || 3000;
// Starting The Server
const server = app.listen(port, () => {
  console.log(`${process.env.NODE_ENV} server is running on port ${port}`);
});

// this will handle any rejection in the entire application
process.on("unhandledRejection", shutDownServer);

function shutDownServer() {
  console.error("Shutting down...");
  server.close(() => {
    process.exit(1);
  });
}
