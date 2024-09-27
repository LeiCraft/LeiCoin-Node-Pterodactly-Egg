import mempool from "../../../storage/mempool.js";
import Transaction from "../../../objects/transaction.js";
import cli from "../../../cli/cli.js";
import Verification from "../../../verification/index.js"
import { Uint } from "../../../binary/uint.js";
import { LNMsgType } from "../messageTypes.js";
import { BroadcastingChannel } from "../abstractChannel.js";

export class NewTransactionChannel extends BroadcastingChannel {
    readonly id = LNMsgType.NEW_TRANSACTION;

    async receive(data: Uint) {

        const transaction = Transaction.fromDecodedHex(data) as Transaction;
    
        if (!(transaction.txid.toHex() in mempool.transactions)) {
    
            const validationresult = await Verification.verifyTransaction(transaction);
    
            if (validationresult === 12000) {

                mempool.addTransactionToMempool(transaction);
        
                cli.leicoin_net.success(`Received Transaction with hash ${transaction.txid} has been validated. Adding to Mempool.`);

                this.broadcast(data);

            } else {
                cli.leicoin_net.error(`Transaction with hash ${transaction.txid} is invalid. Error: ${JSON.stringify(validationresult)}`);
            }
        }
    
        //cli.ws_client_message.error(`Transaction with hash ${transaction.txid} is invalid.`);

    }

}