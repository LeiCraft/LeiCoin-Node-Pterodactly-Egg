import config from "../handlers/configHandler.js";
import cryptoHandlers from "../handlers/cryptoHandlers.js";
import encodingHandlers from "../handlers/encodingHandlers.js";
import utils from "../utils/utils.js";

export interface TransactionLike {

    txid: string;
    senderAddress: string;
    senderPublicKey: string;
    recipientAddress: string;
    amount: string;
    nonce: string;
    timestamp: string
    message: string;
    signature: string;
    readonly version: string;

}
export class Transaction {

    public txid: string;
    public senderAddress: string;
    public senderPublicKey: string;
    public recipientAddress: string;
    public amount: string;
    public nonce: string;
    public timestamp: string
    public message: string;
    public signature: string;
    public readonly version: string;

    constructor(txid: string, senderAddress: string, senderPublicKey: string, recipientAddress: string, amount: string, nonce: string, timestamp: string, message: string, signature: string, version = "00") {
        this.txid = txid;
        this.senderAddress = senderAddress;
        this.senderPublicKey = senderPublicKey;
        this.recipientAddress = recipientAddress;
        this.amount = amount;
        this.nonce = nonce;
        this.timestamp = timestamp;
        this.message = message;
        this.signature = signature;
        this.version = version;
    }

    public static createCoinbaseTransaction() {
        const coinbase = new Transaction(
            "",
            "lc0x6c6569636f696e6e65745f636f696e62617365",
            "",
            config.miner.minerAddress,
            utils.mining_pow,
            "0",
            new Date().getTime().toString(),
            "",
            "0000000000000000000000000000000000000000000000000000000000000000",
        );
        coinbase.txid = cryptoHandlers.createHash(coinbase, ["txid", "version"]);
        return coinbase;
    }

    public encodeToHex(add_empty_bytes = false) {

        const encoded_senderPublicKey = encodingHandlers.stringToHex(this.senderPublicKey);
        const senderPublicKey_length = encoded_senderPublicKey.length.toString().padStart(3, "0");        
    
        const encoded_amount = encodingHandlers.compressZeros(this.amount.toString());
        const amount_length = encoded_amount.length.toString().padStart(2, "0");

        const encoded_nonce = encodingHandlers.compressZeros(this.nonce.toString());
        const nonce_length = encoded_nonce.length.toString().padStart(2, "0");

        const timestamp_str = this.timestamp.toString();
        const timestamp_length = timestamp_str.length.toString().padStart(2, "0");

        const encoded_message = encodingHandlers.stringToHex(this.message);
        const message_length = encoded_message.length.toString().padStart(3, "0");

        const hexData = this.version +
                        this.txid +
                        encodingHandlers.encodeAddressToHex(this.senderAddress) +
                        senderPublicKey_length +
                        encoded_senderPublicKey +
                        encodingHandlers.encodeAddressToHex(this.recipientAddress) +
                        amount_length +
                        encoded_amount +
                        nonce_length +
                        encoded_nonce +
                        timestamp_length +
                        timestamp_str +
                        message_length +
                        encoded_message +
                        this.signature;

        const empty_bytes = (add_empty_bytes && (hexData.length % 2 !== 0)) ? "0" : "";
        
        return hexData + empty_bytes;

    }

    public static fromDecodedHex(hexData: string) {

        try {
            const data = encodingHandlers.splitHex(hexData, [
                {key: "version", length: 2},
                {key: "txid", length: 64},
                {key: "senderAddress", length: 40},
                {key: "senderPublicKey_length", length: 3},
                {key: "senderPublicKey", length: "senderPublicKey_length"},
                {key: "recipientAddress", length: 40},
                {key: "amount_length", length: 2},
                {key: "amount", length: "amount_length"},
                {key: "nonce_length", length: 2},
                {key: "nonce", length: "nonce_length"},
                {key: "timestamp_length", length: 2},
                {key: "timestamp", length: "timestamp_length"},
                {key: "message_length", length: 2},
                {key: "message", length: "message_length"},
                {key: "signature", length: 64}
            ]);
        
            if (data.version === "00") {
                data.senderAddress = encodingHandlers.decodeHexToAddress(data.senderAddress);
                data.recipientAddress = encodingHandlers.decodeHexToAddress(data.recipientAddress);
                return utils.createInstanceFromJSON(Transaction, data);
            }
        } catch (err: any) {
            console.log(err.message);
            return null;
        }

        return null;

    }

}


export default Transaction;