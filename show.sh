#/bin/bash
echo "Starting: $(date)"
./blank.sh
echo "Bridge now blank"
sleep 4h
echo "Ending: $(date)"
killall python2
./default.sh
echo "Bridge now default"
