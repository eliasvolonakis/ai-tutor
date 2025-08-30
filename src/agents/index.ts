import { Agent, tool } from '@openai/agents';
import { z } from 'zod';

const randomNumberTool = tool({
  name: 'random_number',
  description: 'Generate a random number up to the provided maximum.',
  parameters: z.object({ max: z.number() }).strict(),
  execute: async ({ max }: { max: number }) => {
    return Math.floor(Math.random() * (max + 1)).toString();
  },
});


export const startAgent = new Agent({
  name: 'Start Agent',
  instructions:
    "Generate a random number",
  tools: [randomNumberTool],
  outputType: z.object({ number: z.number() })
});

function attachHooks(agent: Agent<any, any>) {
  agent.on('agent_start', (_ctx, agent) => {
    console.log(`${agent.name} started`);
  });
  agent.on('agent_end', (_ctx, output) => {
    console.log(`${agent.name} ended with output ${output}`);
  });
  agent.on('agent_handoff', (_ctx, nextAgent) => {
    console.log(`${agent.name} handed off to ${nextAgent.name}`);
  });
  agent.on('agent_tool_start', (_ctx, tool) => {
    console.log(`${agent.name} started tool ${tool.name}`);
  });
  agent.on('agent_tool_end', (_ctx, tool, output) => {
    console.log(`${agent.name} tool ${tool.name} ended with output ${output}`);
  });
}

attachHooks(startAgent);
