import utils from "../utils/index.js";
import { Transaction } from "./transaction.js";
import mempool from "../storage/mempool.js";
import blockchain from "../storage/blockchain.js";
import EncodingUtils from "../handlers/encodingUtils.js";
import BigNum from "../utils/bigNum.js";
import cli from "../utils/cli.js";
import cryptoHandlers from "../crypto/index.js";
import { AttestationInBlock } from "./attestation.js";
import config from "../handlers/configHandler.js";
import Address from "./address.js";

export interface BlockLike {
    readonly index: string;
    hash: string;
    readonly previousHash: string;
    readonly timestamp: string;
    readonly proposer: string;
    readonly attestations: AttestationInBlock[];
    readonly transactions: Transaction[];
    readonly version: string;
}

export class Block implements BlockLike {

    public readonly index: string;
    public hash: string;
    public readonly previousHash: string;
    public readonly timestamp: string;
    public readonly proposer: string;
    public readonly attestations: AttestationInBlock[];
    public readonly transactions: Transaction[];
    public readonly version: string;

    constructor(
        index: string,
        hash: string,
        previousHash: string,
        timestamp: string,
        proposer: string,
        attestations: AttestationInBlock[],
        transactions: Transaction[],
        version = "00"
    ) {

        this.index = index;
        this.hash = hash;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.proposer = proposer;
        this.attestations = attestations;
        this.transactions = transactions;
        this.version = version;

    }

    public static createNewBlock() {
        
        const previousBlock = blockchain.chainstate.getLatestBlockInfo();
    
        let newIndex;
        let previousHash;
    
        if (!previousBlock || (typeof(previousBlock.index) !== 'number')) newIndex = "0";
        else newIndex = BigNum.add(previousBlock.index, "1");
    
        if (!previousBlock || (typeof(previousBlock.hash) !== 'string')) previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
        else previousHash = previousBlock.hash;

        const coinbase = Transaction.createCoinbaseTransaction();

        const transactions = Object.values(mempool.transactions);
        transactions.unshift(coinbase);
    
        const newBlock = new Block(
            newIndex,
            '',
            previousHash,
            new Date().getTime().toString(),
            config.staker.address,
            [],
            transactions
        );
        
        newBlock.calculateHash();

        return newBlock;
    }

    public encodeToHex(add_empty_bytes = true, forHash = false) {   
    
        const encoded_index = BigNum.numToHex(this.index);
        const index_length = BigNum.numToHex(encoded_index.length);

        const encoded_timestamp = BigNum.numToHex(this.timestamp);
        const timestamp_length = BigNum.numToHex(encoded_timestamp.length);

        let encoded_attestations = BigNum.numToHex(this.attestations.length);
        for (let attestation of this.attestations) {
            encoded_attestations += attestation.encodeToHex();
        }

        let encoded_transactions = BigNum.numToHex(this.transactions.length);
        for (let transaction of this.transactions) {
            encoded_transactions += transaction.encodeToHex();
        }

        const hexData = this.version +
                        index_length +
                        encoded_index +
                        forHash ? this.hash : "" +
                        this.previousHash +
                        timestamp_length +
                        encoded_timestamp +
                        Address.encodeToHex(this.proposer) +
                        encoded_attestations +
                        encoded_transactions;

        const empty_bytes = (add_empty_bytes && (hexData.length % 2 !== 0)) ? "0" : "";
        
        return hexData + empty_bytes;

    }

    public static fromDecodedHex(hexData: string, returnLength = false) {

        try {
            const returnData = EncodingUtils.getObjectFromHex(hexData, [
                {key: "version"},
                {key: "index"},
                {key: "hash"},
                {key: "previousHash", type: "hash"},
                {key: "timestamp"},
                {key: "proposer", type: "address"},
                {key: "attestations", length: 2, type: "array", decodeFunc: AttestationInBlock.fromDecodedHex},
                {key: "transactions", length: 2, type: "array", decodeFunc: Transaction.fromDecodedHex}
            ], returnLength);

            const data = returnData.data;
        
            if (data && data.version === "00") {
                const block = utils.createInstanceFromJSON(Block, data);

                if (returnLength) {
                    return {data: block, length: returnData.length};
                }
                return block;
            }
        } catch (err: any) {
            cli.data_message.error(`Error loading Block from Decoded Hex: ${err.message}`);
        }

        return null;
    }

    public calculateHash() {
        this.hash = cryptoHandlers.sha256(this, ["hash"]);
    }

    public addAttestation(attestation: AttestationInBlock) {
        this.attestations.push(attestation);
    }

}

export default Block;