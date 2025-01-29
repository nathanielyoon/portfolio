import json
import csv
import inspect


def data(file_name, directory=None, data=None, extension="json"):
    source = "/".join(inspect.stack()[1][1].split("/")[:-1])
    directory = f'{source}/data' if directory is None else directory
    file_path = f'{directory}/{file_name}.{extension}'
    if data is not None:
        with open(file_path, "w") as open_file:
            if extension == "json":
                json.dump(data, open_file, indent=4, ensure_ascii=False)
            elif extension == "csv":
                headers = list(data)[0].keys()
                writer = csv.DictWriter(open_file, fieldnames=headers)
                writer.writeheader()
                writer.writerows(data)
            elif extension == "txt":
                open_file.write([f'\n{str(line)}' for line in data])
    else:
        with open(file_path, "r") as open_file:
            if extension == "json":
                data = json.load(open_file)
            elif extension == "csv":
                data = list(csv.DictReader(open_file))
            elif extension == "tsv":
                data = list(csv.DictReader(open_file, delimiter="\t"))
            elif extension == "txt":
                data = [line[:-1] for line in open_file.readlines()]
    return data
