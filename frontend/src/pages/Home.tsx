import { FakeNewsDetector } from "../components/fake-news-detector"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-2 text-slate-800 dark:text-slate-100">Fake News Detector</h1>
        <p className="text-center mb-8 text-slate-600 dark:text-slate-400">
          Advanced political news analysis platform with AI-powered misinformation detection
        </p>
        <FakeNewsDetector />
      </div>
    </main>
  )
}

