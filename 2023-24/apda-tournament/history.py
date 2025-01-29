import datetime

from rich import table, prompt, box
from fuzzywuzzy import fuzz

import utils


def match_debater(query):
    query = query.strip().lower()
    debaters = utils.data("debaters", directory="../apda_records/data")
    if query.isnumeric():
        return query
    options = [
        key for key, value in debaters.items()
        if fuzz.partial_ratio(query, value["name"].lower()) >= 90
    ]
    return [match_debater(key) for key in options] if options else (None, None)


def award_weight(place, award_type, tournament):
    if tournament["teams"] == -1:
        return -1
    if award_type == "varsity_teams":
        return 1-place/tournament["teams"]
    if award_type == "novice_teams":
        try:
            return 1-place/tournament["novice_debaters"]*2
        except ZeroDivisionError:
            return 1-place/tournament["teams"]*2
    if award_type == "varsity_speakers":
        return 1-place/tournament["teams"]/2
    if award_type == "novice_speakers":
        try:
            return 1-place/tournament["novice_debaters"]
        except ZeroDivisionError:
            return 1-place/tournament["teams"]


def awards(debater):
    tournaments = utils.data("tournaments", directory="../apda_records/data")
    rows = []
    for tournament in tournaments.values():
        for key, value in tournament["awards"].items():
            if value is not None and debater in value.keys():
                award = "".join([word[0] for word in key.split("_")])
                weight = award_weight(value[debater], key, tournament)
                rows.append({
                    "date": tournament["date"],
                    "tournament": tournament["name"],
                    "season": tournament["season"],
                    "type": key,
                    "place": value[debater],
                    "name": f'{award} {value[debater]}',
                    "weight": round(weight*100, 1)
                })
    return sorted(
        rows,
        key=lambda row: datetime.datetime.strptime(row["date"], "%x")
    )


def all_awards(debater):
    return utils.flat([awards(debater) for debater in match_debater(debater)])


def debater_table(awards=None):
    rows = all_awards(prompt.Prompt.ask("name")) if awards is None else awards
    weight = round(sum([
        row["weight"] for row in rows
        if row["weight"] != -100
    ])/len(rows), 1) if rows else 0.0
    varsity = round(len([
        row for row in rows
        if row["name"][0] == "v"
    ])/len(rows)*100, 1) if rows else 0.0
    seasons = ", ".join(
        f'{name[5:]}: {len([row for row in rows if row["season"] == name])}'
        for name in sorted(set(row["season"] for row in rows))
    )
    if awards is not None:
        return str(weight), f'{varsity}%', seasons

    rich_table = table.Table(box=box.HORIZONTALS, show_footer=True)
    for header, footer in zip(
        ("date", "award", "tournament", "weight"),
        (f'{len(rows)} total', f'{varsity}%', seasons, str(weight))
    ):
        rich_table.add_column(header, footer=footer)
    for row in rows:
        rich_table.add_row(
            row["date"],
            row["name"],
            row["tournament"],
            str(row["weight"])
        )

    return rich_table
