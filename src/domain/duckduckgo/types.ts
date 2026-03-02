export type DuckduckgoSearchHitSource = "abstract" | "results" | "relatedTopics";

export type DuckduckgoSearchHit = {
  title: string;
  url: string;
  snippet?: string;
  iconUrl?: string;
  source: DuckduckgoSearchHitSource;
};

export type DuckduckgoApiIcon = {
  URL?: string;
};

export type DuckduckgoApiTopic = {
  FirstURL?: string;
  Text?: string;
  Result?: string;
  Icon?: DuckduckgoApiIcon;
  Name?: string;
  Topics?: DuckduckgoApiTopic[];
};

export type DuckduckgoApiResponse = {
  Abstract?: string;
  AbstractText?: string;
  AbstractURL?: string;
  Heading?: string;
  Results?: DuckduckgoApiTopic[];
  RelatedTopics?: DuckduckgoApiTopic[];
};
