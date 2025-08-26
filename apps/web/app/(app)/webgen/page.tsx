import dynamic from "next/dynamic";
const VoicePrompt = dynamic(() => import("./VoicePrompt"), { ssr: false });

export default function Page(){
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Zero-to-Website (Voice → Enhancer)</h1>
      <VoicePrompt />
    </main>
  );
}

