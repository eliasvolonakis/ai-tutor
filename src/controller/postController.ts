import {  run } from '@openai/agents';
import {simpleAgent as startAgent} from '../agents';

export const postHandler = async () => {
try{
  const result = await run(startAgent, 'Generate a random number up to 10');
  return {data: result.finalOutput};
  } catch(e){
    console.log(e)
  return {data: 400};
  }
};
