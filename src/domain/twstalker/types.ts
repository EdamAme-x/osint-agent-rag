export type TwstalkerPost = {
  text: string;
  authorHandle?: string;
  authorProfileUrl?: string;
  authorProfileImageUrl?: string;
  retweetedBy?: string;
  mediaUrls: string[];
};

export type ParsedTwstalkerProfileMarkdown = {
  title?: string;
  sourceUrl?: string;
  profileImageUrl?: string;
  isLikelyMissingProfile: boolean;
  posts: TwstalkerPost[];
};
