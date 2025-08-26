import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Play, Star, Users, Zap, CheckCircle, Video, Mic, Image as ImageIcon } from "lucide-react"
import Link from "next/link"

// Force static generation to avoid API dependency issues
export const dynamic = 'force-static'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="relative z-50 px-4 py-6 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">A</span>
            </div>
            <span className="text-2xl font-bold">AEON</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">About</a>
            <Button variant="ghost" className="text-white hover:text-cyan-400" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-20 md:px-8 md:py-32">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700 mb-8">
            <span className="text-sm text-gray-300">🚀 Now live with AI video creation</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-white">AEON</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              The Future of Video Creation
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your ideas into viral videos with AI. Create, edit, and publish
            professional content in minutes, not hours. Join thousands of creators
            revolutionizing their workflow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-4 text-lg border-0 w-full sm:w-auto"
              asChild
            >
              <Link href="/sign-up" className="inline-flex items-center">
                Start Creating Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-gray-600 text-white hover:bg-gray-800 px-8 py-4 text-lg w-full sm:w-auto"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Free forever plan</span>
            </div>
          </div>
        </div>
      </section>

      {/* Revolutionary AI Architecture */}
      <section className="px-4 py-20 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-purple-400">Revolutionary</span> AI Architecture
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Cutting-edge AI models working in harmony to bring your creative vision to life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-900/50 border-gray-800 hover:border-cyan-500/50 transition-all duration-300 group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Video className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-lg">AI Video</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Next-gen video synthesis powered by advanced neural networks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-all duration-300 group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Mic className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-lg">Voice AI</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Human-like voice synthesis with emotional intelligence
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:border-green-500/50 transition-all duration-300 group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-lg">Image AI</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Photorealistic image generation and intelligent editing
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:border-orange-500/50 transition-all duration-300 group">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-lg">Smart AI</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Intelligent automation that learns from your preferences
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Performance Stats */}
      <section className="px-4 py-16 md:px-8 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
              <div className="text-4xl font-bold text-cyan-400 mb-2">10x</div>
              <div className="text-lg text-white mb-2">Faster Creation</div>
              <div className="text-sm text-gray-400">Average time saved per video project</div>
            </div>
            <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
              <div className="text-4xl font-bold text-purple-400 mb-2">5★</div>
              <div className="text-lg text-white mb-2">User Rating</div>
              <div className="text-sm text-gray-400">Based on 10,000+ creator reviews</div>
            </div>
            <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
              <div className="text-4xl font-bold text-green-400 mb-2">3min</div>
              <div className="text-lg text-white mb-2">Average Edit Time</div>
              <div className="text-sm text-gray-400">From concept to published video</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Creators Choose AEON */}
      <section className="px-4 py-20 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Why Creators Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">AEON</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Join thousands of creators who've transformed their content workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-900/50 border-gray-800 hover:border-cyan-500/50 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Lightning Fast</CardTitle>
                <CardDescription className="text-gray-300 text-base">
                  Create professional videos in minutes, not hours. Our AI handles the heavy lifting.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Studio Quality</CardTitle>
                <CardDescription className="text-gray-300 text-base">
                  Professional-grade output that rivals expensive production studios.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 hover:border-green-500/50 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Collaborative</CardTitle>
                <CardDescription className="text-gray-300 text-base">
                  Work seamlessly with your team. Share, review, and iterate in real-time.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* See AEON in Action */}
      <section className="px-4 py-20 md:px-8 bg-gray-900/30">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">
            See <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">AEON</span> in Action
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Watch how creators are using AEON to transform their content workflow
          </p>

          <div className="relative max-w-4xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 flex items-center justify-center">
              <Button
                size="lg"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white"
              >
                <Play className="mr-2 h-6 w-6" />
                Play Demo Video
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-20 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Creators</span>
            </h2>
            <p className="text-xl text-gray-300">See what our community is saying</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-white">Sarah Chen</div>
                    <div className="text-sm text-gray-400">Content Creator</div>
                  </div>
                </div>
                <CardDescription className="text-gray-300 text-base">
                  "AEON completely transformed my workflow. What used to take me days now takes minutes. The AI is incredibly intuitive."
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-white">Marcus Johnson</div>
                    <div className="text-sm text-gray-400">YouTuber</div>
                  </div>
                </div>
                <CardDescription className="text-gray-300 text-base">
                  "The quality is unmatched. My subscribers can't believe I'm creating this content so quickly. AEON is a game-changer."
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
                  <div>
                    <div className="font-semibold text-white">Emma Rodriguez</div>
                    <div className="text-sm text-gray-400">Marketing Director</div>
                  </div>
                </div>
                <CardDescription className="text-gray-300 text-base">
                  "Our marketing team's productivity has skyrocketed. We're creating more content than ever with half the resources."
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-6xl font-bold mb-6">
            Ready to Go <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Viral?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join the AI video revolution. Create stunning content that captivates your audience and grows your brand.
          </p>

          <Button
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-12 py-6 text-xl border-0"
            asChild
          >
            <Link href="/sign-up" className="inline-flex items-center">
              Start Creating Now
              <ArrowRight className="ml-2 h-6 w-6" />
            </Link>
          </Button>

          <div className="mt-6 text-sm text-gray-400">
            No credit card required • Free forever plan • Cancel anytime
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-4 py-12 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">A</span>
              </div>
              <span className="text-2xl font-bold">AEON</span>
            </div>

            <div className="flex items-center space-x-8 text-sm text-gray-400">
              <span>© 2024 AEON Protocol</span>
              <span>•</span>
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
