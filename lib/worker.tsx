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
  // In a real application, replace this with an actual API call
  // await new Promise(resolve => setTimeout(resolve, 1000));
  // return `Response to: ${query}`;

  // Retrieve the text generator pipeline. When called for the first time,
  // this will load the pipeline and save it for future use.
  const generator = await PipelineSingleton.getInstance();

  // Actually perform the classification
  const output = await generator(query);

  // Send the output back to the main thread
  // const response = {
  //   status: 'complete',
  //   output: output,
  // };

  // Extract the generated text from the output
  if (Array.isArray(output) && output.length > 0 && output[0].generated_text) {
    return output[0].generated_text;
  } else {
    throw new Error("Unexpected output format from text generation model");
  }
}
