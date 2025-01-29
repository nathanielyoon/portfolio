from typing import Union, Any
import json
import os

import aiohttp
import fastapi
from fastapi import encoders

from api import models


class Client:
    TOKEN = f'?_token={os.environ.get("KV_REST_API_TOKEN")}'
    _session = None

    def __init__(self) -> None:
        self._session = aiohttp.ClientSession(
            f'{os.environ.get("KV_REST_API_URL")}'
        )

    async def __aenter__(self):
        return self._session

    async def __aexit__(self, exc_type, exc_value, traceback):
        await self._session.close()


async def set_post(post: models.Post) -> None:
    async with Client() as session:
        await session.post(
            f'/set/{post.key}{Client.TOKEN}',
            json=encoders.jsonable_encoder(post)
        )


async def get_post(key: str) -> Union[models.Post, None]:
    async with Client() as session:
        async with session.get(f'/get/{key}{Client.TOKEN}') as response:
            result = await response.json()
        if result["result"] is None:
            raise fastapi.HTTPException(404)
        post = models.Post(**json.loads(result["result"]))
        post.views += 1
        await session.post(
            f'/set/{post.key}{Client.TOKEN}',
            json=encoders.jsonable_encoder(post)
        )
    return post


async def vote_comment(post_key: str, comment_key: str) -> None:
    async with Client() as session:
        async with session.get(f'/get/{key}{Client.TOKEN}') as response:
            post = models.Post(**json.loads(result["result"]))
        comments = {key: value for comment in post.comments for key, value in (
            {comment.key: comment} |
            {reply.key: reply for reply in comment.reply_comments}
        ).items()}
        comments[comment_key].votes += 1
        await session.post(
            f'/set/{post.key}{Client.TOKEN}',
            json=encoders.jsonable_encoder(post)
        )


async def all_posts() -> list[dict[str, Any]]:
    async with Client() as session:
        async with session.get(
            f'/multi-exec{Client.TOKEN}',
            json=[["SMEMBERS", "ALL_QUESTIONS"]]
        ) as response:
            result = await response.json()
    return [json.loads(post) for post in result[0]["result"]]
