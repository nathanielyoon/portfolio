from apda_records import utils, parse


@utils.timing
def bounds(option):
    lower = min([
        int(key) for key, value in utils.data(option).items()
        if value["teams"] == -1 and value["season"] == "2022-23"
    ]) if option == "tournaments" else max([
        int(key)
        for key in utils.data(option).keys()
    ])
    url = f'http://results.apda.online/core/{option}/?sort=-id'
    soup = utils.soup(url)
    upper = int(soup.find("tbody").find("td").find("a").string)
    return (option, None) if lower == upper else (option, (lower-1, upper))


@utils.timing
def download(option, bounds):
    if bounds is None:
        return None
    return [(index+1, utils.soup(
        f'http://results.apda.online/core/{option}/{index+1}'
    )) for index in range(*bounds)]


@utils.timing
def update_data(option, new_data):
    old_data = utils.data(option)
    old_data.update(new_data)
    utils.data(option, data=old_data)


def season_tournaments(season):
    tournaments = utils.data("tournaments")
    utils.data(f'tournaments_{season}', data={
        key: value for key, value in tournaments.items()
        if value["season"] == season
    })


def auto_update(season="2022-23"):
    options = ["debaters", "schools", "tournaments"]
    for index, option in enumerate(options, 1):
        new_data = download(index*4-2, *bounds(index*4-3, option))
        if new_data is None:
            continue
        else:
            update_data(index*4, option, [
                (key, parse.parse(
                    index*4-1,
                    option,
                    value,
                    say=f'parse {count}'
                ))
                for count, (key, value) in enumerate(new_data)
                if value.find("title").string[:14] != "Page not found"
            ])
    season_tournaments(season)
