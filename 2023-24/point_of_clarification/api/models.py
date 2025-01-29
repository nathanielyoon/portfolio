from typing import Optional
import datetime

from pydantic import BaseModel, validator, root_validator


class Author(BaseModel):
    key: str
    name: str


class Item(BaseModel):
    key: str
    author: Author
    text: str
    votes: int = 0


class ReplyComment(Item):
    post_key: str
    root_comment_key: Optional[str]


class RootComment(Item):
    post_key: str
    reply_comments: list[ReplyComment] = list()


class Post(Item):
    timestamp: datetime.datetime
    comments: list[RootComment]
    total_comments: int = -1
    views: int = 0

    @root_validator
    def count_comments(cls, values: dict) -> dict:
        values["total_comments"] = len(values["comments"])+sum(
            len(comment.reply_comments)
            for comment in values["comments"]
        )
        return values

    @validator("timestamp", pre=True)
    def format_date(cls, value: str) -> datetime.datetime:
        try:
            return datetime.datetime.strptime(value, "%Y-%m-%d %I:%M%p")
        except ValueError:
            return datetime.datetime.strptime(value, "%Y-%m-%dT%H:%M:%S")
