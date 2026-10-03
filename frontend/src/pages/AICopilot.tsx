import React, { useState } from 'react'
import { apiClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Send, Bot, User, Zap, Sparkles, AlertCircle, Database, CheckCircle } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  evidence?: Array<{ label?: string; value?: string; source?: string }>
}

const PREDEFINED_QUESTIONS = [
  "What is the current ICU occupancy and risk?",
  "How many patients are waiting in the ED?",
  "What is the current bed capacity across departments?",
  "What are the recommended actions right now?",
  "Summarize the staffing workload situation.",
  "Give me the morning operational brief."
]

export default function AICopilot() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I am your YODHA AI Copilot. I analyze live hospital operational streams and provide data-grounded insights. How can I assist your team today?' 
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const askQuestion = async (question: string) => {
    if (!question.trim()) return
    
    const userMsg: Message = { role: 'user', content: question }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.post('/copilot/ask', { question })
      setMessages((prev) => [
        ...prev, 
        { 
          role: 'assistant', 
          content: response.data.answer || 'No response returned.',
          evidence: response.data.evidence || []
        }
      ])
    } catch (err: any) {
      setError(err.message || 'Failed to query YODHA Copilot engine')
      setMessages((prev) => [
        ...prev, 
        { 
          role: 'assistant', 
          content: 'Unable to reach the live operational database. Please check connectivity and try again.' 
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">AI Copilot</h1>
          <p className="text-muted-foreground text-sm">Direct, evidence-backed queries on live hospital flow and resources</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1">
            <Sparkles className="w-3.5 h-3.5" />
            AI Decision Support (Deterministic)
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 overflow-hidden min-h-0">
        {/* Suggested Queries */}
        <div className="lg:col-span-1 space-y-3 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Quick Inquiries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2 overflow-y-auto flex-1">
              {PREDEFINED_QUESTIONS.map((q, i) => (
                <button 
                  key={i} 
                  type="button"
                  onClick={() => askQuestion(q)}
                  disabled={loading}
                  className="w-full text-left p-2.5 rounded-lg border border-border/60 hover:border-primary/50 hover:bg-accent/50 transition-all text-xs font-medium text-foreground disabled:opacity-50 flex items-start gap-2"
                >
                  <span className="text-primary mt-0.5">•</span>
                  <span>{q}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Chat Stream */}
        <Card className="lg:col-span-3 flex flex-col h-full overflow-hidden border-border/80">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary border border-primary/20'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  <div className="space-y-2.5">
                    <div className={`p-3.5 rounded-xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-card border border-border/80 text-foreground'
                    }`}>
                      {msg.content}
                    </div>
                    
                    {msg.evidence && msg.evidence.length > 0 && (
                      <div className="rounded-lg bg-muted/40 border border-border/60 p-2.5 space-y-1.5">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Database className="w-3 h-3 text-primary" /> Live Evidence & Telemetry
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {msg.evidence.map((ev, i) => (
                            <div key={i} className="text-xs px-2.5 py-1 rounded bg-background border border-border/40 flex justify-between items-center">
                              <span className="text-muted-foreground">{ev.label || ev.source || 'Metric'}:</span>
                              <span className="font-semibold text-foreground ml-2">{ev.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%] items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="p-3 rounded-xl bg-card border text-xs text-muted-foreground flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    Querying operational database & models...
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 text-xs text-destructive bg-destructive/10 rounded-lg flex items-center gap-2 border border-destructive/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </CardContent>

          {/* Prompt Input Form */}
          <div className="p-3 border-t bg-muted/20">
            <form 
              onSubmit={(e) => { e.preventDefault(); askQuestion(input); }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about hospital capacity, admissions, staffing, or bottleneck trends..."
                disabled={loading}
                className="flex-1 text-sm bg-background"
              />
              <Button type="submit" disabled={loading || !input.trim()} className="gap-1.5 shrink-0">
                <Send className="w-4 h-4" />
                <span>Ask</span>
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
