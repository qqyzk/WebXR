#!/bin/sh
export LANG="en_US.UTF-8"
for i in `seq 0 7`
do
    str1="/sys/devices/system/cpu/cpu"
    str2="/cpufreq/scaling_governor"
    str3="$str1$i$str2"
    str4="/cpufreq/scaling_max_freq"
    str5="$str1$i$str4"
    echo "userspace" > $str3
    echo 800000 > $str5
    cat $str5
done

for i in `seq 1 60`
do
    echo $i
    echo "$i, $(top -n 1 -d 1 |grep com.chrome.dev:privileged_process |grep -v grep)" >> 'cpuUsage0.txt'
    echo "$i, $(top -n 1 -d 1 |grep com.chrome.dev:sandboxed_process |grep -v grep)" >> 'cpuUsage1.txt' 
    echo "$i, $(top -n 1 -d 1 |grep surfaceflinger |grep -v grep)" >> 'cpuUsage2.txt' 
    echo "$i, $(top -n 1 -d 1 |grep android.hardware.graphics.composer|grep -v grep)" >> 'cpuUsage3.txt' 
    echo "$i, $(top -n 1 -d 1 |grep com.chrome.dev | grep -v com.chrome.dev:|grep -v grep)" >> 'cpuUsage4.txt' 
    echo "$i, $(top -n 1 -d 1 |grep com.android.systemui|grep -v grep)" >> 'cpuUsage5.txt'
    echo "$i, $(top -n 1 -d 1 |grep android.hardware.camera.provider@2.7-service-google|grep -v grep)" >> 'cpuUsage6.txt'
    echo "$i, $(top -n 1 -d 1 |grep android.hardware.sensors@2.1-service.multihal|grep -v grep)" >> 'cpuUsage7.txt'
    echo "$i, $(top -n 1 -d 1 |grep cameraserver|grep -v grep)" >> 'cpuUsage8.txt'
    echo "$i, $(cat /sys/class/power_supply/usb/current_now),$(cat /sys/class/power_supply/usb/voltage_now),$(cat /sys/class/power_supply/battery/current_now),$(cat /sys/class/power_supply/battery/voltage_now)" >> 'power.txt'
    # echo "$i,$(cat /sys/class/power_supply/usb/current_now),$(cat /sys/class/power_supply/usb/voltage_now),$(cat /sys/class/power_supply/battery/current_now),$(cat /sys/class/power_supply/battery/voltage_now)" 
    sleep 1 
done
