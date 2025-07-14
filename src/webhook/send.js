import { WEBHOOK_DISCORD } from "../config.js";
export function sendWebHook(err) {
  if (WEBHOOK_DISCORD)
    fetch(WEBHOOK_DISCORD, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: null,
        embeds: [
          {
            title: "Error",
            description: err,
            color: 16711680,
          },
        ],
        attachments: [],
      }),
    }).catch((err) => {});
}
