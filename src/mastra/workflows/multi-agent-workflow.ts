import { ollama } from "ollama-ai-provider";
import { Agent } from "@mastra/core/agent";
import { createStep, createWorkflow } from "@mastra/core";
import z from "zod";


const llm = ollama('llama3.2');

const copywriterAgent = new Agent({
    name: 'Copywriter',
    instructions: "You are a copywriter agent that writes blog post copy.",
    model: llm,
});

const copywriterStep = createStep({
    id: 'copywriterStep',
    inputSchema: z.object({
        topic: z.string().describe("Blog post topic"),
    }),
    outputSchema: z.object({
        copy: z.string().describe("Blog post copy"),
    }),
    execute: async ({ inputData }) => {
        if (!inputData?.topic) {
            throw new Error("Topic not found in trigger data");
        }

        const result = await copywriterAgent.generate(
            `Write a blog post about ${inputData.topic}`
        )
        return {
            copy: result.text,
        }
    },
});


const editorAgent = new Agent({
    name: 'Editor',
    instructions: "You are an editor agent that edits blog post copy.",
    model: llm,
});

const editorStep = createStep({
    id: 'editorStep',
    inputSchema: z.object({
        copy: z.string(),
    }),
    outputSchema: z.object({
        finalCopy: z.string(),
    }),
    execute: async ({ inputData }) => {
        if (!inputData?.copy) {
            throw new Error("Copy not found in trigger data");
        }

        const result = await editorAgent.generate(
            `Edit the following blog post only returning the edited copy: ${inputData.copy}`
        )
        return {
            finalCopy: result.text,
        }
    },
});

const multiAgentWorkflow = createWorkflow({
    id: 'multi-agent-workflow',
    inputSchema: z.object({
        topic: z.string().describe("Blog post topic"),
    }),
    outputSchema: z.object({
        finalCopy: z.string().describe("Blog post copy"),
    }),
})
    .then(copywriterStep)
    .then(editorStep)
    .commit();

export { multiAgentWorkflow };
