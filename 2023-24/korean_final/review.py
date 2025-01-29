import sys
import datetime
import random

from korean_final import utils


def import_vocab():
    return {key: {
        "english": value["english"],
        "korean": value["korean"],
        "level": int(value["level"]),
        "last": datetime.datetime.strptime(value["last"], "%x")
    } for key, value in utils.data("vocab").items()}


def sort_words(words):
    items = list(words.items())
    random.shuffle(items)
    return {key: value for key, value in sorted(items, key=lambda word: (
        word[1]["last"]+datetime.timedelta(days=word[1]["level"]),
        word[1]["last"],
        word[1]["level"]
    ))}


def review_word(word):
    prompt = f'\u001b[2K{word["english"]:<5}: '
    answer = input(prompt)
    right = answer.strip() == word["korean"]
    word["last"] = datetime.datetime.now()

    if right:
        word["level"] += 1
        result = f'{word["korean"]} -> {word["level"]}'
    else:
        word["level"] = 0
        result = f'{answer.strip()} <- {word["korean"]}'
    print(f'\033[A\033[A{prompt}{result}')
    return word


def export_vocab(words):
    output = {key: {
        "english": value["english"],
        "korean": value["korean"],
        "level": int(value["level"]),
        "last": value["last"].strftime("%x")
    } for key, value in sorted(
        words.items(),
        key=lambda item: [int(number) for number in item[0].split(".")]
    )}
    utils.data("vocab", data=output)


def review(limit):
    words = sort_words(import_vocab())
    output_words = words.copy()
    review_words = words.copy().items() if limit is None else [
        (key, value) for key, value in words.copy().items()
        if key[:4] == limit
    ]
    count = 0
    try:
        for key, value in review_words:
            output_words[key] = review_word(value)
            count += 1
    except KeyboardInterrupt:
        print()
    print(f'exporting {count} words')
    export_vocab(output_words)


def list_lists():
    vocab = utils.data("vocab")
    unique_keys = set([key[:4] for key in vocab.keys()])
    key_data = {key: {
        "count": len([
            word_key for word_key in vocab.keys()
            if word_key[:4] == key
        ]),
        "level": sum([
            word["level"] for word_key, word in vocab.items()
            if word_key[:4] == key
        ])/len([
            word_key for word_key in vocab.keys()
            if word_key[:4] == key
        ])
    } for key in sorted(unique_keys)}

    print("\n".join([
        f'{key} > {value["count"]} words ({round(value["level"], 2):<04})'
        for key, value in key_data.items()
    ]))


def main():
    argument = sys.argv[1] if len(sys.argv) == 2 else None
    list_lists() if argument == "list" else review(argument)


if __name__ == "__main__":
    main()
