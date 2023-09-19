import { pino } from "pino";

const logger = pino();
if (process.env.DEBUG) logger.level = "trace";

export default logger;
