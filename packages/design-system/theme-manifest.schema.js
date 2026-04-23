const { z } = require('zod');

const TokenValue = z.string().min(1);

const ThemeManifestSchema = z.object({
  meta: z.object({
    name: z.string().min(1),
    version: z.string().min(1),
    source: z.string().min(1),
    updatedAt: z.string().datetime()
  }),

  colors: z.record(TokenValue),

  fontFamily: z.record(
    z.array(z.string().min(1)).min(1)
  ),

  fontSize: z.record(TokenValue),

  spacing: z.record(TokenValue),

  radius: z.record(TokenValue),

  shadow: z.record(TokenValue),

  easing: z.record(TokenValue)
});

module.exports = {
  ThemeManifestSchema
};
