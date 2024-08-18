import { pipeline, env, PipelineType } from "@xenova/transformers";

// Skip local model check
env.allowLocalModels = false;

class PipelineSingleton {
  static task: PipelineType = 'text-generation';
  static model = 'Xenova/llama2.c-stories15M';
  static instance: any = null;

  static async getInstance(progress_callback: any = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

// Function to generate query response
export const callLLM = async (query: string) => {
  const generator = await PipelineSingleton.getInstance();

  // Adjust these parameters to get longer responses
  const output = await generator(query, {
    max_new_tokens: 100,  // Increase this for longer responses
    temperature: 0.7,     // Adjust for more varied responses
    top_p: 0.9,           // Nucleus sampling
    repetition_penalty: 1.2,  // Discourage repetition
  });

  if (Array.isArray(output) && output.length > 0 && output[0].generated_text) {
    return output[0].generated_text.trim();
  } else {
    throw new Error("Unexpected output format from text generation model");
  }
}