import { FakeNewsDetector } from "../components/fake-news-detector"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-2">Fake News Detector</h1>
        <p className="text-center mb-8">
          Advanced political news analysis platform with AI-powered misinformation detection
        </p>
        <FakeNewsDetector />
      </div>
    </main>
  )
}
