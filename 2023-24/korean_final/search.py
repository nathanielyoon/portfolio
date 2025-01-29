import sys

import pyperclip
from fuzzywuzzy import fuzz

from korean_final import review


def match_query(query, words, minimum):
    words = [{
        "key": key,
        "english": word["english"],
        "korean": word["korean"],
        "score": [fuzz.ratio(query, word["english"]),
                  fuzz.partial_ratio(query, word["english"])]
        } for key, word in words.items()
        if fuzz.partial_ratio(query, word["english"]) >= minimum]
    return list(sorted(words, key=lambda word: word["score"], reverse=True))


def select(matches):
    if len(matches) == 0:
        return None
    elif len(matches) == 1:
        return 0

    length = max([len(word["english"]) for word in matches])
    [print(f'[{index}] {word["english"]:<{length}}  {word["korean"]}')
     for index, word in enumerate(matches)]

    index = input("select key: ")
    if index.isdigit() and int(index) in range(len(matches)):
        return int(index)


def copy(words, index):
    if index is None:
        print("no match")
    else:
        word = words[index]
        pyperclip.copy(word["korean"])
        print(f'copied {word["korean"]} ({word["english"]}, {word["key"]})')


def search(query, minimum, limit=10):
    matches = match_query(query, review.import_vocab(), minimum)
    if minimum == 100:
        matches = [word for word in matches if word["score"][0] == 100]
    copy(matches, select(matches[:limit]))


def main():
    if len(sys.argv) == 2:
        query = input("query: ").strip().lower()
    else:
        query = " ".join([word.strip().lower() for word in sys.argv[2:]])
    search(query, 100 if sys.argv[1] == "exact" else 60)


if __name__ == "__main__":
    main()
