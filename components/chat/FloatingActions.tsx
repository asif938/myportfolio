import BackToTop from "@/components/BackToTop";
import ChatLauncher from "@/components/chat/ChatLauncher";
import { isChatAvailable } from "@/lib/ai/getSettings";
import { getProfile } from "@/lib/data";

/** Back-to-top button plus the chat widget (only when the chatbot is enabled and configured). */
export default async function FloatingActions() {
  const [chatEnabled, profile] = await Promise.all([isChatAvailable(), getProfile()]);
  const ownerName = profile?.name ?? "the site owner";

  return (
    <>
      <BackToTop raised={chatEnabled} />
      {chatEnabled && <ChatLauncher ownerName={ownerName} />}
    </>
  );
}
