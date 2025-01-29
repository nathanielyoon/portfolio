import datetime

from apda_records import utils


def format_date(start_date):
    month, day, year = start_date.split(" ")
    date = datetime.datetime.strptime(f'{month[:3]}{day[:-1]}{year}', "%b%d%Y")
    return date.strftime("%x")


def awards(function):
    def extract_awards(soup, award_type):
        awards = soup.find("div", {"id": award_type})
        return None if awards is None else function(awards("td"))
    return extract_awards


@awards
def team_awards(items):
    debaters = {}
    for index in range(0, len(items), 3):
        place = int(items[index].string)
        debaters.update([
            (debater.get("href")[15:], place)
            for debater in items[index+2]("a")
        ])
    return debaters


@awards
def speaker_awards(items):
    return {
        items[index+1]("a")[0].get("href")[15:]: int(items[index].string)
        for index in range(0, len(items), 3)
    }


def parse_tournament(table, soup):
    tags = [
        ("nationals", ["Nationals"]),
        ("proams", ["Proams", "ProAms"]),
        ("novice", ["Novice", "Nov"]),
        ("northams", ["NorthAms", "Northams"]),
        ("yale_iv", ["Yale IV"]),
        ("wudc", ["Worlds", "WUDC"]),
        ("brandeis_iv", ["Brandeis IV"]),
        ("gm", ["Gender Minority"]),
        ("bipoc", ["BIPOC"]),
        ("expansion", ["Expansion"]),
        ("naudc", ["NAUDC"]),
        ("online_no_points", ["Online No Points"]),
        ("cancelled", ["Canceled", "Cancelled", "CANCELLED"])
    ]
    table = soup.find("tbody")("td")
    return {
        "name": table[3].string,
        "school": table[5]("a")[0].get("href")[14:],
        "season": table[9].string,
        "date": format_date(table[7].string),
        "teams": int(table[11].string),
        "novice_debaters": int(table[13].string),
        "awards": {
            "varsity_teams": team_awards(soup, "varsity"),
            "novice_teams": team_awards(soup, "novice"),
            "varsity_speakers": speaker_awards(soup, "varsity_speakers"),
            "novice_speakers": speaker_awards(soup, "novice_speakers")
        },
        "tags": [tag[0] for tag in tags if any([
            tag_string in table[3].string
            for tag_string in tag[1]
        ])]
    }


def parse_debater(table):
    return {
        "name": table[3].string,
        "school": table[5]("a")[0].get("href")[14:]
    }


def parse_school(table):
    return {
        "name": table[3].string,
        "apda_member": table[5].string == "Yes"
    }


@utils.timing
def parse(option, soup):
    table = soup.find("tbody")("td")
    if option == "debaters":
        return parse_debater(table)
    elif option == "schools":
        return parse_school(table)
    elif option == "tournaments":
        return parse_tournament(table, soup)
