import { z } from 'zod';

export const PlatformSchema = z.enum([
  'whatsapp',
  'telegram',
  'discord',
  'slack',
  'google_chat',
  'web'
]);

export type Platform = z.infer<typeof PlatformSchema>;

export const AttachmentTypeSchema = z.enum([
  'image',
  'video',
  'audio',
  'document',
  'location',
  'contact',
  'sticker'
]);

export type AttachmentType = z.infer<typeof AttachmentTypeSchema>;

export const CommonAttachmentSchema = z.object({
  type: AttachmentTypeSchema,
  url: z.string().url().optional(),
  data: z.string().optional(), // Base64 data if URL is not used
  mimeType: z.string().optional(),
  name: z.string().optional(),
  size: z.number().optional(),
  caption: z.string().optional(),
  // Location specific
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // Contact specific
  vcard: z.string().optional()
});

export type CommonAttachment = z.infer<typeof CommonAttachmentSchema>;

export const CommonMessageSchema = z.object({
  id: z.string(),
  platform: PlatformSchema,
  from: z.string(),
  to: z.string(),
  channelId: z.string().optional(), // Specific account/bot ID on the platform
  content: z.object({
    text: z.string().optional(),
    attachments: z.array(CommonAttachmentSchema).optional(),
    poll: z.object({
      question: z.string(),
      options: z.array(z.string()),
      multipleAnswers: z.boolean().default(false)
    }).optional()
  }),
  metadata: z.record(z.string(), z.any()).optional(),
  timestamp: z.number().default(() => Date.now()),
  replyTo: z.string().optional()
});

export type CommonMessage = z.infer<typeof CommonMessageSchema>;
