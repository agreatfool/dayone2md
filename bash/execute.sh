#!/bin/bash

BASEDIR=$(dirname "$0")
cd ${BASEDIR}/../

mkdir -p ~/Downloads/dayone2md

./dist/index.js -d ~/Downloads/dayone2md -a execute -m ~/Downloads/mapping.json