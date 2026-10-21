import type { UserSession } from "@/types/auth";
import { ChatIA } from "@/components/chat";

interface AsistentesIAProps {
  user: UserSession;
}

export function AsistentesIA({ user }: AsistentesIAProps) {
  return <ChatIA rut={user.rut} />;
}
