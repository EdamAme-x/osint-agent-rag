import { describe, expect, it } from "vitest";
import { parseTwstalkerProfileMarkdown } from "../../src/domain/twstalker/parseTwstalkerProfileMarkdown.js";

describe("parseTwstalkerProfileMarkdown", () => {
  it("extracts timeline posts, retweet marker, and media URLs", () => {
    const markdown = [
      "Title: TwStalker - Twitter Search Web Viewer",
      "URL Source: https://twstalker.com/jack",
      "",
      "Markdown Content:",
      "[![Image 1: jack Profile Picture](https://pbs.twimg.com/profile_images/jack.jpg)](https://twstalker.com/jack)",
      "",
      "_jack retweeted_",
      "",
      "[![Image 2: alice Profile Picture](https://pbs.twimg.com/profile_images/alice.jpg)](https://twstalker.com/alice)",
      "",
      "hello world from alice",
      "",
      "[![Image 3: alice tweet picture](https://pbs.twimg.com/media/a.jpg)](https://twstalker.com/jack#)",
      "",
      "### Trends for United States",
    ].join("\n");

    const parsed = parseTwstalkerProfileMarkdown(markdown, 10);

    expect(parsed.title).toBe("TwStalker - Twitter Search Web Viewer");
    expect(parsed.sourceUrl).toBe("https://twstalker.com/jack");
    expect(parsed.profileImageUrl).toBe("https://pbs.twimg.com/profile_images/jack.jpg");
    expect(parsed.posts).toHaveLength(1);
    expect(parsed.posts[0]).toMatchObject({
      text: "hello world from alice",
      authorHandle: "alice",
      authorProfileUrl: "https://twstalker.com/alice",
      authorProfileImageUrl: "https://pbs.twimg.com/profile_images/alice.jpg",
      retweetedBy: "jack",
      mediaUrls: ["https://pbs.twimg.com/media/a.jpg"],
    });
  });

  it("flags likely missing profile pages", () => {
    const markdown = [
      "Title: TwStalker - Twitter Search Web Viewer",
      "URL Source: https://twstalker.com/does_not_exist",
      "",
      "Markdown Content:",
      "*   TwStalker is not affiliated with X™. All Rights Reserved. 2024 twstalker.com",
    ].join("\n");

    const parsed = parseTwstalkerProfileMarkdown(markdown, 10);

    expect(parsed.posts).toHaveLength(0);
    expect(parsed.isLikelyMissingProfile).toBe(true);
  });
});
