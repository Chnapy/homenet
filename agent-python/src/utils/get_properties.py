def get_properties(file_content: str) -> dict[str, str | None]:
    tupleMap: dict[str, str | None] = {}

    for line in file_content.splitlines():
        if line.startswith("#"):
            continue

        keyValue = tuple(
            filter(
                lambda i: len(i) > 0,
                map(lambda i: i.strip(), line.replace("\n", "").split("=")),
            )
        )

        if len(keyValue) != 2:
            continue

        tupleMap[keyValue[0]] = keyValue[1]

    return tupleMap
