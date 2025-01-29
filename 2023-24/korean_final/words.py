import sys
import regex

from korean_final import utils, review


def import_list_text_files():
    lists = [[[f'{lesson}.{conversation}_{language}.txt'
               for language in ("english", "korean")]
              for conversation in (1, 2)]
             for lesson in (12, 13, 14)]
    file_names = [item for sub_list in lists for item in sub_list]

    data = {}
    for file_name_pair in file_names:
        with open(f'data/{file_name_pair[0]}', "r") as open_file:
            english = [line.strip() for line in open_file.readlines()]
        with open(f'data/{file_name_pair[1]}', "r") as open_file:
            korean = [line.strip() for line in open_file.readlines()]
        for index, words in enumerate(zip(english, korean), 1):
            data[f'{file_name_pair[0][:4]}.{index}'] = {
                "english": words[0],
                "korean": words[1],
                "level": 0,
                "last": "01/01/23"
            }
    utils.data("vocab", data=data)


def print_lists(names=None):
    all_words = review.import_vocab()
    all_names = sorted(set([key[:4] for key in all_words.keys()]))
    names = all_names if not names else [name for name in all_names
                                         if name in names]
    if len(names) == 0:
        return
    words = {name: [word for key, word in all_words.items() if key[:4] == name]
             for name in names}
    length = max([max([korean_padding(word, None) for word in word_list])
                  for word_list in words.values()])

    for key, word_list in words.items():
        print("lesson {} conversation {}".format(*key.split(".")))
        print("\n".join([f'{korean_padding(word, length)} {word["english"]}'
                         for word in word_list]))


def korean_padding(word, length):
    characters = [character for character in word["korean"]
                  if regex.search(r'\p{IsHangul}', character)]
    if length is None:
        return len(word["korean"])+len(characters)
    return f'{word["korean"]:>{length-len(characters)}}'


def main():
    import_list_text_files()
    try:
        print_lists(names=sys.argv[1:])
    except IndexError:
        print_lists()


if __name__ == "__main__":
    main()
