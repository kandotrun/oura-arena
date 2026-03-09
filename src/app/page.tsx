import { fetchAllUsers } from "@/lib/fetchAllUsers";
import UserCard from "@/components/UserCard";

export const revalidate = 300; // ISR: 5 minutes

export default async function Home() {
  const users = await fetchAllUsers();

  const gridClass =
    users.length === 1
      ? "max-w-xl mx-auto"
      : users.length === 2
        ? "grid gap-8 sm:grid-cols-2 max-w-4xl mx-auto"
        : "grid gap-8 sm:grid-cols-2 lg:grid-cols-3";

  const now = new Date();
  const lastUpdated = now.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Health Dashboard
            </h1>
            <p className="text-neutral-400 text-xs mt-0.5">
              Powered by Oura Ring
            </p>
          </div>
          <p className="text-xs text-neutral-400 hidden sm:block">
            Updated {lastUpdated}
          </p>
        </div>
      </header>

      {/* Cards */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
        <div className={gridClass}>
          {users.map((user) => (
            <UserCard key={user.name} user={user} />
          ))}
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-8 pb-10 text-center text-xs text-neutral-300">
        Data refreshes every 5 minutes &middot; Oura Ring API v2
      </footer>
    </div>
  );
}
