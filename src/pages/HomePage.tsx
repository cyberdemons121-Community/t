import { Events } from "../components/Events";
import { Faq } from "../components/Faq";
import { Hero } from "../components/Hero";
import { Join } from "../components/Join";
import { Manifesto } from "../components/Manifesto";
import { Mission } from "../components/Mission";
import { Operations } from "../components/Operations";
import { Ticker } from "../components/Ticker";
import { Tracks } from "../components/Tracks";

export function HomePage() {
  return (
    <>
      <Hero />
      <Ticker />
      <Mission />
      <Tracks />
      <Operations />
      <Manifesto />
      <Events />
      <Join />
      <Faq />
    </>
  );
}
