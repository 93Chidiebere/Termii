export default async function handler(req, res) {
  const userAgent = req.headers["user-agent"] || "";
  const isCrawler = /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest/i.test(userAgent);

  const slug = req.query.slug;

  if (!isCrawler || !slug) {
    // Not a crawler, or no slug — just redirect to the real app
    res.writeHead(302, { Location: `/blog/${slug || ""}` });
    res.end();
    return;
  }

  try {
    const backendUrl = `https://termii-production.up.railway.app/blog/${slug}`;
    const response = await fetch(backendUrl);

    if (!response.ok) {
      res.writeHead(302, { Location: `/blog/${slug}` });
      res.end();
      return;
    }

    const post = await response.json();

    const title = escapeHtml(post.title);
    const description = escapeHtml(post.summary);
    const image = post.og_image || "https://res.cloudinary.com/dwfojbv0m/image/upload/w_1200,h_630,c_fill/v1782108543/Termii_Africa_logo_evpfzt.png";
    const url = `https://termii.vercel.app/blog/${slug}`;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0; url=${url}" />
</head>
<body>
  <p>Redirecting to <a href="${url}">${title}</a>...</p>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  } catch {
    res.writeHead(302, { Location: `/blog/${slug}` });
    res.end();
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}