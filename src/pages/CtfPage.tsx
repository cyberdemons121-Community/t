import { eventPages } from "../data/events";
import { EventPageView } from "../components/EventPageView";

export function CtfPage() {
  return <EventPageView event={eventPages.ctf} />;
}
