import os

from apda_tournament import utils


def compile_pairings() -> None:
    pairings = {}
    for index in [str(index) for index in range(1, 8)]:
        name = sorted([
            name for name in os.listdir("data/4")
            if name[1] == index
        ])[-1][:-5]
        pairings[index] = utils.data(f'4/{name}')
    utils.data("pairings", data=pairings)


def find_pairings(team_name: str) -> dict:
    pairings = utils.data("pairings")
    return {
        key: [pairing for pairing in value if team_name in pairing.values()][0]
        for key, value in pairings.items()
    }


def all_sides(team_name: str) -> list:
    team_pairings = find_pairings(team_name)

    return [
        [key[0] for key, value in pairing.items() if value == team_name][0]
        for pairing in team_pairings.values()
    ]


def team_sides(team_code: str) -> str:
    teams = utils.data("team_names")
    team_name = teams[team_code] if team_code in teams else team_code
    sides = all_sides(team_name)
    govs, opps = sides.count("g"), sides.count("o")
    return f'{govs=} {opps=}'
