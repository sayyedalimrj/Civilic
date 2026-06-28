#!/bin/bash
LOG=/home/z/my-project/dev.log
WATCHDOG_LOG=/home/z/my-project/watchdog.log
cd /home/z/my-project

pkill -9 -f "next-server" 2>/dev/null
sleep 1

while true; do
  if ! ss -tlnp 2>/dev/null | grep -q ":3000 "; then
    NODE_OPTIONS="--max-old-space-size=3072" ./node_modules/.bin/next dev -p 3000 >> $LOG 2>&1 &
    SRV_PID=$!
    echo "[$(date)] Started server PID=$SRV_PID" >> $WATCHDOG_LOG
    sleep 12
  fi
  sleep 3
done
