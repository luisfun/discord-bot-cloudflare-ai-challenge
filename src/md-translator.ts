import type { Gateway } from '@luisfun/workers-ai-gateway'
import { Ai, modelMappings } from '@cloudflare/ai'
type ModelMappings = typeof modelMappings

type TranslationModels = ModelMappings['translation']['models'][number]
type TranslationInputs = ModelMappings['translation']['class']['prototype']['inputs']
type CacheHeaders = {
  'cf-skip-cache'?: boolean
  'cf-cache-ttl'?: number
}

class MDTranslator {
  protected ai: Ai | Gateway
  constructor(ai: Ai | Gateway) {
    this.ai = ai
  }
  protected async trans(model: TranslationModels, inputs: TranslationInputs, headers?: HeadersInit | CacheHeaders) {
    if (!inputs.text) return inputs.text
    if (this.ai instanceof Ai) return (await this.ai.run(model, inputs)).translated_text
    else return (await this.ai.run(model, inputs, headers)).outputs.translated_text
  }

  async run(model: TranslationModels, inputs: TranslationInputs, headers?: HeadersInit | CacheHeaders) {
    const { source_lang, target_lang } = inputs
    return await mdTranslator(
      (text: string) => this.trans(model, { text, source_lang, target_lang }, headers),
      inputs.text,
    )
  }
}

export const mdTranslator = async (translator: (text: string) => Promise<string | undefined>, text: string) =>
  (
    await Promise.all(
      text.split('```').map(async (segment, i) => {
        // this is code block
        if (i % 2 === 1) return segment
        // not code block
        return (
          await Promise.all(
            segment.split('\n').map(async para => {
              // Bulleted List
              if (para.startsWith('- ')) return '- ' + (await translator(para.slice(2)))
              // Numbered List
              const numPrefix = para.match(/^(\d+\.\s)/)?.[0]
              if (numPrefix) return numPrefix + (await translator(para.slice(numPrefix.length)))
              // Normal Paragraph
              return translator(para)
            }),
          )
        ).join('\n')
      }),
    )
  ).join('```')
