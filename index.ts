import * as util from './src/utils';
import { createStorageIfNotExists } from './src/handlers/dataHandler';

createStorageIfNotExists();

utils.server_message.log("Starting LeiCoin-Node Server ...");
require("./src/server");
utils.server_message.log("LeiCoin-Node Server started");

// utils.ws_client_message.log("Starting LeiCoin-Node WS ...");
// require("./src/ws-client");
// utils.ws_client_message.log("LeiCoin-Node WS Client started");

utils.miner_message.log("Starting LeiCoin-Node Miner ...");
require("./src/miner");
utils.miner_message.log("LeiCoin-Node Miner started");   
