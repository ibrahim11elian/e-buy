"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const port = process.env.PORT || 3000;
// Starting The Server
const server = app_1.default.listen(port, () => {
    console.log(`${process.env.NODE_ENV} server is running on port ${port}`);
});
// Connecting to the Database
mongoose_1.default
    .connect(process.env.DB_HOST)
    .then(() => {
    console.log("Connected to the Database");
})
    .catch(() => {
    console.log("Failed to connect to the Database");
    shutDownServer();
});
// this will handle any rejection in the entire application
process.on("unhandledRejection", shutDownServer);
function shutDownServer() {
    console.error("Shutting down...");
    server.close(() => {
        process.exit(1);
    });
}
