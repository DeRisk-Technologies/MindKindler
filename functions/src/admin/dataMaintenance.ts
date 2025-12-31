import { ScheduledEvent } from "firebase-functions/v2/scheduler";

export const anonymizeDataHandler = async (event: ScheduledEvent) => {
    console.log("Running monthly anonymization...", event.scheduleTime);
};
