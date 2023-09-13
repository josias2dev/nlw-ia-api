import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { createReadStream } from "fs";
import { openai } from "../lib/openai";

export async function createTranscriptionRoute(app: FastifyInstance) {
    app.post("/videos/:videoId/transcription", async (request, reply) => {
        [
            console.log(request.params)
        ]
        const paramsSchema = z.object({
            videoId: z.string().uuid(),
        })

        const { videoId } = paramsSchema.parse(request.params)

        const bodySchema = z.object({
            prompt: z.string(),
        })

        const { prompt } = bodySchema.parse(request.body)

        const video = await prisma.video.findUniqueOrThrow({
            where: {
                id: videoId,
            }
        })

        const videoPath = video.path
        console.log(videoPath)
        const audioReadStream = createReadStream(videoPath)

        const response = await openai.audio.transcriptions.create({
            file: audioReadStream,
            model: "whisper-1",
            language: "pt",
            response_format: "json",
            temperature: 0.5,
            prompt
        })

        await prisma.video.update({
            where: {
                id: videoId,
            },
            data: {
                transcription: response.text,
            }
        })
        
        return {
            response: response.text,
            videoPath: video.path,
            vide: video,
        }

    })
}