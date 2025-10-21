
"use client"

import { useState, useEffect } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthHeader } from "@/components/auth/auth-header"
import { apiRequest } from "@/lib/utils"
import {
  Loader2,
  Image as ImageIcon,
  Clock,
  CheckCircle,
  XCircle,
  Bot,
  Briefcase,
  Sparkles,
  Palette,
  Film,
  Headphones,
  Users,
  BarChart3,
  Zap,
  Code,
  Globe,
  Shield,
  Workflow,
  TrendingUp,
  Activity,
  ShoppingCart,
  Brain
} from "lucide-react"
import { ImageStudio } from "@/components/modules/image-studio"
import { VideoHub } from "@/components/modules/video-hub"
import { AiCoder } from "@/components/modules/ai-coder"
import { AudioSuite } from "@/components/modules/audio-suite"
import dynamic from "next/dynamic"
const ThreeNodeNetwork = dynamic(() => import("@/components/bg/three-node-network").then(m => m.ThreeNodeNetwork), { ssr: false })
import { MetricsChart } from "@/components/charts/metrics-chart"
import { useJobEvents } from "@/components/realtime/job-events"
import { toast } from "sonner"

interface Job {
  id: number
  type: string
  status: string
  input_data: any
  output_data?: any
  created_at: string
  completed_at?: string
  error_message?: string
}

interface Asset {
  id: number
  s3_key: string
  s3_bucket: string
  media_type: string
  presigned_url?: string
}

