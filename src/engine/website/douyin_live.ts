const axios = require("axios");

export function main(url: string) {
  return new Promise(function (resolve, reject) {
    axios
      .post("http://localhost:5027/api/v1/live/flv", {
        url,
      })
      .then(function (response: any) {
        const { data } = response;
        if (data.code === 0) {
          resolve(data.data.flvUrl);
        } else {
          reject(data.message);
        }
      });
  });
}
