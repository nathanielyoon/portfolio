import sys
import os

from rich import console, prompt

import utils
from tab_cards import teams, rounds, display


def parse_csv(file_name: str, round_count: int) -> None:
    teams.parse_teams(file_name, rounds=round_count)
    rounds.parse_rounds(file_name, rounds=round_count)


def pairings(file_name: str, round_number: str) -> None:
    rich_console = console.Console()
    rich_console.print(display.pairings_table(file_name, round_number))


def run():
    functions = {
        "parse": parse_csv,
        "display": pairings
    }
    tournaments = {
        name[:-4].split(" ")[-1]: name[:-4]
        for name in os.listdir("data/input")
    }
    if len(sys.argv) == 1:
        function = functions[prompt.Prompt.ask("select", choices=functions.keys())]
        arguments = [tournaments[prompt.Prompt.ask("file name", choices=tournaments.keys())]]
        round_count = 7 if arguments[0] == "4-28 nats" else 5
        if function == pairings:
            arguments.append(prompt.Prompt.ask("round", choices=[
                str(index) for index in range(1, round_count+1)
            ]))
        elif function == parse_csv:
            arguments.append(int(round_count))
    elif len(sys.argv) == 4:
        function = functions[sys.argv[1]]
        arguments = [tournaments[sys.argv[2]], sys.argv[3]]
    else:
        sys.exit()

    function(*arguments)


def novice_teams():
    teams = utils.data("output/4-28 nats")["teams"]
    novice_teams = sorted([(key, (value["total_wins"], value["total_speaks"], value["total_ranks"])) for key, value in teams.items() if value["debater_1"]["status"] == "novice" and value["debater_2"]["status"] == "novice"], key=lambda item: (item[1][0], item[1][1], -item[1][2]), reverse=True)
    for team, value in novice_teams:
        print(f'{team:<12} {value[0]} {value[1]:.1f} {value[2]:.1f}')


def main():
    run()
    # novice_teams()


if __name__ == "__main__":
    main()
