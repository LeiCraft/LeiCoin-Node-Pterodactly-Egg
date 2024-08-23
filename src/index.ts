import Utils from "./utils/index.js";
import cli from "./cli/cli.js";
import HTTP_API from "./http_api/index.js";
import LeiCoinNetNode from "./leicoin-net/index.js";

export default class Main {

    private static initialized = false;

    public static version = "0.5.3-beta.1";

    private static environment: "full" | "cli" | "command";

    private static httpAPI: HTTP_API | null = null;
    private static leicoinNetNode: LeiCoinNetNode | null = null;

    public static async init() {
        if (this.initialized) return;
        this.initialized = true;

        if (process.argv.slice(2)[0] === "-c") {
            //process.env.NO_OUTPUT = "true";
            await cli.init("none", "none", false, false, process.cwd());
        } else {
            await cli.init("all", "all", true, true, process.cwd());
            console.log(`Starting LeiCoin-Node v${Main.version}...`);
        }

        const config = (await import("./config/index.js")).default;

        if (Utils.getRunStatus() === "shutdown_on_error") {
            cli.default.error("Error during startup");
            return;
        }

        this.environment = "full";
        if (config.processArgs["--only-cli"]) {
            this.environment = "cli";
        } else if (config.processArgs["-c"]) {
            this.environment = "command"
        };

        cli.default.info(`Loaded core modules`);

        await (await import("./storage/blockchain.js")).default.waitAllinit();

        switch (this.environment) {
            case "full": {
                
                this.leicoinNetNode = new LeiCoinNetNode();
                await this.leicoinNetNode.start({
                    ...config.leicoin_net,
                    peers: config.peers,
                    eventHandler: Utils.events
                });

                if (config.api.active) {
                    this.httpAPI = new HTTP_API();
                    await this.httpAPI.start({
                        ...config.api,
                        eventHandler: Utils.events
                    });
                }

                (await import("./minter/index.js")).MinterClient.createMinters(config.staker.stakers, this.leicoinNetNode);
                (await import("./pos/index.js")).POS.init();
    
                cli.default.info(`LeiCoin-Node started in Full Node mode`);

                break;
            }
            case "cli": {
                cli.default.info(`LeiCoin-Node started in CLI Only mode`);
                break;
            }
            case "command": {

                const args = config.processArgs["-c"] as string[];

                if (!args[0]) {
                    cli.cmd.info("Command not recognized. Type leicoin-node -c help for available commands.");
                    Utils.gracefulShutdown(0);
                    return;
                }

                const CLICMDHandler = (await import("./cli/cliCMDHandler.js")).default;

                await CLICMDHandler.getInstance().run(
                    args.map(arg => arg.toLowerCase())
                        .filter(arg => arg),
                    []
                );

                Utils.gracefulShutdown(0);
                break;
            }
        }

    }

}

Main.init();

