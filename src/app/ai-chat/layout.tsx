export default function AiChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(244,114,182,0.2),transparent_36%),radial-gradient(circle_at_85%_14%,rgba(251,113,133,0.2),transparent_35%),radial-gradient(circle_at_52%_86%,rgba(249,168,212,0.16),transparent_38%)]" />
      {children}
    </div>
  );
}
