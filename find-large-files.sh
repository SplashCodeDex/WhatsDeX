#!/bin/bash
# Find the 20 largest files in the git repository history

git rev-list --objects --all |\
  git cat-file --batch-check='%(objectname)\t%(objecttype)\t%(objectsize)\t%(rest)' |\
  grep blob |\
  sort -n -k 3 |\
  tail -n 20
