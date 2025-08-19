export type Usage = {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
}

export type AgentUsage = {
  models: Record<string, Usage>;
  tools: Record<string, number>;
};