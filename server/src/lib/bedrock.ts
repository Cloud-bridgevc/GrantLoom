import { AnthropicBedrockMantle } from '@anthropic-ai/bedrock-sdk';

export const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-opus-5-5';
const client = new AnthropicBedrockMantle({ awsRegion: process.env.AWS_REGION });

export class ModelRefusal extends Error {}

/**
 * Ask Claude to return data through a single strict tool. Forced tool_choice is not available on this model,
 * so the tool is offered with `auto` and the prompt names it; the result is validated by the caller.
 */
export async function callForJson<T>(opts: {
  system: string;
  user: string;
  tool: { name: string; description: string; input_schema: Record<string, unknown> };
  effort?: 'low' | 'medium' | 'high';
}): Promise<T> {
  const stream = client.messages.stream({
    model: MODEL_ID,
    max_tokens: 32000,
    output_config: { effort: opts.effort ?? 'high' },
    system: opts.system,
    tools: [{ ...opts.tool, strict: true }],
    tool_choice: { type: 'auto' },
    messages: [{ role: 'user', content: `${opts.user}\n\nReturn your result by calling the ${opts.tool.name} tool exactly once.` }],
  } as never);
  const msg = await stream.finalMessage();
  if (msg.stop_reason === 'refusal') throw new ModelRefusal('Model declined the request; route to human review.');
  if (msg.stop_reason === 'max_tokens') throw new Error('Model output truncated (max_tokens).');
  const call = msg.content.find((b) => b.type === 'tool_use' && b.name === opts.tool.name);
  if (!call || call.type !== 'tool_use') throw new Error(`Model did not call ${opts.tool.name}.`);
  return call.input as T;
}
