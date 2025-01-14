import * as dayjs from "dayjs";
import * as chalk from "chalk";
import * as path from "path";
import * as fs from "fs";

import { getStreamUrl } from "@/engine/getStreamUrl";
import { StreamInfo } from "@/type/streamInfo";
import { RoomStatus } from "@/engine/roomStatus";
import { getRoomArrInfo, getTimeV } from "@/util/utils";
import { log4js } from "@/log";
import { Scheduler } from "@/type/scheduler";
import { App } from "..";
import { Recorder, saveRootPath } from "@/engine/message";

const roomCheckTime = require("../../templates/info.json").StreamerHelper
  .roomCheckTime;
const checkTime = roomCheckTime ? roomCheckTime * 1000 : 10 * 60 * 1000;
const rooms = getRoomArrInfo(require("../../templates/info.json").streamerInfo);
const logger = log4js.getLogger(`checkRoom`);
const loggerCheck = log4js.getLogger(`check`);
const interval = checkTime;

const getJsonUrl = (roomName?: string): string => {
  console.info("roomName: ", roomName);
  if (!roomName) {
    return "";
  }
  try {
    const timeV = getTimeV();
    const fileStatusPath = path.resolve(
      saveRootPath,
      roomName,
      timeV,
      "fileStatus.json"
    );
    console.log("fileStatusPath: ", fileStatusPath);
    const fileStatusStr = fs.readFileSync(fileStatusPath);
    const fileStatus = JSON.parse(fileStatusStr.toString());
    return fileStatus.streamUrl;
  } catch (err) {
    return "";
  }
};

export default new Scheduler(interval, async function (app: App) {
  loggerCheck.info(`Start checkRoom. Interval ${interval / 1000}s`);
  loggerCheck.debug(`Rooms ${JSON.stringify(rooms, null, 2)}`);

  for (const room of rooms) {
    let curRecorder: Recorder | undefined;
    let curRecorderText: string = "";
    let curRecorderIndex: number | undefined;
    logger.info(`正在检查直播 ${chalk.red(room.roomName)} ${room.roomLink}`);

    console.log("app.recorderPool: ", app.recorderPool);
    app.recorderPool.forEach((elem: Recorder, index: number) => {
      if (elem.recorderName === room.roomName) {
        curRecorder = elem;
        curRecorderIndex = index;
        curRecorderText = getTipsString(curRecorder) + curRecorderText;
      }
    });

    let stream: StreamInfo = {
      roomLink: room.roomLink,
      roomName: room.roomName,
      roomTags: room.roomTags,
      roomTid: room.roomTid,
      streamUrl: "",
      deleteLocalFile: room.deleteLocalFile,
      uploadLocalFile: room.uploadLocalFile,
      templateTitle: room.templateTitle,
      desc: room.desc,
      source: room.source,
      dynamic: room.dynamic,
      copyright: room.copyright,
      delayTime: room.delayTime,
    };

    try {
      const jsonStream = getJsonUrl(room.roomName);
      console.info("stream from json: ", jsonStream);
      let tmpStream: StreamInfo;
      if (jsonStream) {
        tmpStream = {
          streamUrl: jsonStream,
          roomName: room.roomName,
          roomLink: room.roomLink,
          roomTags: room.roomTags,
          roomTid: room.roomTid,
        };
      } else {
        tmpStream = await getStreamUrl(
          room.roomName,
          room.roomLink,
          room.roomTags,
          room.roomTid
        );
      }

      // Merge streamUrl
      stream = Object.assign(stream, tmpStream);

      logger.debug(`stream ${JSON.stringify(stream, null, 2)}`);
      // start a recorder
      if (RoomStatus.get(room.roomName) !== 1 && !curRecorder) {
        RoomStatus.set(room.roomName, 1);
        const tmp = new Recorder(stream);
        tmp.startRecord(stream);
        app.recorderPool.push(tmp);
      } else if (curRecorder?.recorderStat() === false) {
        logger.info(`下载流 ${curRecorder.dirName} 断开，但直播间在线，重启`);
        curRecorder.startRecord(stream);
      }
    } catch (e) {
      // room offline
      // it is time to submit
      RoomStatus.delete(room.roomName);
      // but the stream isn't disconnected
      // so stop the recorder before submit
      if (curRecorder?.recorderStat()) {
        curRecorder.stopRecord();
      }
      // 保证同一时刻一个直播间只有一个Recorder
      if (curRecorder) {
        logger.info(
          `Will delete ${curRecorder.dirName} ${curRecorder.recorderName} ${curRecorderIndex}`
        );
        const p = app.recorderPool.splice(curRecorderIndex as number, 1);
        logger.info(`Deleted recorder: ${p.length}`);
      }
    }
    if (curRecorderText)
      curRecorderText += `
检测间隔 ${chalk.yellow(`${interval / 1000}s`)}
系统时间 ${chalk.green(dayjs().format("YYYY-MM-DD hh:mm:ss"))}
`;
    loggerCheck.info(curRecorderText);
  }
  function getTipsString(curRecorder: Recorder) {
    return `
直播间名称 ${chalk.red(curRecorder.recorderName)}
直播间地址 ${curRecorder.recorderLink}
时间 ${chalk.cyan(curRecorder.timeV)}
是否删除本地文件 ${
      curRecorder.deleteLocalFile ? chalk.yellow("是") : chalk.red("否")
    }
是否上传本地文件 ${
      curRecorder.uploadLocalFile ? chalk.yellow("是") : chalk.red("否")
    } 
`;
  }
});
