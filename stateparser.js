const fs = require('fs');

fs.readFile("names.txt", (err, data) => {
    if (err) throw err;
    let parsed = data.toString('utf8');
    parsed = parsed
        .split("\n")
        .map(e => e.split(':').map(x => x.trim()))
        .map(e => ({ StateName: e[0], Capital: e[1] }));
    console.log(parsed);
});