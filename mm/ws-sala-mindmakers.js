///////////// Codigo SALA

var clientSALA = null;
var PORTA_SALA = '801';
var urlConexaoRecenteSALA = '';
var clienteConectadoSALA = false;

var valorSALA = '';
var inputSALA = 0;

//Validar somente valores diferentes?
//var  lastMsgIn = 0;

function salaRecebeValor(valorSALA) {
    //console.log('salaRecebeValor = valorSALA: ' + valorSALA);
    inputSALA = parseInt(valorSALA);

}

function registraConexaoSALA(dado) {
    clienteConectadoSALA = true;
}

function registraDesconexaoSALA(dado) {

    if (dado !== undefined) {
        console.log('Entrou para deregistrarSALA: ' + JSON.stringify(dado));
    }
    clienteConectadoSALA = false;
    clientSALA.close();

}


//----Inicia websocket----//
function statusConnectionSALA(urlConexaoSALAArg) {

    if (!urlConexaoSALAArg || urlConexaoSALAArg == '' || urlConexaoSALAArg == 'localhost') {
        urlConexaoRecenteSALA = 'localhost';
    } else {
        if (urlConexaoSALAArg.indexOf('.local') == -1)
            urlConexaoRecenteSALA = urlConexaoSALAArg + '.local';
    }

    if (clienteConectadoSALA) {

        alert('WS client already connected ' + JSON.stringify(clientSALA));

    } else {

        clientSALA = new WebSocket('ws://' + urlConexaoRecenteSALA + ':' + PORTA_SALA, 'echo-protocol');
        console.log('WebSocket Client Trying to Connect on Port: ' + PORTA_SALA);

        clientSALA.onopen = function() {
            alert('Sala Connected');
            var msg = JSON.stringify({
                'command': 'ready'
            });
            clientSALA.send(msg);

            clienteConectadoSALA = true;
            console.log('WebSocket Client Connected on Port: ' + PORTA_SALA);

        };

        clientSALA.onmessage = function(message) {

            clienteConectadoSALA = true;

            if (message.data.toLowerCase().indexOf('desconectado') > -1) {
                registraDesconexaoSALA(message.data);

            } else if (message.data.indexOf('conectado') > -1) {
                setTimeout(function() {
                    registraConexaoSALA(message.data);
                }, 1000);

            } else {
                //para implementar pegar valores do sensor
                alert('messageELSE: '+JSON.stringify(message.data));

                // salaRecebeValor(message.data);

            }

        };

        clientSALA.onerror = function(error) {
            alert('Erro de conexão na porta: ' + PORTA_SALA);
            clienteConectadoMBOT = false;
            registraDesconexaoSALA(error);
        };

        clientSALA.onclose = function(e) {
            console.log('Conexão SALA fechada.');
            clienteConectadoSALA = false;
            registraDesconexaoSALA(e);
        };

        //Tentativa forçar reconexão
        if (clienteConectadoSALA == 'false') {
            setTimeout(statusConnectionSALA(urlConexaoSALAArg), 3000);
        }

    }

}


//ainda precisa ser implementado no mmsala-server.js
function sendMessageSALA(valorSALA, cb) {
    //alert(valorSALA)
    //validar envios?
    waitForSocketConnectionSALA(clientSALA, function() {
        clientSALA.send(valorSALA);

        waitForSocketConnectionSALA(clientSALA, function() {
            //console.log('SALA valor: ' + valorSALA);
            if (cb !== undefined) {
                cb(valorSALA);
            }
        });

    });
}

function waitForSocketConnectionSALA(socket, callback) { //Valida que ws está aberta antes de mandar msg
    setTimeout(
        function() {
            if (socket.readyState === socket.OPEN) {
                if (callback !== undefined) {
                    callback();
                }
                return;
            } else {
                waitForSocketConnectionSALA(socket, callback);
            }
        }, 5);
}
