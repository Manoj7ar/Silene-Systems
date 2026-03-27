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

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  let body: {
    action?: "brief" | "chat";
    messages?: ChatMessage[];
    userMessage?: string;
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

  const system = SYSTEM + JSON.stringify(ctx);

  if (body.action === "brief") {
    const reply = await runAiPrompt(system, BRIEF_PROMPT);
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

    const reply = await runAiPrompt(system, userPayload);
    return NextResponse.json({ reply });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
