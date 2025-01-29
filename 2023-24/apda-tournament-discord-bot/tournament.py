import os
import asyncio
import datetime
import requests

import dotenv
import discord
import discord.ext.tasks
import bs4


intents = discord.Intents.default()
intents.message_content = True
intents.reactions = True
bot = discord.Client(intents=intents)


def download_pairings(tab_site):
    url = f'https://{tab_site}.nu-tab.com/pairings/pairinglist/'
    request = requests.get(url, timeout=30).text
    return bs4.BeautifulSoup(request, "html.parser")


def pairings_data(soup):
    def parse_judges(judges):
        judge_strings = [string.strip() for string in judges.text.split("\n")
                         if len(string.strip()) > 0]
        if len(judge_strings) == 1:
            return judge_strings[0]

        chair = judges("b")[0].string
        panel = [string for string in judge_strings if string != chair]
        return ", ".join([chair, *panel])

    try:
        round_number = soup("h1")[0].text.strip()[-1]
    except IndexError:
        return int(soup("title")[0].text.strip()[-1])*-1, None
    return round_number, [{
        "gov": tr("td")[0].string,
        "opp": tr("td")[1].string,
        "judge": parse_judges(tr("td")[2]),
        "room": tr("td")[3].string
    } for tr in soup("tr")[1:]]


def format_pairings(tab_site):
    pairings = download_pairings(tab_site)
    round_number, data = pairings_data(pairings)
    if int(round_number) < 0:
        return f'R{round_number*-1} pairings not released'
    return "\n".join([
        f'R{round_number} pairings',
        *[f'\n{pairing["room"]}\n'
          f'Gov: {pairing["gov"]}\n'
          f'Opp: {pairing["opp"]}\n'
          f'Judge: {pairing["judge"]}\n' for pairing in data]])


@bot.event
async def on_ready():
    print(f'{bot.user} connected')


@bot.event
async def on_message(message):
    if message.author == bot.user:
        return
    if message.channel.id != 1096477802221543534:
        return

    if message.content.startswith("t!show"):
        await post_pairings(message.channel)
    elif message.content.startswith("t!post"):
        announcements_channel = bot.get_channel(1096476137481318483)
        await post_pairings(announcements_channel, tag_everyone=True)
    elif message.content.startswith("t!unpost"):
        announcements_channel = bot.get_channel(1096476137481318483)
        await un_post_pairings(announcements_channel)
    elif message.content.startswith("t!start"):
        if message.content == "t!start":
            motions_channel = bot.get_channel(1096476154329845780)
            await prep_timer(motions_channel)
        else:
            motions_channel = bot.get_channel(1096476154329845780)
            await prep_timer(motions_channel, total=int(message.content[8:]))
    elif message.content.startswith("t!stop"):
        motions_channel = bot.get_channel(1096476154329845780)
        await stop_timer(motions_channel)
    elif message.content.startswith("t!help"):
        embed = discord.Embed(title="commands (t!help)")
        embed.description = "\n".join((
            "t!show\tshow pairings in this channel",
            "t!post\tpost pairings to #announcements and tag everyone",
            "t!unpost\tdelete last message in #announcements",
            "t!start\tstart motion prep timer",
            "t!stop\tdelete and stop motion prep timer (by crashing the bot)"
        ))
        await message.channel.send(embed=embed)


async def post_pairings(channel, tag_everyone=False):
    tab_site = ""

    pairings = format_pairings(tab_site)
    if pairings[-21:] == "pairings not released":
        await bot.get_channel(1096477802221543534).send(pairings)
    else:
        pairings = f'@everyone {pairings}' if tag_everyone else pairings
        await channel.send(pairings)


async def un_post_pairings(channel):
    async for message in channel.history(limit=1):
        await message.delete()


@discord.ext.tasks.loop(seconds=5)
async def prep_timer_message(message, embed, end_time):
    minutes, seconds = divmod((end_time-datetime.datetime.now()).seconds, 60)
    embed.description = f'{minutes:02d}:{seconds:02d} left'
    await message.edit(embed=embed)


async def prep_timer(channel, total=900):
    end_time = datetime.datetime.now() + datetime.timedelta(minutes=15)
    end_time_display = end_time.strftime("%-I:%M%p").lower()
    embed = discord.Embed(title=f'R1 prep (ends {end_time_display})')
    message = await channel.send(embed=embed)

    prep_timer_message.start(message, embed, end_time)
    await asyncio.sleep(total)
    prep_timer_message.stop()
    embed.description = "Time's up!"
    await message.edit(embed=embed)
    await channel.send("@everyone Prep time is over, start your debates!")


async def stop_timer(channel):
    prep_timer_message.cancel()
    async for message in channel.history(limit=1):
        await message.delete()


def main():
    dotenv.load_dotenv()
    bot.run(os.getenv("DISCORD_TOKEN"))


if __name__ == "__main__":
    main()
