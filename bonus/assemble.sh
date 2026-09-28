#!/bin/sh
# reassemble files split for GitHub's API blob limit
set -e
cd "$(dirname "$0")"
cat bonus.mp4.part-00 bonus.mp4.part-01 bonus.mp4.part-02 bonus.mp4.part-03 bonus.mp4.part-04 bonus.mp4.part-05 bonus.mp4.part-06 bonus.mp4.part-07 > bonus.mp4
rm bonus.mp4.part-00 bonus.mp4.part-01 bonus.mp4.part-02 bonus.mp4.part-03 bonus.mp4.part-04 bonus.mp4.part-05 bonus.mp4.part-06 bonus.mp4.part-07
echo reassembled
