import os
import datetime
import time

import notify2
import smtplib
import email
from rich import table, box, prompt

from apda_tournament import utils, decoder


def download_pairings(tab_site):
    return utils.soup(f'https://{tab_site}.nu-tab.com/pairings/pairinglist/')


def parse_pairings(soup):
    pairings = []
    for tr in soup("tr")[1:]:
        gov, opp, judges, room = tr("td")
        panel = [
            judge.strip() for judge in judges.text.split("\n")
            if len(judge.strip()) > 0
        ]

        chair = judges.find("b")
        panel = [panel[0]] if len(panel) == 1 else [
            chair.string.strip(),
            *[name for name in panel if name != chair.string.strip()]
        ]
        pairings.append({
            "gov": gov.string.strip(),
            "opp": opp.string.strip(),
            "judges": panel,
            "room": room.string.strip()
        })
    if bye := soup.find("span", class_="pairings_bye_entry"):
        pairings.append({"bye": bye.text})
    return int(soup.find("title").string.strip()[-1]), pairings


def save_pairings(number, soup, target_round):
    round_number, pairings = parse_pairings(soup)
    if str(round_number) != target_round:
        return None

    files = [name[:11] for name in os.listdir(f'data/{number}')]
    file_count = int(files.count(name := f'r{round_number}_pairings')/2+1)
    with open(f'data/{number}/{name}_{file_count}.html', "w") as open_file:
        open_file.write(str(soup))
    return utils.data(f'{number}/{name}_{file_count}', data=pairings)


def check(tab_site, number, target_round):
    soup = download_pairings(tab_site)
    if soup("body")[0].string is not None:
        return None
    return save_pairings(number, soup, target_round)


def team_pairing(team_name, pairings):
    for pairing in pairings:
        if team_name == pairing.get("gov", ""):
            return {
                "side": "gov",
                "opponent": decoder.decode_team(pairing["opp"]),
                "judges": pairing["judges"],
                "room": pairing["room"]
            }
        if team_name == pairing.get("opp", ""):
            return {
                "side": "opp",
                "opponent": decoder.decode_team(pairing["gov"]),
                "judges": pairing["judges"],
                "room": pairing["room"]
            }
        if team_name == pairing.get("bye", ""):
            return {
                "side": "bye",
                "opponent": None,
                "judges": None,
                "room": None
            }
    return None


def send_notification(pairing):
    notify2.init("APDA Tournament")
    summary = f'{pairing["side"].title()} vs {pairing["opponent"]}'
    body = f'{", ".join(pairing["judges"])}\n{pairing["room"]}'
    notification = notify2.Notification(summary, body)
    notification.show()
    return summary


def send_email(address, summary, body):
    message = email.message.EmailMessage()

    timestamp = datetime.datetime.now().strftime("%I:%M%p").lower()
    message["Subject"] = f'{summary} ({timestamp})'
    message.set_content(body)
    message["From"] = "Tab Notifier <tabnotifier@gmail.com>"
    message["To"] = address

    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login("tabnotifier@gmail.com", "vnbvlobthzyprxcq")
    server.send_message(message)
    server.quit()


def notify(pairings, teams):
    output = []
    for team_name, address in teams:
        pairing = team_pairing(team_name, pairings)
        summary = send_notification(pairing)
        output_body = [f'    {key}: {pairing[key]}' for key in pairing.keys()]
        if address is not None:
            send_email(address, summary, "\n".join(output_body))
        output.append([team_name, *pairing.values()])
    return output


def attempt(info, target, attempts):
    data = check(info["tab_site"], info["number"], target)
    print(f'{attempts:4}> {"no" if data is None else "yes"}', end="\r")
    return data


def pairing_table():
    target = prompt.Prompt.ask(
        "round",
        choices=[str(index) for index in range(1, 8)]
    )
    info = utils.data("input")
    try:
        output, attempts = None, 0
        while output is None:
            attempts += 1
            output = attempt(info, target, attempts)
            if output is None:
                time.sleep(3)

    except KeyboardInterrupt:
        utils.stop("")

    rows = notify(output, info["teams"])
    rich_table = table.Table(box=box.HORIZONTALS)
    for column in ("team", "side", "opponents", "judges", "room"):
        rich_table.add_column(column)
    for row in rows:
        rich_table.add_row(*[
            ", ".join(item) if isinstance(item, list) else item
            for item in row
        ])
    return rich_table


def history_table(target=None):
    target = prompt.Prompt.ask("team name") if target is None else target
    history = tournament_history(target, 4)
    rich_table = table.Table(box=box.HORIZONTALS)
    for column in history[0].keys():
        rich_table.add_column(column)
    for row in history:
        rich_table.add_row(*[
            ", ".join(item) if isinstance(item, list) else item
            for item in row.values()
        ])
    return rich_table


def tournament_history(team_name, tournament_number):
    highest_round = max(
        int(file_name[1])
        for file_name in os.listdir(f'data/{tournament_number}')
    )
    backtab = utils.data("results")
    team_names = {key.lower(): key for key in backtab.keys()}
    previous_rounds = []
    for index in range(1, highest_round+1):
        pairings = utils.data(f'{tournament_number}/' + sorted([
            file_name for file_name in os.listdir(f'data/{tournament_number}')
            if file_name[1] == str(index) and file_name[-4:] == "json"
        ], key=lambda file_name: file_name[-6], reverse=True)[0][:-5])
        pairing = {team_name: str(index)}
        pairing.update(team_pairing(team_names.get(
            team_name,
            team_name
        ), pairings))
        try:
            pairing.update({"result": backtab.get(team_names.get(
                team_name,
                team_name
            ))[str(index)]})
        except KeyError:
            pairing.update({"result": "none"})
        previous_rounds.append(pairing)
    return previous_rounds
