import { ChatbotSubnav } from "@/components/admin/chatbot/chatbot-subnav";

export default function ChatbotAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Chatbot IA</h1>
        <p className="text-muted-foreground mt-1">
          Assistente virtual da Spotlog — base de conhecimento, sessões e self-learning.
        </p>
      </div>
      <ChatbotSubnav />
      {children}
    </div>
  );
}
