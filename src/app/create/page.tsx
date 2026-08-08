import type { Metadata } from "next";

import { CreateFlow } from "@/components/upload/CreateFlow";

export const metadata: Metadata = {
  title: "لنستعيد رحلتك · صوِّر",
};

export default function CreatePage() {
  return <CreateFlow />;
}
