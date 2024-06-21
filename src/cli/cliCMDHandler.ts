import { Dict } from "../utils/dataUtils.js";
import cli from "./cli.js"; // @ts-ignore
import { CLICMD } from "./cliCMD.js";
import { GenKairPairCMD } from "./commands/genKeyPairCMD.js";
import { StopCMD } from "./commands/stopCMD.js";


export class CLICMDHandler {

    private static instance: CLICMDHandler;

    public static getInstance() {
        if (!this.instance) {
            this.instance = new CLICMDHandler();
        }
        return this.instance;
    }
    
    private readonly registry: Dict<CLICMD> = {};

    private constructor() {

        this.register(new StopCMD());
        this.register(new GenKairPairCMD());

        this.setupHelpCommand();
    }

    private register(command: CLICMD) {
        this.registry[command.name.toLowerCase()] = command;
        for (const alias of command.aliases) {
            this.registry[alias.toLowerCase()] = command;
        }
    }

    private setupHelpCommand() {
        let help_message = "Available commands:\n" +
                           " - help: Show available commands";
        for (const cmd of Object.values(this.registry)) {
            help_message += `\n - ${cmd.name}: ${cmd.description}`;
        }

        this.register(new class extends CLICMD {
            public name = "help";
            public description = "Show available commands";
            public aliases = [];
            public usage = "help";
            public async run(args: string[]): Promise<void> {
                cli.default_message.info(help_message);
            }
        });
    }

    public handle(input: string) {
        const args = input.trim().toLowerCase().split(" ").filter(arg => arg);
        const command_name = args.shift();
        
        if (!command_name) {
            cli.default_message.info('Command not recognized. Type "help" for available commands.');
            return;
        }

        const cmd = this.registry[command_name];

        if (!cmd) {
            cli.default_message.info(`Command '${command_name}' not found. Type "help" for available commands.`);
            return;
        }

        if (args[0] === "--help") {
            cli.default_message.info(
                `Command '${cmd.name}':\n` +
                `Description: ${cmd.description}` +
                `Aliases: ${cmd.aliases.length > 0 ? cmd.aliases.join(",") : "None"}\n` +
                `Usage: ${cmd.usage}\n`
            );
            return;    
        }

        cmd.run(args);
    }

}

export default CLICMDHandler;
