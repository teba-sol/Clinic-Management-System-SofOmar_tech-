#!/bin/bash
if [ -d "@" ]; then
  cp -r "@/." src/
  rm -rf "@"
  echo "Fixed: moved stray @ folder contents into src/"
else
  echo "No stray @ folder found, all good."
fi
