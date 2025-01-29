import csv

from tab_cards import utils


def clean_text(row: list[str]) -> str:
    row = [(
        " ".join(substring.strip() for substring in text.split("\n"))
        .replace("pre med", "pre-med")
        .replace("Joe am", "Joe-am")
        .replace("peg a-sus", "peg-a-sus")
        .replace("장이 윤을 들고 있 어", "장이 윤을 들고 있어")
        .replace("@Patrick-Han 10 for Punts", "@Patrick-Han-10 for Punts")
        .replace("장이 윤을 들고있어", "장이 윤을 들고 있어")
        .replace("Louisa Miller Out", "Louisa Miller-Out")
    ) for text in row]
    row = [
        "?".join(
            substring.strip() if substring != "Team: " else "Team: "
            for substring in text.split("�")
        )
        for text in row
    ]
    return row


def csv_rows(file_name: str) -> list[list[str]]:
    rows = []
    with open(f'data/input/{file_name}.csv', "r") as open_file:
        reader = csv.reader(open_file)
        rows = [
            clean_text(row) for row in reader
            if row[7] != "" or row[0][:6] == "Team: " or row[0][:5] == "Tourn"
        ]
    return rows


def previous(key: str, team: dict, total: bool = False) -> float:
    values = [
        info[key] for info in team["rounds"].values()
        if info[key] != "average"
    ]
    if not total or len(values) == 0:
        return sum(values)
    average = sum(values)/len(values)
    return sum([*values, *[
        average for info in team["rounds"].values()
        if info[key] == "average"
    ]])


def parse_row(
    teams: dict,
    index: int,
    row: list[list[str]],
    key: str,
    rounds: int
) -> tuple[dict, str]:
    step = index % (rounds+3)
    match step:
        case 0:
            key = row[0][6:]
        case 1:
            teams[key] = {
                "debater_1": {
                    "name": " ".join(row[5].split(" ")[:-1]),
                    "status": "varsity" if row[5][-2] == "V" else "novice"
                },
                "debater_2": {
                    "name": " ".join(row[6].split(" ")[:-1]),
                    "status": "varsity" if row[6][-2] == "V" else "novice"
                },
                "rounds": {}
            }
        case 7 if rounds == 5:
            result = [info["result"] for info in teams[key]["rounds"].values()]
            teams[key]["total_wins"] = result.count("w")+result.count("bye")
            for info in ("_1", "_2", "_total"):
                for option in ("speaks", "ranks"):
                    name = f'total_{option}{info if info != "_total" else ""}'
                    teams[key][name] = round(previous(
                        f'{option}{info}',
                        teams[key],
                        total=True
                    ), 2)
        case 9 if rounds == 7:
            result = [info["result"] for info in teams[key]["rounds"].values()]
            teams[key]["total_wins"] = result.count("w")+result.count("bye")
            for info in ("_1", "_2", "_total"):
                for option in ("speaks", "ranks"):
                    name = f'total_{option}{info if info != "_total" else ""}'
                    teams[key][name] = round(previous(
                        f'{option}{info}',
                        teams[key],
                        total=True
                    ), 2)
        case _:
            if row[1] == "BYE":
                teams[key]["rounds"][row[0]] = {
                    "side": None,
                    "result": "bye",
                    "opponent": None,
                    "judge": None,
                    "speaks_1": "average",
                    "ranks_1": "average",
                    "speaks_2": "average",
                    "ranks_2": "average",
                    "speaks_total": "average",
                    "ranks_total": "average"
                }
            elif row[1] == "":
                teams[key]["rounds"][row[0]] = {
                    "side": None,
                    "result": "forfeit",
                    "opponent": None,
                    "judge": None,
                    "speaks_1": 0.0,
                    "ranks_1": 0.0,
                    "speaks_2": 0.0,
                    "ranks_2": 0.0,
                    "speaks_total": 0.0,
                    "ranks_total": 0.0
                }
            else:
                teams[key]["rounds"][row[0]] = {
                    "side": "gov" if row[1] == "G" else "opp",
                    "result": row[2].lower(),
                    "opponent": row[3],
                    "judge": row[4].split(" - "),
                    "speaks_1": float(row[5].split(", ")[0][1:]),
                    "ranks_1": float(row[5].split(", ")[1][:-1]),
                    "speaks_2": float(row[6].split(", ")[0][1:]),
                    "ranks_2": float(row[6].split(", ")[1][:-1]),
                    "speaks_total": float(row[7].split(", ")[0][1:])-previous(
                        "speaks_total",
                        teams[key]
                    ),
                    "ranks_total": float(row[7].split(", ")[1][:-1])-previous(
                        "ranks_total",
                        teams[key]
                    )
                }

    return teams, key


def parse_teams(file_name: str, rounds: int = 5) -> dict:
    rows = csv_rows(file_name)
    teams = {}
    key = ""
    for index, row in enumerate(rows):
        teams, key = parse_row(teams, index, row, key, rounds)
    return utils.data(f'output/{file_name}', data={"teams": teams})


def main():
    parse_teams("nyu")


if __name__ == "__main__":
    main()
