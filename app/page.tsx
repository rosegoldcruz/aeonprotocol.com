"use client";

import { useState, useEffect } from "react";

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
import { Loader } from "@/components/ai-elements/loader";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { ProjectSidebar } from "@/components/project-sidebar";

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

export default function Home() {
  const [message, setMessage] = useState("");
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

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
    setCurrentProject(null);
    setChatHistory([]);
    setMessage("");
  };

  const handleSendMessage = async (promptMessage: PromptInputMessage) => {
    const hasText = Boolean(promptMessage.text);

    if (!hasText || isLoading) return;

    const userMessage = promptMessage.text?.trim() || "";
    setMessage("");
    setIsLoading(true);

    setChatHistory((prev) => [...prev, { type: "user", content: userMessage }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          chatId: currentProject?.chatId,
          projectId: currentProject?.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create app");
      }

      const result = await response.json();
      
      // Update current project with the new data
      setCurrentProject({
        tenantId: "00000000-0000-0000-0000-000000000000",
        id: result.projectId,
        name: currentProject?.name || userMessage.slice(0, 50),
        chatId: result.id,
        demoUrl: result.demo,
        createdAt: currentProject?.createdAt || new Date().toISOString(),
      });

      setChatHistory((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "✨ Your app is ready! Check the preview panel on the right.",
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
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
    }
  };

  return (
    <div className="h-screen flex">
      {/* Project Sidebar */}
      <ProjectSidebar
        currentProjectId={currentProject?.id || null}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
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

      {/* Preview Panel */}
      <div className="w-1/2 flex flex-col bg-muted/30">
        <WebPreview isLoading={isLoading}>
          <WebPreviewNavigation>
            <WebPreviewUrl
              readOnly
              placeholder="Your app preview URL..."
              value={currentProject?.demoUrl || ""}
            />
          </WebPreviewNavigation>
          <WebPreviewBody src={currentProject?.demoUrl || undefined} />
        </WebPreview>
      </div>
    </div>
  );
}
