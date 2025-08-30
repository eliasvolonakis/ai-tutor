import {  run } from '@openai/agents';
import {startAgent} from '../agents';

export const postHandler = async () => {

  const result = await run(startAgent, 'Generate a random number up to 10');
  return {data: result.finalOutput};
};
