import { Command } from '@oclif/command';
export default class Namespace extends Command {
    static description: string;
    static flags: {
        help: import("@oclif/parser/lib/flags").IBooleanFlag<void>;
    };
    static args: never[];
    namespaces: never[];
    run(): Promise<void>;
    selectNamespace(): Promise<void>;
    getNamespaces(): Promise<void>;
}
