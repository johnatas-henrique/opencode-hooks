import { PluginInput } from "@opencode-ai/plugin";

type Variant = "success" | "warning" | "error" | "info";

export const createToast = async ({ ctx, title, messages, variant, duration = 2000 }:
  { ctx: PluginInput, title: string, messages: string[], variant: Variant, duration: number }
) => {
  const message = messages.map(line => line.trim()).join('\n');
  await ctx.client.tui.showToast({
    body: { title, message, variant, duration },
  });
}
