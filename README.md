# rizzle
replace `node` runtime with `rizzle` to start your nodejs application in cluster mode

## Usage
You can just replace each `node` call in the terminal/cmd/bash whatever with `rizzle`. Make use of the `-f` and `-c` parameters:

- `-f` restarts slaves which stopped running due to an error - does not restart slaves which stopped successfully
- `-c <num>` specify the number of slaves to start - default is the number of cpus (`os.cpus().length`)

> `node ./test.js` becomes `rizzle ./test.js -f -c 5`

## Example
```javascript
// server.js

const http = require("http");
http.createServer((request, response) => response.end("success message sent from " + process.pid))
    .listen(8080, "localhost");
```
```bash
rizzle ./server.js -f -c 5
```