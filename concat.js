const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const commonFilter = (e) => e !== ".DS_Store";
const downloadPath = path.resolve(__dirname, "download");
const concatPath = path.resolve(__dirname, "concat.txt");

const handleField = (fieldPath, filedName) => {
  const fileList = fs.readdirSync(fieldPath);
  const statusPath = path.resolve(fieldPath, "fileStatus.json");
  const statusInfoStr = fs.readFileSync(statusPath);
  const statusInfo = JSON.parse(statusInfoStr.toString());
  if (!statusInfo.concatFlag) {
    const flvList = fileList.filter((f) => f.match(/\.flv$/));
    const flvPathList = flvList.map((flv) => path.resolve(fieldPath, flv));
    console.log("flvPathList: ", flvPathList);
    const concatContent = flvPathList
      .map((path) => `file '${path}'`)
      .join("\n");
    fs.writeFileSync(concatPath, concatContent);
    execSync(
      `ffmpeg -f concat -safe 0 -i ${concatPath} -c copy 阔澜直播录屏${filedName}.flv`
    );
    // 标记已合并
    statusInfo.concatFlag = 1;
    fs.writeFileSync(statusPath, JSON.stringify(statusInfo, null, 2));
  } else {
    // 删除已合并
  }
};

const main = async () => {
  const authorDir = fs.readdirSync(downloadPath);
  for (const author of authorDir.filter(commonFilter)) {
    const authorPath = path.resolve(downloadPath, author);
    const fieldList = fs.readdirSync(authorPath);
    for (const field of fieldList.filter(commonFilter)) {
      const fieldPath = path.resolve(authorPath, field);
      await handleField(fieldPath, field);
    }
  }
};

main();
