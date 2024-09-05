import fs from "fs";
import { type GeneralConfigLike } from "../../src/config/general.js";
import LCrypt from "../../src/crypto/index.js";
import { AddressHex } from "../../src/objects/address.js";
import { MinterCredentials } from "../../src/objects/minter.js";
import { hostname } from "os";
import { type Server } from "bun";

class LocalNodeTestNet {

    private static commands: {[cmd: string]: (args: string[]) => Promise<void>} = {
        "setup": LocalNodeTestNet.setup,
        "init": LocalNodeTestNet.initNode,
        "start": LocalNodeTestNet.start,
        "clean": LocalNodeTestNet.cleanup
    }

    static async run() {

        const args = Bun.argv.slice(2);

        const cmd = this.commands[args[0]];

        if (!cmd) {
            this.help();
            return;
        }

        await cmd.call(this, args.slice(1));
    }

    static async help() {
        console.log("Usage: bun testnet multi-node (setup | init | start)");
        console.log("- setup: Setup the testnet nodes");
        console.log("- init (1|2): Initialize a node and create the terminal");
        console.log("- start [--clear]: Start the testnet nodes that are waiting to be started");
        console.log("- clean: Cleanup the testnet nodes");
    }

    private static async setup(args: string[]) {

        const nodes = [
            {host: "127.0.0.1", port: 12201},
            {host: "127.0.0.1", port: 12202}
        ]

        const credentials = [
            MinterCredentials.fromPrivateKey(LCrypt.generatePrivateKey()),
            MinterCredentials.fromPrivateKey(LCrypt.generatePrivateKey())
        ]

        await Promise.all([
            this.setupNode(0, nodes, credentials),
            this.setupNode(1, nodes, credentials)
        ]);
    }

    private static async setupNode(index: number, nodes: Array<{host: string, port: number}>, credentials: MinterCredentials[]) {
        const cwd = `./localtests/testnet-nodes/Node${index}`;

        if (!fs.existsSync(`${cwd}/config`)) {
            fs.mkdirSync(`${cwd}/config`, { recursive: true });
        }

        const config: GeneralConfigLike = {
            leicoin_net: nodes[index],
            minter: {
                active: true,
                credentials: [{
                    privateKey: credentials[index].privateKey.toHex(),
                    address: credentials[index].address.toHex()
                }]
            },
            api: {
                active: false,
                host: "127.0.0.1",
                port: 12281 + index
            },
            experimental: false
        }

        const otherIndex = index === 0 ? 1 : 0;

        fs.writeFileSync(`${cwd}/config/config.json`, JSON.stringify(config, null, 4));

        fs.writeFileSync(`${cwd}/config/peers.json`, JSON.stringify([`${nodes[otherIndex].host}:${nodes[otherIndex].port}`], null, 4));

        await Bun.$`bun debug --cwd ${{ raw: cwd }} -c minterdb insert ${{ raw: credentials[0].address.toHex() }} 10000000 00`.quiet();
        await Bun.$`bun debug --cwd ${{ raw: cwd }} -c minterdb insert ${{ raw: credentials[1].address.toHex() }} 10000000 00`.quiet();
    }

    private static async initNode(args: string[]) {

        if (args[0] !== "0" && args[0] !== "1") {
            console.log("Usage: bun testnet multi-node init (1|2)");
        }

        const index = parseInt(args[0]);

        Bun.serve({
            hostname: "127.0.0.1",
            port: 12291 + index,
            fetch(request, server) {
                const relative_url = new URL(request.url);
                switch (relative_url.pathname) {
                    case "/start":
                        LocalNodeTestNet.startNode(index, server);
                        return Response.json({success: true});
                    default:
                        return Response.json({success: false});
                }
            },
        });

        console.log(`Node${index} initialized and ready to start`);
    }
    
    private static async start(args: string[]) {

        if (args[0] === "--clear" || args[0] === "-c") {
            await this.clearBlockchain();
        }

        await Promise.all([
            this.sendStartSignal(0),
            this.sendStartSignal(1)
        ]);
        console.log("All nodes started");
    }

    private static async sendStartSignal(index: number) {
        try {
            const port = 12291 + index;
            await fetch(`http://127.0.0.1:${port}/start`);
        } catch (error) {
            console.log(`Node${index} is not initialized yet. Run 'bun testnet multi-node init ${index}' to initialize it.`);
        }
    }

    private static async startNode(index: number, server: Server) {
        const cwd = `./localtests/testnet-nodes/Node${index}`;
        await Bun.$`bun debug --cwd ${{ raw: cwd }}`
        .catch(() => {})
        .finally(() => {
            server.stop();
        });
    }

    private static async clearBlockchain() {

        for (let i = 0; i < 2; i++) {
            const cwd = `./localtests/testnet-nodes/Node${i}/blockchain_data`;
            for (const directory of fs.readdirSync(cwd)) {
                if (directory === "validators") continue;
                fs.rmSync(`${cwd}/${directory}`, {recursive: true});
            }
        }


    }

    private static async cleanup() {
        fs.rmSync("./localtests/testnet-nodes", {recursive: true});
        console.log("Cleanup complete")
    }

}


await LocalNodeTestNet.run();

export {};