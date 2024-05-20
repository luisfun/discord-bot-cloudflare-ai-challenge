import { env } from 'node:process'
import { modelMappings } from '@cloudflare/ai'
import { BooleanOption, Command, Option, register } from 'discord-hono'
import { config } from 'dotenv'
config({ path: '.dev.vars' })

const noCatalogModels = [
  '@cf/mistral/mixtral-8x7b-instruct-v0.1-awq',
  '@cf/deepseek-ai/deepseek-coder-7b-instruct-v1.5',
  '@cf/nexaaidev/octopus-v2',
  '@cf/m-a-p/opencodeinterpreter-ds-6.7b',
  '@cf/fblgit/una-cybertron-7b-v2-bf16',
  '@cf/sven/test',
]
const baseTextModels = modelMappings['text-generation'].models.filter(
  m => !m.includes('-lora') && !m.includes('-base') && !noCatalogModels.includes(m),
)
const codeModels = baseTextModels.filter(m => m.includes('code'))
const mathModels = baseTextModels.filter(m => m.includes('math'))
const textModels = baseTextModels.filter(m => !codeModels.includes(m) && !mathModels.includes(m))
const imageModels = modelMappings['text-to-image'].models.filter(
  m => !m.includes('-img2img') && !m.includes('-inpainting'),
)

const options = (promptDesc: string, defaultModel: string, models: string[]) => [
  new Option('prompt', promptDesc).required(),
  new BooleanOption('translation', 'Translation (Default True)'),
  new Option('model', `Select Model (Default ${defaultModel})`).choices(
    ...models.map(m => ({ name: m.split('/').slice(-1)[0], value: m })).sort((a, b) => a.name.localeCompare(b.name)),
  ),
]

const commands = [
  new Command('text', 'Text to Text').options(...options('Ask AI', 'mistral-7b-instruct-v0.1', textModels)),
  new Command('code', 'Code Hints').options(...options('Ask AI', 'deepseek-coder-6.7b-instruct-awq', codeModels)),
  new Command('math', 'Math Resolution').options(...options('Ask AI', 'deepseek-math-7b-instruct', mathModels)),
  new Command('image', 'Text to Image').options(...options('Image Elements', 'dreamshaper-8-lcm', imageModels)),
]

await register(
  commands,
  env.DISCORD_APPLICATION_ID,
  env.DISCORD_TOKEN,
  //env.DISCORD_TEST_GUILD_ID,
)
