#!/bin/bash
LOG=/home/z/my-project/dev.log
cd /home/z/my-project
pkill -9 -f "next-server" 2>/dev/null
sleep 1

# Double fork
( (
  exec env NODE_OPTIONS="--max-old-space-size=3072" ./node_modules/.bin/next dev -p 3000 > $LOG 2>&1
) & ) &
disown -a
exit 0
