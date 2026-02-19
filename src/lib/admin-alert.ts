type NewPostAlertInput = {
  postId: string;
  title: string;
  lounge: string;
  body: string;
  authorId: string;
};

function parseRecipients() {
  const list = (process.env.ADMIN_ALERT_EMAILS ?? process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const one = (process.env.ADMIN_EMAIL ?? "").trim();
  if (one) list.push(one);
  return Array.from(new Set(list));
}

function getBaseUrl() {
  return (
    process.env.APP_BASE_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    ""
  );
}

export async function sendAdminNewPostEmail(input: NewPostAlertInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ADMIN_ALERT_FROM?.trim();
  const recipients = parseRecipients();

  if (!apiKey || !from || recipients.length === 0) return;

  const baseUrl = getBaseUrl();
  const postUrl = baseUrl ? `${baseUrl.replace(/\/+$/, "")}/post/${input.postId}` : `/post/${input.postId}`;
  const excerpt = input.body.replace(/\s+/g, " ").slice(0, 180);

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height:1.5;">
      <h2 style="margin:0 0 8px;">새 글이 등록되었습니다</h2>
      <p style="margin:0 0 10px;"><strong>${input.title}</strong></p>
      <p style="margin:0 0 10px;">라운지: ${input.lounge}</p>
      <p style="margin:0 0 14px; color:#555;">${excerpt}${input.body.length > 180 ? "..." : ""}</p>
      <p style="margin:0 0 10px; color:#777;">작성자 ID: ${input.authorId}</p>
      <a href="${postUrl}" style="display:inline-block; padding:10px 14px; border-radius:999px; background:#2f2a25; color:#fff; text-decoration:none;">게시글 확인</a>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: `[잉꼬톡] 새 글 알림: ${input.title}`,
        html,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("sendAdminNewPostEmail failed", response.status, text);
    }
  } catch (error) {
    console.error("sendAdminNewPostEmail error", error);
  }
}
