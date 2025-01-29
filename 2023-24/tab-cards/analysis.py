from rich import table, box, console

from tab_cards import utils


def gov_opp_speaks(round_data: list) -> tuple[float, float]:
    gov = 0.0
    opp = 0.0
    for matchup in round_data:
        gov += matchup.get("gov_1_speaks", 0)+matchup.get("gov_2_speaks", 0)
        opp += matchup.get("opp_1_speaks", 0)+matchup.get("opp_2_speaks", 0)
    return round(gov/len(round_data)/2, 2), round(opp/len(round_data)/2, 2)


def gov_opp_wins(round_data: list) -> tuple[int, int]:
    gov_wins = 0
    opp_wins = 0
    for matchup in round_data:
        gov_wins += 1 if matchup["gov_result"] == "w" else 0
        opp_wins += 1 if matchup["opp_result"] == "w" else 0
    return gov_wins, opp_wins


def bracketed_gov_opp_wins(data: dict) -> tuple[dict, dict]:
    brackets = {}
    for round_key, rounds in data.items():
        for matchup in rounds:
            if isinstance(matchup["gov_bracket"], int):
                gov_losses = int(round_key)-1-matchup["gov_bracket"]
                opp_losses = int(round_key)-1-matchup["opp_bracket"]
                key = (
                    f'{matchup["gov_bracket"]}-{gov_losses}/'
                    f'{matchup["opp_bracket"]}-{opp_losses}'
                )
            else:
                key = f'{matchup["gov_bracket"]}/{matchup["opp_bracket"]}'
            if key not in brackets.keys():
                brackets[key] = {"gov": 0, "opp": 0}
            winner = "gov" if matchup["gov_result"] == "w" else "opp"
            brackets[key][winner] += 1
    balanced = dict(sorted([
        (key, value) for key, value in brackets.items()
        if key.split("/")[0] == key.split("/")[1]
    ], key=lambda item: (item[0].isnumeric(), item[0]), reverse=True))
    unbalanced = dict(sorted([
        (key, value) for key, value in brackets.items()
        if key.split("/")[0] != key.split("/")[1]
    ], key=lambda item: (item[0].isnumeric(), item[0]), reverse=True))
    return balanced, unbalanced


def bubble_results(data: dict, teams: list) -> list[dict]:
    r7_data = data["7"]
    return sorted([
        {
            "bracket": f'{item["gov_bracket"]}/{item["opp_bracket"]}',
            "gov": item["gov_team"],
            "opp": item["opp_team"],
            "result": "gov" if item["gov_result"] == "w" else "opp",
        }
        for item in r7_data
        if (4 in (item["gov_bracket"], item["opp_bracket"]) or (
            3 in (item["gov_bracket"], item["opp_bracket"])
            and (item["gov_team"] in teams or item["opp_team"] in teams)
        ))
    ], key=lambda item: item["bracket"], reverse=True)


def breaking_teams(data: dict) -> list:
    return [key for index, (key, _) in enumerate(sorted(
        data.items(),
        key=lambda item: (
            item[1]["total_wins"],
            item[1]["total_speaks"],
            -item[1]["total_ranks"]
        ),
        reverse=True
    ), 1) if index <= 16]


def main():
    file_name = "4-28 nats"
    data = {
        key: [info for info in value if "bye" not in info.keys()]
        for key, value in utils.data(f'output/{file_name}')["rounds"].items()
    }
    teams = breaking_teams(utils.data(f'output/{file_name}')["teams"])

    bubbles = bubble_results(data, teams)

    rich_console = console.Console()
    rich_table = table.Table(box=box.HORIZONTALS)

    for column in ("bracket", "gov", "opp", "result"):
        rich_table.add_column(column)
    for row in bubbles:
        rich_table.add_row(*row.values())
    rich_console.print(rich_table)

    balanced, unbalanced = bracketed_gov_opp_wins(data)

    balanced_table = table.Table(box=box.HORIZONTALS)
    total = {
        "gov": sum(value["gov"] for value in balanced.values()),
        "opp": sum(value["opp"] for value in balanced.values())
    }
    for column in ("bracket", "gov", "opp", "%"):
        balanced_table.add_column(column)
    balanced_table.add_row(
        "all",
        str(total["gov"]),
        str(total["opp"]),
        f'{total["gov"]/(total["gov"]+total["opp"])*100:.1f}%'
    )
    for key, value in balanced.items():
        balanced_table.add_row(
            key,
            str(value["gov"]),
            str(value["opp"]),
            f'{value["gov"]/(value["gov"]+value["opp"])*100:.1f}%'
        )
    rich_console.print(balanced_table)

    unbalanced_table = table.Table(box=box.HORIZONTALS)
    total = {
        "gov": sum(value["gov"] for value in unbalanced.values()),
        "opp": sum(value["opp"] for value in unbalanced.values())
    }
    for column in ("bracket", "gov", "opp", "%"):
        unbalanced_table.add_column(column)
    unbalanced_table.add_row(
        "all",
        str(total["gov"]),
        str(total["opp"]),
        f'{total["gov"]/(total["gov"]+total["opp"])*100:.1f}%'
    )
    for key, value in unbalanced.items():
        unbalanced_table.add_row(
            key,
            str(value["gov"]),
            str(value["opp"]),
            f'{value["gov"]/(value["gov"]+value["opp"])*100:.1f}%'
        )
    rich_console.print(unbalanced_table)


if __name__ == "__main__":
    main()
