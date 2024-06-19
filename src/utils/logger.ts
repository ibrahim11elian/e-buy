import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.json(), // Output logs in JSON format
  ),
  transports: [
    new transports.File({ filename: "app.log" }),
    // new transports.Console(),
  ],
});

export default logger;
