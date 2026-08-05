// Routes a user message: local command engine first (instant, offline),
// then optionally the Claude API if the user has saved a key in Settings.
import Anthropic from '@anthropic-ai/sdk'
import { runCommand } from '../nlp/commands'
import { parseInput } from '../nlp/parse'
import { todayKey, fmtRange } from '../state/time'
import { isOverdue, overdueDays, displayDateKey } from '../state/rollover'

// The structured actions Claude is allowed to return.
const ACTION_TOOL = {
  name: 'apply_actions',
  description: 'Apply changes to the user\'s task list and reply to them.',
  input_schema: {
    type: 'object',
    properties: {
      reply: { type: 'string', description: 'A short, friendly reply to show the user.' },
      actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            op: { type: 'string', enum: ['add', 'move', 'complete', 'delete'] },
            title: { type: 'string', description: 'For add: the task title.' },
            date: { type: 'string', description: 'YYYY-MM-DD for add/move.' },
            start: { type: ['integer', 'null'], description: 'Minutes from midnight, or null.' },
            end: { type: ['integer', 'null'] },
            taskIds: { type: 'array', items: { type: 'string' }, description: 'Targets for move/complete/delete.' },
          },
          required: ['op'],
        },
      },
    },
    required: ['reply'],
  },
}

function snapshot(tasks) {
  const today = todayKey()
  return tasks
    .filter((t) => !t.done)
    .map((t) => ({
      id: t.id,
      title: t.title,
      date: t.date,
      when: t.anytime ? 'anytime' : fmtRange(t.start, t.end),
      overdueDays: overdueDays(t, today),
      showsOn: displayDateKey(t, today),
    }))
}

// Returns { reply, actions: [{type, ...}] }  — actions are dispatched by caller.
export async function ask(message, tasks, settings) {
  // 1) Local-first.
  const local = runCommand(message, tasks)
  if (local) {
    return { reply: local.reply, actions: local.action ? [local.action] : [], source: 'local' }
  }

  // 2) If it looks like "add X", parse it locally too.
  if (/^(add|create|new|remind me to|i need to)\b/i.test(message.trim())) {
    const cleaned = message.replace(/^(add|create|new|remind me to|i need to)\s+/i, '')
    const p = parseInput(cleaned)
    if (p.title) {
      return {
        reply: `Added “${p.title}”${p.detectedTime ? ' · ' + fmtRange(p.start, p.end) : ''}.`,
        actions: [{ type: 'add', title: p.title, date: p.date, start: p.start, end: p.end }],
        source: 'local',
      }
    }
  }

  // 3) Claude fallback (only if a key is configured).
  if (!settings.aiKey) {
    return {
      reply:
        "I can do that with a bit more brainpower — add a Claude API key in Settings to unlock free-form requests. For now I understand things like “what's overdue”, “move today's tasks to tomorrow”, or “add Dentist Friday at 3”.",
      actions: [],
      source: 'local',
    }
  }

  try {
    const client = new Anthropic({ apiKey: settings.aiKey, dangerouslyAllowBrowser: true })
    const today = todayKey()
    const res = await client.messages.create({
      model: settings.aiModel || 'claude-haiku-4-5',
      max_tokens: 1024,
      tools: [ACTION_TOOL],
      tool_choice: { type: 'tool', name: 'apply_actions' },
      system:
        `You are StackTask, a fast, warm task assistant. Today is ${today}. ` +
        `Times are minutes-from-midnight (e.g. 3pm = 900). ` +
        `Use the user's current tasks (JSON) to resolve references, then call apply_actions. ` +
        `Keep replies to one short sentence.`,
      messages: [
        {
          role: 'user',
          content: `My tasks:\n${JSON.stringify(snapshot(tasks))}\n\nRequest: ${message}`,
        },
      ],
    })

    const tool = res.content.find((c) => c.type === 'tool_use')
    if (!tool) return { reply: 'Hmm, I could not parse that.', actions: [], source: 'claude' }
    const { reply, actions = [] } = tool.input
    const mapped = actions
      .map((a) => {
        if (a.op === 'add') return { type: 'add', title: a.title, date: a.date || today, start: a.start ?? null, end: a.end ?? null }
        if (a.op === 'move') return { type: 'bulkPatch', ids: a.taskIds || [], patch: { date: a.date } }
        if (a.op === 'complete') return { type: 'completeMany', ids: a.taskIds || [] }
        if (a.op === 'delete') return { type: 'deleteMany', ids: a.taskIds || [] }
        return null
      })
      .filter(Boolean)
    return { reply: reply || 'Done.', actions: mapped, source: 'claude' }
  } catch (err) {
    return { reply: `Claude error: ${err.message || err}. Check your key/model in Settings.`, actions: [], source: 'error' }
  }
}
