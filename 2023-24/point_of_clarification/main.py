import contextlib
import json
import random

import fastapi
from fastapi import Request, responses, templating, staticfiles

from api import models, database


app = fastapi.FastAPI()

TEMPLATES = templating.Jinja2Templates("static/templates")
app.mount("/static", staticfiles.StaticFiles(directory="static"))


async def page(request: Request, data: dict) -> responses.HTMLResponse:
    return TEMPLATES.TemplateResponse(
        data["template"] if request.headers.get("hx-boosted") else "page.html",
        {"request": request} | data
    )


@app.exception_handler(404)
async def missing(request: Request, exception: fastapi.HTTPException):
    return await page(request, {
        "template": "invalid.html",
        "error": "Couldn't find :("
    })


@app.get("/", response_class=responses.JSONResponse)
async def root(request: Request):
    posts = await database.all_posts()
    random.shuffle(posts)
    return await page(request, {
        "template": "root.html",
        "posts": posts
    })


@app.get("/sort/{method}", response_class=responses.HTMLResponse)
async def sort_posts(request: Request, method: str):
    return TEMPLATES.TemplateResponse(f'{method}.html', {"request": request})


@app.get("/{key}", response_class=responses.HTMLResponse)
async def get_post(request: Request, key: str):
    post = await database.get_post(key)
    return await page(request, {
        "template": "post.html",
        "date": f'{post.timestamp:%Y-%m-%d}',
        "text": post.text.split("\n"),
        "comments": post.comments,
        "key": post.key
    })
