from rich import table

from apda_tournament import history, utils


def rough_sort_judges(judges):
    return [(key, value) for key, value in sorted(
        judges.items(), key=lambda judge: (
            judge[1]["status"] == "dino",
            judge[1]["status"][:7] == "dino",
            len([award for award in judge[1]["awards"]
                if award["type"][:6] == "varsit"]),
            len(judge[1]["awards"]),
            len([award for award in judge[1]["awards"]
                if award["season"] == "2022-23"]),
            judge[1]["status"] == "varsity",
            judge[1]["status"][:7] == "varsity",
            "1" in judge[1]["availability"],
            len(judge[1]["availability"])
        ), reverse=False)]


def scratch_table():
    judges = rough_sort_judges(utils.data("judges"))

    rich_table = table.Table()
    for column in (
        "judge",
        "rounds",
        "status",
        "schools",
        "weight",
        "v%",
        "awards"
    ):
        rich_table.add_column(column)

    for key, value in judges:
        awards = value["awards"]
        rich_table.add_row(
            key,
            ", ".join(value["availability"]),
            value["status"].replace("?", ""),
            ", ".join(value["schools"]),
            *history.debater_table(awards=awards)
        )
    return rich_table
