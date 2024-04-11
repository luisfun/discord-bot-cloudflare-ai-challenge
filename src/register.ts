import dotenv from 'dotenv'
import process from 'node:process'
import { modelMappings } from '@cloudflare/ai'
import { Command, Option, BooleanOption, register } from 'discord-hono'
dotenv.config({ path: '.dev.vars' })

const codeModels = [
	'@hf/thebloke/deepseek-coder-6.7b-base-awq',
	'@hf/thebloke/deepseek-coder-6.7b-instruct-awq',
	'@hf/thebloke/codellama-7b-instruct-awq',
	'@cf/defog/sqlcoder-7b-2',
]
const mathModels = ['@cf/deepseek-ai/deepseek-math-7b-base', '@cf/deepseek-ai/deepseek-math-7b-instruct']

// choices
const textC = modelMappings['text-generation'].models
	.filter(m => !codeModels.includes(m) && !mathModels.includes(m))
	.map(m => ({ name: m.split('/').slice(-1)[0], value: m }))
const codeC = codeModels.map(m => ({ name: m.split('/').slice(-1)[0], value: m }))
const mathC = mathModels.map(m => ({ name: m.split('/').slice(-1)[0], value: m }))
const imageC = modelMappings['text-to-image'].models
	.filter(m => !m.includes('-img2img') && !m.includes('-inpainting'))
	.map(m => ({ name: m.split('/').slice(-1)[0], value: m }))

const options = (promptDesc: string, defaultModel: string, choices: { name: string; value: string }[]) => [
	new Option('prompt', promptDesc).required(),
	new BooleanOption('translation', 'Translation (Default True)'),
	new Option('model', `Select Model (Default ${defaultModel})`).choices(
		...choices.sort((a, b) => a.name.localeCompare(b.name)),
	),
]

const commands = [
	new Command('text', 'Text to Text').options(...options('Ask AI', 'mistral-7b-instruct-v0.1', textC)),
	new Command('code', 'Program Code Hints').options(...options('Ask AI', 'deepseek-coder-6.7b-instruct-awq', codeC)),
	new Command('math', 'Math Resolution').options(...options('Ask AI', 'deepseek-math-7b-instruct', mathC)),
	new Command('image', 'Text to Image').options(...options('Image Elements', 'Default dreamshaper-8-lcm', imageC)),
]

await register(
	commands,
	process.env.DISCORD_APPLICATION_ID,
	process.env.DISCORD_TOKEN,
	//process.env.DISCORD_TEST_GUILD_ID,
)
