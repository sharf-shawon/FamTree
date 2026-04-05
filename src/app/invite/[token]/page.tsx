import { InviteAcceptContent } from "./invite-accept-content";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  return <InviteAcceptContent token={token} />;
}
