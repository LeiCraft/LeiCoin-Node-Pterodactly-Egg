import BCUtils from "./blockchainUtils.js";
import Chainstate from "./chainstate.js";
import Chain from "./chain.js";
import cli from "../cli/cli.js";
import { BasicModuleLike } from "../utils/dataUtils.js";
import { type Block } from "../objects/block.js";
import fs from "fs";

export class Blockchain implements BasicModuleLike<typeof Blockchain> {
    public static initialized = false;

    static chainstate: Chainstate;
    static readonly chains: {[chain: string]: Chain} = {};

    static get name() { return "main" }
    static get blocks() { return this.chains["main"].blocks }
    static get wallets() { return this.chains["main"].wallets }
    static get cstates() { return this.chains["main"].cstates }
    static get minters() { return this.chains["main"].minters }

    static async init() {
        if (this.initialized) return;
        this.initialized = true;

        this.createStorageIfNotExists();
        this.setupEvents();

        this.chainstate = Chainstate.getInstance();
        for (const chainName in this.chainstate.getAllChainStates()) {
            this.chains[chainName] = new Chain(chainName);
        }
        if (!this.chains["main"]) {
            this.chains["main"] = new Chain("main");
        }
    }

    private static createStorageIfNotExists() {
        BCUtils.ensureDirectoryExists('/forks', "main");
    }

    static async createFork(targetChain: string, parentChain: string, baseBlock: Block) {
        
        // const parentChain = "main";

        const blocksToReset = baseBlock.index;

        if (parentChain !== "main") {
            fs.cpSync(BCUtils.getBlockchainDataFilePath("", parentChain), BCUtils.getBlockchainDataFilePath("", targetChain), { recursive: true });
            fs.unlinkSync(BCUtils.getBlockchainDataFilePath(`/blocks/${parentLatestBlock.index}.lcb`, targetChain));
        }

        const forkChain = new Chain(targetChain);
        await forkChain.waitAllinit();

        this.chains[targetChain] = forkChain;

        for (const transactionData of parentLatestBlock.transactions) {
            const senderWallet = await this.chains[parentChain].wallets.getWallet(transactionData.senderAddress);
            const recipientWallet = await this.chains[parentChain].wallets.getWallet(transactionData.recipientAddress);

            senderWallet.adjustNonce(-1);
            senderWallet.addMoney(transactionData.amount);
            recipientWallet.subtractMoneyIFPossible(transactionData.amount);

            await forkChain.wallets.setWallet(senderWallet);
            await forkChain.wallets.setWallet(recipientWallet);
        }

    }

    // public transferForkToMain(fork: string) {

    //     // we have to update this later
    //     try {

    //         const tempBlockchain = {};

    //         const forkBlocks = fs.readdirSync(BCUtils.getBlockchainDataFilePath("/blocks", fork));

    //         forkBlocks.sort((a: string, b: string) => {
    //             const numA = parseInt(a.split('.')[0]);
    //             const numB = parseInt(b.split('.')[0]);
    //             return numA - numB;
    //         });

    //         for (const blockFile of forkBlocks) {

    //             const blockIndex = blockFile.split('.')[0];

    //             const block = this.blocks.getBlock(blockIndex).data;
    //             if (!block) {
    //                 return { cb: CB.ERROR };
    //             }

    //             const blockInMain = this.blocks.getBlock(blockIndex);

    //         }

    //         return { cb: CB.SUCCESS };

    //     } catch (err: any) {
    //         cli.data.error(`Error transfering Fork ${fork} to Main Blockchain: ${err.stack}`);
    //         return { cb: CB.ERROR };
    //     }

    // }

    // public deleteFork(name: string) {
        
    // }

    static async waitAllChainsInit() {
        for (const chain of Object.values(this.chains)) {
            await chain.waitAllinit();
        }
    }

    private static async setupEvents() {}

    static async stop() {
        cli.data.info("Saving blockchain data...");

        await Promise.all(
            Object.values(this.chains).map(chain => chain.close())
        );
        this.chainstate.updateChainStateFile();

        cli.data.info("Blockchain data saved!");
    }

}

