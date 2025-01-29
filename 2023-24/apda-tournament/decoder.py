import os

from fuzzywuzzy import fuzz
from rich import table, prompt, box

from apda_tournament import utils


def fix_names(row: dict) -> str:
    debaters = utils.data("debaters").keys()
    fixed_names = {
        "Benny": "Benny Nicholson",
        "Ethan": "Ethan Ross",
        "Ben Thomas": "Benjamin Thomas",
        "Muzzi Godil": "Muzamil Godil",
        "Ahmad": "Ahmad Howard",
        "Justin Rohan": "Justin Wu",
        "Connor": "Connor Beaney",
        "Ej": "EJ Hermacinski",
        "Emily": "Emily Paulin",
        "West point": "",
        "Aidan": "Aiden Zhang",
        "Emaan": "Iman Onbargi",
        "Rasme": "Rasmee Ky",
        "Iman Obargi": "Iman Onbargi",
        "Audrey S": "Audrey Higley"
    }
    for key in ("Member One", "Member Two"):
        if row[key] not in debaters and row[key] != "":
            matches = [
                name for name in debaters
                if fuzz.partial_ratio(name.lower(), row[key].lower()) == 100
            ]
            if len(matches) == 1:
                row[key] = matches[0]
            elif row[key] in fixed_names.keys():
                row[key] = fixed_names[row[key]]
            else:
                utils.stop(row[key])

    return row["Member One"], row["Member Two"]


def parse_backtab_teams(backtab: list) -> dict:
    teams = {row["Team"].strip().lower(): fix_names(row) for row in backtab}
    debaters = utils.data("debaters").keys()
    problems = [
        debater for team in teams.values() for debater in team
        if debater not in debaters and debater != ""
    ]
    if len(problems) > 0:
        print("\n".join(debaters))
        utils.stop(problems)
    utils.data("teams", data=teams)


def manual_updates(data: dict) -> dict:
    data["Nameless Math"]["4"] = "L"
    data["Super Darkness"]["3"] = "L"
    data["Super Darkness"]["4"] = "W"
    return data


def parse_backtab_results(backtab: list) -> None:
    results = {row["Team"].strip(): {
        str(index): row[f'Result R{index}'] for index in range(1, 7)
        if row[f'Result R{index}']
    } for row in backtab if row["Team"].strip() != ""}
    utils.data("results", data=manual_updates(results))


def decode_team(name: str) -> str:
    teams = utils.data("teams")
    team_info = teams.get(name.strip().lower(), name)
    return (
        team_info if isinstance(team_info, str)
        else f'{name} ({", ".join(team_info)})'
    )


def update_backtab():
    data = utils.data("backtab", extension="csv")
    parse_backtab_teams(data)
    parse_backtab_results(data)


def pairings_table():
    round_number = prompt.Prompt.ask(
        "round",
        choices=[str(index) for index in range(1, 8)]
    )
    file_names = sorted([
        name for name in os.listdir("data/4")
        if name[1] == round_number
    ], key=lambda name: int(name.split(".")[0].split("_")[-1]))
    pairing = utils.data(f'4/{file_names[0][:-5]}')
    rich_table = table.Table(box=box.HORIZONTALS)
    for column in ("gov", "opp", "judge", "room"):
        rich_table.add_column(column)
    for row in pairing:
        if "bye" in row.keys():
            rich_table.add_row(decode_team(row["bye"]), "bye", "none", "none")
        else:
            rich_table.add_row(
                decode_team(row["gov"]),
                decode_team(row["opp"]),
                ", ".join(row["judges"]),
                row["room"]
            )
    return rich_table
