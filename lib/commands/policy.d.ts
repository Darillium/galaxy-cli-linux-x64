import { Command, flags } from '@oclif/command';
export default class Policy extends Command {
    static description: string;
    static flags: {
        help: import("@oclif/parser/lib/flags").IBooleanFlag<void>;
        id: flags.IOptionFlag<string | undefined>;
        file: flags.IOptionFlag<string | undefined>;
        name: flags.IOptionFlag<string | undefined>;
        description: flags.IOptionFlag<string | undefined>;
        impAdd: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        impUpdate: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        impRemove: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        impProvider: flags.IOptionFlag<string | undefined>;
    };
    static args: {
        name: string;
    }[];
    userObject: any;
    policies: never[];
    selectedEntity: any;
    updateCache: any;
    run(): Promise<void>;
    localMenu(): Promise<any>;
    actionManager(userChoice: {
        [s: string]: string;
    }): Promise<void>;
    addImp(): Promise<void>;
    updateImp(): Promise<void>;
    removeImp(): Promise<void>;
    handleImplementation(targetId: string): Promise<void>;
    filterFields(obj: {
        [s: string]: string;
    }, filters: string[]): {
        [s: string]: string;
    };
    showSelectedEntityMenu(answer: string): Promise<void>;
    deleteTarget(targetId: string): Promise<void>;
    injectUserFile(action: string): Promise<void>;
    updateTarget(targetId: string): Promise<void>;
    select(): Promise<void>;
    listTarget(targetId: string, log: boolean): Promise<void>;
    listAllTargets(log: boolean): Promise<void>;
    createTarget(): Promise<void>;
}
