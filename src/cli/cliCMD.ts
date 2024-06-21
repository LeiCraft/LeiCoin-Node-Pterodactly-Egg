

export abstract class CLICMD {

    public abstract name: string;
    public abstract description: string;
    public abstract aliases: string[];
    public abstract usage: string;

    public abstract run(args: string[]): Promise<void>;

}
