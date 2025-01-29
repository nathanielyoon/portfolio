from apda_records import utils


def toty_points(tournament, limit=None):
    teams = tournament["teams"]
    if teams < 8:
        return None
    if teams < 16:
        return {1: 8, 2: 4}

    extra = (teams-16)//8
    points = [12+extra, 8+extra, 3+extra*0.75, 3+extra*0.75]
    if teams >= 24:
        points.extend([extra*0.5]*4)
    if teams >= 72:
        points.extend([(extra-6)*0.75]*8)
    if limit is not None:
        points = points[:limit]
    return {index: value for index, value in enumerate(points, 1)}


def soty_points(tournament, limit=None):
    points = [toty_points(tournament)[1]-2.5*index for index in range(8)]
    if limit is not None:
        points = points[:limit]
    return {index: value for index, value in enumerate(points, 1) if value > 0}


def points(tournament):
    no_points = ("online_no_points", "nationals", "novice", "wudc", "naudc")
    if any([tag in tournament["tags"] for tag in no_points]):
        return None

    breaks = tournament["awards"]["varsity_teams"]
    speaks = tournament["awards"]["varsity_speakers"]
    if "yale_iv" in tournament["tags"] or "northams" in tournament["tags"]:
        return {"qual": {key: 10 for key in list(breaks.keys())[:16]}}

    toty = toty_points(tournament, limit=len(breaks))
    points = {"qual": {
        key: toty[value]
        for key, value in breaks.items()
        if value in toty.keys()
    }}
    if "gm" in tournament["tags"] or "bipoc" in tournament["tags"]:
        return points

    soty = soty_points(tournament, limit=len(speaks))
    points["soty"] = {
        key: soty[value]
        for key, value in speaks.items()
        if value in soty.keys()
    }
    if "proams" in tournament["tags"]:
        return points

    try:
        debaters = utils.data("debaters")
        points["toty"] = {
            key: toty[value] for key, value in breaks.items()
            if debaters[[
                partner_key for partner_key, partner_value in breaks.items()
                if partner_value == value
            ][0]]["school"] == debaters[key]["school"] and value in toty.keys()
        }
    except KeyError:
        utils.stop(debaters)
    return points


def season(season="2022-23"):
    tournaments = [value[1].get("qual", {}) for value in [
        (key, points(value))
        for key, value in utils.data(f'tournaments_{season}').items()
        if "cancelled" not in value["tags"]
    ] if value[1] is not None]
    quals = {}
    for tournament in tournaments:
        for debater, qual_points in tournament.items():
            quals[debater] = quals.get(debater, 0)+qual_points
    return {key: value for key, value in sorted(
        quals.items(),
        key=lambda item: -item[1]
    )}


def school_points():
    points = season()
    all_debaters = utils.data("debaters")
    all_schools = utils.data("schools")
    schools = {}
    for key, value in points.items():
        schools[all_schools[all_debaters[key]["school"]]["name"]] = schools.get(all_schools[all_debaters[key]["school"]]["name"], 0)+value
    sort = sorted(schools.items(), key=lambda item: item[1], reverse=True)
    print("\n".join(f'{float(school[1])}\t{school[0]}' for school in sort))
