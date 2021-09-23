# dayone2md

Dump all dayone posts to local disk as md files

## How to use

1 use this tool to generate the slug mapping json file, since some title could not be converted to slug directly:

```bash
$ dayone2md -d ~/Downloads -a mapping
```

2 edit the mapping json, fill in all the slugs

3 execute the dump action

```bash
$ dayone2md -d ~/Downloads/your/obsidian/vault -m ~/Downloads/mapping.json -a execute
```

## Help

```bash
$ dayone2md -h
Usage: dayone2md [options]

Dayone2md application, supports only MacOS & Dayone2

Options:
  -V, --version          output the version number
  -d, --dest <dir>       directory of output destination
  -m, --mapping <path>   file path of the post title slug mapping json file
  -a, --action <action>  which action will be executed: execute | mapping (default: "execute")
  -h, --help             display help for command
```
