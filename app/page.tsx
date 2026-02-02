"use client";

import { useState, useEffect, useRef } from "react";

import {
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewUrl,
  WebPreviewBody,
} from "@/components/ai-elements/web-preview";
import { AgentIDE } from "@/components/ai-elements/agent-ide";
import { Loader } from "@/components/ai-elements/loader";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { ProjectSidebar } from "@/components/project-sidebar";
import { LoadingScreen } from "@/components/loading-screen";
import { NewProjectModal } from "@/components/new-project-modal";
import { Button } from "@/components/ui/button";

interface Project {
  tenantId: string;
  id: string;
  name: string;
  demoUrl: string | null;
  chatId: string | null;
  createdAt: string;
}

interface ChatMessage {
  type: "user" | "assistant";
  content: string;
}

const DEFAULT_AGENT_CODE = `// AEON Agent IDE Workspace\n// Use this editor to draft agent-generated code and iterations.\n\nexport function agentTask() {\n  return {\n    status: "ready",\n    message: "Monaco IDE online for coding agents.",\n  };\n}`;

const REQUESTY_MODELS = [
  { group: "OpenAI", models: ["gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "gpt-4o", "gpt-4o-mini", "gpt-4o-nano", "gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-5-pro", "gpt-5-codex", "gpt-5.1", "o4-mini", "o4-mini-deep-research", "o3-mini", "o3-pro", "o3-deep-research"], },
  { group: "Anthropic", models: ["claude-3-5-haiku", "claude-3-7-sonnet", "claude-3-haiku", "claude-haiku-4-5", "claude-opus-4", "claude-opus-4-1", "claude-opus-4-5", "claude-sonnet-4", "claude-sonnet-4-5"], },
  { group: "Google", models: ["gemini-2.0-flash-001", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro", "gemini-3-flash", "gemini-3-pro"], },
  { group: "DeepSeek", models: ["deepseek-r1", "deepseek-r1-distill-llama-70b", "deepseek-v3", "deepseek-v3.1"], },
  { group: "Mistral", models: ["codestral", "devstral", "devstral-medium", "devstral-small", "mistral-large", "mistral-medium", "mistral-small", "open-mistral-7b", "pixtral-large"], },
  { group: "Meta", models: ["llama-3.2-90b-vision-instruct", "llama-3.3-70b-instruct", "llama-3.1-8b-instruct-turbo", "meta-llama-3.1-70b-instruct", "meta-llama-3.1-405b-instruct"], },
  { group: "Qwen", models: ["qwen2.5-72b-instruct", "qwen2.5-coder-32b-instruct", "qwen2.5-72b-a22b", "qwen3-32b", "qwen3-coder-480b-a15b-instruct"], },
  { group: "Other", models: ["glm-4.5", "glm-4.5-air", "phi-4"], },
];

export default function Home() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [message, setMessage] = useState("");
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activePanel, setActivePanel] = useState<"preview" | "ide">("preview");
  const [agentCode, setAgentCode] = useState(DEFAULT_AGENT_CODE);
  const [provider, setProvider] = useState<"v0" | "openai" | "deepseek" | "requesty">("v0");
  const [model, setModel] = useState("v0-1.5-sm");
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const projectsRefreshRef = useRef<{ refresh: () => void } | null>(null);
  const isPreviewPanel = activePanel === "preview";

  // Load messages when project changes
  useEffect(() => {
    if (currentProject?.id) {
      loadProjectMessages(currentProject.id);
    }
  }, [currentProject?.id]);

  const loadProjectMessages = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/messages`);
      if (response.ok) {
        const messages = await response.json();
        setChatHistory(
          messages.map((m: { role: string; content: string }) => ({
            type: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    setMessage("");
  };

  const handleNewProject = () => {
    setIsNewProjectModalOpen(true);
  };

  const handleCreateProject = async (projectName: string) => {
    try {
      setIsCreatingProject(true);
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: projectName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create project");
      }

      const newProject = await response.json();
      setCurrentProject(newProject);
      setChatHistory([]);
      setMessage("");
      
      // Refresh the projects list in sidebar
      projectsRefreshRef.current?.refresh();
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleSendMessage = async (promptMessage: PromptInputMessage) => {
    const hasText = Boolean(promptMessage.text);

    if (!hasText || isLoading || isGenerating) return;

    const userMessage = promptMessage.text?.trim() || "";
    setMessage("");
    setIsLoading(true);
    setIsGenerating(true);

    setChatHistory((prev) => [...prev, { type: "user", content: userMessage }]);

    try {
      const response = await fetch("/api/generate-v0", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userMessage,
          provider,
          model,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        try {
          const error = JSON.parse(text);
          // Include details if available
          const errorMessage = JSON.stringify(error, null, 2);
          throw new Error(errorMessage);
        } catch (e) {
          // If response is not JSON, use the text directly
          throw new Error(text || "Failed to create app");
        }
      }

      const result = await response.json();
      const generatedCode = result.code || "// No code generated";
      setAgentCode(generatedCode);
      setActivePanel("ide");

      setChatHistory((prev) => [
        ...prev,
        {
          type: "assistant",
          content: `✨ Code generated via ${provider}. Check the Agent IDE and Preview panel.`,
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setAgentCode("// Error generating code");
      setChatHistory((prev) => [
        ...prev,
        {
          type: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Epic Loading Screen with 3 Aeon characters */}
      {!isAppReady && (
        <LoadingScreen onComplete={() => setIsAppReady(true)} minDisplayTime={2800} />
      )}

      <div className={`h-screen flex transition-opacity duration-500 ${isAppReady ? 'opacity-100' : 'opacity-0'}`}>
        {/* Project Sidebar */}
        <ProjectSidebar
          ref={projectsRefreshRef}
          currentProjectId={currentProject?.id || null}
          onSelectProject={handleSelectProject}
          onNewProject={handleNewProject}
        />

        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          onCreate={handleCreateProject}
          isLoading={isCreatingProject}
        />

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col border-r">
          {/* Header */}
          <div className="border-b p-3 h-14 flex items-center justify-between">
            <h1 className="text-lg font-semibold truncate">
              {currentProject?.name || "New Project"}
            </h1>
            <span className="text-xs text-muted-foreground">
              {currentProject ? "Iterating..." : "Start building"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="text-center mt-16">
                <div className="text-6xl mb-6">🚀</div>
                <p className="text-3xl font-semibold mb-2">What shall we build?</p>
                <p className="text-muted-foreground">
                  Describe your app and watch it come to life
                </p>
              </div>
            ) : (
              <>
                <Conversation>
                  <ConversationContent>
                    {chatHistory.map((msg, index) => (
                      <Message from={msg.type} key={index}>
                        <MessageContent>{msg.content}</MessageContent>
                      </Message>
                    ))}
                  </ConversationContent>
                </Conversation>
                {isLoading && (
                  <Message from="assistant">
                    <MessageContent>
                      <div className="flex items-center gap-2">
                        <Loader />
                        Building your app...
                      </div>
                    </MessageContent>
                  </Message>
                )}
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            {!currentProject && chatHistory.length === 0 && (
              <Suggestions>
                <Suggestion
                  onClick={() =>
                    setMessage("Create a modern landing page for a coffee shop with menu and contact sections")
                  }
                  suggestion="Landing page for a coffee shop"
                />
                <Suggestion
                  onClick={() => setMessage("Build a todo app with dark mode and local storage")}
                  suggestion="Todo app with dark mode"
                />
                <Suggestion
                  onClick={() =>
                    setMessage("Create a responsive dashboard with charts and stats cards")
                  }
                  suggestion="Dashboard with charts"
                />
                <Suggestion
                  onClick={() =>
                    setMessage("Build a pricing page with 3 tiers and a toggle for monthly/yearly")
                  }
                  suggestion="Pricing page with tiers"
                />
              </Suggestions>
            )}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <label className="text-xs text-muted-foreground">Provider</label>
              <select
                value={provider}
                onChange={(e) => {
                  const nextProvider = e.target.value as typeof provider;
                  setProvider(nextProvider);
                  setIsCustomModel(false);
                  if (nextProvider === "v0") setModel("v0-1.5-sm");
                  if (nextProvider === "openai") setModel("gpt-4o-mini");
                  if (nextProvider === "deepseek") setModel("deepseek-chat");
                  if (nextProvider === "requesty") setModel(REQUESTY_MODELS[0]?.models[0] || "");
                }}
                className="h-8 rounded-md border bg-background px-2 text-xs"
              >
                <option value="v0">v0</option>
                <option value="openai">OpenAI</option>
                <option value="deepseek">DeepSeek</option>
                <option value="requesty">Requesty</option>
              </select>
              <label className="text-xs text-muted-foreground">Model</label>
              {provider === "requesty" ? (
                <div className="flex w-full flex-wrap items-center gap-2">
                  <select
                    value={isCustomModel ? "__custom" : model}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "__custom") {
                        setIsCustomModel(true);
                        setModel("");
                      } else {
                        setIsCustomModel(false);
                        setModel(value);
                      }
                    }}
                    className="h-8 min-w-[220px] flex-1 rounded-md border bg-background px-2 text-xs"
                  >
                    {REQUESTY_MODELS.map((group) => (
                      <optgroup key={group.group} label={group.group}>
                        {group.models.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="__custom">Custom...</option>
                  </select>
                  {isCustomModel && (
                    <input
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Enter Requesty model id"
                      className="h-8 min-w-[220px] flex-1 rounded-md border bg-background px-2 text-xs"
                    />
                  )}
                </div>
              ) : (
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="model id"
                  className="h-8 min-w-[180px] flex-1 rounded-md border bg-background px-2 text-xs"
                />
              )}
            </div>
            <PromptInput
              onSubmit={handleSendMessage}
              isLoading={isLoading}
              className="w-full"
            >
              <PromptInputTextarea
                onChange={(e) => setMessage(e.target.value)}
                value={message}
                className="pr-12 min-h-[60px]"
              />
              <PromptInputSubmit
                className="absolute bottom-3 right-3"
                disabled={!message.trim()}
                status={isLoading ? "streaming" : "ready"}
              />
            </PromptInput>
            {currentProject && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Keep chatting to iterate on your app
              </p>
            )}
          </div>
        </div>

        {/* Preview / IDE Panel */}
        <div className="w-1/2 flex flex-col bg-muted/30">
          {isPreviewPanel ? (
            <WebPreview isLoading={isLoading}>
              <WebPreviewNavigation>
                <div className="flex items-center gap-1 mr-2">
                  <Button
                    variant={activePanel === "preview" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActivePanel("preview")}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActivePanel("ide")}
                  >
                    Agent IDE
                  </Button>
                </div>
                <WebPreviewUrl
                  readOnly
                  placeholder="Live preview"
                  value={agentCode ? "v0:local-preview" : currentProject?.demoUrl || ""}
                />
              </WebPreviewNavigation>
              <WebPreviewBody
                src={currentProject?.demoUrl || undefined}
                srcDoc={
                  agentCode
                    ? `<!doctype html><html><head><meta charset="utf-8" /><script src="https://cdn.tailwindcss.com"></script></head><body>${agentCode}</body></html>`
                    : undefined
                }
              />
            </WebPreview>
          ) : (
            <AgentIDE
              code={agentCode}
              onChange={setAgentCode}
              activePanel={activePanel}
              onSwitchToPreview={() => setActivePanel("preview")}
              onSwitchToIDE={() => setActivePanel("ide")}
            />
          )}
        </div>
      </div>
    </>
  );
}
