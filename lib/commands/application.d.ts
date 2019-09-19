import { Command, flags } from '@oclif/command';
export default class Application extends Command {
    static description: string;
    static flags: {
        help: import("@oclif/parser/lib/flags").IBooleanFlag<void>;
        file: flags.IOptionFlag<string | undefined>;
        id: flags.IOptionFlag<string | undefined>;
        name: flags.IOptionFlag<string | undefined>;
        description: flags.IOptionFlag<string | undefined>;
        type: flags.IOptionFlag<string | undefined>;
    };
    static args: {
        name: string;
    }[];
    applications: never[];
    selectedEntity: any;
    userObject: any;
    run(): Promise<void>;
    localMenu(): Promise<any>;
    actionManager(userChoice: {
        [s: string]: string;
    }): Promise<void>;
    filterFields(obj: {
        [s: string]: string;
    }, filters: string[]): {
        [s: string]: string;
    };
    injectUserFile(action: string): Promise<void>;
    showSelectedEntityMenu(answer: string): Promise<void>;
    deleteTarget(targetId: string): Promise<void>;
    updateTarget(targetId: string): Promise<void>;
    select(): Promise<void>;
    listTarget(targetId: string, log: boolean): Promise<void>;
    listAllTargets(log: boolean): Promise<void>;
    createTarget(): Promise<void>;
}
