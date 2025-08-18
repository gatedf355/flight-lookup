import FlightSearch from '@/components/FlightSearch'
export default function Page() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">FlightLookup</h1>
      <FlightSearch />
    </main>
  )
}
