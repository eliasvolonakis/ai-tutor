import { Agent, tool } from '@openai/agents';
import { z } from 'zod';

const randomNumberTool = tool({
  name: 'random_number',
  description: 'Generate a random number up to the provided maximum.',
  // JSON Schema with additionalProperties:false
  parameters: {
    type: 'object',
    properties: { max: { type: 'number' } },
    required: ['max'],
    additionalProperties: false,
  } as const,
  async execute({ max }: { max: number }) {
    const n = Math.floor(Math.random() * (max + 1));
    return { number: n };
  },
});

export const startAgent = new Agent({
  name: 'Start Agent',
  instructions: 'Generate a random number',
  tools: [randomNumberTool],
  // ✅ Zod => 'json_object' under the hood
  outputType: z.object({ number: z.number() }).strict(),
});

function attachHooks(agent: Agent<any, any>) {
  agent.on('agent_start', (_ctx, agent) => {
    console.log(`${agent.name} started`);
  });
  agent.on('agent_end', (_ctx, output) => {
    console.log(`${agent.name} ended with output ${JSON.stringify(output)}`);
  });
  agent.on('agent_tool_start', (_ctx, tool) => {
    console.log(`${agent.name} started tool ${tool.name}`);
  });
  agent.on('agent_tool_end', (_ctx, tool, output) => {
    console.log(`${agent.name} tool ${tool.name} ended with output ${JSON.stringify(output)}`);
  });
}
attachHooks(startAgent);
