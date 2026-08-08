import type { Metadata } from "next";

import { JourneyLibrary } from "@/components/journey/JourneyLibrary";

export const metadata: Metadata = {
  title: "رحلاتي · صوِّر",
};

export default function JourneysPage() {
  return <JourneyLibrary />;
}
