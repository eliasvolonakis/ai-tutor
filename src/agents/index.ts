import { Agent, tool } from "@openai/agents";
import { z } from "zod";

// Define a tool
const randomNumberTool = tool({
  name: "random_number",
  description: "Generate a random number up to the provided maximum.",
  parameters: z.object({
    max: z.number(),
  }),
  async execute({ max }: { max: number }) {
    const n = Math.floor(Math.random() * (max + 1));
    return { number: n };
  },
});

// Define the agent
export const simpleAgent = new Agent({
  name: "Simple Agent",
  instructions: "Generate a random number using the tool",
  tools: [randomNumberTool],
  outputType: z.object({
    number: z.number(),
  }),
});
