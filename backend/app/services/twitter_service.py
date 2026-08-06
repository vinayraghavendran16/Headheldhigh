"""Twitter/X search service for outreach lead discovery."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class TwitterLead:
    tweet_id: str
    tweet_text: str
    author_id: str
    author_name: str
    author_username: str
    author_bio: Optional[str]
    author_followers: int
    profile_url: str


def search_leads(
    query: str,
    max_results: int = 20,
    bearer_token: str = "",
) -> list[TwitterLead]:
    """Search recent tweets and return structured lead data.

    Returns an empty list (with a warning) if tweepy is not installed or the
    bearer token is not configured, so the rest of the agent keeps working.
    """
    if not bearer_token:
        logger.warning("TWITTER_BEARER_TOKEN not set — skipping Twitter search")
        return []

    try:
        import tweepy  # noqa: PLC0415
    except ImportError:
        logger.warning("tweepy not installed — skipping Twitter search")
        return []

    client = tweepy.Client(bearer_token=bearer_token, wait_on_rate_limit=False)

    # Exclude retweets and replies; target English content
    full_query = f"({query}) -is:retweet -is:reply lang:en"

    try:
        response = client.search_recent_tweets(
            query=full_query,
            max_results=min(max(10, max_results), 100),
            expansions=["author_id"],
            tweet_fields=["author_id", "text"],
            user_fields=["name", "username", "description", "public_metrics", "url"],
        )
    except Exception as exc:
        logger.error("Twitter search failed: %s", exc)
        return []

    if not response.data:
        return []

    users_by_id: dict[str, tweepy.User] = {}
    if response.includes and response.includes.get("users"):
        for u in response.includes["users"]:
            users_by_id[str(u.id)] = u

    leads: list[TwitterLead] = []
    for tweet in response.data:
        author = users_by_id.get(str(tweet.author_id))
        if not author:
            continue
        metrics = getattr(author, "public_metrics", {}) or {}
        leads.append(
            TwitterLead(
                tweet_id=str(tweet.id),
                tweet_text=tweet.text,
                author_id=str(author.id),
                author_name=author.name,
                author_username=author.username,
                author_bio=getattr(author, "description", None),
                author_followers=metrics.get("followers_count", 0),
                profile_url=f"https://twitter.com/{author.username}",
            )
        )

    return leads