export default function DashboardPage() {
  const { getToken, isLoaded: authLoaded } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [assets, setAssets] = useState<{ [jobId: number]: Asset[] }>({})
  const [activeTab, setActiveTab] = useState("image")

  const fetchJobs = async () => {
    if (!authLoaded || !userLoaded) return
    
    try {
      const token = await getToken()
      if (!token) return
      
      const response = await apiRequest("/v1/jobs", {}, token)
      setJobs(response.jobs || [])
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
    }
  }

  const fetchJobAssets = async (jobId: number) => {
    if (!authLoaded || !userLoaded) return
    
    try {
      const token = await getToken()
      if (!token) return
      
      const response = await apiRequest(`/v1/jobs/${jobId}/assets`, {}, token)
      setAssets(prev => ({ ...prev, [jobId]: response }))
    } catch (error) {
      console.error("Failed to fetch assets:", error)
    }
  }

  useEffect(() => {
    if (authLoaded && userLoaded && user) {
      fetchJobs()
      const interval = setInterval(fetchJobs, 3000) // Poll every 3 seconds
      return () => clearInterval(interval)
    }
    return () => {} // Return empty cleanup function for other code paths
  }, [authLoaded, userLoaded, user])

  useEffect(() => {
    // Fetch assets for completed jobs
    jobs.forEach(job => {
      if (job.status === "completed" && !assets[job.id]) {
        fetchJobAssets(job.id)
      }
    })
  }, [jobs, assets])

  // Realtime job status updates via WebSocket (fallback to polling remains)
  useJobEvents((evt) => {
    setJobs((prev) => {
      const found = prev.some((j) => j.id === evt.id)
      const next = prev.map((j) => (j.id === evt.id ? { ...j, status: evt.status } : j))
      return found ? next : prev
    })
    if (evt.status === "completed") {
      toast.success("Job completed", { description: `#${evt.id} is ready` })
      fetchJobAssets(evt.id)
    }
  })

  const handleGenerate = async () => {
    if (!prompt.trim() || !authLoaded || !userLoaded) return

    setIsGenerating(true)
    try {
      const token = await getToken()
      if (!token) {
        console.error("No authentication token available")
        return
      }

      let endpoint = "/v1/jobs/image-generate"
      let payload: any = {
        prompt: prompt.trim(),
        model: "flux-schnell",
        width: 1024,
        height: 1024,
        num_outputs: 1
      }

      if (activeTab === "video") {
        endpoint = "/v1/jobs/video-generate"
        payload = { prompt: prompt.trim(), provider: "runway", duration: 5, resolution: "1280x768" }
      } else if (activeTab === "audio") {
        endpoint = "/v1/jobs/audio-generate"
        payload = {
          text: prompt.trim(),
          voice_id: "21m00Tcm4TlvDq8ikWAM"
        }
      }
      await apiRequest(endpoint, { method: "POST", body: JSON.stringify(payload) }, token)
      setPrompt("")
      fetchJobs() // Refresh jobs list
    } catch (error) {
      console.error("Failed to generate content:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (!authLoaded || !userLoaded) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Welcome to AEON</CardTitle>
              <CardDescription>Please sign in to continue</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  // OS-style app modules
  const appModules = [
    // Media Generation Suite
    {
      id: "image-studio",
      name: "Image Studio",
      description: "AI-powered image generation and editing",
      icon: Palette,
      color: "bg-gradient-to-br from-purple-500 to-pink-500",
      category: "Media",
      features: ["FLUX", "DALL-E", "Ideogram", "Background Removal", "Upscaling"]
    },
    {
      id: "video-hub",
      name: "Video Hub",
      description: "Professional video production and editing",
      icon: Film,
      color: "bg-gradient-to-br from-blue-500 to-cyan-500",
      category: "Media",
      features: ["Runway", "Pika", "Luma", "Hailuo", "Auto-editing"]
    },
    {
      id: "audio-suite",
      name: "Audio Suite",
      description: "Voice synthesis and audio processing",
      icon: Headphones,
      color: "bg-gradient-to-br from-green-500 to-emerald-500",
      category: "Media",
      features: ["ElevenLabs", "Voice Cloning", "Music Gen", "Audio Effects"]
    },

    // AI Agents
    {
      id: "content-agents",
      name: "Content Agents",
      description: "AI agents for content creation",
      icon: Bot,
      color: "bg-gradient-to-br from-orange-500 to-red-500",
      category: "Agents",
      features: ["Screenwriter", "Video Editor", "SEO Agent", "Content Optimizer"]
    },
    {
      id: "business-agents",
      name: "Business Agents",
      description: "Automation for business operations",
      icon: Briefcase,
      color: "bg-gradient-to-br from-indigo-500 to-purple-500",
      category: "Agents",
      features: ["Sales Agent", "Customer Service", "Marketing", "Analytics"]
    },

    // Business Integration
    {
      id: "crm-integration",
      name: "CRM Integration",
      description: "Connect with HubSpot, Salesforce, Pipedrive",
      icon: Users,
      color: "bg-gradient-to-br from-teal-500 to-blue-500",
      category: "Integration",
      features: ["HubSpot", "Salesforce", "Pipedrive", "Lead Scoring"]
    },
    {
      id: "ecommerce-hub",
      name: "E-commerce Hub",
      description: "Shopify, WooCommerce, Amazon automation",
      icon: ShoppingCart,
      color: "bg-gradient-to-br from-yellow-500 to-orange-500",
      category: "Integration",
      features: ["Shopify", "WooCommerce", "Amazon", "Inventory Management"]
    },
    {
      id: "analytics-center",
      name: "Analytics Center",
      description: "Business intelligence and reporting",
      icon: BarChart3,
      color: "bg-gradient-to-br from-pink-500 to-rose-500",
      category: "Analytics",
      features: ["Performance Tracking", "Insights", "Reporting", "Predictions"]
    },

    // Development & Automation
    {
      id: "ai-coder",
      name: "AI Coder",
      description: "Natural language to web apps",
      icon: Code,
      color: "bg-gradient-to-br from-gray-700 to-gray-900",
      category: "Development",
      features: ["No-Code Builder", "React Apps", "API Generation", "Deployment"]
    },
    {
      id: "workflow-builder",
      name: "Workflow Builder",
      description: "Drag-and-drop automation workflows",
      icon: Workflow,
      color: "bg-gradient-to-br from-violet-500 to-purple-500",
      category: "Automation",
      features: ["Visual Builder", "Triggers", "Actions", "Integrations"]
    },

    // Enterprise Features
    {
      id: "data-models",
      name: "Data & Models",
      description: "Custom AI training and model management",
      icon: Brain,
      color: "bg-gradient-to-br from-emerald-500 to-teal-500",
      category: "Enterprise",
      features: ["Model Training", "Fine-tuning", "Edge Inference", "Cost Optimization"]
    },
    {
      id: "enterprise-security",
      name: "Security Center",
      description: "Enterprise security and compliance",
      icon: Shield,
      color: "bg-gradient-to-br from-red-500 to-pink-500",
      category: "Enterprise",
      features: ["SOC 2", "GDPR", "SSO", "Audit Logs"]
    }
  ]

  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredModules = appModules.filter(module =>
    module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = [...new Set(appModules.map(module => module.category))]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <AuthHeader />
      <ThreeNodeNetwork />

      <div className="relative z-10 container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="h-10 w-10 text-blue-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              AEON OS
            </h1>
          </div>
          <p className="text-xl text-gray-300">The Complete AI Operating System for Business</p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <Input
              placeholder="Search apps and features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-gray-800/60 backdrop-blur-md border-gray-700 col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Job Throughput (last 24h ticks)</CardTitle>
              <CardDescription>Created vs Completed</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricsChart />
            </CardContent>
          </Card>
          <Card className="bg-gray-800/60 backdrop-blur-md border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Tips</CardTitle>
              <CardDescription>Generate media and watch realtime updates</CardDescription>
            </CardHeader>
            <CardContent className="text-gray-300 text-sm">
              Realtime updates flow over secure WebSockets. Your assets will appear as soon as the job completes.
            </CardContent>
          </Card>
        </div>

        {/* App Grid - OS Style */}
        <div className="space-y-8">
          {categories.map(category => {
            const categoryModules = filteredModules.filter(module => module.category === category)
            if (categoryModules.length === 0) return null

            return (
              <div key={category} className="space-y-4">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                  {category === "Media" && <Sparkles className="h-6 w-6 text-purple-400" />}
                  {category === "Agents" && <Bot className="h-6 w-6 text-blue-400" />}
                  {category === "Integration" && <Globe className="h-6 w-6 text-green-400" />}
                  {category === "Analytics" && <TrendingUp className="h-6 w-6 text-pink-400" />}
                  {category === "Development" && <Code className="h-6 w-6 text-gray-400" />}
                  {category === "Automation" && <Zap className="h-6 w-6 text-yellow-400" />}
                  {category === "Enterprise" && <Shield className="h-6 w-6 text-red-400" />}
                  {category}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categoryModules.map((module) => (
                    <Card
                      key={module.id}
                      className="group relative overflow-hidden border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:bg-gray-800/80 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-2xl"
                      onClick={() => setSelectedModule(module.id)}
                    >
                      <div className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity ${module.color}`} />

                      <CardHeader className="relative z-10">
                        <div className="flex items-center justify-between">
                          <module.icon className="h-12 w-12 text-white group-hover:scale-110 transition-transform" />
                          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                        </div>
                        <CardTitle className="text-white group-hover:text-blue-300 transition-colors">
                          {module.name}
                        </CardTitle>
                        <CardDescription className="text-gray-300">
                          {module.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="relative z-10">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {module.features.slice(0, 3).map((feature, index) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-1 bg-gray-700/50 text-gray-300 rounded-full"
                              >
                                {feature}
                              </span>
                            ))}
                            {module.features.length > 3 && (
                              <span className="text-xs px-2 py-1 bg-gray-700/50 text-gray-300 rounded-full">
                                +{module.features.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions Bar */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-700"
                  onClick={() => setSelectedModule("image-studio")}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Quick Generate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-700"
                  onClick={() => setSelectedModule("workflow-builder")}
                >
                  <Workflow className="h-4 w-4 mr-2" />
                  New Workflow
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-700"
                  onClick={() => setSelectedModule("analytics-center")}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Module Detail Modal/Overlay */}
        {selectedModule && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
              <CardHeader className="border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {(() => {
                      const module = appModules.find(m => m.id === selectedModule)
                      if (!module) return null
                      return (
                        <>
                          <div className={`p-3 rounded-lg ${module.color}`}>
                            <module.icon className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-2xl text-white">{module.name}</CardTitle>
                            <CardDescription className="text-gray-300">{module.description}</CardDescription>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedModule(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {selectedModule === "image-studio" && (
                  <ImageStudio
                    onGenerate={(data) => {
                      // Convert the advanced data to the simple format expected by handleGenerate
                      setPrompt(data.prompt)
                      setActiveTab("image")
                      handleGenerate()
                    }}
                    isGenerating={isGenerating}
                  />
                )}

                {selectedModule === "video-hub" && (
                  <VideoHub
                    isGenerating={isGenerating}
                  />
                )}

                {selectedModule === "audio-suite" && (
                  <AudioSuite
                    onGenerate={(data) => {
                      // Convert the advanced data to the simple format expected by handleGenerate
                      setPrompt(data.text)
                      setActiveTab("audio")
                      handleGenerate()
                    }}
                    isGenerating={isGenerating}
                  />
                )}

                {selectedModule === "ai-coder" && (
                  <AiCoder
                    onGenerate={(data) => {
                      // Handle AI Coder generation
                      console.log("AI Coder generation:", data)
                      // This would integrate with a code generation API
                    }}
                    isGenerating={isGenerating}
                  />
                )}

                {!["image-studio", "video-hub", "audio-suite", "ai-coder"].includes(selectedModule || "") && (
                  <div className="text-center py-12">
                    <div className="space-y-4">
                      <div className="text-6xl">🚧</div>
                      <h3 className="text-2xl font-semibold text-white">Coming Soon</h3>
                      <p className="text-gray-400">
                        This module is currently under development. Stay tuned for updates!
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activity Sidebar */}
        {jobs.length > 0 && (
          <div className="fixed right-6 top-24 w-80 max-h-96 overflow-y-auto z-40">
            <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded">
                    {getStatusIcon(job.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {job.input_data?.prompt || job.input_data?.text || "No prompt"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(job.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}


