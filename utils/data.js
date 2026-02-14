const fs = require('fs');

const DATA_FILE = './data.json';

let data = {
  counter: 1,
  totalVolume: 0,
  totalProfit: 0,
  staffStats: {}
};

if (fs.existsSync(DATA_FILE)) {
  data = JSON.parse(fs.readFileSync(DATA_FILE));
} else {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = data;
module.exports.save = save;