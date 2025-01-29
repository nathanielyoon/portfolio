from rich import table, console, box, prompt

from apda_tournament import utils, decoder, reloader


def team_results(team_name, team, teams):
    wins = list(team.values()).count("W")
    losses = list(team.values()).count("L")
    return {
        "team": decoder.decode_team(team_name),
        "record": f'{wins}-{losses}',
        "1": team.get("1", ""),
        "2": team.get("2", ""),
        "3": team.get("3", ""),
        "4": team.get("4", "")
    }


def results_table():
    teams = utils.data("teams")
    results = sorted([
        team_results(key, value, teams)
        for key, value in utils.data("results").items()
    ], key=lambda team: (-int(team["record"][0]), team["record"][-1]))
    rich_table = table.Table(box=box.HORIZONTALS)
    for column in ("team", "record", "1", "2", "3", "4"):
        rich_table.add_column(column)
    for row in results:
        rich_table.add_row(*row.values())
    return rich_table


def silent_round():
    results = utils.data("results")
    pairings = utils.data("4/r6_pairings_1")
    for pairing in pairings:
        try:
            pairing["gov_record"] = "".join(
                results.get(pairing["gov"], "").values()
            )
            pairing["opp_record"] = "".join(
                results.get(pairing["opp"], "").values()
            )
        except KeyError:
            pass

    rich_table = table.Table(box=box.HORIZONTALS)
    for column in ("gov", "opp", "record", "record"):
        rich_table.add_column(column)
    for row in pairings:
        if "bye" in row.keys():
            rich_table.add_row(decoder.decode_team(row["bye"]), "", "bye", "")
        else:
            rich_table.add_row(
                decoder.decode_team(row["gov"]),
                decoder.decode_team(row["opp"]),
                row["gov_record"],
                row["opp_record"]
            )
    return rich_table


def expand_history(team_name=None):
    team_name = (
        prompt.Prompt.ask("team name") if team_name is None
        else team_name
    )
    pairings = {key: reloader.team_pairing(
        team_name,
        utils.data(f'4/r{key}_pairings_1')
    )["opponent"].split(" (")[0] for key in ("5", "6", "7")}
    rich_console = console.Console()
    rich_console.print(reloader.history_table(target=pairings["5"]))
    rich_console.print(reloader.history_table(target=pairings["6"]))
    rich_console.print(reloader.history_table(target=pairings["7"]))
