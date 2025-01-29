from rich import table, prompt, box


def run_round(initial, limit):
    if len(initial["brackets"]) > limit:
        return initial

    if len([team for teams in initial["brackets"] for team in teams]) % 2 == 1:
        bye = [
            bracket for bracket in initial["brackets"]
            if bracket != []
        ][-1].pop()+1
    else:
        bye = None

    scenarios = [{
        "weight": initial["weight"],
        "brackets": [[] for index in range(len(initial["brackets"])+1)]
    }]
    for index, bracket in enumerate(initial["brackets"]):
        if len(bracket) % 2 == 1:
            try:
                bracket.append(initial["brackets"][index+1].pop())
            except IndexError:
                bracket.append(initial["brackets"][index+2].pop())

        for number in range(int(len(bracket)/2)):
            team_1 = bracket[number]
            team_2 = bracket[len(bracket)-number-1]
            if team_1 == team_2:
                for scenario in scenarios:
                    scenario["brackets"][index].append(team_1+1)
                    scenario["brackets"][index+1].append(team_2)

            else:
                team_1_wins = [{
                    "weight": scenario["weight"]*0.9,
                    "brackets": [item.copy() for item in scenario["brackets"]]
                } for scenario in scenarios]
                team_2_wins = [{
                    "weight": scenario["weight"]*0.1,
                    "brackets": [item.copy() for item in scenario["brackets"]]
                } for scenario in scenarios]

                for scenario in team_1_wins:
                    scenario["brackets"][index].append(team_1+1)
                    scenario["brackets"][index+2].append(team_2)

                for scenario in team_2_wins:
                    scenario["brackets"][index+1].append(team_2+1)
                    scenario["brackets"][index+1].append(team_1)

                scenarios = [*team_1_wins, *team_2_wins]

    if bye is not None:
        [scenario["brackets"][-2].append(bye) for scenario in scenarios]

    return [run_round(scenario, limit) for scenario in scenarios]


def combine_brackets(brackets):
    def compare(index, bracket, final_bracket):
        bracket_length = len(bracket["brackets"][index])
        final_bracket_length = len(final_bracket["brackets"][index])
        return bracket_length == final_bracket_length

    final_brackets = []
    for bracket in brackets:
        found = False
        for final in final_brackets:
            if all([compare(index, bracket, final) for index in range(6)]):
                final["weight"] += bracket["weight"]
                found = True
                break
        if not found:
            final_brackets.append(bracket)
    return final_brackets


def scenarios(teams, rounds, custom_brackets=None, limit=0, show_all=True):
    def count_brackets(brackets):
        return {
            (len(brackets)-index-1, index): len(bracket)
            for index, bracket in enumerate(brackets)
        }

    brackets = [[0]*teams] if custom_brackets is None else custom_brackets
    results = run_round({"weight": 1, "brackets": brackets}, rounds)

    while isinstance(results[0], list):
        results = [bracket for scenario in results for bracket in scenario]

    scenarios = [{
        "weight": round(scenario["weight"], 4),
        "brackets": count_brackets(scenario["brackets"])
    } for scenario in sorted(
        combine_brackets(results),
        key=lambda item: -item["weight"]
    ) if scenario["weight"] > limit]
    return scenarios if show_all else scenarios[0]


def show_pullups(scenarios, limit):
    total_pullups = 0
    for number, scenario in enumerate(scenarios, 1):
        print(f'\nscenario {number} (weight {scenario["weight"]})')
        [print(f'{limit-index}-{index}: {len(bracket)}')
         for index, bracket in enumerate(scenario["brackets"])]
        pullups = count_pullups(scenario)
        print(f'pullups: {pullups}')
        total_pullups += pullups

    print(f'\naverage pullups: {total_pullups/len(scenarios)}')


def display(scenario):
    brackets = [f'{key[0]}-{key[1]}: {value}'
                for key, value in scenario["brackets"].items()]
    return f'weight: {round(scenario["weight"]*100, 2)}%\n'+"\n".join(brackets)


def count_pullups(brackets):
    pullups = 0
    for index, bracket in enumerate(brackets):
        if len(bracket) % 2 == 1:
            try:
                bracket.append(brackets[index+1].pop())
            except IndexError:
                bracket.append(brackets[index+2].pop())
            pullups += 1
    return pullups


def break_table():
    teams = prompt.IntPrompt.ask("teams")
    rich_table = table.Table(box=box.HORIZONTALS)
    breaks = scenarios(teams, 7, limit=0.05)
    for column in ["weight", *[
        f'{key[0]}-{key[1]}'
        for key in list(breaks[0]["brackets"].keys())[:4]
    ], "break", "bye"]:
        rich_table.add_column(column)
    for row in [[
        f'{round(scenario["weight"]*100, 2)}%',
        *[str(value) for value in list(scenario["brackets"].values())[:4]],
        str(sum(list(scenario["brackets"].values())[:3])),
        str(16-sum(list(scenario["brackets"].values())[:3]))
    ] for scenario in breaks]:
        rich_table.add_row(*row)

    return rich_table
