import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";

export default function Home() {
  return (
    <div className="min-h-screen dark:bg-black" style={{ backgroundColor: '#2e4ed2' }}>
      <Header />
      <main className="flex min-h-screen w-full flex-col items-center justify-center py-20 px-6">
        <div className="flex flex-col items-center gap-8 max-w-2xl">
          <Image
            src="/logo.png"
            alt="Activity Match"
            width={360}
            height={360}
            priority
            className="dark:invert"
          />
          <h1 className="text-2xl md:text-3xl font-semibold text-center text-white leading-relaxed">
            Making connection as simple as showing up.
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
            <Link href="/discover" className="flex flex-col items-center gap-3 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow" style={{ backgroundColor: '#ee9dd6' }}>
              <h3 className="text-lg font-semibold text-black">Discover</h3>
              <p className="text-sm text-black text-center">Browse and find activities that match your interests.</p>
            </Link>
            
            <Link href="/create" className="flex flex-col items-center gap-3 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow" style={{ backgroundColor: '#ee9dd6' }}>
              <h3 className="text-lg font-semibold text-black">Create</h3>
              <p className="text-sm text-black text-center">Host your own activity and meet like-minded people.</p>
            </Link>
            
            <Link href="/requests" className="flex flex-col items-center gap-3 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow" style={{ backgroundColor: '#ee9dd6' }}>
              <h3 className="text-lg font-semibold text-black">Requests</h3>
              <p className="text-sm text-black text-center">Manage and review join requests from participants.</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}