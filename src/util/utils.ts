import * as fs from "fs";
import { join } from "path";
import { StreamInfo } from "@/type/streamInfo";
import { EventEmitter } from "events";
import * as dayjs from "dayjs";
export const RoomTypeArr = ["huya", "bilibili", "douyu"];
export const testRoomTypeArr = (roomType: string) => {
  if (RoomTypeArr.some((type) => type === roomType)) return roomType;
  else return "error";
};
export const getRoomArrInfo = (
  roomObj: {
    [key: string]: {
      delayTime: number;
      copyright: number;
      dynamic: string;
      source: string;
      desc: string;
      roomUrl: string;
      tags: string[];
      tid: number;
      deleteLocalFile: boolean;
      uploadLocalFile: boolean;
      templateTitle: string;
    };
  }[]
): StreamInfo[] => {
  const roomInfoArr = [];
  for (const roomInfo of roomObj) {
    for (const key in roomInfo) {
      const roomName = key;
      const roomLink = roomInfo[key].roomUrl;
      const roomTags = roomInfo[key].tags;
      const roomTid = roomInfo[key].tid;
      const deleteLocalFile = roomInfo[key].deleteLocalFile;
      const uploadLocalFile = roomInfo[key].uploadLocalFile;
      const templateTitle = roomInfo[key].templateTitle;
      const desc = roomInfo[key].desc;
      const source = roomInfo[key].source;
      const dynamic = roomInfo[key].dynamic;
      const copyright = roomInfo[key].copyright;
      const delayTime = roomInfo[key].delayTime;
      roomInfoArr.push({
        roomName,
        roomLink,
        roomTags,
        streamUrl: "",
        roomTid,
        deleteLocalFile,
        uploadLocalFile,
        templateTitle,
        desc,
        source,
        dynamic,
        copyright,
        delayTime,
      });
    }
  }
  return roomInfoArr;
};

export const deleteFolder = function (path: string) {
  try {
    if (fs.existsSync(path)) {
      const files = fs.readdirSync(path);
      files.forEach((file) => {
        const curPath = join(path, file);
        if (!fs.statSync(curPath).isDirectory()) {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  } catch (err) {
    throw err;
  }
};

export const emitter = new EventEmitter();

export function getTitlePostfix() {
  const hour = parseInt(dayjs().format("HH"));

  if (hour >= 0 && hour < 6) return "晚上场";

  if (hour >= 6 && hour < 12) return "早上场";

  if (hour >= 12 && hour < 18) return "下午场";

  if (hour >= 18 && hour < 24) return "晚上场";
  return "";
}

export function getTimeV() {
  const titlePostfix = getTitlePostfix();
  const hour = parseInt(dayjs().format("HH"));
  if (hour >= 0 && hour < 6) {
    return `${dayjs().subtract(1, "days").format("YYYYMMDD")}${titlePostfix}`;
  }
  return `${dayjs().format("YYYYMMDD")}${titlePostfix}`;
}
