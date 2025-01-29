from rich import table, box

from tab_cards import utils


def pairings_table(file_name: str, round_number: str) -> table.Table:
    rich_table = table.Table(box=box.HORIZONTALS)

    pairings = sorted(
        utils.data(f'output/{file_name}')["rounds"][round_number],
        key=lambda matchup: (
            "bye" not in matchup.keys(),
            matchup.get("gov_bracket", 0)+matchup.get("opp_bracket", 0),
            max([matchup.get("gov_bracket", 0), matchup.get("opp_bracket", 0)])
        ),
        reverse=True
    )
    for column in ("#", "W", "gov", "", "", "opp", "", "", "judge"):
        rich_table.add_column(column)
    for row in pairings:
        if "bye" in row.keys():
            rich_table.add_row(str(row["bracket"]), row["bye"], *[""]*6, "bye")
        else:
            rich_table.add_row(
                f'{row["gov_bracket"]}/{row["opp_bracket"]}',
                "G" if row["gov_result"] == "w" else "O",
                (
                    row["gov_team"]
                    if row["gov_team"] != "American University RW"
                    else "AU RW"
                ),
                (
                    f'{" ".join(row["gov_1"].split(" ")[:-1])} '
                    f'({row["gov_1_speaks"]:.0f}/{row["gov_1_ranks"]:.0f})'
                ),
                (
                    f'{" ".join(row["gov_2"].split(" ")[:-1])} '
                    f'({row["gov_2_speaks"]:.0f}/{row["gov_2_ranks"]:.0f})'
                ),
                (
                    row["opp_team"]
                    if row["opp_team"] != "American University RW"
                    else "AU RW"
                ),
                (
                    f'{" ".join(row["opp_1"].split(" ")[:-1])} '
                    f'({row["opp_1_speaks"]:.0f}/{row["opp_1_ranks"]:.0f})'
                ),
                (
                    f'{" ".join(row["opp_2"].split(" ")[:-1])} '
                    f'({row["opp_2_speaks"]:.0f}/{row["opp_2_ranks"]:.0f})'
                ),
                ", ".join(
                    judge.split(" ")[0]
                    for judge in row["judge"].split(", ")
                )
            )
    return rich_table
