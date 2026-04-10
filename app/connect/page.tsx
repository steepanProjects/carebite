import ConnectCard from "@/components/ConnectCard";
import { Suspense } from "react";

function ConnectContent() {
  return <ConnectCard />;
}

export default function ConnectPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      }>
        <ConnectContent />
      </Suspense>
    </div>
  );
}
