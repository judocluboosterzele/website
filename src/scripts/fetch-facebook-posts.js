import fs from "fs/promises";
import path from "path";
import { parseStringPromise } from "xml2js";

const RSS_URL = "https://fetchrss.com/feed/1urF0L3PsDAY1urEvF5u70ig.rss";
const POSTS_DIR = "src/content/pages/facebook-posts";
const IMAGES_DIR = "src/assets/images/facebook-posts";

// Decode HTML entities
function decodeHTMLEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Ensure directories exist
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }
}

// Download image from URL
async function downloadImage(url, filepath) {
  try {
    // Decode HTML entities in URL
    const decodedUrl = decodeHTMLEntities(url);
    console.log(`  Downloading image...`);

    const response = await fetch(decodedUrl);

    if (!response.ok) {
      console.error(`  ✗ Failed: ${response.status} ${response.statusText}`);
      return false;
    }

    const buffer = await response.arrayBuffer();
    await fs.writeFile(filepath, Buffer.from(buffer));
    console.log(`  ✓ Saved to: ${path.basename(filepath)}`);
    return true;
  } catch (error) {
    console.error(`  ✗ Error:`, error.message);
    return false;
  }
}

// Extract text content from HTML description
function extractTextFromHTML(html) {
  return decodeHTMLEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<img[^>]*>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\(Feed generated with.*?\)$/s, "")
      .trim()
  );
}

// Extract image URLs from HTML and also check media:content
function extractImageURLs(item) {
  const urls = [];

  // Check description HTML
  if (item.description && item.description[0]) {
    const html = item.description[0];
    const imgRegex = /<img[^>]+src="([^"]+)"/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      urls.push(match[1]);
    }
  }

  // Check media:content
  if (item["media:content"] && Array.isArray(item["media:content"])) {
    item["media:content"].forEach((media) => {
      if (media.$ && media.$.url) {
        urls.push(media.$.url);
      }
    });
  }

  // Remove duplicates by comparing decoded URLs
  const uniqueUrls = [];
  const seenUrls = new Set();

  for (const url of urls) {
    const decoded = decodeHTMLEntities(url);
    if (!seenUrls.has(decoded)) {
      seenUrls.add(decoded);
      uniqueUrls.push(url);
    }
  }

  return uniqueUrls;
}

// Generate slug from title and date
function generateSlug(title, date) {
  const titleSlug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);

  return titleSlug;
}

// Check if post already exists
async function postExists(year, month, slug) {
  try {
    const filepath = path.join(POSTS_DIR, year, month, `${slug}.md`);
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("Fetching RSS feed...");

  // Fetch RSS feed
  const response = await fetch(RSS_URL);
  const xmlText = await response.text();

  // Parse XML
  const result = await parseStringPromise(xmlText);
  const items = result.rss.channel[0].item || [];

  console.log(`Found ${items.length} posts in feed\n`);

  await ensureDir(POSTS_DIR);
  await ensureDir(IMAGES_DIR);

  let newPostsCount = 0;

  for (const item of items) {
    const title =
      item.description[0].match(/^([^<]+)/)?.[1]?.trim() || "Facebook Post";
    const description = item.description[0];
    const pubDate = new Date(item.pubDate[0]);
    const link = item.link[0];

    const year = pubDate.getFullYear().toString();
    const month = (pubDate.getMonth() + 1).toString().padStart(2, "0");
    const day = pubDate.getDate().toString().padStart(2, "0");
    const slug = generateSlug(title, pubDate);

    // Skip if post already exists
    if (await postExists(year, month, slug)) {
      console.log(`⏭️  Post already exists: ${year}/${month}/${slug}\n`);
      continue;
    }

    console.log(`📝 Processing: ${title}`);
    console.log(`   Date: ${year}-${month}-${day}`);

    const textContent = extractTextFromHTML(description);

    // Remove first line if it equals the title
    let cleanedText = textContent;
    if (cleanedText.split("\n")[0].trim() === title.trim()) {
      cleanedText = cleanedText.split("\n").slice(1).join("\n").trim();
    }

    const imageURLs = extractImageURLs(item);

    console.log(`   Found ${imageURLs.length} unique image(s)`);

    // Create directories for this post
    const postFolder = path.join(POSTS_DIR, year, month);
    const imageFolderPath = path.join(IMAGES_DIR, year, month, day);
    await ensureDir(postFolder);
    await ensureDir(imageFolderPath);

    // Download images
    const images = [];
    for (let i = 0; i < imageURLs.length; i++) {
      const imageURL = imageURLs[i];
      const ext = ".jpg"; // Default to jpg
      const imageName = `image-${i + 1}${ext}`;
      const imagePath = path.join(imageFolderPath, imageName);

      const success = await downloadImage(imageURL, imagePath);
      if (success) {
        // Calculate relative path from markdown file to image
        // From: src/content/pages/facebook-posts/2025/11/post.md
        // To: src/assets/images/facebook-posts/2025/11/27/image-1.jpg
        // Relative path: ../../../../../assets/images/facebook-posts/2025/11/27/image-1.jpg
        const relativePath = `../../../../../assets/images/facebook-posts/${year}/${month}/${day}/${imageName}`;
        images.push({
          src: relativePath,
          alt: `${title} - afbeelding ${i + 1}`,
        });
      }
    }

    // Create markdown content
    let markdown = "---\n";
    markdown += `title: "${title.replace(/"/g, '\\"')}"\n`;
    markdown += `date: "${year}-${month}-${day}"\n`;
    markdown += `facebookLink: "${link}"\n`;
    markdown += `type: "facebook-posts"\n`;

    if (images.length > 0) {
      markdown += "images:\n";
      images.forEach((img) => {
        markdown += `  - src: ${img.src}\n`;
        markdown += `    alt: "${img.alt}"\n`;
      });
    }

    markdown += "---\n\n";
    // markdown += textContent;
    markdown += cleanedText;

    // Write markdown file
    const filepath = path.join(postFolder, `${slug}.md`);
    await fs.writeFile(filepath, markdown, "utf8");

    newPostsCount++;
    console.log(`✅ Created: ${year}/${month}/${slug}.md\n`);
  }

  console.log(`🎉 Processing complete. ${newPostsCount} new posts created.`);
}

main().catch(console.error);
