import { type TCPSocketListener } from "bun";
import { type BasicLNSocketHandler, LNSocketHandler, type SocketData } from "./socket.js";
import cli from "../cli/cli.js";
import { LNConnections } from "./connections.js";
import { type EventEmitter } from "events";
import { Pipelines } from "./pipelines/index.js";

export type LeiCoinNetBroadcaster = typeof LeiCoinNetNode.prototype.broadcast;

export class LeiCoinNetNode {

    protected server: TCPSocketListener<SocketData> | null = null;

    constructor(
        readonly connections = new LNConnections(),
        readonly pipelines = new Pipelines(this.broadcast.bind(this)),
        readonly socketHandler: BasicLNSocketHandler = new LNSocketHandler(connections, pipelines),
    ) {}

    async start(config: {
        host: string,
        port: number,
        peers: readonly string[]
        eventHandler?: EventEmitter
    }) {
        const tasks: Promise<void>[] = [];

        tasks.push(
            this.startServer(config.host, config.port),
            this.initPeers(config.peers)
        );

        if (config.eventHandler) {
            tasks.push(this.setupEvents(config.eventHandler));
        }

        await Promise.all(tasks);

        cli.leicoin_net.info(`LeiCoinNet-Node started on ${config.host}:${config.port}`);
    }

    protected async startServer(host: string, port: number) {
        this.server = Bun.listen<SocketData>({
            hostname: host,
            port: port,
            socket: this.socketHandler
        });
    }

    /** @param peers Array of strings in the format "host:port" if no port is provided, the default port is 12200 */
    protected async initPeers(peers: readonly string[]) {
        const promises: Promise<void>[] = [];

        // Connect to other peer nodes and create peer-to-peer connections
        for (const targetData of peers) {
            const dataArray = targetData.split(":");
            const host = dataArray[0];
            const port = dataArray[1] ? parseInt(dataArray[1]) : 12200;

            if (!host) {
                cli.leicoin_net.error(`Invalid Connection Data: ${targetData}`);
                continue;
            }
            if (!port) {
                cli.leicoin_net.error(`Invalid Connection Data: ${targetData}`);
                continue;
            }

            promises.push(this.connectToNode(host, port));
        }

        await Promise.all(promises);
    }

    protected async connectToNode(host: string, port: number) {
        const connection = await Bun.connect<SocketData>({
            hostname: host,
            port: port,
            socket: this.socketHandler
        })
        this.connections.add(connection);
    }

    public async stop() {
        
        for (const connection of this.connections.values()) {
            connection.end();
        }
        cli.leicoin_net.info(`Closed ${this.connections.size} connections`);

        if (this.server) {
            this.server.stop();
        } else {
            cli.leicoin_net.error(`LeiCoinNet-Node connot be stopped, because it is not running`);
        }

        cli.leicoin_net.info(`LeiCoinNet-Node stopped`);
    }

    public async broadcast(data: Buffer) {
        for (const connection of this.connections.values()) {
            connection.write(data);
        }
    }

    protected async setupEvents(eventHandler: EventEmitter) {
        eventHandler.once("stop_server", async() => await this.stop());
    }

}

export default LeiCoinNetNode;