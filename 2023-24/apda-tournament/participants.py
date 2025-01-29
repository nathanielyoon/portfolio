from fuzzywuzzy import fuzz
from rich import table, box

from apda_tournament import history, decoder, sheets_api, utils
from apda_records import points


def fix_csvs():
    keys = {
        "Judge ": "name",
        "Affiliation ": "schools",
        "Affiliation(s)": "schools",
        "Status": "status",
        "Debater ": "name",
        "Availability": "availability",
        "name": "name",
        "schools": "schools",
        "status": "status",
        "availability": "availability"
    }
    utils.data("debaters", extension="csv", data=[
        {keys[key]: value.strip() for key, value in row.items()}
        for row in utils.data("debaters", extension="csv")
    ])
    utils.data("judges", extension="csv", data=[
        {keys[key]: value.strip() for key, value in row.items() if key != ""}
        for row in utils.data("judges", extension="csv")
    ])


def match_participant(participant, value, schools):
    if participant["name"] == "Muzzi Godil":
        participant["name"] = "Muzamil Godil"
    if fuzz.ratio(value["name"].lower(), participant["name"].lower()) < 90:
        return False
    return schools[value["school"]]["name"] == "Unaffiliated" or any(
        fuzz.partial_ratio(
            schools[value["school"]]["name"],
            participant_school
        ) >= 30 for participant_school in participant["schools"].split(", ")
    )


def estimate_status(awards, current="2022-23"):
    if not awards:
        return "none"

    award_seasons = set(award["season"] for award in awards)
    if len(award_seasons) > 4:
        return "dino"
    if int(current[2:4])-int(sorted(award_seasons)[0][2:4]) > 4:
        return "dino"

    novice_speakers = [
        award["date"] for award in awards
        if award["type"] == "novice_speakers"
    ]
    if "varsity_speakers" in [
        award["type"] for award in awards
        if award["date"] not in novice_speakers
    ]:
        return "varsity"

    season_awards = [award for award in awards if award["season"] == current]
    if "novice" in [award["type"] for award in season_awards]:
        return "novice"
    if "novice" in [
        award["type"] for award in awards
        if award not in season_awards
    ]:
        return "novice?"
    if len(awards) > len(season_awards):
        return "varsity?"
    return "novice?"


def availability(judge):
    if judge["availability"].strip().lower() == "all":
        return (*[str(index) for index in range(1, 8)], "outs")
    keys = judge["availability"].strip().lower().split(", ")
    ranges = utils.flat([
        list(range(int(key.split("-")[0]), int(key.split("-")[1])+1))
        for key in keys if len(key.split("-")) == 2
    ])
    others = [key for key in keys if len(key.split("-")) == 1]
    if "outs" in keys:
        others.append("outs")
    return tuple(sorted(set([str(item) for item in [*ranges, *others]])))


def import_participants(role_name):
    schools = utils.data("schools", directory="../apda_records/data")
    debaters = utils.data("debaters", directory="../apda_records/data")
    debaters = {
        key: value for key, value in debaters.items()
        if int(key) > 3000
    }
    quals = points.season(season="2022-23")

    participants = {}
    for item in utils.data(role_name, extension="csv"):
        ids = [
            key for key, value in debaters.items()
            if match_participant(item, value, schools)
        ]
        awards = utils.flat([history.awards(apda_id) for apda_id in ids])
        participants[item["name"]] = {
            "role": role_name[:-1],
            "schools": item["schools"].split(", "),
            "status": item.get("status", estimate_status(awards)).lower(),
            "points": float(sum(quals.get(apda_id, 0) for apda_id in ids)),
            "awards": awards,
            "apda_ids": ids,
        }
        if role_name == "judges":
            participants[item["name"]]["availability"] = availability(item)
    utils.data(role_name, data=participants)


def estimate_teams():
    debaters = utils.data("debaters")
    teams = {}
    for school, school_debaters in [(key, [
        (debater, value["points"]) for debater, value in debaters.items()
        if value["schools"][0] == key
    ]) for key in set(debater["schools"][0] for debater in debaters.values())]:
        sort = sorted(school_debaters, key=lambda item: item[1], reverse=True)
        teams.update({
            f'{school} {index/2+1:.0f}': (sort[index][0], sort[index+1][0])
            for index in range(0, len(sort), 2)
        })


def teams_info(count=False):
    teams = utils.data("teams")
    debaters = utils.data("debaters")
    total = len(teams)
    statuses = [[team for team in teams.values() if sorted([
        debaters[debater]["status"][:4]
        for debater in team if debater
    ]) == statuses] for statuses in (
        ["dino", "vars"],
        ["vars", "vars"],
        ["novi", "vars"],
        ["novi", "novi"]
    )]
    seeds = [[team for team in teams.values() if len([
        debater for debater in team
        if debater and debaters[debater]["points"] >= 10
    ]) == key] for key in (2, 1, 0)]
    if count:
        return str(total), *[
            [str(len(item)) for item in items]
            for items in (statuses, seeds)
        ]
    return ["\n".join([", ".join(team) for team in seed]) for seed in seeds]


def teams():
    rich_table = table.Table()
    for column in ("full", "half", "none"):
        rich_table.add_column(column)
    rich_table.add_row(*teams_info())
    return rich_table


def info():
    rich_table = table.Table(box=box.HORIZONTALS)
    for column in ("role", "total", "d/v/n", "q/uq"):
        rich_table.add_column(column)

    for name in ("judges", "debaters"):
        data = utils.data(name)
        total = len(data)
        counts = [str(len([
            item for item in data.values()
            if item["status"][:4] == key
        ])) for key in ("dino", "vars", "novi")]
        quals = len([item for item in data.values() if item["points"] >= 10])
        balance = f'{quals}/{total-quals}'
        rich_table.add_row(name, str(total), "/".join(counts), balance)

    total, statuses, seeds = teams_info(count=True)
    rich_table.add_row("teams", total, "/".join(statuses), "/".join(seeds))

    return rich_table


def update():
    sheets_api.download_judges()
    fix_csvs()
    import_participants("judges")
    import_participants("debaters")
    sheets_api.download_backtab()
    decoder.update_backtab()
    return info()
