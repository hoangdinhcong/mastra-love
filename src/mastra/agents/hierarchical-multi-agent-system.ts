import { ollama } from 'ollama-ai-provider';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core';
import z from 'zod';
import { LibSQLStore } from '@mastra/libsql';
import { Memory } from '@mastra/memory';

const llm = ollama('llama3.2');

/** Copywriter Agent */

const copywriterAgent = new Agent({
    name: 'Copywriter',
    instructions: "You are a copywriter agent that writes blog post copy.",
    model: llm,
});

const copywriterTool = createTool({
    id: 'copywriter-agent',
    description: 'Calls the copywriter agent to write blog post copy.',
    inputSchema: z.object({
        topic: z.string().describe("Blog post topic"),
    }),
    outputSchema: z.object({
        copy: z.string().describe("Blog post copy"),
    }),
    execute: async ({ context }) => {
        const result = await copywriterAgent.generate(
            `Write a blog post about ${context.topic}`
        )
        return {
            copy: result.text,
        }
    },
})

/** Editor Agent */

const editorAgent = new Agent({
    name: 'Editor',
    instructions: "You are an editor agent that edits blog post copy.",
    model: llm,
})

const editorTool = createTool({
    id: 'editor-agent',
    description: 'Calls the editor agent to edit blog post copy.',
    inputSchema: z.object({
        copy: z.string().describe("Blog post copy"),
    }),
    outputSchema: z.object({
        copy: z.string().describe("Blog post copy"),
    }),
    execute: async ({ context }) => {
        const result = await editorAgent.generate(
            `Edit the following blog post only returning the edited copy: ${context.copy}`,
        )
        return {
            copy: result.text,
        }
    },
})

/** Publisher Agent */

const publisherAgent = new Agent({
    name: 'Publisher Agent',
    instructions: "You are a publisher agent that first calls the Copywriter agent to write blog post copy about a specific topic and then calls the Editor agent to edit the copy. Just return the final edited copy.",
    model: llm,
    tools: {
        copywriterTool,
        editorTool,
    },
    memory: new Memory({
        storage: new LibSQLStore({
          url: 'file:../mastra1.db', // path is relative to the .mastra/output directory
        }),
      }),
})

export { publisherAgent }

// const mastra = new Mastra({
//     agents: {
//         publisherAgent,
//     }
// })

// async function main() {
//     const agent = mastra.getAgent("publisherAgent");
//     const result = await agent.generate(
//         "Write a blog post about Angular frameworks. Only return the final edited copy.",
//     );
//     console.log(result.text);
// }

// main();