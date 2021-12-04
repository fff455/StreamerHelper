:> concat.txt
for f in /Users/bytedance/Documents/git/biliup/*.flv; do echo "file '$f'" >> concat.txt; done
file=`find /Users/bytedance/Documents/git/biliup -name '阔澜'${Date}'*' -exec basename {} \; | head -n 1`
stamp=`echo "$file" | tr -cd "[0-9]" `
d=`date -r $stamp +%Y%m%d`
h=`date -r $stamp +%H`
eve=19
if [ $h -lt $eve ]
then
after="下午场.flv"
else 
after="晚上场.fl"
fi
fname=阔澜直播录屏$d$after
ffmpeg -f concat -safe 0 -i /Users/bytedance/Documents/git/StreamerHelper/concat.txt -c copy $fname