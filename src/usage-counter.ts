/**
 * The UsageCounter class is responsible for tracking the usage of input, output, and total tokens per model.
 */

import { LanguageModelUsage } from "ai";
import { AgentUsage, Usage } from "./types";

export class UsageCounter {
  private modelUsage: Record<
    string,
    { inputTokens: number; outputTokens: number; totalTokens: number }
  >;

  private toolUsage: Record<string, number>;

  /**
   * Constructs a UsageCounter instance and initializes token counts for each model to zero.
   */
  constructor() {
    this.modelUsage = {};
    this.toolUsage = {};
  }

  /**
   * Adds the usage tokens to the current counts for a specific model.
   * @param {string} model - The model name.
   * @param {Usage} usage - The usage object containing input, output, and total tokens.
   * @param {number} [arbitraryUsage=0] - Arbitrary usage value for tools or other non-token-based usages.
   */
  public addUsageTokens(model: string, usage: LanguageModelUsage) {
    console.log(
      `Adding usage tokens for model ${model}: inputTokens=${usage.promptTokens}, outputTokens=${usage.completionTokens}, totalTokens=${usage.totalTokens}`
    );
    if (!this.modelUsage[model]) {
      this.modelUsage[model] = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      };
    }

    this.modelUsage[model].inputTokens += usage.promptTokens;
    this.modelUsage[model].outputTokens += usage.completionTokens;
    this.modelUsage[model].totalTokens += usage.totalTokens;
  }

  /**
   * Adds arbitrary usage for a specific tool.
   * @param {string} toolName - The name of the tool.
   * @param {number} usage - The arbitrary usage value.
   */
  public addToolUsage(toolName: string, usage: number) {
    console.log(`Adding tool usage for ${toolName}: ${usage}`);
    if (!this.toolUsage[toolName]) {
      this.toolUsage[toolName] = 1;
    }
    this.toolUsage[toolName] += usage;
  }

  /**
   * Retrieves the current usage counts for all models.
   * @returns {UsageSummary} An object containing the counts of input, output, total tokens, and arbitrary usage for each model.
   */
  public getUsage(): AgentUsage {
    return {
      models: this.modelUsage,
      tools: this.toolUsage,
    };
  }

  public getFormattedUsage(): string {
    const modelEntries = Object.entries(this.modelUsage).map(
      ([model, usage]) => {
        return `${model}: input=${usage.inputTokens}, output=${usage.outputTokens}, total=${usage.totalTokens}`;
      }
    );
    const toolEntries = Object.entries(this.toolUsage).map(
      ([tool, count]) => `${tool}: ${count}`
    );

    return `Model Usage:\n${modelEntries.join("\n")}\n\nTool Usage:\n${toolEntries.join("\n")}`;

  }
}