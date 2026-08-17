import BackgroundVideo from "~/components/BackgroundVideo"

export default function Home() {
  return (
    <main className="relative bg-black min-h-screen w-full flex flex-col overflow-hidden text-white">
      <BackgroundVideo />
      <div className="relative z-10 flex min-h-svh p-6 items-center justify-center">
        <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose text-center">
          <div>
            <h1 className="font-medium text-3xl mb-2">Project ready!</h1>
            <p className="text-white/80">You may now add components and start building.</p>
            <button className="mt-4 px-6 py-2.5 rounded-full bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
