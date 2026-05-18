const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '..', '..', 'logs', 'requests.log');

fs.mkdirSync(path.dirname(logFile), { recursive: true });

function pad(str, len) {
  return String(str).padEnd(len);
}

module.exports = function requestLogger(req, res, next) {
  const startAt = process.hrtime();
  const startTime = new Date();

  res.on('finish', () => {
    const diff = process.hrtime(startAt);
    const ms = (diff[0] * 1e3 + diff[1] / 1e6).toFixed(1);

    const time = startTime.toTimeString().slice(0, 8);
    const method = pad(req.method, 7);
    const status = res.statusCode;
    const url = req.originalUrl;

    let line = `[${time}]  ${method}  ${status}  ${url}  ${ms}ms`;

    if (req.method !== 'GET' && req.body && Object.keys(req.body).length) {
      line += `\n         Body: ${JSON.stringify(req.body)}`;
    }

    line += '\n';

    fs.appendFile(logFile, line, () => {});
    process.stdout.write(line);
  });

  next();
};
