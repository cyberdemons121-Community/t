import { eventPages } from "../data/events";
import { EventPageView } from "../components/EventPageView";

export function HackathonPage() {
  return <EventPageView event={eventPages.hackathon} />;
}
