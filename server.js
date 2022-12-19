const WebSocketServer = require('websocket').server;
const http = require('http');

function createWebSocketServer(port, options = {}) {
    var server = http.createServer(function (request, response) {
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

        var connection = request.accept();
        connection.on('message', function (message) {
            if (options.onMessage) {
                options.onMessage(message, connection);
            }
        });
        connection.on('close', function (reasonCode, description) {
            console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
            if (options.onClose) {
                options.onClose(reasonCode, description, connection);
            }
        });
        if (options.onConnect) {
            options.onConnect(connection);
        }
        
    });
}


// The port webf app connect to.
const webfPort = 8090;

// The port Chrome devtools connect to.
const devToolPort = 8091;


let webfConnection;
let devToolsConnection;

createWebSocketServer(webfPort, {
    onConnect: (connect) => {
        console.log('webf client connected');
        webfConnection = connect;
    },
    onMessage: (message, connection) => {
        if (devToolsConnection) {
            devToolsConnection.sendUTF(message.utf8Data);
        }
    }
});

createWebSocketServer(devToolPort, {
    onConnect: (connection) => {
        devToolsConnection = connection;
    },
    onMessage: (message, connection) => {
        if (webfConnection) {
            webfConnection.sendUTF(message.utf8Data);
        }
    }
});