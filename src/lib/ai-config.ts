import type { AiConfig } from "@/lib/types"

const KEY = "mengchu-ai-config"

export const defaultAiConfig: AiConfig = {
  baseUrl: "https://api.siliconflow.cn/v1",
  model: "Qwen/Qwen2.5-7B-Instruct",
  apiKey: "",
}

export function loadAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...defaultAiConfig }
    return { ...defaultAiConfig, ...JSON.parse(raw) }
  } catch {
    return { ...defaultAiConfig }
  }
}

export function saveAiConfig(config: AiConfig) {
  localStorage.setItem(KEY, JSON.stringify(config))
}
