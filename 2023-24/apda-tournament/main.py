import sys

from rich import console, prompt

from apda_tournament import (
    breaks,
    history,
    scratches,
    participants,
    reloader,
    results,
    decoder
)


def main():
    options = {
        "update": participants.update,
        "info": participants.info,
        "t": participants.teams,
        "j": scratches.scratch_table,
        "breaks": breaks.break_table,
        "history": reloader.history_table,
        "reload": reloader.pairing_table,
        "pairings": decoder.pairings_table,
        "results": results.results_table,
        "awards": history.debater_table,
        "expand": results.expand_history
    }
    try:
        rich_console = console.Console()
        rich_console.print(options[
            sys.argv[1] if len(sys.argv) == 2
            else prompt.Prompt.ask("select", choices=options.keys())
        ]())
    except KeyboardInterrupt:
        print()


if __name__ == "__main__":
    main()
