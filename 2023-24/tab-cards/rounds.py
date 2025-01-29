from tab_cards import utils


def seeding(debater_1: str, debater_2: str) -> str:
    return 0
    # seeds = {
    #     (0, 0): "u",
    #     (0, 1): "h",
    #     (1, 0): "h",
    #     (1, 1): "f"
    # }
    # names = {
    #     "Muzzi Godil": "Muzamil Godil"
    # }
    # debaters = utils.data("debaters")
    # points = [
    #     1 if debaters[names.get(debater, debater)]["points"] >= 10
    #     else 0 for debater in (debater_1, debater_2)
    # ]
    # return seeds[tuple(points)]


def matchup_info(cards: dict, round_number: str, matchup: dict) -> dict:
    if "bye" in matchup.keys():
        results = [
            value["result"]
            for round_key, value in cards[matchup["bye"]]["rounds"].items()
            if int(round_key) < int(round_number)
        ]
        matchup["bracket"] = (
            results.count("w")+results.count("bye") if round_number != "1"
            else seeding(
                cards[matchup["bye"]]["debater_1"]["name"],
                cards[matchup["bye"]]["debater_2"]["name"]
            )
        )
        return matchup
    for key in ("gov", "opp"):
        team_name = matchup[f'{key}_team']
        if team_name is None:
            team = {
                "debater_1": {"name": ""},
                "debater_2": {"name": ""},
                "rounds": {round_number: {
                    "speaks_1": "",
                    "ranks_1": "",
                    "speaks_2": "",
                    "ranks_2": ""
                }}
            }
            matchup[f'{key}_bracket'] = -1
        else:
            team = cards[team_name]
            results = [
                value["result"] for round_key, value in team["rounds"].items()
                if int(round_key) < int(round_number)
            ]
            matchup[f'{key}_bracket'] = (
                results.count("w")+results.count("bye") if round_number != "1"
                else seeding(team["debater_1"], team["debater_2"])
            )
        for index in (1, 2):
            matchup[f'{key}_{index}'] = team[f'debater_{index}']["name"]
            results = team["rounds"][round_number]
            matchup[f'{key}_{index}_speaks'] = results[f'speaks_{index}']
            matchup[f'{key}_{index}_ranks'] = results[f'ranks_{index}']
    return matchup


def eliminate_duplicates(matchups: list[dict]):
    final_matchups = []
    for matchup in matchups:
        if "bye" in matchup.keys():
            final_matchups.append(matchup)
        elif matchup["gov_team"] is None and matchup["opp_team"] is None:
            continue
        elif [
            (final_matchup.get("gov_team"), final_matchup.get("opp_team"))
            for final_matchup in final_matchups
        ].count((matchup["gov_team"], matchup["opp_team"])) == 0:
            final_matchups.append(matchup)
    return final_matchups


def pairing_info(cards: dict, round_number: str) -> list[dict]:
    matchups = []
    for key, value in cards.items():
        if value["rounds"][round_number]["result"] == "bye":
            matchups.append({"bye": key})
    round_info = {
        key: value["rounds"][round_number] for key, value in cards.items()
        if value["rounds"][round_number]["result"] != "bye"
    }
    for key, value in round_info.items():
        matchups.append({
            "gov_team": key if value["side"] == "gov" else value["opponent"],
            "gov_bracket": -1,
            "gov_result": (
                "w" if value["side"] == "gov" and value["result"] == "w"
                or value["side"] == "opp" and value["result"] == "l"
                else "l"
            ),
            "gov_1": "",
            "gov_1_speaks": "",
            "gov_1_ranks": "",
            "gov_2": "",
            "gov_2_speaks": "",
            "gov_2_ranks": "",
            "opp_team": key if value["side"] == "opp" else value["opponent"],
            "opp_bracket": -1,
            "opp_result": (
                "w" if value["side"] == "opp" and value["result"] == "w"
                or value["side"] == "gov" and value["result"] == "l"
                else "l"
            ),
            "opp_1": "",
            "opp_1_speaks": "",
            "opp_1_ranks": "",
            "opp_2": "",
            "opp_2_speaks": "",
            "opp_2_ranks": "",
            "judge": (
                ", ".join(value["judge"]) if isinstance(value["judge"], list)
                else ""
            )
        })
    return eliminate_duplicates([
        matchup_info(cards, round_number, matchup)
        for matchup in matchups
    ])


def parse_rounds(file_name: str, rounds: int = 5):
    cards = utils.data(f'output/{file_name}')["teams"]
    return utils.data(f'output/{file_name}', data={"teams": cards, "rounds": {
        key: pairing_info(cards, key)
        for key in [str(index) for index in range(1, rounds+1)]
    }})
