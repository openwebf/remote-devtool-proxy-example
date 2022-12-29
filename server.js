const WebSocketServer = require('websocket').server;
const http = require('http');

function createWebSocketServer(port, options = {}) {
    const server = http.createServer(function (request, response) {
        console.log((new Date()) + ' Received request for ' + request.url);
        response.writeHead(404);
        response.end();
    });


    server.listen(port, function () {
        console.log((new Date()) + ' Server is listening on port', port);
    });

    let wsServer = new WebSocketServer({
        httpServer: server,
        autoAcceptConnections: false
    });

    wsServer.on('request', function (request) {
        if (options.onRequest) {
            options.onRequest(request);
        }

        const connection = request.accept();
        connection.on('message', function (message) {
            if (options.onMessage) {
                options.onMessage(message, connection, request);
            }
        });
        connection.on('close', function (reasonCode, description) {
            console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
            if (options.onClose) {
                options.onClose(reasonCode, description, connection, request);
            }
        });
        if (options.onConnect) {
            options.onConnect(connection, request);
        }

    });
}


// The port webf app connect to.
const webfPort = 8090;

// The port Chrome devtools connect to.
const devToolPort = 8091;


let webfConnection = {};
let devToolsConnection = {};

createWebSocketServer(webfPort, {
    onConnect: (connect, request) => {
        console.log('webf client connected:', request.resource);
        webfConnection[request.resource] = connect;
    },
    onMessage: (message, connection, request) => {
        if (devToolsConnection[request.resource]) {
            devToolsConnection[request.resource].sendUTF(message.utf8Data);
        }
    },
    onClose: (reasonCode, description, connection, request) => {
        webfConnection[request.resource] = null;
    },
    onRequest: (request) => {

    }
});

createWebSocketServer(devToolPort, {
    onConnect: (connection, request) => {
        console.log('devTool connected:', request.resource);
        devToolsConnection[request.resource] = connection;
    },
    onMessage: (message, connection, request) => {
        // 找到对应的 ws, 并转发消息过去
        if (webfConnection[request.resource]) {
            webfConnection[request.resource].sendUTF(message.utf8Data);
        }
    },
    onClose: (reasonCode, description, connection, request) => {
        devToolsConnection[request.resource] = null
    },
    onRequest: (request) => {

    }
});
