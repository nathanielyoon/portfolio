from rich import table, console

from apda_records import utils, download, points


def nats_quals():
    def extra(number):
        unqualified = 3 if number <= 4 else 2
        unqualified = (number+unqualified)//2*2-number
        return unqualified*"unqualified, "[:-2].split(", ")

    def list_debaters(debaters):
        return "\n".join(f'    {debater}' for debater in debaters)

    debaters, schools = utils.data("debaters"), utils.data("schools")

    unqualled_schools = []
    quals = {}
    for key, value in points.season().items():
        if value >= 10:
            quals[debaters[key]["school"]] = [
                *quals.get(debaters[key]["school"], []),
                key
            ]
        else:
            unqualled_schools.append(debaters[key]["school"])
    unqualled_schools = [
        schools[school]["name"] for school in set(unqualled_schools)
        if school not in quals.keys()
    ]
    quals = [(
        schools[key]["name"],
        [*[debaters[debater]["name"] for debater in value], *extra(len(value))]
    ) for key, value in quals.items() if schools[key]["name"][:5] != "Unaff"]
    total = len([debater for value in quals for debater in value[1]])
    return total, sorted(quals, key=lambda school: (
        -len(school[1]),
        school[1].count("unqualified")
    )), unqualled_schools


def main():
    download.auto_update()
    total, quals, unqualled_schools = nats_quals()
    quals.extend([
        (school, ["unqualified", "unqualified"])
        for school in unqualled_schools
    ])
    rich_table = table.Table(show_footer=True)
    feet = (
        f'total: {str(len(quals))}',
        str(sum(len(school[1]) for school in quals)//2),
        str(sum(school[1].count("unqualified") for school in quals)),
        ""
    )
    for header, footer in zip(("school", "teams", "free", "debaters"), feet):
        rich_table.add_column(header, footer=footer)
    for row in quals:
        rich_table.add_row(
            row[0],
            str(len(row[1])//2),
            str(row[1].count("unqualified")),
            ", ".join(" ".join(
                name.split(" ")[:-1]
            ) if name != "unqualified" else "free" for name in row[1])
        )

    rich_console = console.Console()
    rich_console.print(rich_table)


if __name__ == "__main__":
    main()
