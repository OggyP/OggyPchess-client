var engine = typeof STOCKFISH === "function" ? STOCKFISH() : new Worker(options.stockfishjs || 'stockfish.js');
var evaler = typeof STOCKFISH === "function" ? STOCKFISH() : new Worker(options.stockfishjs || 'stockfish.js');

function uciCmd(cmd, which) {
    console.log("UCI: " + cmd);
    
    (which || engine).postMessage(cmd);
}

evaler.onmessage = function(event) {
    var line;
    
    if (event && typeof event === "object") {
        line = event.data;
    } else {
        line = event;
    }
    
    console.log("evaler: " + line);
}

engine.onmessage = function(event) {
    var line;
    
    if (event && typeof event === "object") {
        line = event.data;
    } else {
        line = event;
    }
    console.log("Reply: " + line)
};