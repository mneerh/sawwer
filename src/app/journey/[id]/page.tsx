import type { Metadata } from "next";

import { JourneyExperience } from "@/components/journey/JourneyExperience";

export const metadata: Metadata = {
  title: "رحلتك · صوِّر",
};

export default async function JourneyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JourneyExperience journeyId={id} />;
}
