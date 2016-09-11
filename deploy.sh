#!/bin/bash

# Automated deployment of OSMC website using Jenkins

pushd /root/osmc-blog
service osmcblog stop
git pull --rebase
npm install --production
## Hack hack hack for NPM issue #6170
while pgrep npm; do sleep 5; done
service osmcblog start
