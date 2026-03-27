import { fetchDashboardAiContext } from "@/lib/dashboard/ai-context";
import { runAiPrompt } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SYSTEM = `You are the ElderCare Companion voice assistant. The user is on their health dashboard.
Rules:
- Answer ONLY using the JSON dashboard data below. It is refreshed on every request — treat it as current.
- If something is not in the data, say clearly that you do not see it in their records.
- Be warm and plain-language. This will be read aloud: use short sentences, no markdown, no bullet symbols.
- Never diagnose or prescribe; remind them to speak with a clinician for medical decisions.
- Keep typical replies to a few sentences unless they ask for more detail.

Dashboard data (JSON):
`;

const BRIEF_PROMPT = `Give a single spoken overview (about 90 seconds when read aloud) of this dashboard for the patient.
Cover: how they are doing at a glance, medications listed, mood pattern if any, adherence in plain words, upcoming visits, and any alerts.
If a section is empty, mention it briefly. End with one encouraging line.`;

/** Appended to the system prompt for the floating voice agent (dialogue + opening turn). */
const DIALOGUE_INSTRUCTIONS = `
Voice dialogue mode (floating agent):
- Have a natural back-and-forth. You may ask one short, caring question at a time when it helps the user reflect, grounded in the dashboard data.
- Prefer brief acknowledgments, then a follow-up question when useful. Avoid lists; no markdown.
- If they give short answers, respond warmly and ask one concrete next question when appropriate.
`;

const VOICE_OPEN_PROMPT = `You are starting a voice conversation. Give a brief welcome (one or two sentences) using their name from the data if present.
Mention one concrete observation from their dashboard (e.g. mood pattern, medication count, adherence, next appointment, or an alert).
Then ask exactly ONE gentle, specific question to invite them to talk. Keep the whole turn under about 80 words.`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  let body: {
    action?: "brief" | "chat" | "voiceOpen";
    messages?: ChatMessage[];
    userMessage?: string;
    /** When true (with action chat), uses dialogue-oriented instructions for the floating agent. */
    dialogueMode?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let ctx;
  try {
    ctx = await fetchDashboardAiContext(supabase, user.id);
  } catch (e) {
    console.error("[dashboard-chat] context fetch:", e);
    return NextResponse.json(
      { error: "Could not load dashboard data." },
      { status: 500 }
    );
  }

  const dataJson = JSON.stringify(ctx);
  const baseSystem = SYSTEM + dataJson;

  if (body.action === "brief") {
    const reply = await runAiPrompt(baseSystem, BRIEF_PROMPT);
    return NextResponse.json({ reply });
  }

  if (body.action === "voiceOpen") {
    const system = baseSystem + DIALOGUE_INSTRUCTIONS;
    const reply = await runAiPrompt(system, VOICE_OPEN_PROMPT);
    return NextResponse.json({ reply });
  }

  if (body.action === "chat") {
    const userMessage = body.userMessage?.trim() ?? "";
    if (!userMessage) {
      return NextResponse.json({ error: "Missing userMessage" }, { status: 400 });
    }

    const prior = Array.isArray(body.messages) ? body.messages : [];
    const historyBlock = prior
      .slice(-12)
      .map((m) =>
        m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`
      )
      .join("\n\n");

    const userPayload = historyBlock
      ? `${historyBlock}\n\nUser: ${userMessage}`
      : `User: ${userMessage}`;

    const system =
      body.dialogueMode === true ? baseSystem + DIALOGUE_INSTRUCTIONS : baseSystem;
    const reply = await runAiPrompt(system, userPayload);
    return NextResponse.json({ reply });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
